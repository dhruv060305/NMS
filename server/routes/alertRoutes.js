const express = require('express');
const Alert = require('../models/Alert');

const router = express.Router();

// GET /api/alerts — list alerts with filters
router.get('/', async (req, res) => {
  try {
    const { severity, resolved, startDate, endDate } = req.query;
    const filter = {};

    if (severity) filter.severity = severity;
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const alerts = await Alert.find(filter)
      .populate('deviceId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: alerts, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

// PATCH /api/alerts/:id/resolve — mark alert as resolved
router.patch('/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true }
    ).populate('deviceId');

    if (!alert) {
      return res.status(404).json({ success: false, data: null, error: 'Alert not found' });
    }

    res.json({ success: true, data: alert, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

module.exports = router;
