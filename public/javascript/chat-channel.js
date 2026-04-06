// eslint-disable-next-line no-undef
const socket = io()

const messages = document.getElementById('messages')
const messageInput = document.getElementById('message-input')
const sendButton = document.getElementById('sendButton')
const chatPartnerId = document.getElementById('chatPartnerId').value
const chatPartnerName = document.getElementById('chatPartnerName').textContent
const typingIndicator = document.getElementById('typingIndicator')

let typingTimeout

// Laat de server weten dat we een privéchat willen joinen met deze gebruiker
socket.emit('join private chat', {
  otherUserId: chatPartnerId,
  otherUserName: chatPartnerName
})

// Maak een bericht element aan en voeg het toe aan het scherm
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
  // Stuur het bericht naar de server, inclusief de ID van de chatpartner
  socket.emit('private message', {
    toUserId: chatPartnerId,
    text: messageText
  })

  socket.emit('stop typing', {
    toUserId: chatPartnerId
  })
  //reset
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
  typingIndicator.textContent = message
  console.log(message)
})

window.addEventListener('beforeunload', () => {
  socket.emit('leave private chat', {
    otherUserId: chatPartnerId
  })
})

// Scroll naar beneden bij het laden van de pagina
messages.scrollTop = messages.scrollHeight