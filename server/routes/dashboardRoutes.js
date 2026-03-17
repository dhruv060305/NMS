const express = require('express');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const TrafficLog = require('../models/TrafficLog');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalDevices, activeAlerts, criticalCount] = await Promise.all([
      Device.countDocuments(),
      Alert.countDocuments({ resolved: false }),
      Alert.countDocuments({ resolved: false, severity: 'critical' })
    ]);

    // Packets per second: count logs in last 60 seconds / 60
    const sixtySecsAgo = new Date(Date.now() - 60000);
    const recentPackets = await TrafficLog.countDocuments({
      timestamp: { $gte: sixtySecsAgo }
    });
    const packetsPerSecond = Math.round((recentPackets / 60) * 100) / 100;

    res.json({
      success: true,
      data: { totalDevices, activeAlerts, packetsPerSecond, criticalCount },
      error: null
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

module.exports = router;
