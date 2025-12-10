/* 
HVORDAN MAN PULLER OG GENSTARTER PÅ DROPLETTEN
cd SecurePing
git pull
pm2 restart myapp
*/

// app.js
const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch@2
const app = express();
const PORT = 3000;
require('dotenv').config();

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

// ------------------------------------------------------------------------------
// STATISTICS ENDPOINT (nyt)
let stats = { avgRTT: 0, avgResp: 0 };

/**
 * /stats
 * - Hvis loadbalancer sender query params avgRTT og avgResp → opdater stats
 * - Hvis ingen params → returner nuværende stats til frontend
 */
app.get('/stats', (req, res) => {
    const { avgRTT, avgResp } = req.query;

    if (avgRTT && avgResp) {
        stats.avgRTT = parseFloat(avgRTT);
        stats.avgResp = parseFloat(avgResp);
        console.log(`Stats opdateret: RTT=${stats.avgRTT.toFixed(2)}ms, Responstid=${stats.avgResp.toFixed(2)}ms`);
        return res.sendStatus(200);
    }

    res.json(stats);
});

// ------------------------------------------------------------------------------
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
                    entry.country = geo.countryCode || "Ukendt";
                } catch {
                    entry.country = "Ukendt";
                }
                return entry;
            })
        );

        res.json({ status: "success", data });

    } catch (error) {
        res.json({ status: "error", message: error.message });
    }
});

// Endpoint som modtager data fra frontend og sender videre til load balancer
app.post('/forward-to-loadbalancer', async (req, res) => {
    const { ips } = req.body; // forvent et array af IP'er
    const LOADBALANCER_URL = "http://138.197.183.51:8080/receive-post";

    if (!ips || !Array.isArray(ips)) {
        return res.status(400).json({ error: "Forventet et array af IP-adresser under 'ips'" });
    }

    try {
        const response = await fetch(LOADBALANCER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ips })
        });

        const result = await response.json(); 
        res.json({ success: true, response: result });

    } catch (error) {
        console.error("Fejl ved POST til loadbalancer:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/set-rate-limit', (req, res) => {
    const { rate } = req.body;

    if (!rate || typeof rate !== 'number' || rate <= 0) {
        return res.status(400).json({ error: 'Ugyldig rate værdi' });
    }

    console.log('Ny rate limit modtaget:', rate);
});



// ENDPOINT SOM MODTAGER POST FRA FRONTEND
/*
app.post("/send-sms", async (req, res) => {
  const HARD_CODED_RECIPIENT = "+4542373620";
  
    const { besked } = req.body;   // <-- Her modtager vi "besked" fra frontend
    // const modtager = process.env.TWILIO_PHONE_RECIPIENT; // Eller dynamisk senere

    console.log("Modtaget besked:", besked);

    try {
        const message = await client.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: HARD_CODED_RECIPIENT,
            body: besked,
        });

        res.json({ 
            success: true, 
            sid: message.sid,
            besked: "SMS sendt!"
        });

    } catch (error) {
        console.error("Twilio fejl:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
*/



// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
