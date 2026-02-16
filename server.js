const { MongoClient } = require('mongodb');
const port = 3000;
var express = require('express');
var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

// helpt express form data uitlezen
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// roept de public map op met behulp van express
app.use(express.static('public'));

app.get('/', function(req, res) {
  res.render('pages/index', {data});
});

async function runGetStarted() {
  // Replace the uri string with your connection string
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    const database = client.db('sample_mflix');
    const movies = database.collection('movies');

    // Queries for a movie that has a title value of 'Back to the Future'
    const query = { title: 'Back to the Future' };
    const movie = await movies.findOne(query);

    console.log(movie);
  } finally {
    await client.close();
  }
}
runGetStarted().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
