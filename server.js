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

// XSS sanitizing middleware
app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      req.body[key] = xss(req.body[key])
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
 
  // hier is Roos nu mee bezig
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


  // hier is laura nu mee bezig
  app.get('/discover', (req, res) => {
    res.render('pages/discover', { user: req.session.user })
  })

  app.get('/create-post', (req, res) => {
    res.render('pages/create-post', { user: req.session.user })
  })
  app.get('/post', (req, res) => {
    res.render('pages/post', { user: req.session.user })
  })
    
  //

  // hier is Stiene nu mee bezig
  app.get('/matchen', (req, res) => {
    res.render('pages/matchen', { user: req.session.user })
  })
  //
 
   // Chatroom paginas Nicha
  app.get('/chatroom', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    res.render('pages/chatroom', { user: req.session.user })
  })

  app.get('/chat-channel', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    res.render('pages/chat-channel', { user: req.session.user })
  })
  
  app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/login')
    })
  })
}
 

// ==========================================
// 6. POST ROUTES (Data verwerken)
// ==========================================
function registerPostRoutes() {
  // Login
  app.post('/login', async (req, res) => {
    const { email, password } = req.body

    // validator checks
    if (!validator.isEmail(email)) {
      return res.status(400).render('pages/login', { error: 'Ongeldig emailadres' })
    }

    const user = await users.findOne({ email: email })
    if (!user) {
      return res.status(401).render('pages/login', { error: 'Onbekende gebruiker' })
    }
 
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).render('pages/login', { error: 'Ongeldig wachtwoord' })
    }
 
    req.session.user = {
      _id: user._id,
      email: user.email
    }
 
    return res.redirect('/discover')
  })
 
 
  // Register
  app.post('/register', async (req, res) => {
    const { name, lastName, email, password, username, birthday,
      tel, gender, profile, image1, image2, image3, status,
      bio, interests, opzoek
    } = req.body
 
    // validator checks
    if (!validator.isEmail(email)) {
      return res.status(400).render('pages/register', { error: 'Ongeldig emailadres' })
    }

    if (!validator.isLength(password, { min: 8 })) {
      return res.status(400).render('pages/register', { error: 'Wachtwoord moet minimaal 8 tekens bevatten' })
    }

    const existingUser = await users.findOne({ email })
    if (existingUser) {
      return res.status(409).render('pages/register', { error: 'Email bestaat al' })
    }

    // password hashing
    const hashedPassword = await bcrypt.hash(password, 10)
 
    await users.insertOne({
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
 
    return res.redirect('/discover')
  })

  //Post
  app.post('/post', (req, res) => {
    const supplies = req.body.supplies.split('\n') //checken of dit werkt

    res.redirect('/post')
  })

    //route naar annabels pagina

    app.get('/filter', async (req, res) => {
      try {
        const myUsers = await users
          .find({ owner: "annabel" }) // alleen jouw records
          .toArray();
    
        res.render('pages/filter', { users: myUsers });
      } catch (err) {
        console.error(err);
        res.status(500).send("Fout bij ophalen data");
      }
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

    // Middleware to handle not found errors - error 404

 
 
 
// ==========================================
// 8. ERROR HANDLING & SERVER START
// ==========================================
 
function registerErrorHandlers() {
  // Middleware to handle not found errors - error 404
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
 
    // Routes registreren

    registerGetRoutes()
    registerPostRoutes()
    registerSocketHandlers()
    registerErrorHandlers()
 
    // Server starten

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