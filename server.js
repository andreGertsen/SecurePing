/* server.js */
const express = require('express');
const fetch = require('node-fetch'); // npm i node-fetch
const app = express();
const PORT = 3000;
require('dotenv').config();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

// --------------------
// Rate-limit
// --------------------
let rateLimit = 10; // maks antal requests per minut
const clients = {}; // gemmer antal requests per IP

function checkRateLimit(ip) {
    if (!clients[ip]) clients[ip] = 0;
    if (clients[ip] >= rateLimit) return false;
    clients[ip] += 1;
    return true;
}

setInterval(() => {
    for (let ip in clients) clients[ip] = 0;
    console.log("Rate counters cleared");
}, 60000);

// --------------------
// Stats fra loadbalancer
// --------------------
let avgRTT = 0;
let avgRes = 0;

// Modtag gennemsnit fra loadbalancer
app.get('/receive-stats', (req, res) => {
    avgRTT = req.query.avgRTT || 0;
    avgRes = req.query.avgRes || 0;
    res.json({ success: true });
});

// --------------------
// EJS-side /index
// --------------------
app.get('/index', async (req, res) => {
    try {
        const response = await fetch("http://138.197.183.51:8080/array");
        let dataModtaget = await response.json();
        dataModtaget = dataModtaget.slice(-200);

        const enriched = await Promise.all(
            dataModtaget.map(async entry => {
                try {
                    const geoResp = await fetch(`http://ip-api.com/json/${entry.ip}?fields=countryCode`);
                    const geoData = await geoResp.json();
                    entry.country = geoData.countryCode || "UNKNOWN";
                } catch {
                    entry.country = "UNKNOWN";
                }
                return entry;
            })
        );

        // Send avgRTT og avgRes til EJS
        res.render('index', { dataModtaget: enriched, avgRTT, avgRes });

    } catch (err) {
        res.render('index', { dataModtaget: [], avgRTT, avgRes });
    }
});

// --------------------
// API til frontend (ajax)
// --------------------
app.get('/call-other-server', async (req, res) => {
    try {
        const response = await fetch("http://138.197.183.51:8080/array");
        let data = await response.json();

        data = await Promise.all(
            data.map(async entry => {
                try {
                    const geoResp = await fetch(`http://ip-api.com/json/${entry.ip}?fields=countryCode`);
                    const geoData = await geoResp.json();
                    entry.country = geoData.countryCode || "Ukendt";
                } catch {
                    entry.country = "Ukendt";
                }
                return entry;
            })
        );

        res.json({ status: "success", data });

    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

// --------------------
// Send IP’er til loadbalancer for blokering
// --------------------
app.post('/forward-to-loadbalancer', async (req, res) => {
    const { ips } = req.body;
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
    } catch (err) {
        console.error("Fejl ved POST til loadbalancer:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --------------------
// Sæt rate limit
// --------------------
app.post('/set-rate-limit', (req, res) => {
    const { rate } = req.body;
    if (!rate || typeof rate !== 'number' || rate <= 0) {
        return res.status(400).json({ error: 'Ugyldig rate værdi' });
    }
    rateLimit = rate;
    console.log('Ny rate limit modtaget:', rateLimit);
    res.json({ success: true, rate: rateLimit });
});

// --------------------
// Start server
// --------------------
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
