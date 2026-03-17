const http = require('http');

const API_URL = 'http://localhost:5000';
let authToken = null;

function randomIp() {
  return `192.168.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 254) + 1}`;
}

function randomMac() {
  const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  return `${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`;
}

function randomPort() {
  return Math.floor(Math.random() * 65535) + 1;
}

function randomProtocol() {
  return Math.random() > 0.5 ? 'TCP' : 'UDP';
}

function randomByteCount() {
  return Math.floor(Math.random() * 10000) + 64;
}

// Pool of known MACs to create some device consistency
const macPool = Array.from({ length: 10 }, () => randomMac());

function generatePacket() {
  return {
    srcIp: randomIp(),
    destIp: randomIp(),
    srcPort: randomPort(),
    destPort: randomPort(),
    protocol: randomProtocol(),
    byteCount: randomByteCount(),
    mac: macPool[Math.floor(Math.random() * macPool.length)]
  };
}

function generatePortScanBatch() {
  const srcIp = randomIp();
  const mac = macPool[Math.floor(Math.random() * macPool.length)];
  const packets = [];
  for (let i = 0; i < 20; i++) {
    packets.push({
      srcIp,
      destIp: randomIp(),
      srcPort: randomPort(),
      destPort: randomPort(), // All different ports
      protocol: 'TCP',
      byteCount: randomByteCount(),
      mac
    });
  }
  return packets;
}

function postData(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function login() {
  try {
    const result = await postData('/api/auth/login', { username: 'admin', password: 'admin123' });
    const parsed = JSON.parse(result.body);
    if (parsed.success) {
      authToken = parsed.data.token;
      console.log('[Agent] Logged in successfully');
    } else {
      console.error('[Agent] Login failed:', parsed.error);
      process.exit(1);
    }
  } catch (err) {
    console.error('[Agent] Login error:', err.message);
    process.exit(1);
  }
}

async function sendTraffic() {
  try {
    const isPortScan = Math.random() < 0.1; // 1 in 10 chance
    let packets;

    if (isPortScan) {
      packets = generatePortScanBatch();
      console.log(`[Agent] Simulating PORT SCAN: 20 packets from same IP`);
    } else {
      // Send 1-5 normal packets
      const count = Math.floor(Math.random() * 5) + 1;
      packets = Array.from({ length: count }, generatePacket);
      console.log(`[Agent] Sending ${count} normal packet(s)`);
    }

    const result = await postData('/api/ingest', packets);
    const parsed = JSON.parse(result.body);
    if (parsed.success) {
      console.log(`[Agent] Ingested: ${parsed.data.logsCreated} logs, ${parsed.data.alertsFired} alerts`);
    } else {
      console.error('[Agent] Ingest error:', parsed.error);
    }
  } catch (err) {
    console.error('[Agent] Send error:', err.message);
  }
}

async function main() {
  console.log('[Agent] Mock Network Agent starting...');
  await login();
  console.log('[Agent] Sending traffic every 3 seconds. Press Ctrl+C to stop.');

  // Send first batch immediately
  await sendTraffic();

  // Then every 3 seconds
  setInterval(sendTraffic, 3000);
}

main();
