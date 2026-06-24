const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');

// Card CRUD
router.post('/', cardController.create);
router.get('/:id', cardController.getById);
router.put('/:id', cardController.update);
router.put('/:id/move', cardController.move);
router.delete('/:id', cardController.delete);

// Card Tags
router.post('/:id/tags', cardController.addTag);
router.delete('/:id/tags/:tagId', cardController.removeTag);

// Card Members
router.post('/:id/members', cardController.addMember);
router.delete('/:id/members/:memberId', cardController.removeMember);

// Board Tag Management (Create/Delete tags directly)
router.post('/tags/manage', cardController.createTag);
router.delete('/tags/manage/:tagId', cardController.deleteTag);

module.exports = router;
