const http = require('http');

const data = JSON.stringify({
    deviceId: "1" // Assumindo ID 1, se falhar tento descobrir o ID correto
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/debug/sync-events-raw',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    let responseBody = '';
    res.on('data', chunk => { responseBody += chunk; });
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', responseBody);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
