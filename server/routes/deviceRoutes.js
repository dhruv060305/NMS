const express = require('express');
const Device = require('../models/Device');
const socketService = require('../services/socketService');

const router = express.Router();

// GET /api/devices — list all devices
router.get('/', async (req, res) => {
  try {
    const devices = await Device.find().sort({ lastSeen: -1 });
    res.json({ success: true, data: devices, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// PATCH /api/devices/:id/status — update device trust status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['trusted', 'suspicious', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, data: null, error: 'Invalid status' });
    }

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, data: null, error: 'Device not found' });
    }

    try {
      socketService.getIO().emit('device_update', device);
    } catch (e) { /* ignore if socket not ready */ }

    res.json({ success: true, data: device, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

module.exports = router;
