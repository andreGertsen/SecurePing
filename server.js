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
app.use(express.json());


// Rate limit konfiguration
let rateLimit = 10; // maks antal requests per minut
const clients = {}; // gemmer antal requests per IP

// Funktion til at tjekke rate limit
function checkRateLimit(ip) {
    if (!clients[ip]) {
        clients[ip] = 0;
    }

    if (clients[ip] >= rateLimit) {
        return false; // overskredet
    }

    clients[ip] += 1;
    return true; // ok
}

// Nulstil tællere hvert minut
setInterval(() => {
    for (let ip in clients) {
        clients[ip] = 0;
    }
    console.log("Rate counters cleared");
}, 60000);




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
    let data = await response.json();

    data = await Promise.all(
      data.map(async entry => {
        try {
          const resp = await fetch(`http://ip-api.com/json/${entry.ip}?fields=countryCode`);
          const geo = await resp.json();
          entry.country = geo.countryCode || "UNKNOWN";
        } catch {
          entry.country = "UNKNOWN";
        }
        return entry;
      })
    );

    res.json({ status: "success", data });

  } catch (error) {
    res.json({ status: "error", message: error.message });
  }
});


app.post('/set-rate-limit', (req, res) => {
    const { rate } = req.body;

    if (!rate || typeof rate !== 'number' || rate <= 0) {
        return res.status(400).json({ error: 'Ugyldig rate værdi' });
    }

    console.log('Ny rate limit modtaget:', rate);
});

const twilio = require("twilio");
require("dotenv").config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSMS(besked, modtager) {
    try {
        const message = await client.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: modtager,       // Dynamisk modtager
            body: besked,
        });
        console.log("SMS sendt til:", modtager, "SID:", message.sid);
    } catch (err) {
        console.error("Fejl ved SMS:", err);
    }
}

// Eksempel:
sendSMS("Hej, dette er en test", "+4542373620");

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
