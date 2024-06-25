const socket = io();

const app = new Vue({
    el: '#app',
    data: {
        color: '#000000',
        brushSize: 5,
        keyword: '',
        members: [],
        messages: [],
        roomNumber: '', // 用户输入的房间号
        username: ''    // 用户输入的用户名
    },
    methods: {
        changeKeyword() {
            fetch('/api/keyword', {
                method: 'POST', // 注意此处使用 POST 方法，因为后端定义了 POST /api/keyword
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomNumber: this.roomNumber // 将房间号作为参数传递给后端
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch keyword');
                }
                return response.json();
            })
            .then(data => {
                if (!data.keyword) {
                    throw new Error('Empty keyword received');
                }
                this.keyword = data.keyword;
            })
            .catch(error => {
                console.error('Error fetching keyword:', error.message);
                // 可以根据具体情况处理错误，例如设置默认关键词或显示错误信息给用户
                this.keyword = 'Default Keyword';
            });
        },
        fetchKeyword() {
            fetch('/api/keyword', {
                method: 'POST', // 注意此处使用 POST 方法，因为后端定义了 POST /api/keyword
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomNumber: this.roomNumber // 将房间号作为参数传递给后端
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch keyword');
                }
                return response.json();
            })
            .then(data => {
                if (!data.keyword) {
                    throw new Error('Empty keyword received');
                }
                this.keyword = data.keyword;
            })
            .catch(error => {
                console.error('Error fetching keyword:', error.message);
                // 可以根据具体情况处理错误，例如设置默认关键词或显示错误信息给用户
                this.keyword = 'Default Keyword';
            });
        }
    },
    mounted() {
        // 从 URL 参数获取房间号和用户名
        const urlParams = new URLSearchParams(window.location.search);
        this.roomNumber = urlParams.get('roomNumber');
        this.username = urlParams.get('username');


        // 初始化时获取一个随机关键词
        this.fetchKeyword();

        const canvas = document.getElementById('drawingCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let drawing = false;

        canvas.addEventListener('mousedown', () => drawing = true);
        canvas.addEventListener('mouseup', () => drawing = false);
        canvas.addEventListener('mousemove', (event) => {
            if (!drawing) return;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.brushSize;
            ctx.lineTo(event.clientX, event.clientY);
            ctx.stroke();
            socket.emit('drawing', { x: event.clientX, y: event.clientY, color: this.color, brushSize: this.brushSize });
        });

        let joinedRoom = false;

        socket.on('connect', () => {
            if (!joinedRoom) {
                socket.emit('join', { room: this.roomNumber, username: this.username });
                joinedRoom = true;
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
