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
import fetch from "node-fetch";

app.get('/index', async (req, res) => {
  try {
    const response = await fetch("http://138.197.183.51:8080/array");
    let dataModtaget = await response.json();

    const enriched = await Promise.all(
      dataModtaget.map(async entry => {
        const country = await getCountryCode(entry.ip);
        return { ...entry, country };
      })
    );

    res.render('index', { dataModtaget: enriched });

  } catch (error) {
    console.error(error);
    res.render('index', { dataModtaget: [] });
  }
});

async function getCountryCode(ip) {
  try {
    const url = `http://ip-api.com/json/${ip}?fields=countryCode,status,message`;
    const res = await fetch(url);
    const data = await res.json();
    return data.status === "success" ? data.countryCode : "??";
  } catch {
    return "??";
  }
}


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
