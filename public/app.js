// 创建一个 Vue 实例
const app = new Vue({
    el: '#app',  // 绑定到 id 为 app 的 HTML 元素上
    data: {
        roomNumber: '', // 房间号
        username: '',   // 用户名
        message: '',    // 用于显示返回的消息或错误信息
    },
    methods: {
        handleSubmit() {
            // 根据当前页面路径判断是创建房间还是加入房间
            const path = window.location.pathname;
            if (path.includes('create_room.html')) {
                this.createRoom();
            } else if (path.includes('join_room.html')) {
                this.joinRoom();
            }
        },
        createRoom() {
            // 提交表单逻辑
            console.log('提交表单');

            // 构造请求体数据
            const requestData = {
                roomNumber: this.roomNumber,
                username: this.username
            };

            // 发送创建房间的 POST 请求
            fetch('/api/create-room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 400) {
                        return response.json().then(data => {
                            throw new Error(data.error); // 抛出具体的错误信息
                        });
                    }
                    throw new Error('网络错误');
                }
                return response.json();
            })
            .then(data => {
                // 成功创建房间，处理返回的数据
                this.message = data.message;
                console.log('成功创建房间:', data);
        
                // 跳转到出题者页面，并传递房间号和用户名
                const redirectUrl = `/drawer.html?roomNumber=${encodeURIComponent(this.roomNumber)}&username=${encodeURIComponent(this.username)}`;
                window.location.href = redirectUrl;
            })
            .catch(error => {
                // 处理错误情况
                this.message = error.message || '服务器错误';
                console.error('创建房间错误:', error);
            });
        },
        joinRoom() {
            // 提交表单逻辑
            console.log('提交表单');

            // 构造请求体数据
            const requestData = {
                roomNumber: this.roomNumber,
                username: this.username
            };

            // 发送加入房间的 POST 请求
            fetch('/api/join-room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 400) {
                        return response.json().then(data => {
                            throw new Error(data.error); // 抛出具体的错误信息
                        });
                    }
                    throw new Error('网络错误');
                }
                return response.json();
            })
            .then(data => {
                // 成功加入房间，处理返回的数据
                this.message = data.message;
                console.log('成功加入房间:', data);
                // 跳转到猜题者页面，并传递房间号和用户名
                const redirectUrl = `/guesser.html?roomNumber=${encodeURIComponent(this.roomNumber)}&username=${encodeURIComponent(this.username)}`;
                window.location.href = redirectUrl;
            })
            .catch(error => {
                // 处理错误情况
                this.message = error.message || '服务器错误';
                console.error('加入房间错误:', error);
            });
        },
        goBack() {
            // 返回按钮逻辑
            console.log('返回');
            window.history.back();
        }
    }
});
