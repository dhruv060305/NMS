const express = require('express');
const TrafficLog = require('../models/TrafficLog');
const detectionEngine = require('../services/detectionEngine');

const router = express.Router();

// POST /api/ingest — accepts raw traffic data, runs detection, saves log
router.post('/', async (req, res) => {
  try {
    const packets = Array.isArray(req.body) ? req.body : [req.body];
    const savedLogs = [];
    const allAlerts = [];

    for (const pkt of packets) {
      const { srcIp, destIp, srcPort, destPort, protocol, byteCount, mac } = pkt;

      // Save traffic log
      const log = await TrafficLog.create({
        srcIp, destIp, srcPort, destPort, protocol, byteCount
      });
      savedLogs.push(log);

      // Run detection engine
      const alerts = await detectionEngine.analyze(pkt);
      allAlerts.push(...alerts);
    }

    res.json({
      success: true,
      data: { logsCreated: savedLogs.length, alertsFired: allAlerts.length },
      error: null
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

module.exports = router;
