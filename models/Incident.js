const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['NEW', 'INVESTIGATING', 'CONTAINED', 'ERADICATED', 'CLOSED'],
    default: 'NEW',
    index: true
  },
  assigned_to: String,
  created_by: String,
  sla_deadline: Date,
  sla_status: {
    type: String,
    enum: ['normal', 'warning', 'breached'],
    default: 'normal'
  },
  related_events: [{
    type: String
  }],
  playbooks_applied: [{
    type: String
  }],
  timeline: [{
    action: String,
    user: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  affected_assets: [String],
  Mitigation: String,
  remediation: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

incidentSchema.virtual('sla_timer').get(function() {
  if (!this.sla_deadline) return null;
  const diff = this.sla_deadline - new Date();
  if (diff <= 0) return '00:00:00';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

module.exports = mongoose.model('Incident', incidentSchema);
