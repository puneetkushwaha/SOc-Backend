const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['SIEM', 'EDR', 'Threat Intel', 'Cloud Security', 'Ticketing', 'SOAR', 'Network', 'Database', 'Other']
  },
  status: {
    type: String,
    enum: ['CONNECTED', 'DISCONNECTED', 'SYNCING', 'ERROR'],
    default: 'DISCONNECTED'
  },
  description: String,
  config: {
    endpoint: String,
    api_key: String,
    secret: String,
    region: String,
    options: mongoose.Schema.Types.Mixed
  },
  data_volume: String,
  last_sync: Date,
  health_check: {
    last_check: Date,
    status: String,
    message: String
  },
  icon: String,
  color: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Integration', integrationSchema);
