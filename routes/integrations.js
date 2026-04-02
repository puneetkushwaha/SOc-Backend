const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');

// The io object is passed in server.js via a middleware: req.io

router.post('/splunk', integrationController.handleSplunkWebhook);

module.exports = router;
