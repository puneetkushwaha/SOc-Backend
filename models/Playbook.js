const mongoose = require('mongoose');

const playbookSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Malware', 'Social Engineering', 'Network', 'Web App', 'Identity', 'Physical', 'Other']
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'P1', 'P2', 'P3', 'P4'],
    required: true
  },
  source: {
    type: String,
    enum: ['NIST', 'CISA', 'OWASP', 'MITRE', 'Custom', 'Internal'],
    default: 'Custom'
  },
  mitre_techniques: [String],
  estimated_resolution_time: String,
  last_updated: Date,
  steps: [{
    order: Number,
    title: String,
    description: String,
    automated: Boolean,
    tool: String,
    command: String
  }],
  investigation_steps: [{
    order: Number,
    action: String,
    description: String,
    automated: Boolean
  }],
  containment_steps: [{
    order: Number,
    action: String,
    description: String,
    automated: Boolean
  }],
  remediation_steps: [{
    order: Number,
    action: String,
    description: String,
    automated: Boolean
  }],
  prevention_controls: [{
    control: String,
    type: { type: String },
    priority: String,
    description: String
  }],
  author: String,
  version: String,
  is_active: {
    type: Boolean,
    default: true
  },
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Playbook', playbookSchema);
