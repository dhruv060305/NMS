const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: { type: String, required: true },
  severity: {
    type: String,
    enum: ['low', 'medium', 'critical'],
    required: true
  },
  description: { type: String, required: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', default: null },
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

alertSchema.index({ severity: 1 });
alertSchema.index({ resolved: 1 });
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
