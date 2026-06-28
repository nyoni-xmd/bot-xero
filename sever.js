// server.js - XERO-MD Pairing Site
const express = require('express');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');
const QRCode = require('qrcode');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Store socket instance
let sock = null;
let isConnected = false;

// ========== PAIRING ENDPOINT ==========
app.post('/pair', async (req, res) => {
    try {
        const { number } = req.body;
        if (!number) {
            return res.status(400).json({ error: 'Namba ya simu inahitajika!' });
        }

        // Clean number
        const cleanNumber = number.replace(/[^0-9]/g, '');
        if (cleanNumber.length < 9) {
            return res.status(400).json({ error: 'Namba si sahihi! Tafadhali ingiza namba kamili.' });
        }

        // If socket exists and connected, use it
        if (sock && isConnected) {
            try {
                const code = await sock.requestPairingCode(cleanNumber);
                return res.json({ 
                    success: true, 
                    code: code,
                    message: '✅ Pairing code imetumwa!',
                    number: cleanNumber
                });
            } catch (err) {
                console.error('Pairing error:', err);
                // If error, recreate socket
            }
        }

        // Create new socket for pairing
        const { state, saveCreds } = await useMultiFileAuthState('./sessions');
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            logger: P({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.macOS('Firefox'),
            auth: state,
            version,
            markOnlineOnConnect: false
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                isConnected = true;
                console.log('✅ XERO-MD socket connected!');
                try {
                    const code = await sock.requestPairingCode(cleanNumber);
                    res.json({ 
                        success: true, 
                        code: code,
                        message: '✅ Pairing code imetumwa!',
                        number: cleanNumber
                    });
                } catch (err) {
                    res.status(500).json({ error: 'Error generating pairing code: ' + err.message });
                }
            } else if (connection === 'close') {
                isConnected = false;
                console.log('❌ Socket closed');
            }
        });

        // Set timeout for pairing
        setTimeout(() => {
            if (!isConnected) {
                res.status(408).json({ error: 'Timeout! Jaribu tena.' });
            }
        }, 30000);

    } catch (error) {
        console.error('Pair error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// ========== STATUS ENDPOINT ==========
app.get('/status', (req, res) => {
    res.json({ 
        status: isConnected ? 'connected' : 'disconnected',
        bot: 'XERO-MD',
        version: '3.0.0'
    });
});

// ========== SERVE INDEX ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========== START SERVER ==========
app.listen(port, () => {
    console.log(`🚀 XERO-MD Pairing Site running on http://localhost:${port}`);
    console.log(`💡 Open in browser: http://localhost:${port}`);
});
