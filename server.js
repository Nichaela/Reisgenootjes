// ==========================================
// 1. IMPORTS (Packages)
// ==========================================
require('dotenv').config()

const express = require('express')
const session = require('express-session')
const http = require('http')
const socketIo = require('socket.io')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')

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
 
// database collections
let users
let discover;
 
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


  app.get('/profile', async (req, res) => {
    if (!req.session.user) return res.redirect('/login')
    
    try {
      const { ObjectId } = require('mongodb')
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


  // hier is laura nu mee bezig
  app.get('/discover', async (req, res) => {
    try {
      const posts = await discover.find({}).toArray(); // alle posts ophalen
  
      res.render('pages/discover', { 
        user: req.session.user,
        posts: posts
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Er ging iets mis bij het laden van posts');
    }
  });
  app.get('/discover', (req, res) => {
    res.render('pages/discover', { user: req.session.user })
  })

  app.get('/create-post', (req, res) => {
    if (!req.session.user) return res.redirect('/welkom')  
    res.render('pages/create-post', { user: req.session.user })
  })

  app.get('/post', (req, res) => {
    res.render('pages/post', { user: req.session.user })
  })

  app.get('/post/:id', async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await discover.findOne({ _id: new ObjectId(postId) });

      if (!post) {
        return res.status(404).send('Post niet gevonden');
      }

      res.render('pages/post', { post });

    } catch (err) {
      console.error(err);
      res.status(500).send('Er ging iets mis bij het ophalen van de post');
    }
  });
    
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
    const user = await users.findOne({ email: email })
 
    if (!user) {
      return res.status(401).render('pages/login', { error: 'Onbekende gebruiker' })
    }
 
    if (user.password !== password) {
      return res.status(401).render('pages/login', {
        error: 'Verkeerd wachtwoord'
      })
    }
 
    req.session.user = {
      _id: user._id,
      email: user.email
    }
 
    return res.redirect('/discover')
  })
 
 
  // Register
  app.post('/register', async (req, res) => {
    const { name, lastName, email, password, username, birthday, tel, gender, profile, image1, image2, image3, status, bio, interests, opzoek} = req.body
 
    const existingUser = await users.findOne({ email: email })
 
    if (existingUser) {
      return res.status(409).render('pages/register', { error: 'Email bestaat al' })
    }
 
    await users.insertOne({
      name: name,
      lastName: lastName,
      email: email,
      password: password,
      username: username,
      birthday: birthday || null,
      tel: tel,
      gender: gender,
      profile: profile,
      image1: image1,
      image2: image2,
      image3: image3,
      status: status,
      bio: bio,
      interests: interests,
      opzoek: opzoek,
    })
 
    return res.redirect('/discover')
  })

  //create-post formulier 
  app.post('/post', async (req, res) => {
    const { title, startDate, endDate, location, persons, discription, gender } = req.body;
    
    // Age komt als array van de browser, of als string als 1 item
    let age = req.body.age;
    if (!Array.isArray(age)) {
      age = age ? [age] : [];
    }

    // Supplies als array van nieuwe regels
    const supplies = req.body.supplies ? req.body.supplies.split('\n') : [];

    await discover.insertOne({
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

    return res.redirect('/post')
  })
}

    //route naar annabels pagina

    app.get('/filter', async (req, res) => {
      try {
        const myUsers = await users
          .find({}) // alleen jouw records
          .toArray();
    
        res.render('pages/filter', { users: myUsers });
      } catch (err) {
        console.error(err);
        res.status(500).send("Fout bij ophalen data");
      }
    })


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
 

 // error handler
app.use(function (err, req, res) {
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