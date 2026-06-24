const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');

router.post('/', listController.create);
router.put('/positions/reorder', listController.updatePositions);
router.put('/:id', listController.update);
router.delete('/:id', listController.delete);

module.exports = router;
