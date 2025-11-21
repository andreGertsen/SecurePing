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

app.set('view engine', 'ejs');
app.use(express.static('public')); // til JS-filen på klienten

let data = {
  title: 'My EJS Example',
  message: 'Hello from Node.js and EJS!',
  user: { name: 'Alice', age: 25 },
  hobbies: ['coding', 'music', 'gaming']
};

// Route til EJS-side
app.get('/index', (req, res) => {
  res.render('index', data);
});

// API-route til at hente data dynamisk
app.get('/api/data', (req, res) => {
  res.json(data);
});

// Opdater data hvert sekund
setInterval(() => {
  data.message = 'Updated at ' + new Date().toLocaleTimeString();
}, 1000);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
