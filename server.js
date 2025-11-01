// app.js
const express = require('express');
const app = express();
const PORT = 3000;

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Middleware til at parse data fra formularer (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Serve static files (like CSS, JS, images)
app.use(express.static('public'));

// Route for GET /
app.get('/index', (req, res) => {
  // Example data object
  const data = {
    title: 'My EJS Example',
    message: 'Hello from Node.js and EJS!',
    user: {
      name: 'Alice',
      age: 25
    },
    hobbies: ['coding', 'music', 'gaming']
  };

  // Render index.ejs and pass data to it
  res.render('index', data);
});

app.post('/login', (req, res) => {
  const { email, adgangskode } = req.body;

  console.log('Modtaget login:');
  console.log('Email:', email);
  console.log('Adgangskode:', adgangskode);

  // Simpelt tjek — i praksis ville du slå brugeren op i en database
  if (email === 'boi' && adgangskode === '123') {
    res.send('✅ Login succesfuldt!');
  } else {
    res.send('❌ Forkert email eller adgangskode.');
  }
});

// Start server
app.listen(PORT, '159.65.120.94', () => {
  console.log(`Server running at http://159.65.120.94:${PORT}`);
});
