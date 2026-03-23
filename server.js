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

const multer = require('multer')
const path = require('path')
const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, Date.now() + ext)
  }
})
const upload = multer({ storage: storage })


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
      const gejoindePosts = await discover.find({
        reizigers: new ObjectId(req.session.user._id)
      }).toArray()
      
      // samenvoegen en sorteren op startdatum
      const alleReizen = [...mijnPosts, ...gejoindePosts].sort((a, b) => 
        new Date(a.startDate) - new Date(b.startDate)
      )

      const today = new Date();
      const birthDate = new Date(req.session.user.birthday);
      let age = today.getFullYear() - birthDate.getFullYear();
      const month = today.getMonth() - birthDate.getMonth();
      if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) age--;

      res.render('pages/profile', {
        user: req.session.user,
        alleReizen: alleReizen,
        age: age
      })

    } catch (err) {
      console.error(err)
      res.status(500).send('Fout bij ophalen van jouw reizen')
    }
  })

  app.get('/discover', async (req, res) => {
    try {
      const postsAlles = await discover.find({}).toArray() //haalt ALLES op uit discover collection 

      const posts = [] //lege array waar data ingaat

      for (const post of postsAlles) { //voor elke post uit de hele discover collection
        const user = await users.findOne({ _id: post.userId }) //zoekt gebruiker op

        posts.push({ //voegt user toe aan de post uit de user collection
          ...post, // de '...' haalt alle data uit de post (titel, location etc)
          user
        })
      }

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
    res.render('pages/create-post', { user: req.session.user })
  })

  app.get('/post/:id', async (req, res) => {
    try {
      const post = await discover.findOne({
        _id: new ObjectId(req.params.id),
      })

      if (!post) {
        return res.status(404).send('Post niet gevonden');
      }

      const postUser = await users.findOne({ _id: new ObjectId(post.userId) });

      res.render('pages/post', { post, postUser });

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
  app.post('/register', upload.fields([
    { name: 'profileImg', maxCount: 1 },
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
  ]), async (req, res) => {
  
    const { name, lastName, email, password, birthday,
      tel, gender, status, bio, interests, opzoek
    } = req.body
  
    const profileImg = req.files['profileImg'] ? req.files['profileImg'][0].filename : null
    const image1 = req.files['image1'] ? req.files['image1'][0].filename : null
    const image2 = req.files['image2'] ? req.files['image2'][0].filename : null
    const image3 = req.files['image3'] ? req.files['image3'][0].filename : null

    const interestsArray = Array.isArray(interests)
    ? interests
    : (interests ? interests.split(',').map(i => i.trim()) : [])

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
      birthday,
      tel,
      gender,
      profileImg,
      image1,
      image2,
      image3,
      status,
      bio,
      interests: interestsArray,
      opzoek
    })

    // sessie opslaan na registratie
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
  })

  //create-post formulier 
  app.post('/post', upload.single('postCoverImg'), async (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    try {
      const { title, startDate, endDate, location, continent, persons, description, gender } = req.body
      if (!title || !startDate || !endDate || !location || !continent || !persons) {
        return res.status(400).send('Vul alle verplichte velden in')
      }
      
      const postCoverImg = req.file ? req.file.filename : null

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
        postCoverImg,
        startDate,
        endDate,
        location,
        continent,
        persons: Number(persons),
        description,
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

  // join reis
  app.post('/post/:id/join', async (req, res) => {
    if (!req.session.user) return res.redirect('/login')

    try {
      const post = await discover.findOne({ _id: new ObjectId(req.params.id) })
      if (!post) return res.status(404).send('Post niet gevonden')

      const aantalReizigers = post.reizigers ? post.reizigers.length : 0

      // check of de reis vol is
      if (aantalReizigers >= post.persons) {
        return res.status(403).send('Deze reis is vol')
      }
      
      // check of user al meedoet
      const alGejoint = post.reizigers && post.reizigers.some(id => id.toString() === req.session.user._id.toString())
      if (alGejoint) return res.redirect(`/post/${req.params.id}`)

      // voeg user toe aan reizigers array
      await discover.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $push: { reizigers: new ObjectId(req.session.user._id) } }
      )

      res.redirect(`/post/${req.params.id}`)
    } catch (err) {
      console.error(err)
      res.status(500).send('Er ging iets mis bij het joinen')
    }
  })

  app.post('/likes', async (req, res) => {
    if (!req.session.user) return res.redirect('/login')
  
    const matchedUserId = req.body.matchedUser;
    const actie = req.body.actie;
  
    // Voeg toe aan gezien in sessie
    if (!req.session.gezien) req.session.gezien = [];
    req.session.gezien.push(matchedUserId);
  
    if (actie === 'like') {
      // Sla like op in database bij de ingelogde gebruiker
      await users.updateOne(
        { _id: new ObjectId(req.session.user._id) },
        { $addToSet: { likes: matchedUserId } }
      )
  
      // Check of de andere persoon jou ook al geliket heeft
      const andereUser = await users.findOne({ _id: new ObjectId(matchedUserId) });
      const matchId = req.session.user._id.toString();
  
      if (andereUser.likes && andereUser.likes.includes(matchId)) {
        return res.redirect('/chatroom')
      }
    }
  
    res.redirect('/matchen')
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