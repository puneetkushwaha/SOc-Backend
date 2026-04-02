const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/cvs',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-key-change-me-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-change-me-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
