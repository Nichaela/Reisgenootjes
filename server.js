// ==========================================
// 1. IMPORTS (Packages)
// ==========================================
require('dotenv').config()

const express = require('express')
const session = require('express-session')
const http = require('http')
const socketIo = require('socket.io')

const { MongoClient, ServerApiVersion } = require('mongodb')

// ==========================================
// 2. APP, SERVER, SOCKET.IO
// ==========================================
const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// ==========================================
// 3. CONFIGURATIE & DATABASE
// ==========================================
app
  .use(express.urlencoded({ extended: true })) // parse form data
  .use(express.static('public')) // serve static files
  .set('view engine', 'ejs') // EJS templating
  .use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  )

// Construct URL used to connect to database from info in the .env file
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

let users

// ==========================================
// 4. MIDDLEWARE (Algemeen)
// ==========================================
app.use((req, res, next) => {
  res.locals.user = req.session.user || null
  next()
})

// ==========================================
// 5. ROUTES (GET - Pagina's bekijken)
// ==========================================
function registerGetRoutes() {
  app.get('/', (req, res) => {
    res.render('pages/index', { data: null })
  })

  app.get('/login', (req, res) => {
    res.render('pages/login', { error: null })
  })

  app.get('/register', (req, res) => {
    res.render('pages/register', { error: null })
  })

  app.get('/register-success', (req, res) => {
    res.render('pages/register-success')
  })

  app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    res.render('pages/dashboard', { user: req.session.user })
  })

  // Laura pagina's
  app.get('/discover', (req, res) => {
    res.render('pages/discover', { user: req.session.user })
  })

  app.get('/create-post', (req, res) => {
    res.render('pages/create-post', { user: req.session.user })
  })

    // Chatroom pagina
  app.get('/chatroom', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    res.render('pages/chatroom', { user: req.session.user })
  })

  app.get('/chat-channel', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    res.render('pages/chat-channel', { user: req.session.user })
  })

  app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'))
  })
}

// ==========================================
// 6. POST ROUTES (Data verwerken)
// ==========================================
function registerPostRoutes() {
  // Login
  app.post('/login', async (req, res) => {
    const { username, password } = req.body
    const user = await users.findOne({ name: username })

    if (!user) {
      return res.status(401).render('pages/login', { error: 'Onbekende gebruiker' })
    }

    if (user.password !== password) {
      return res.status(401).render('pages/login', { error: 'Verkeerd wachtwoord' })
    }

    req.session.user = { _id: user._id, name: user.name, email: user.email }
    return res.redirect('/')
  })

  // Register
  app.post('/register', async (req, res) => {
    const { email, username, password, dob } = req.body

    const existingUser = await users.findOne({ email })
    if (existingUser) {
      return res.status(409).render('pages/register', { error: 'Email bestaat al' })
    }

    await users.insertOne({
      email,
      name: username,
      password,
      dob: dob || null,
    })

    return res.redirect('/register-success')
  })
}

// ==========================================
// 7. SOCKET.IO (Chat events)
// source: https://medium.com/@basukori8463/build-a-real-time-chat-app-from-scratch-with-node-js-and-socket-io-9714b7076372
// ==========================================
let connectedUsers = 0

function registerSocketHandlers() {
  io.on('connection', (socket) => {
    connectedUsers++
    console.log(`🎉 A user connected: ${socket.id} Total users: ${connectedUsers}`)

    // Notify others that someone joined
    socket.broadcast.emit(
      'user notification',
      `Someone joined the chat! (${connectedUsers} users online)`
    )

    socket.on('chat message', (msg) => {
      console.log('📨 Message received:', msg)
      io.emit('chat message', msg)
    })

    // Typing indicators
    socket.on('typing', () => {
      socket.broadcast.emit('typing')
    })

    socket.on('stop typing', () => {
      socket.broadcast.emit('stop typing')
    })

    socket.on('disconnect', () => {
      connectedUsers--
      console.log(`👋 A user disconnected: ${socket.id} Total users: ${connectedUsers}`)

      socket.broadcast.emit(
        'user notification',
        `Someone left the chat. (${connectedUsers} users online)`
      )
    })
  })
}

// ==========================================
// 8. ERROR HANDLING & SERVER START
// ==========================================
function registerErrorHandlers() {
  // 404 handler
  app.use((req, res) => {
    if (req.url === '/.well-known/appspecific/com.chrome.devtools.json') {
      return res.sendStatus(204)
    }
    console.error('404 error at URL:', req.url)
    res.status(404).send('404 error at URL: ' + req.url)
  })

  // 500 handler
  app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('500: server error')
  })
}

async function start() {
  try {
    await client.connect()
    console.log('Database connection established')

    const db = client.db(process.env.DB_NAME)
    users = db.collection(process.env.DB_COLLECTION)

    registerGetRoutes()
    registerPostRoutes()
    registerSocketHandlers()
    registerErrorHandlers()

    const port = process.env.PORT || 3000
    server.listen(port, () => {
      console.log(`Server draait op poort ${port}`)
    })
  } catch (err) {
    console.log('Database connection error:', err)
    console.log('For uri -', uri)
    process.exit(1)
  }
}

start()