const socket = io();
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');
const chatPartnerInput = document.getElementById('chatPartnerId');

let typingTimer;
let isTyping = false;
let toUserId = chatPartnerInput ? chatPartnerInput.value : null;

// Stop meteen als dit geen chatpagina is
if (!messages || !messageInput || !sendButton || !typingIndicator) {
    console.log('Geen chatpagina, chat JS wordt overgeslagen');
} else {
    function sendMessage() {
        const message = messageInput.value.trim();

        if (message) {
            socket.emit('private message', {
                toUserId: toUserId,
                text: message
            });

            messageInput.value = '';
            socket.emit('stop typing');
            isTyping = false;
        }
    }

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        } else {
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

    socket.on('private message', (msg) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.textContent = `${msg.fromName}: ${msg.text}`;
        messages.appendChild(messageElement);
        messages.scrollTop = messages.scrollHeight;
    });

    socket.on('chat message', (msg) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.textContent = msg;
        messages.appendChild(messageElement);
        messages.scrollTop = messages.scrollHeight;
    });
    

    socket.on('user notification', (notification) => {
        const notificationElement = document.createElement('div');
        notificationElement.classList.add('message');
        notificationElement.style.background = '#fff3cd';
        notificationElement.style.color = '#856404';
        notificationElement.style.fontStyle = 'italic';
        notificationElement.textContent = notification;
        messages.appendChild(notificationElement);
        messages.scrollTop = messages.scrollHeight;
    });

    socket.on('typing', () => {
        typingIndicator.textContent = 'Someone is typing...';
    });

    socket.on('stop typing', () => {
        typingIndicator.textContent = '';
    });

    messageInput.focus();
}