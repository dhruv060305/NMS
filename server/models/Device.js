const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  mac: { type: String, required: true, unique: true },
  hostname: { type: String, default: 'Unknown' },
  status: {
    type: String,
    enum: ['trusted', 'suspicious', 'blocked'],
    default: 'suspicious'
  },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now }
});

deviceSchema.index({ ip: 1 });
// removed mac index — already handled by unique: true above

module.exports = mongoose.model('Device', deviceSchema);