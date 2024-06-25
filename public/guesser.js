const socket = io();

const app = new Vue({
    el: '#app',
    data: {
        guess: '',
        members: [],
        messages: [],
        roomNumber: '',  // 用户输入的房间号
        username: ''    // 用户输入的用户名
    },
    methods: {
        joinRoom() {
            socket.emit('join', { room: this.roomNumber, username: this.username }); // 发送用户输入的房间号和用户名
        },
        submitGuess() {
            // 提交猜测
            console.log('Submitting guess:', this.guess);
            if (this.guess.trim() === '') {
                return; // 空猜测不处理
            }
            socket.emit('guess', this.guess); // 发送猜测内容到服务器
        }
        
    },
    mounted() {
        // 从 URL 参数获取房间号和用户名
        const urlParams = new URLSearchParams(window.location.search);
        this.roomNumber = urlParams.get('roomNumber');
        this.username = urlParams.get('username');

        const canvas = document.getElementById('drawingCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        socket.on('connect', () => {
            // 连接成功后，自动加入房间（如果需要）
            if (this.roomNumber && this.username) {
                this.joinRoom(); // 调用加入房间方法
            }
        });

socket.on('message', (message) => {
    console.log('Received message:', message);
    this.messages.push(message);
});


        socket.on('members', (members) => {
            console.log('Received members:', members);
            this.members = members; // 更新成员列表
        });

        socket.on('drawing', (data) => {
            ctx.strokeStyle = data.color;
            ctx.lineWidth = data.brushSize;
            ctx.lineTo(data.x, data.y);
            ctx.stroke();
        });
    }
});