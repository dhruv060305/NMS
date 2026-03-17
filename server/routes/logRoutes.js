const express = require('express');
const TrafficLog = require('../models/TrafficLog');

const router = express.Router();

// GET /api/logs — paginated traffic logs, filterable by ip or port
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, ip, port } = req.query;
    const filter = {};

    if (ip) {
      filter.$or = [{ srcIp: ip }, { destIp: ip }];
    }

    if (port) {
      const portNum = parseInt(port, 10);
      if (filter.$or) {
        // Combine IP and port filters
        filter.$and = [
          { $or: filter.$or },
          { $or: [{ srcPort: portNum }, { destPort: portNum }] }
        ];
        delete filter.$or;
      } else {
        filter.$or = [{ srcPort: portNum }, { destPort: portNum }];
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [logs, total] = await Promise.all([
      TrafficLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      TrafficLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10))
        }
      },
      error: null
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

module.exports = router;
