// eslint-disable-next-line no-undef
const socket = io()

const messages = document.getElementById('messages')
const messageInput = document.getElementById('message-input')
const sendButton = document.getElementById('sendButton')
const chatPartnerId = document.getElementById('chatPartnerId').value
const chatPartnerName = document.getElementById('chatPartnerName').textContent
const typingIndicator = document.getElementById('typingIndicator')

let typingTimeout

socket.emit('join private chat', {
  otherUserId: chatPartnerId,
  otherUserName: chatPartnerName
})

function addMessageToScreen(messageData) {
  const messageElement = document.createElement('div')
  messageElement.classList.add('message')
  messageElement.classList.add(
    messageData.fromSelf ? 'message-sent' : 'message-received'
  )
  messageElement.textContent =
    `${messageData.fromSelf ? 'Jij' : messageData.fromName}: ` +
    `${messageData.text}`

  messages.appendChild(messageElement)
  messages.scrollTop = messages.scrollHeight
}

function sendMessage() {
  const messageText = messageInput.value.trim()

  if (!messageText) {
    return
  }

  socket.emit('private message', {
    toUserId: chatPartnerId,
    text: messageText
  })

  socket.emit('stop typing', {
    toUserId: chatPartnerId
  })

  messageInput.value = ''
  typingIndicator.textContent = ''
}

sendButton.addEventListener('click', sendMessage)

messageInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    sendMessage()
  }
})

messageInput.addEventListener('input', () => {
  if (messageInput.value.trim()) {
    socket.emit('typing', {
      toUserId: chatPartnerId
    })

    clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      socket.emit('stop typing', {
        toUserId: chatPartnerId
      })
    }, 1000)
  } else {
    socket.emit('stop typing', {
      toUserId: chatPartnerId
    })
  }
})

socket.on('private message', (messageData) => {
  addMessageToScreen(messageData)
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
  socket.emit('leave private chat', {
    otherUserId: chatPartnerId
  })
})

messages.scrollTop = messages.scrollHeight