const express = require('express');
const mysql = require('mysql2/promise'); // 使用 mysql2 的 promise 版本
const path = require('path');

const app = express();
const port = 3000;

// 解析请求体中的 JSON
app.use(express.json());

// 静态文件中间件，指定静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// 创建数据库连接池
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'draw&guess_room',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试数据库连接
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL database: ', err);
    } else {
        console.log('Connected to MySQL database');
        connection.release(); // 释放连接
    }
});

// 创建房间接口
app.post('/api/create-room', async (req, res) => {
    const { roomNumber, username } = req.body;

    try {
        const connection = await pool.getConnection();

        // 检查房间是否已存在
        const [existingRooms] = await connection.query('SELECT * FROM rooms WHERE room_id = ?', [roomNumber]);
        if (existingRooms.length > 0) {
            connection.release();
            return res.status(400).json({ error: '房间已存在，请输入其他房间号' });
        }

        // 插入新房间记录
        const [results] = await connection.query('INSERT INTO rooms (room_id, homeowner) VALUES (?, ?)', [roomNumber, username]);
        connection.release();
        
        res.status(200).json({ message: '成功创建房间', room_id: results.insertId });
    } catch (error) {
        console.error('Error inserting into database: ', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 加入房间接口
app.post('/api/join-room', async (req, res) => {
    const { room_id } = req.body;

    try {
        const connection = await pool.getConnection();
        const [results] = await connection.query('SELECT * FROM rooms WHERE room_id = ?', [room_id]);
        connection.release();

        if (results.length === 0) {
            res.status(400).json({ error: '房间不存在，请输入正确的房间号' });
        } else {
            res.status(200).json({ message: '成功加入房间', room_id: results[0].room_id });
        }
    } catch (error) {
        console.error('Error querying database: ', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
