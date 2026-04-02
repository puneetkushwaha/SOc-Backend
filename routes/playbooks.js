const express = require('express');
const router = express.Router();
const playbookController = require('../controllers/playbookController');
const { getPlaybookContent, downloadPlaybook } = require('../controllers/playbookContentController');

router.get('/', playbookController.getPlaybooks);
router.get('/:id/content', getPlaybookContent);
router.get('/:id/download', downloadPlaybook);
router.get('/:id', playbookController.getPlaybookById);
router.post('/', playbookController.createPlaybook);
router.put('/:id', playbookController.updatePlaybook);

module.exports = router;
