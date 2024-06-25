const express = require('express');
const http = require('http');
const mysql = require('mysql2/promise');
const path = require('path');
const socketIo = require('socket.io');
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;
const keywordFilePath = path.join(__dirname, 'data', 'keyword.txt');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'draw&guess_room',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL database: ', err);
    } else {
        console.log('Connected to MySQL database');
        connection.release();
    }
});

app.post('/api/create-room', async (req, res) => {
    const { roomNumber, username } = req.body;

    try {
        const connection = await pool.getConnection();
        const [existingRooms] = await connection.query('SELECT * FROM rooms WHERE room_id = ?', [roomNumber]);
        if (existingRooms.length > 0) {
            connection.release();
            return res.status(400).json({ error: '房间已存在，请输入其他房间号' });
        }

        const [results] = await connection.query('INSERT INTO rooms (room_id, homeowner,keyword) VALUES (?, ?,"Undefine")', [roomNumber, username]);
        connection.release();

        res.status(200).json({ message: '成功创建房间', room_id: results.insertId });
    } catch (error) {
        console.error('Error inserting into database: ', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/join-room', async (req, res) => {
    const { roomNumber, username } = req.body;

    console.log('Received join-room request:', { roomNumber, username });

    try {
        const connection = await pool.getConnection();
        const [results] = await connection.query('SELECT * FROM rooms WHERE room_id = ?', [roomNumber]);

        if (results.length === 0) {
            connection.release();
            console.log('Room not found:', roomNumber);
            return res.status(400).json({ error: '房间不存在，请输入正确的房间号' });
        }

        connection.release();

        console.log('Successfully joined room:', roomNumber);
        res.status(200).json({ message: '成功加入房间', room_id: results[0].room_id });
    } catch (error) {
        console.error('Error querying database: ', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/keyword', async (req, res) => {
    const { roomNumber } = req.body;

    try {
        const connection = await pool.getConnection();
        const [results] = await connection.query('SELECT * FROM rooms WHERE room_id = ?', [roomNumber]);

        if (results.length === 0) {
            connection.release();
            return res.status(404).json({ error: '房间不存在，请输入正确的房间号' });
        }

        const data = await fs.readFile(keywordFilePath, 'utf8');
        const keywords = data.trim().split('\n');
        const newKeyword = keywords[Math.floor(Math.random() * keywords.length)].trim();

        // 更新数据库中的关键词信息
        await connection.query('UPDATE rooms SET keyword = ? WHERE room_id = ?', [newKeyword, roomNumber]);

        connection.release();

        console.log('Updated keyword for room:', roomNumber);
        res.status(200).json({ message: '成功更新房间关键词', keyword: newKeyword });
    } catch (error) {
        console.error('Error updating keyword: ', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join', async ({ room, username }) => {
        socket.join(room); // 加入房间
        socket.room = room; // 设置 socket 对象的 room 属性
        socket.username = username; // 设置 socket 对象的 username 属性

        // 广播消息通知其他成员有新成员加入
        io.to(room).emit('message', `${username} 已加入房间`);

        // 更新房间成员列表
        updateMembers(room);
    });

    socket.on('drawing', (data) => {
        socket.to(socket.room).emit('drawing', data);
    });

    socket.on('guess', async (guess) => {
        console.log('Received guess:', guess);
        const room = socket.room;
        const username = socket.username;

        try {
            const connection = await pool.getConnection();
            const [results] = await connection.query('SELECT keyword FROM rooms WHERE room_id = ?', [room]);
            connection.release();

            if (results.length === 0) {
                console.error(`No keyword found for room ${room}`);
                io.to(room).emit('message', '房间关键词未找到，请刷新页面重试');
                return;
            }

            const keyword = results[0].keyword;

            // 输出当前房间的关键词
            console.log(`Current keyword for room ${room}:`, keyword);
            // 输出猜测的关键词
            console.log(`Guessing keyword:`, guess);

            // 比较猜测和关键词
            if (guess.trim().toLowerCase() === keyword.toLowerCase()) {
                const message = `${username} 猜对了！答案是 ${keyword}`;
                console.log(message);
                io.to(room).emit('message', message);
            } else {
                const message = `${username} 猜测不正确`;
                console.log(message);
                io.to(room).emit('message', message);
            }
        } catch (error) {
            console.error('Error querying database: ', error);
            io.to(room).emit('message', '数据库错误，请刷新页面重试');
        }
    });

    socket.on('disconnect', () => {
        if (socket.room) {
            console.log('Client disconnected:', socket.id);
            updateMembers(socket.room); // 更新房间成员列表
        }
    });

    function updateMembers(room) {
        // 获取房间内所有成员的用户名并发送给客户端
        const roomSockets = io.sockets.adapter.rooms.get(room);
        if (roomSockets) {
            const memberUsernames = Array.from(roomSockets).map(socketId => io.sockets.sockets.get(socketId).username);
            io.to(room).emit('members', memberUsernames);
        }
    };
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
