// =======================
// IMPORTS
// =======================
require('dotenv').config()

const express = require('express')
const session = require('express-session')
const http = require('http')
const socketIo = require('socket.io')

const xss = require('xss')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const crypto = require('crypto')
const nodemailer = require('nodemailer')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const { error } = require('console')

// =======================
// APP, SERVER SOCKET.IO
// =======================
const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// =======================
// CONFIGURATIE & DATABASE
// =======================
app.use(express.urlencoded({ extended: true })) //parse form data
app.use(express.static('public')) //server static files
app.set('view engine', 'ejs') // EJS templating 

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
)

// Construct URL used to connect to database from info in the .env file
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/?retryWrites=true&w=majority`

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

// =======================
// MIDDELWARE (ALGEMEEN)
// =======================
app.use((req, res, next) => {
  res.locals.user = req.session.user || null
  next()
})

// xss sanitizing middleware
app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      req.body[key] = xss(req.body[key])
    }
  }
  next()
})

// =======================
// GET ROUTES
// =======================

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

  app.get('/profile', async (req, res) => {
    if (!req.session.user) return res.redirect('/login')

    try {
      const { ObjectId } = require('mongodb')
      const mijnPosts = await discover.find({
        userId: new ObjectId(req.session.user._id),
      }).toArray()

      const today = new Date();
      const birthDate = new Date(req.session.user.birthday);
      let age = today.getFullYear() - birthDate.getFullYear();
      const month = today.getMonth() - birthDate.getMonth();
      if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) age--;

      res.render('pages/profile', {
        user: req.session.user,
        posts: mijnPosts,
        age: age
      })

    } catch (err) {
      console.error(err)
      res.status(500).send('Fout bij ophalen van jouw reizen')
    }
  })

  app.get('/discover', async (req, res) => {
    try {
      const posts = await discover.find({}).toArray() // alle posts ophalen

      res.render('pages/discover', {
        user: req.session.user,
        posts,
      })
    } catch (err) {
      console.error(err)
      res.status(500).send('Er ging iets mis bij het laden van posts')
    }
  })

  app.get('/create-post', (req, res) => {
    if (!req.session.user) return res.redirect('/welkom')
    res.render('pages/create-post')
  })

  app.get('/post/:id', async (req, res) => {
    try {
      const post = await discover.findOne({
        _id: new ObjectId(req.params.id),
      })

      if (!post) {
        return res.status(404).send('Post niet gevonden');
      }

      res.render('pages/post', { post })

    } catch (err) {
      console.error(err)
      res.status(500).send('Fout post laden')
    }
  })

  app.get('/matchen', async (req, res) => {
    const post = await discover.findOne({});
    const matchUser = await users.findOne({ _id: new ObjectId(post.userId) });
    const today = new Date();
    const birthDate = new Date(matchUser.birthday);
    const month = today.getMonth() - birthDate.getMonth();
    let age = today.getFullYear() - birthDate.getFullYear();

    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) age--;

    res.render('pages/matchen', { user: req.session.user, post: post, matchUser: matchUser, age: age })
  })

  app.get('/chatroom', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    res.render('pages/chatroom', { user: req.session.user })
  })

  app.get('/chat-channel', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    res.render('pages/chat-channel', { user: req.session.user })
  })

  // route naar ontdek filter
  app.get('/ontdekfilter', async (req, res) => {
    try {
      const db = client.db(process.env.DB_NAME);
      const usersCollection = db.collection('users');
      const discoverCollection = db.collection('discover');
      const reizen = await discoverCollection.find({}).toArray();
      const resultaat = []; for (const reis of reizen) {

        //voor elke reis in de lijst reizen doe dit: 
        const user = await usersCollection.findOne({
          _id: reis.userId //vind een reis 
        })
        resultaat.push({ //pusht deze data in die lege array genaamd resultaat 
          reis: reis, user: user
        })
      }

      res.render('pages/ontdekfilter', {
        reizen: resultaat //reizen = de array van de collection en resultaat is de array die ik heb gemaakt 
      })
    } catch (err) { console.error(err); res.status(500).send("Fout bij ophalen data"); }
  })

  app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/welkom')
    })
  })
}

  //Huidge route naar filter menu + werkende continent filter 
  app.get('/filter', async (req, res) => {
    try {
      const db = client.db(process.env.DB_NAME);
      const usersCollection = db.collection('users');
      const discoverCollection = db.collection('discover');
      const reizen = await discoverCollection.find({}).toArray();
      const resultaat = []; for (const reis of reizen) {

        //voor elke reis in de lijst reizen doe dit: 
        const user = await usersCollection.findOne({
          _id: reis.userId //vind een reis 
        })
        resultaat.push({ //pusht deze data in die lege array genaamd resultaat 
          reis: reis, user: user
        })
      }

      res.render('pages/filter', {
        reizen: resultaat //reizen = de array van de collection en resultaat is de array die ik heb gemaakt 
      })
    } catch (err) { console.error(err); res.status(500).send("Fout bij ophalen data"); }
  })

  app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/welkom')
    })
  })


// =======================
// POST ROUTES
// =======================

function registerPostRoutes() {
  // login
  app.post('/login', async (req, res) => {
    const { email, password } = req.body

    // validatie checks
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
  })

  //register
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

    // sessie opslaan na registratie
    const nieuweUser = await users.findOne({ _id: result.insertedId })
    req.session.user = {
      _id: nieuweUser._id,
      email: nieuweUser.email,
      name: nieuweUser.name
    }

    return res.redirect('/discover')
  })

  app.post('/post', async (req, res) => {
    try {
      if (!req.session.user) return res.redirect('/login')

      const { title, startDate, endDate, location, continent, persons, discription, gender } = req.body

      let age = req.body.age
      if (!Array.isArray(age)) {
        age = age ? [age] : []
      }

      // Supplies als array van nieuwe regels
      const supplies = req.body.supplies
        ? req.body.supplies.split('\n').map(item => item.trim()).filter(Boolean)
        : []

      const result = await discover.insertOne({
        userId: new ObjectId(req.session.user._id), // koppeling aan gebruiker die ingelogd is
        title,
        startDate,
        endDate,
        location,
        continent,
        persons: Number(persons),
        discription,
        supplies,
        age,
        gender
      })

      return res.redirect(`/post/${result.insertedId}`)
    } catch (err) {
      console.error(err)
      res.status(500).send('Er ging iets mis bij het aanmaken van de post')
    }
  })
}

// =======================
// SOCKET.IO
// source: https://medium.com/@basukori8463/build-a-real-time-chat-app-from-scratch-with-node-js-and-socket-io-9714b7076372
// =======================
let connectedUsers = 0

function registerSocketHandlers() {
  io.on('connection', (socket) => {
    connectedUsers++
    console.log(`A user connected: ${socket.id} Total users: ${connectedUsers}`)

    // Notify others that someone joined
    socket.broadcast.emit(
      'user notification',
      `Someone joined the chat! (${connectedUsers} users online)`
    )

    socket.on('chat message', (msg) => {
      console.log('Message received:', msg)
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

// =======================
// ERROR HANDLING
// =======================

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

  // error handler
  app.use(function (err, req, res) {
    console.error(err.stack)
    res.status(500).send('500: server error')
  })
}
// =======================
// START SERVER
// =======================

async function start() {
  try {
    await client.connect()

    const db = client.db(process.env.DB_NAME)
    users = db.collection(process.env.DB_COLLECTION)
    
    discover = db.collection('discover')

    // routes registeren
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