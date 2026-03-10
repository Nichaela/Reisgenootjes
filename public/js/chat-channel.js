const socket = io();
        const messages = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const typingIndicator = document.getElementById('typingIndicator');
        let typingTimer;
        let isTyping = false;
        // Send message function
        function sendMessage() {
            const message = messageInput.value.trim();
            if (message) {
                socket.emit('chat message', message);
                messageInput.value = '';
                // Stop typing indicator
                socket.emit('stop typing');
                isTyping = false;
            }
        }
        // Send message on button click
        sendButton.addEventListener('click', sendMessage);
        // Send message on Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            } else {
                // Handle typing indicator
                if (!isTyping) {
                    socket.emit('typing');
                    isTyping = true;
                }
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => {
                    socket.emit('stop typing');
                    isTyping = false;
                }, 1000);
            }
        });
        // Listen for messages
        socket.on('chat message', (msg) => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.textContent = msg;
            messages.appendChild(messageElement);
            messages.scrollTop = messages.scrollHeight;
        });
        // Handle typing indicators
        socket.on('typing', () => {
            typingIndicator.textContent = 'Someone is typing...';
        });
        socket.on('stop typing', () => {
            typingIndicator.textContent = '';
        });
        // Focus on input when page loads
        messageInput.focus();

// source: https://medium.com/@basukori8463/build-a-real-time-chat-app-from-scratch-with-node-js-and-socket-io-9714b7076372