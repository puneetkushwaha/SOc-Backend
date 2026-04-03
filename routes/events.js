const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/', eventController.getEvents);
router.get('/stats', eventController.getEventStats);
router.get('/:id', eventController.getEventById);
router.put('/:id', eventController.updateEvent);
router.patch('/:id/acknowledge', eventController.acknowledgeEvent);
router.patch('/:id/verify', eventController.verifyEvent);

module.exports = router;
