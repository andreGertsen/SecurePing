// Track hvilke logs vi allerede har tilføjet
const seenEntries = new Set();

// Array til at samle IP-adresser fra markeringer
let selectedIPs = [];

function insertRow(entry) {
    const tableBody = document.querySelector("#logTable tbody");

    const row = document.createElement("tr");
    row.innerHTML = `
    <td class="ts">${entry.timestamp}</td>
    <td class="ip">${entry.ip}</td>
    <td>${entry.method}</td>
    <td>${entry.url}</td>
    <td>${entry.country}</td>   <!-- NY KOLONNE -->
`;
    // Tilføj click-handler
    row.addEventListener("click", () => highlightSameIP(entry.ip));

    tableBody.appendChild(row);
}

function highlightSameIP(ip) {
    const rows = document.querySelectorAll("#logTable tbody tr");

    // Nulstil selection
    selectedIPs = [];

    rows.forEach(row => {
        row.classList.remove("highlight");

        const rowIP = row.querySelector(".ip")?.textContent;
        if (rowIP === ip) {
            row.classList.add("highlight");
            selectedIPs = [rowIP]; // sæt den valgte IP i array
        }
    });

    console.log("Valgte IP'er:", selectedIPs);
}


async function fetchNewData() {
    try {
        const response = await fetch('/call-other-server');
        const json = await response.json();

        if (json.status === "success") {

            let added = false; // ← MANGLEDE !!

            json.data.forEach(entry => {
                const key = entry.timestamp + entry.ip + entry.method + entry.url + entry.country;

                if (!seenEntries.has(key)) {
                    seenEntries.add(key);
                    insertRow(entry);
                    added = true; // ← NU BLIVER TOP-3 AKTIVERET
                }
            });

            // Her var fejlen: dette blev aldrig sandt før
            if (added) {
                highLightMistænkeligeIPer();
            }
        }

    } catch (err) {
        console.error("Kunne ikke hente data:", err);
    }
}

// Hent data hvert minut
setInterval(fetchNewData, 60000);

// Hent første gang med det samme
fetchNewData();


    // RATE LIMIT FUNKTION //
    document.getElementById('sætRateLimit_ID').addEventListener('click', () => {
        const rate = document.getElementById('rateLimit_ID').value; // får tal fra input

        // tjekker om input er gyldigt
        if(rate <= 0 || isNaN(rate))
        {
            alert("Ugyldigt input");
        }
        // Post den nye rate limit til loadbalanceren
        fetch('https://understory.live/set-rate-limit', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ rate: parseInt(rate) })
        })

        .then(response => { // vent på response // 
            if (!response.ok) throw new Error('Fejl ved opdatering');
            return response.json();
        })
        .then(data => { 
            alert('Rate limit opdateret: ' + data.rate);
        })
        .catch(err =>
        {
            console.error(err);
            alert('Noget gik galt');
            return;
        });
    });


// ---------------------------------------------------------------------------- //
// HIGHLIGHT IP ADRESSERNE

document.getElementById('blokerIPButton_ID').addEventListener('click', () => {
    if (selectedIPs.length === 0) {
        alert("Ingen IP markeret!");
        return;
    }

    fetch("/forward-to-loadbalancer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ips: selectedIPs })
    })
    .then(res => res.json())
    .then(resData => {
        console.log("Loadbalancer svar:", resData);
        alert("IP'er blokeret: " + selectedIPs.join(", "));
    })
    .catch(err => {
        console.error(err);
        alert("Noget gik galt ved blokering af IP");
    });
});


// ---------------------------------------------------------- //
// SEND DRIFTSMEDDELELSE //
/*
document.getElementById('sendDriftsmeddelelser_ID').addEventListener('click', async () => {
    let besked = document.getElementById("beskedIndhold_ID").value;

    try {
        const response = await fetch('/send-sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ besked })
        });
        const data = await response.json();
        console.log(data);
        if (data.success) {
            alert('SMS sendt!');
        } else {
            alert('Fejl: ' + data.error);
        }
    } catch (err) {
        console.error(err);
        alert('Noget gik galt!');
    }
});
*/
