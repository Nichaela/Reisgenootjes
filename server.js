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

// =======================
// APP, SERVER SOCKET.IO
// =======================
const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// =======================
// CONFIGURATIE & DATABASE
// =======================
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.set('view engine', 'ejs')

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
)

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

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
    res.render('pages/index')
  })

  app.get('/login', (req, res) => {
    res.render('pages/login', { error: null })
  })

  app.get('/register', (req, res) => {
    res.render('pages/register', { error: null })
  })

  app.get('/discover', async (req, res) => {
    try {
      const posts = await discover.find({}).toArray()

      res.render('pages/discover', {
        user: req.session.user,
        posts,
      })
    } catch (err) {
      console.error(err)
      res.status(500).send('Fout bij laden discover')
    }
  })

  app.get('/profile', async (req, res) => {
    if (!req.session.user) return res.redirect('/login')

    try {
      const mijnPosts = await discover.find({
        userId: new ObjectId(req.session.user._id),
      }).toArray()

      res.render('pages/profile', {
        user: req.session.user,
        posts: mijnPosts,
      })
    } catch (err) {
      console.error(err)
      res.status(500).send('Fout profiel')
    }
  })

  app.get('/post/:id', async (req, res) => {
    try {
      const post = await discover.findOne({
        _id: new ObjectId(req.params.id),
      })

      if (!post) return res.status(404).send('Post niet gevonden')

      res.render('pages/post', { post })
    } catch (err) {
      console.error(err)
      res.status(500).send('Fout post laden')
    }
  })

  app.get('/create-post', (req, res) => {
    if (!req.session.user) return res.redirect('/welkom')
    res.render('pages/create-post')
  })

  app.get('/chatroom', (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    res.render('pages/chatroom')
  })

  app.get('/filter', async (req, res) => {
    try {
      const reizen = await discover.find({}).toArray()

      const resultaat = []

      for (const reis of reizen) {
        const user = await users.findOne({ _id: reis.userId })

        resultaat.push({
          reis,
          user,
        })
      }

      res.render('pages/filter', {
        reizen: resultaat,
      })
    } catch (err) {
      console.error(err)
      res.status(500).send('Fout filter')
    }
  })

  app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/login')
    })
  })
}

// =======================
// POST ROUTES
// =======================

function registerPostRoutes() {
  app.post('/register', async (req, res) => {
    try {
      const { name, email, password } = req.body

      if (!validator.isEmail(email)) {
        return res.render('pages/register', {
          error: 'Ongeldig emailadres',
        })
      }

      const existingUser = await users.findOne({ email })

      if (existingUser) {
        return res.render('pages/register', {
          error: 'Email bestaat al',
        })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const result = await users.insertOne({
        name,
        email,
        password: hashedPassword,
      })

      req.session.user = {
        _id: result.insertedId,
        name,
        email,
      }

      res.redirect('/discover')
    } catch (err) {
      console.error(err)
      res.status(500).send('Register error')
    }
  })

  app.post('/login', async (req, res) => {
    const { email, password } = req.body

    const user = await users.findOne({ email })

    if (!user) {
      return res.render('pages/login', {
        error: 'Onbekende gebruiker',
      })
    }

    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      return res.render('pages/login', {
        error: 'Verkeerd wachtwoord',
      })
    }

    req.session.user = user

    res.redirect('/discover')
  })

  app.post('/post', async (req, res) => {
    try {
      if (!req.session.user) return res.redirect('/login')

      const {
        title,
        startDate,
        endDate,
        location,
        continent,
        persons,
        discription,
      } = req.body

      const result = await discover.insertOne({
        userId: new ObjectId(req.session.user._id),
        title,
        startDate,
        endDate,
        location,
        continent,
        persons: Number(persons),
        discription,
      })

      res.redirect(`/post/${result.insertedId}`)
    } catch (err) {
      console.error(err)
      res.status(500).send('Post error')
    }
  })
}

// =======================
// SOCKET.IO
// =======================

function registerSocketHandlers() {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    socket.on('chat message', (msg) => {
      io.emit('chat message', msg)
    })

    socket.on('disconnect', () => {
      console.log('User disconnected')
    })
  })
}

// =======================
// ERROR HANDLING
// =======================

function registerErrorHandlers() {
  app.use((req, res) => {
    res.status(404).render('pages/errorstate', {
      status: 404,
      message: 'Pagina niet gevonden',
    })
  })

  app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('500 server error')
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

    registerGetRoutes()
    registerPostRoutes()
    registerSocketHandlers()
    registerErrorHandlers()

    server.listen(process.env.PORT || 3000, () => {
      console.log('Server draait')
    })
  } catch (err) {
    console.error(err)
  }
}

start()