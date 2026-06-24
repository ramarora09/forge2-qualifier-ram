const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

router.get('/', memberController.getAll);
router.post('/', memberController.create);
router.delete('/:id', memberController.delete);

module.exports = router;
