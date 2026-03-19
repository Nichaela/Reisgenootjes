// ==========================================
// 1. IMPORTS (Packages)
// ==========================================
require('dotenv').config()

const express = require('express')
const session = require('express-session')
const http = require('http')
const socketIo = require('socket.io')

const xss = require('xss')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')

const nodemailer = require('nodemailer')
const crypto = require('crypto')

// ==========================================
// 2. APP, SERVER, SOCKET.IO
// ==========================================
const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// ==========================================
// 3. CONFIGURATIE & DATABASE
// ==========================================
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
})

app
  .use(express.urlencoded({ extended: true }))
  .use(express.static('public'))
  .set('view engine', 'ejs')
  .use(sessionMiddleware)

io.engine.use(sessionMiddleware)

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

// database collections
let users
let discover
let messages

// ==========================================
// 4. MIDDLEWARE (Algemeen)
// ==========================================
app.use((req, res, next) => {
  res.locals.user = req.session.user || null
  next()
})

// XSS sanitizing middleware
app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key])
      }
    }
  }
  next()
})

// ==========================================
// 5. ROUTES (GET - Pagina's bekijken)
// ==========================================
function registerGetRoutes() {
  app.get('/', (req, res) => {
    res.render('pages/index', { data: null })
  })

  app.get('/welkom', (req, res) => {
    res.render('pages/welkom', { error: null })
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

  app.get('/forgot-password', (req, res) => {
    res.render('pages/forgot-password', { error: null, success: null })
  })

  app.get('/profile', async (req, res) => {
    if (!req.session.user) return res.redirect('/login')

    try {
      const mijnReizen = await discover.find({
        userId: new ObjectId(req.session.user._id)
      }).toArray()

      res.render('pages/profile', {
        user: req.session.user,
        reizen: mijnReizen
      })
    } catch (err) {
      console.error(err)
      res.status(500).send('Fout bij ophalen van jouw reizen')
    }
  })

  app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    res.render('pages/dashboard', { user: req.session.user })
  })

  app.get('/discover', async (req, res) => {
    try {
      const posts = await discover.find({}).toArray()

      res.render('pages/discover', {
        user: req.session.user,
        posts: posts
      })
    } catch (err) {
      console.error(err)
      res.status(500).send('Er ging iets mis bij het laden van posts')
    }
  })

  app.get('/create-post', (req, res) => {
    if (!req.session.user) return res.redirect('/welkom')
    res.render('pages/create-post', { user: req.session.user })
  })

  app.get('/post', (req, res) => {
    res.render('pages/post', { user: req.session.user, post: null })
  })

  app.get('/post/:id', async (req, res) => {
    try {
      const postId = req.params.id
      const post = await discover.findOne({ _id: new ObjectId(postId) })

      if (!post) {
        return res.status(404).send('Post niet gevonden')
      }

      res.render('pages/post', { user: req.session.user, post })
    } catch (err) {
      console.error(err)
      res.status(500).send('Er ging iets mis bij het ophalen van de post')
    }
  })

  app.get('/matchen', (req, res) => {
    res.render('pages/matchen', { user: req.session.user })
  })

  app.get('/profiel', async (req, res) => {
    if (!req.session.user) return res.redirect('/login')

    try {
      const mijnPosts = await discover.find({
        userId: new ObjectId(req.session.user._id)
      }).toArray()

      res.render('pages/profiel', {
        user: req.session.user,
        posts: mijnPosts
      })
    } catch (err) {
      console.error(err)
      res.status(500).send('Fout bij ophalen van profiel')
    }
  })

  app.get('/chatroom', async (req, res) => {
    if (!req.session.user) return res.redirect('/login')

    try {
      const allUsers = await users.find().toArray()
      const otherUsers = allUsers.filter(otherUser =>
        otherUser._id.toString() !== req.session.user._id.toString()
      )

      res.render('pages/chatroom', {
        user: req.session.user,
        users: otherUsers
      })
    } catch (err) {
      console.error(err)
      res.status(500).send('Fout bij ophalen van chatroom')
    }
  })

  app.get('/chat-channel/:userId', async (req, res) => {
    if (!req.session.user) return res.redirect('/login')

    try {
      const chatPartnerId = req.params.userId
      const myUserId = req.session.user._id.toString()

      const chatPartner = await users.findOne({ _id: new ObjectId(chatPartnerId) })

      if (!chatPartner) {
        return res.status(404).render('pages/errorstate', {
          status: 404,
          message: 'Gebruiker niet gevonden'
        })
      }

      const conversationId = getConversationRoom(myUserId, chatPartnerId)

      const conversationHistory = await messages
        .find({ conversationId })
        .sort({ createdAt: 1 })
        .toArray()

      res.render('pages/chat-channel', {
        user: req.session.user,
        chatPartner: {
          _id: chatPartner._id.toString(),
          name: chatPartner.name
        },
        conversationHistory
      })
    } catch (err) {
      console.error(err)
      res.status(500).send('Fout bij ophalen van chatkanaal')
    }
  })

  app.get('/filter', async (req, res) => {
    try {
      const myUsers = await users.find({}).toArray()
      res.render('pages/filter', { users: myUsers })
    } catch (err) {
      console.error(err)
      res.status(500).send('Fout bij ophalen data')
    }
  })

  app.get('/ontdekfilter', async (req, res) => {
    try {
      const myUsers = await users.find({}).toArray()
      res.render('pages/ontdekfilter', { users: myUsers })
    } catch (err) {
      console.error(err)
      res.status(500).send('Fout bij ophalen data')
    }
  })
}

