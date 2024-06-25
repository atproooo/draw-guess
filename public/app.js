// 创建一个 Vue 实例
const app = new Vue({
    el: '#app',  // 绑定到 id 为 app 的 HTML 元素上
    data: {
        roomNumber: '', // 房间号
        userID: '',     // 用户ID
        message: '',    // 用于显示返回的消息或错误信息
    },
    methods: {
        handleSubmit() {
            // 提交表单逻辑
            console.log('提交表单');

            // 构造请求体数据
            const requestData = {
                roomNumber: this.roomNumber,
                username: this.userID
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
                // 在这里可以处理成功后的逻辑，如跳转页面等
            })
            .catch(error => {
                // 处理错误情况
                this.message = error.message || '服务器错误';
                console.error('创建房间错误:', error);
            });
        },
        goBack() {
            // 返回按钮逻辑
            console.log('返回');
            window.location.href = '/index.html'; // 跳转到游戏开始页面
        }
    }
});
