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
// source: https://socket.io/how-to/use-with-express-session

// Construct URL used to connect to database from info in the .env file
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`


const MongoStore = require('connect-mongo').default
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: uri })
})

app
  .use(express.urlencoded({ extended: true }))
  .use(express.static('public'))
  .set('view engine', 'ejs')
  .use(sessionMiddleware)

io.engine.use(sessionMiddleware)


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
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key])
      }
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

  app.get('/forgot-password', (req, res) => {
    res.render('pages/forgot-password', { error: null, success: null })
  })

  // wachtwoord resetten token
  app.get('/reset-password/:token', async (req, res) => {
    const user = await users.findOne({
      resetToken: req.params.token,
      resetTokenExpiry: { $gt: Date.now() }
    })
  
    if (!user) {
      return res.send('Link is ongeldig of verlopen')
    }
  
    res.render('pages/reset-password', { token: req.params.token })
  })

  app.get('/register', (req, res) => {
    res.render('pages/register', { error: null })
  })

  app.get('/profile', async (req, res) => {
    if (!req.session.user) return res.redirect('/login')

    try {
      const { ObjectId } = require('mongodb')

      // haal de gemaakte en gejoinde reizen van de gebruiker op
      const mijnPosts = await discover.find({
        userId: new ObjectId(req.session.user._id),
      }).toArray()
      const gejoindePosts = await discover.find({
        reizigers: new ObjectId(req.session.user._id)
      }).toArray()
      
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
      const postsRaw = await discover.find({}).toArray() //haalt ALLES op uit discover collection

      const posts = [] //lege array waar data ingaat

      for (const post of postsRaw) { //voor elke post uit de hele discover collection
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
        return res.status(404).send('Post niet gevonden')
      }
  
      const postUser = await users.findOne({ _id: post.userId })
  
      // haal alle mederezigers op
      const reizigersIds = post.reizigers || []
      const mederezigers = await users.find({ 
        _id: { $in: reizigersIds.map(id => new ObjectId(id)) } 
      }).toArray()

      res.render('pages/post', { post, postUser, mederezigers, user: req.session.user || null, error: null })
    } catch (err) {
        console.error(err)
        res.status(500).send('Fout post laden')
    }
  })


app.get('/matchen', async (req, res) => {
  if (!req.session.user) return res.redirect('/login')

  try {
    if (!req.session.gezien) req.session.gezien = []

    const mijnId = new ObjectId(req.session.user._id)

    const voorkeur = req.session.genderPreference //toegevoegd door annabel

const query = {
  _id: {
    $ne: mijnId,
    $nin: req.session.gezien.map(id => new ObjectId(id))
  }
}

// alleen filteren als er een voorkeur is
if (voorkeur) {
  query.gender = voorkeur
}

const matchUser = await users.findOne(query)

    if (!matchUser) {
      return res.render('pages/matchen', {
        user: req.session.user,
        post: null,
        matchUser: null,
        age: null
      })
    }

    const post = await discover.findOne({
      userId: matchUser._id
    })

    const today = new Date()
    const birthDate = new Date(matchUser.birthday)
    let age = today.getFullYear() - birthDate.getFullYear()
    const month = today.getMonth() - birthDate.getMonth()

    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return res.render('pages/matchen', {
      user: req.session.user,
      post,
      matchUser,
      age
    })
  } catch (err) {
    console.error('Fout in /matchen:', err)
    return res.status(500).send('Fout bij laden van matchen')
  }
})

  app.get('/matchen/reset', (req, res) => {
  req.session.gezien = [];
  res.redirect('/matchen')
})


app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err)
      return res.redirect('/discover')
    }

    res.clearCookie('connect.sid')
    res.redirect('/welkom')
  })
})


// =======================
// POST ROUTES
// =======================

function registerPostRoutes() {
  // login
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
        bio: user.bio,
        profileImg: user.profileImg,
        image1: user.image1,
        image2: user.image2,
        image3: user.image3,
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

  // logout
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

  // forgot password
  app.post('/forgot-password', async (req, res) => {
    try {
      const email = req.body.email

      if (!validator.isEmail(email || '')) {
        return res.render('pages/forgot-password', {
          error: 'Ongeldig emailadres',
          success: null
        })
      }

      const user = await users.findOne({ email })
      if (!user) {
        return res.render('pages/forgot-password', {
          error: 'Email niet gevonden',
          success: null
        })
      }

      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = Date.now() + 3600000

      await users.updateOne(
        { _id: user._id },
        { $set: { resetToken, resetTokenExpiry } }
      )

      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      })

      const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset je wachtwoord',
        html: `<p>Klik op deze link om je wachtwoord te resetten: <a href="${resetLink}">${resetLink}</a></p>`
      })

      return res.render('pages/forgot-password', {
        error: null,
        success: 'Reset link is verstuurd!'
      })
    } catch (err) {
      console.error(err)
      return res.status(500).render('pages/forgot-password', {
        error: 'Er ging iets mis bij het versturen van de reset link',
        success: null
      })
    }
  })

  // reset wachtwoord
  app.post('/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body

      const user = await users.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() }
      })

      if (!user) {
        return res.send('Link is ongeldig of verlopen')
      }

      if (!validator.isLength(password || '', { min: 8 })) {
        return res.send('Wachtwoord moet minimaal 8 tekens zijn')
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      await users.updateOne(
        { _id: user._id },
        {
          $set: { password: hashedPassword },
          $unset: {
            resetToken: '',
            resetTokenExpiry: ''
          }
        }
      )

      return res.send('Wachtwoord succesvol gereset! Je kunt nu inloggen.')
    } catch (err) {
      console.error(err)
      return res.status(500).send('Er ging iets mis bij resetten van het wachtwoord')
    }
  })

  // register
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
    : (interests ? [interests] : []);
 
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
 
  const nieuweUser = await users.findOne({ _id: result.insertedId })
  req.session.user = {
    _id: nieuweUser._id,
    email: nieuweUser.email,
    name: nieuweUser.name,
    lastName: nieuweUser.lastName,
    bio: nieuweUser.bio,
    gender: nieuweUser.gender,
    birthday: nieuweUser.birthday,
    interests: nieuweUser.interests,
    opzoek: nieuweUser.opzoek
  }
  return res.redirect('/discover')
})
 

  // create-post formulier
  app.post('/post', upload.single('postCoverImg'), async (req, res) => {
    try {
      if (!req.session.user) return res.redirect('/login')

      const { title, startDate, endDate, location, continent, persons, discription, gender } = req.body

      const postCoverImg = req.file ? req.file.filename : null

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
        postCoverImg,
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
      return res.status(500).send('Er ging iets mis bij het aanmaken van de post')
    }
  })

  // join reis
  app.post('/post/:id/join', async (req, res) => {
    try {
      if (!req.session.user) return res.redirect('/login')

      const post = await discover.findOne({ _id: new ObjectId(req.params.id) })
      if (!post) return res.status(404).send('Post niet gevonden')

      // Geslacht check
      if (post.gender && post.gender !== 'gemengd') {
        if (req.session.user.gender !== post.gender) {
          return res.status(403).send('Je voldoet niet aan de geslachtseis voor deze reis')
        }
      }

      // Leeftijd check
      if (post.age && post.age.length > 0) {
        const userAge = req.session.user.age

        const ranges = {
          '18': (age) => age >= 18 && age < 21,
          '21': (age) => age >= 21 && age < 26,
          '26': (age) => age >= 26 && age < 30,
          '30': (age) => age >= 30
        }
      
        const voldoet = post.age.some(min => ranges[min]?.(userAge))
      
        if (!voldoet) {
          return res.status(403).send('Je voldoet niet aan de leeftijdseis voor deze reis')
        }
      }

      // Reis vol check
      const aantalReizigers = post.reizigers ? post.reizigers.length : 0
      if (aantalReizigers >= post.persons) {
        return res.status(403).send('Deze reis is vol')
      }

      // Al gejoint check
      const alGejoint = post.reizigers && post.reizigers.some(
        id => id.toString() === req.session.user._id.toString()
      )
      if (alGejoint) return res.redirect(`/post/${req.params.id}`)

      await discover.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $push: { reizigers: new ObjectId(req.session.user._id) } }
      )

      return res.redirect(`/post/${req.params.id}`)
    } catch (err) {
      console.error(err)
      return res.status(500).send('Er ging iets mis bij het joinen van de reis')
    }
  })

  // likes
  app.post('/likes', async (req, res) => {
  if (!req.session.user) return res.redirect('/login')

  try {
    const matchedUserId = req.body.matchedUser
    const actie = req.body.actie
    const genderPreference = req.body.genderPreference

    if (!req.session.gezien) req.session.gezien = []

    if (matchedUserId && !req.session.gezien.includes(matchedUserId)) {
      req.session.gezien.push(matchedUserId)
    }

    if (genderPreference) {
      req.session.genderPreference = genderPreference
    }

    if (actie === 'like') {
      await users.updateOne(
        { _id: new ObjectId(req.session.user._id) },
        { $addToSet: { likes: matchedUserId } }
      )

      const andereUser = await users.findOne({
        _id: new ObjectId(matchedUserId)
      })

      const matchId = req.session.user._id.toString()

      if (andereUser && andereUser.likes && andereUser.likes.includes(matchId)) {
        return res.redirect('/chatroom')
      }
    }

    return res.redirect('/matchen')
  } catch (err) {
    console.error('Fout in /likes:', err)
    return res.status(500).send('Fout bij verwerken van like')
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
  
}

// =======================
// SOCKET.IO
// source: https://medium.com/@basukori8463/build-a-real-time-chat-app-from-scratch-with-node-js-and-socket-io-9714b7076372
// =======================
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
// =======================
// ERROR HANDLING
// =======================

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