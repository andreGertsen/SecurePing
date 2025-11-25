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
  tid: '02:46',
  ip: 'My EJS Example',
  type: 'Hello from Node.js and EJS!',
  land: 'DK'
};

// Route til EJS-side
app.get('/index', async (req, res) => {
  try {
    const response = await fetch("http://138.197.183.51:8080/array");
    const dataModtaget = await response.json();

    res.render('index', { dataModtaget });
  } catch (error) {
    res.render('index', { dataModtaget: [] });
  }
});

// API-route til at hente data dynamisk
app.get('/api/data', (req, res) => {
  res.json(data);
});


// Opdater data hvert sekund
setInterval(() => {
  data.message = 'Updated at ' + new Date().toLocaleTimeString();
}, 1000);


app.get('/call-other-server', async (req, res) => {
  try {
    const response = await fetch("http://138.197.183.51:8080/array");
    const data = await response.json();

    res.json({
      status: "success",
      data
    });
  } catch (error) {
    res.json({
      status: "error",
      message: error.message
    });
  }
});






// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
