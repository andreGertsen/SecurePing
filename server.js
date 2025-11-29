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



// Route til EJS-side
app.get('/index', async (req, res) => {
  try {
    const response = await fetch("http://138.197.183.51:8080/array");
    let dataModtaget = await response.json();

    dataModtaget = dataModtaget.slice(-200); // max 200

    const enriched = await Promise.all(
      dataModtaget.map(async entry => {
        try {
          const resp = await fetch(`http://ip-api.com/json/${entry.ip}?fields=countryCode`);
          const data = await resp.json();
          entry.country = data.countryCode || "UNKNOWN";
        } catch {
          entry.country = "UNKNOWN";
        }
        return entry;
      })
    );

    res.render('index', { dataModtaget: enriched });
  } catch (error) {
    res.render('index', { dataModtaget: [] });
  }
});



app.get('/call-other-server', async (req, res) => {
  try {
    const response = await fetch("http://138.197.183.51:8080/array");
    const data = await response.json();

    // Begræns til max 200 entries (fjern ældste)

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
