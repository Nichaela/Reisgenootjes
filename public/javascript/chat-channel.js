const socket = io()

const messages = document.getElementById('messages')
const input = document.getElementById('messageInput')
const sendButton = document.getElementById('sendButton')
const chatPartnerId = document.getElementById('chatPartnerId').value
const chatPartnerName = document.getElementById('chatPartnerName').textContent
const typingIndicator = document.getElementById('typingIndicator')

let typingTimeout

socket.emit('join private chat', {
  otherUserId: chatPartnerId,
  otherUserName: chatPartnerName
})

function addMessageToScreen(data) {
  const div = document.createElement('div')
  div.classList.add('message')
  div.classList.add(data.fromSelf ? 'messageSent' : 'messageReceived')
  div.textContent = `${data.fromSelf ? 'Jij' : data.fromName}: ${data.text}`

  messages.appendChild(div)
  messages.scrollTop = messages.scrollHeight
}

function sendMessage() {
  const text = input.value.trim()
  if (!text) return

  socket.emit('private message', {
    toUserId: chatPartnerId,
    text: text
  })

  socket.emit('stop typing', { toUserId: chatPartnerId })

  input.value = ''
  typingIndicator.textContent = ''
}

sendButton.addEventListener('click', sendMessage)

input.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    sendMessage()
  }
})

input.addEventListener('input', () => {
  if (input.value.trim()) {
    socket.emit('typing', { toUserId: chatPartnerId })

    clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      socket.emit('stop typing', { toUserId: chatPartnerId })
    }, 1000)
  } else {
    socket.emit('stop typing', { toUserId: chatPartnerId })
  }
})

socket.on('private message', (data) => {
  addMessageToScreen(data)
})

socket.on('typing', () => {
  typingIndicator.textContent = `${chatPartnerName} is typing...`
})

socket.on('stop typing', () => {
  typingIndicator.textContent = ''
})

socket.on('user notification', (message) => {
  console.log(message)
})

window.addEventListener('beforeunload', () => {
  socket.emit('leave private chat', { otherUserId: chatPartnerId })
})

messages.scrollTop = messages.scrollHeight