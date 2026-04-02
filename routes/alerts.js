const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

router.get('/latest', alertController.getLatestAlert);
router.post('/refresh', alertController.refreshAlert);
router.get('/status', alertController.getAlertStatus);

module.exports = router;
