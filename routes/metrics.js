const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');

router.get('/', metricsController.getMetrics);
router.get('/dashboard', metricsController.getDashboardData);

module.exports = router;
