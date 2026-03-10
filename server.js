// ==========================================
// 1. IMPORTS (Packages)
// ==========================================
 
// Add info from .env file to process.env
require('dotenv').config()
 
// Initialise Express webserver
const express = require('express')
const session = require('express-session')
const app = express()
 
// Use MongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

 
// ==========================================
// 2. CONFIGURATIE & DATABASE
// ==========================================
 
app
  .use(express.urlencoded({ extended: true })) // middleware to parse form data
  .use(express.static('public'))               // serve static files
  .set('view engine', 'ejs')                   // use EJS templating
  .use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
 
// Construct URL used to connect to database from info in the .env file
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`
 
// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})
 
// database collections
let users
let discover;
 
// ==========================================
// 3. MIDDLEWARE (Algemeen)
// ==========================================
 
app.use((req, res, next) => {
  res.locals.user = req.session.user || null
  next()
})
 
// ==========================================
// 4. ROUTES (GET - Pagina's bekijken)
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
    if (!req.session.user) {
      return res.redirect('/login')
    }
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

  app.get('/create-post', (req, res) => {
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
  
      // Eventueel: personenlijst (als je dat in je DB opslaat)
      const joinedPersons = post.persons || [];
  
      // Stuur alles door naar EJS
      res.render('pages/post', {
        title: post.title,
        startDate: post.startDate,
        endDate: post.endDate,
        location: post.location,
        image: post.image || '/path/to/default.jpg', // als je images wilt
        joinedPersons: joinedPersons,
        gender: post.gender,
        hobby: post.hobby || 'Geen hobby opgegeven',
        age: post.age.join(', '), // zet array om naar string
        discription: post.discription,
        supplies: post.supplies
      });
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
 
  app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/login')
    })
  })
}
 
 
 
// ==========================================
// 5. POST ROUTES (Data verwerken)
// ==========================================
 
function registerPostRoutes() {
 
  // Login
  app.post('/login', async (req, res) => {
    const { username, password } = req.body
    const user = await users.findOne({ name: username })
 
    if (!user) {
      return res.status(401).render('pages/login', {
        error: 'Onbekende gebruiker'
      })
    }
 
    if (user.password !== password) {
      return res.status(401).render('pages/login', {
        error: 'Verkeerd wachtwoord'
      })
    }
 
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email
    }
 
    return res.redirect('/')
  })
 
 
  // Register
  app.post('/register', async (req, res) => {
    const { email, username, password, birthday } = req.body
 
    const existingUser = await users.findOne({ email: email })
 
    if (existingUser) {
      return res.status(409).render('pages/register', {
        error: 'Email bestaat al'
      })
    }
 
    await users.insertOne({
      email: email,
      name: username,
      password: password,
      birthday: birthday || null
    })
 
    return res.redirect('/register-success')
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


 
 
 
// ==========================================
// 6. ERROR HANDLING & SERVER START
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

    discover = db.collection('discover')
 
    // Routes registreren
    registerGetRoutes()
    registerPostRoutes()
    registerErrorHandlers()
 
    // Server starten
    const port = process.env.PORT || 3000
    app.listen(port, () => {
      console.log(`Server draait op poort ${port}`)
    })
 
  } catch (err) {
    console.log('Database connection error:', err)
    console.log('For uri -', uri)
    process.exit(1)
  }
}
 
start()