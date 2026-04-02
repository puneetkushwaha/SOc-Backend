const rateLimit = require('express-rate-limit');

// General rate limiter for all routes - INCREASED for production use
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased from 100 to 1000 requests per windowMs for SIEM integration
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for webhook endpoints (SIEM integration)
      if (req.path.startsWith('/api/webhooks')) {
        return true;
      }
      return false;
    }
});

// Webhook rate limiter - Very high limits for SIEM tools
const webhookLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10000, // 10,000 requests per minute for real-time SIEM data
    message: {
        success: false,
        error: 'Webhook rate limit exceeded'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Login rate limiter - stricter limits
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Increased from 5 to 10 for testing
    message: {
        success: false,
        error: 'Too many login attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Register rate limiter
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Increased from 3 to 10
    message: {
        success: false,
        error: 'Too many registration attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { generalLimiter, loginLimiter, registerLimiter, webhookLimiter };