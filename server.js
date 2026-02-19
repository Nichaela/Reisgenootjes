// Add info from .env file to process.env
require('dotenv').config()

// Initialise Express webserver
const express = require('express')
const app = express()

app
  .use(express.urlencoded({ extended: true })) // middleware to parse form data
  .use(express.static('public'))               // serve static files
  .set('view engine', 'ejs')                   // use EJS templating

// Use MongoDB
const { MongoClient, ServerApiVersion } = require('mongodb')

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

let users

async function start() {
  try {
    // Try to open a database connection
    await client.connect()
    console.log('Database connection established')

    const db = client.db(process.env.DB_NAME)
    users = db.collection(process.env.DB_COLLECTION)

    // Home route
    app.get('/', (req, res) => {
      res.render('pages/index', { data: null })
    })

    // Login page
    app.get('/login', (req, res) => {
      res.render('pages/login', { error: null })
    })

    // Login form submit
    app.post('/login', async (req, res) => {
      const { email, password } = req.body

      const user = await users.findOne({ email: email })

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

      return res.redirect('/')
    })

    // Register page
    app.get('/register', (req, res) => {
      res.render('pages/register', { error: null })
    })

    // Register form submit
    app.post('/register', async (req, res) => {
      const { email, username, password, dob } = req.body

      const existingUser = await users.findOne({ email: email, name: username, pw: password})

      if (existingUser) {
        return res.status(409).render('pages/register', {
          error: 'Email bestaat al'
        })
      }

      await users.insertOne({
        email: email,
        name: username,
        password: password,
        dob: dob || null
      })

      return res.redirect('/registerSuccess')
    })

    // Register success page
    app.get('/registerSuccess', (req, res) => {
      res.render('pages/registerSuccess')
    })

    // Middleware to handle not found errors - error 404
    app.use((req, res) => {
      console.error('404 error at URL: ' + req.url)
      res.status(404).send('404 error at URL: ' + req.url)
    })

    // Middleware to handle server errors - error 500
    app.use((err, req, res, next) => {
      console.error(err.stack)
      res.status(500).send('500: server error')
    })

    // Start the webserver and listen for HTTP requests at specified port
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
