const socket = io();
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');
const chatPartnerInput = document.getElementById('chatPartnerId');
const chatPartnerNameElement = document.getElementById('chatPartnerName');

let typingTimer;
let isTyping = false;
let toUserId = chatPartnerInput ? chatPartnerInput.value : null;
let otherUserName = chatPartnerNameElement ? chatPartnerNameElement.textContent.trim() : '';

if (!messages || !messageInput || !sendButton || !typingIndicator || !toUserId) {
  console.log('Geen chatpagina, chat JS wordt overgeslagen');
} else {
  socket.emit('join private chat', {
    otherUserId: toUserId,
    otherUserName: otherUserName
  });

  window.addEventListener('beforeunload', () => {
    socket.emit('leave private chat', { otherUserId: toUserId });
  });

  function addMessage(text, type = 'message') {
    const messageElement = document.createElement('div');
    messageElement.classList.add(type);
    messageElement.textContent = text;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
  }

  function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    socket.emit('private message', {
      toUserId,
      text: message
    });

    messageInput.value = '';
    socket.emit('stop typing', { toUserId });
    isTyping = false;
  }

  sendButton.addEventListener('click', sendMessage);

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
      return;
    }

    if (!isTyping) {
      socket.emit('typing', { toUserId });
      isTyping = true;
    }

    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('stop typing', { toUserId });
      isTyping = false;
    }, 1000);
  });

  socket.on('private message', (msg) => {
    if (msg.fromSelf) {
      addMessage(`Jij: ${msg.text}`);
      return;
    }

    if (msg.fromUserId !== toUserId) return;

    addMessage(`${msg.fromName}: ${msg.text}`);
  });

  socket.on('user notification', (notification) => {
    addMessage(notification);
  });

  socket.on('typing', (data) => {
    if (data && data.fromUserId === toUserId) {
      typingIndicator.textContent = 'De ander is aan het typen...';
    }
  });

  socket.on('stop typing', (data) => {
    if (data && data.fromUserId === toUserId) {
      typingIndicator.textContent = '';
    }
  });

  messageInput.focus();
}