const mongoose = require('mongoose');

const trafficLogSchema = new mongoose.Schema({
  srcIp: { type: String, required: true },
  destIp: { type: String, required: true },
  srcPort: { type: Number, required: true },
  destPort: { type: Number, required: true },
  protocol: { type: String, required: true },
  byteCount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

trafficLogSchema.index({ srcIp: 1 });
trafficLogSchema.index({ destIp: 1 });
trafficLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('TrafficLog', trafficLogSchema);
