const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true,
    index: true
  },
  src_ip: {
    type: String,
    required: true
  },
  dst_ip: {
    type: String,
    required: true
  },
  attack_type: {
    type: String,
    required: true
  },
  protocol: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['UNACKNOWLEDGED', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED'],
    default: 'UNACKNOWLEDGED'
  },
  cve_id: String,
  mitre_technique: String,
  description: String,
  user_id: String,
  hostname: String,
  location: {
    country: String,
    city: String,
    lat: Number,
    lng: Number
  }
}, {
  timestamps: true
});

securityEventSchema.index({ createdAt: -1 });
securityEventSchema.index({ severity: 1, status: 1 });

module.exports = mongoose.model('SecurityEvent', securityEventSchema);
