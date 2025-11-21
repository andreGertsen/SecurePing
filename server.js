/* 
HVORDAN MAN PULLER OG GENSTARTER PÅ DROPLETTEN
cd SecurePing
git pull
pm2 restart myapp
*/


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

app.get('/', (req, res) => {
  res.redirect('/index'); // sender alle requests til /index
});

// Route for GET /
const express = require('express');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');

let data = {
  title: 'My EJS Example',
  message: 'Hello from Node.js and EJS!',
  user: { name: 'Alice', age: 25 },
  hobbies: ['coding', 'music', 'gaming']
};

// Route
app.get('/index', (req, res) => {
  res.render('index', data);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://167.99.140.208:${PORT}`);
});

// Hvis du vil opdatere data hvert sekund
setInterval(() => {
  data.message = 'Updated at ' + new Date().toLocaleTimeString();
}, 1000);