// ==========================================
// 6. POST ROUTES (Data verwerken)
// ==========================================
function registerPostRoutes() {
  // Login
  app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body

      if (!validator.isEmail(email || '')) {
        return res.status(400).render('pages/login', { error: 'Ongeldig emailadres' })
      }

      const user = await users.findOne({ email })
      if (!user) {
        return res.status(401).render('pages/login', { error: 'Onbekende gebruiker' })
      }

      const passwordMatch = await bcrypt.compare(password, user.password)
      if (!passwordMatch) {
        return res.status(401).render('pages/login', { error: 'Ongeldig wachtwoord' })
      }

      req.session.user = {
        _id: user._id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        username: user.username,
        bio: user.bio,
        profile: user.profile,
        gender: user.gender,
        birthday: user.birthday,
        interests: user.interests,
        opzoek: user.opzoek
      }

      return res.redirect('/discover')
    } catch (err) {
      console.error(err)
      return res.status(500).render('pages/login', { error: 'Er ging iets mis bij inloggen' })
    }
  })

  // Logout
  app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Fout bij uitloggen:', err)
        return res.status(500).send('Uitloggen mislukt')
      }

      res.clearCookie('connect.sid')
      res.redirect('/login')
    })
  })

  // Register
  app.post('/register', async (req, res) => {
    try {
      const {
        name,
        lastName,
        email,
        password,
        username,
        birthday,
        tel,
        gender,
        profile,
        image1,
        image2,
        image3,
        status,
        bio,
        interests,
        opzoek
      } = req.body

      if (!validator.isEmail(email || '')) {
        return res.status(400).render('pages/register', { error: 'Ongeldig emailadres' })
      }

      if (!validator.isLength(password || '', { min: 8 })) {
        return res.status(400).render('pages/register', { error: 'Wachtwoord moet minimaal 8 tekens bevatten' })
      }

      const existingUser = await users.findOne({ email })
      if (existingUser) {
        return res.status(409).render('pages/register', { error: 'Email bestaat al' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const result = await users.insertOne({
        name,
        lastName,
        email,
        password: hashedPassword,
        username,
        birthday,
        tel,
        gender,
        profile,
        image1,
        image2,
        image3,
        status,
        bio,
        interests,
        opzoek
      })

      const nieuweUser = await users.findOne({ _id: result.insertedId })

      req.session.user = {
        _id: nieuweUser._id,
        email: nieuweUser.email,
        name: nieuweUser.name,
        lastName: nieuweUser.lastName,
        username: nieuweUser.username,
        bio: nieuweUser.bio,
        profile: nieuweUser.profile,
        gender: nieuweUser.gender,
        birthday: nieuweUser.birthday,
        interests: nieuweUser.interests,
        opzoek: nieuweUser.opzoek
      }

      return res.redirect('/discover')
    } catch (err) {
      console.error(err)
      return res.status(500).render('pages/register', { error: 'Er ging iets mis bij registreren' })
    }
  })

  // create-post formulier
  app.post('/post', async (req, res) => {
    try {
      if (!req.session.user) return res.redirect('/login')

      const { title, startDate, endDate, location, persons, discription, gender } = req.body

      let age = req.body.age
      if (!Array.isArray(age)) {
        age = age ? [age] : []
      }

      const supplies = req.body.supplies
        ? req.body.supplies.split('\n').map(item => item.trim()).filter(Boolean)
        : []

      const result = await discover.insertOne({
        userId: new ObjectId(req.session.user._id),
        title,
        startDate,
        endDate,
        location,
        persons,
        discription,
        supplies,
        age,
        gender
      })

      return res.redirect(`/post/${result.insertedId}`)
    } catch (err) {
      console.error(err)
      return res.status(500).send('Fout bij het maken van post')
    }
  })
}

// ==========================================
// 7. SOCKET.IO (Chat events)
// ==========================================
let connectedUsers = 0

function getConversationRoom(userId1, userId2) {
  return [userId1.toString(), userId2.toString()].sort().join('_')
}

function registerSocketHandlers() {
  io.on('connection', (socket) => {
    const user = socket.request.session.user
    console.log('session user:', user)

    if (!user) {
      return socket.disconnect()
    }

    const myUserId = user._id.toString()
    socket.join(myUserId)

    connectedUsers++
    console.log(`🎉 A user connected: ${socket.id} Total users: ${connectedUsers}`)

    // gebruiker opent een specifiek chatkanaal
    socket.on('join private chat', ({ otherUserId, otherUserName }) => {
      if (!otherUserId) return

      const roomName = getConversationRoom(myUserId, otherUserId)
      socket.join(roomName)

      socket.to(roomName).emit(
        'user notification',
        `${user.name} joined the chat with ${otherUserName || 'you'}`
      )

      console.log(`${user.name} joined room: ${roomName}`)
    })

    socket.on('leave private chat', ({ otherUserId }) => {
      if (!otherUserId) return

      const roomName = getConversationRoom(myUserId, otherUserId)
      socket.leave(roomName)

      socket.to(roomName).emit(
        'user notification',
        `${user.name} left the chat`
      )

      console.log(`${user.name} left room: ${roomName}`)
    })

    socket.on('private message', async({ toUserId, text }) => {
      if (!toUserId || !text) return

      const cleanText = xss(String(text).trim())
      if (!cleanText) return

      const roomName = getConversationRoom(myUserId, toUserId)
      
      await messages.insertOne({
        conversationId: roomName,
        fromUserId: myUserId,
        toUserId: toUserId,
        fromName: user.name,
        text: cleanText,
        createdAt: new Date()
      })
      
      const payloadForReceiver = {
        fromUserId: myUserId,
        fromName: user.name,
        text: cleanText,
        timestamp: new Date().toISOString(),
        fromSelf: false
      }

      const payloadForSender = {
        fromUserId: myUserId,
        fromName: user.name,
        text: cleanText,
        timestamp: new Date().toISOString(),
        fromSelf: true
      }

      socket.emit('private message', payloadForSender)
      socket.to(roomName).emit('private message', payloadForReceiver)

      console.log(`Privébericht in room ${roomName}: ${cleanText}`)
    })

    socket.on('typing', ({ toUserId }) => {
      if (!toUserId) return

      const roomName = getConversationRoom(myUserId, toUserId)
      socket.to(roomName).emit('typing', { fromUserId: myUserId })
    })

    socket.on('stop typing', ({ toUserId }) => {
      if (!toUserId) return

      const roomName = getConversationRoom(myUserId, toUserId)
      socket.to(roomName).emit('stop typing', { fromUserId: myUserId })
    })

    socket.on('disconnect', () => {
      connectedUsers--
      console.log(`👋 A user disconnected: ${socket.id} Total users: ${connectedUsers}`)
    })
  })
}

// ==========================================
// 8. ERROR HANDLING & SERVER START
// ==========================================
function registerErrorHandlers() {
  app.use((req, res) => {
    if (req.url === '/.well-known/appspecific/com.chrome.devtools.json') {
      return res.sendStatus(204)
    }

    console.error('404 error at URL: ' + req.url)
    res.status(404).render('pages/errorstate', {
      status: 404,
      message: 'Pagina niet gevonden'
    })
  })

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
    discover = db.collection('discover')
    messages = db.collection('messages')

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