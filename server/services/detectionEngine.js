const Alert = require('../models/Alert');
const Device = require('../models/Device');
const socketService = require('./socketService');

// In-memory tracking for time-window rules
const portScanTracker = {};   // { srcIp: [{ port, time }] }
const floodTracker = {};      // { srcIp: [timestamp] }

async function createAlert(type, severity, description, deviceId = null) {
  const alert = await Alert.create({ type, severity, description, deviceId });
  const populated = await Alert.findById(alert._id).populate('deviceId');
  try {
    socketService.getIO().emit('new_alert', populated);
  } catch (e) {
    console.error('[DetectionEngine] Socket emit error:', e.message);
  }
  return alert;
}

async function analyze(payload) {
  const { srcIp, destIp, srcPort, destPort, protocol, byteCount, mac } = payload;
  const now = Date.now();
  const alerts = [];

  // ── Rule 1: Port Scan ──
  if (!portScanTracker[srcIp]) portScanTracker[srcIp] = [];
  portScanTracker[srcIp].push({ port: destPort, time: now });
  // Prune entries older than 60 seconds
  portScanTracker[srcIp] = portScanTracker[srcIp].filter(e => now - e.time < 60000);
  const distinctPorts = new Set(portScanTracker[srcIp].map(e => e.port));
  if (distinctPorts.size > 15) {
    const device = await Device.findOne({ ip: srcIp });
    const alert = await createAlert(
      'PORT_SCAN',
      'critical',
      `Port scan detected from ${srcIp} — ${distinctPorts.size} distinct ports in 60s`,
      device?._id
    );
    alerts.push(alert);
    portScanTracker[srcIp] = []; // Reset after firing
  }

  // ── Rule 2: DDoS Flood ──
  if (!floodTracker[srcIp]) floodTracker[srcIp] = [];
  floodTracker[srcIp].push(now);
  // Prune entries older than 10 seconds
  floodTracker[srcIp] = floodTracker[srcIp].filter(t => now - t < 10000);
  if (floodTracker[srcIp].length > 500) {
    const device = await Device.findOne({ ip: srcIp });
    const alert = await createAlert(
      'DDOS_FLOOD',
      'critical',
      `DDoS flood detected from ${srcIp} — ${floodTracker[srcIp].length} packets in 10s`,
      device?._id
    );
    alerts.push(alert);
    floodTracker[srcIp] = []; // Reset after firing
  }

  // ── Rule 3: ARP Spoof ──
  if (mac) {
    const existingDevice = await Device.findOne({ ip: srcIp, mac: { $ne: mac } });
    if (existingDevice) {
      const alert = await createAlert(
        'ARP_SPOOF',
        'critical',
        `ARP spoof detected: IP ${srcIp} seen with MAC ${mac} (previously ${existingDevice.mac})`,
        existingDevice._id
      );
      alerts.push(alert);
    }
  }

  // ── Rule 4 & 5: Unknown Device / Escalation ──
  if (mac) {
    const knownDevice = await Device.findOne({ mac });
    if (!knownDevice) {
      // Check if this IP was previously flagged as suspicious (escalation — Rule 5)
      const previouslyFlagged = await Device.findOne({ ip: srcIp, status: 'suspicious' });

      const newDevice = await Device.create({
        ip: srcIp,
        mac,
        hostname: `host-${mac.replace(/:/g, '').slice(-6)}`,
        status: 'suspicious',
        firstSeen: new Date(),
        lastSeen: new Date()
      });

      try {
        socketService.getIO().emit('device_update', newDevice);
      } catch (e) { /* ignore */ }

      if (previouslyFlagged) {
        // Rule 5: escalate to critical
        const alert = await createAlert(
          'UNKNOWN_DEVICE',
          'critical',
          `Repeated unknown device from IP ${srcIp} with new MAC ${mac} — escalated to critical`,
          newDevice._id
        );
        alerts.push(alert);
      } else {
        // Rule 4: normal unknown device
        const alert = await createAlert(
          'UNKNOWN_DEVICE',
          'medium',
          `New unknown device detected: IP ${srcIp}, MAC ${mac}`,
          newDevice._id
        );
        alerts.push(alert);
      }
    } else {
      // Update lastSeen for known devices
      knownDevice.lastSeen = new Date();
      await knownDevice.save();
    }
  }

  return alerts;
}

module.exports = { analyze };
