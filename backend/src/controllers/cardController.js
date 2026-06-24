const cardService = require('../services/cardService');

class CardController {
  async getById(req, res, next) {
    try {
      const card = await cardService.getCardById(req.params.id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }
      res.json(card);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { listId, title, description, dueDate } = req.body;
      if (!listId) {
        return res.status(400).json({ error: 'listId is required' });
      }
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
      }
      const card = await cardService.createCard(listId, title.trim(), description, dueDate);
      res.status(201).json(card);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { title, description, dueDate } = req.body;
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
      }
      const card = await cardService.updateCard(req.params.id, title.trim(), description, dueDate);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }
      res.json(card);
    } catch (err) {
      next(err);
    }
  }

  async move(req, res, next) {
    try {
      const { targetListId, targetPosition } = req.body;
      if (targetListId === undefined || targetPosition === undefined) {
        return res.status(400).json({ error: 'targetListId and targetPosition are required' });
      }
      const card = await cardService.moveCard(req.params.id, Number(targetListId), Number(targetPosition));
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }
      res.json(card);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await cardService.deleteCard(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Card not found' });
      }
      res.json({ message: 'Card deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // Tags
  async addTag(req, res, next) {
    try {
      const { tagId } = req.body;
      if (!tagId) {
        return res.status(400).json({ error: 'tagId is required' });
      }
      const card = await cardService.addTagToCard(req.params.id, Number(tagId));
      res.json(card);
    } catch (err) {
      next(err);
    }
  }

  async removeTag(req, res, next) {
    try {
      const card = await cardService.removeTagFromCard(req.params.id, Number(req.params.tagId));
      res.json(card);
    } catch (err) {
      next(err);
    }
  }

  // Members
  async addMember(req, res, next) {
    try {
      const { memberId } = req.body;
      if (!memberId) {
        return res.status(400).json({ error: 'memberId is required' });
      }
      const card = await cardService.addMemberToCard(req.params.id, Number(memberId));
      res.json(card);
    } catch (err) {
      next(err);
    }
  }

  async removeMember(req, res, next) {
    try {
      const card = await cardService.removeMemberFromCard(req.params.id, Number(req.params.memberId));
      res.json(card);
    } catch (err) {
      next(err);
    }
  }

  // Tag Management
  async createTag(req, res, next) {
    try {
      const { boardId, name, color } = req.body;
      if (!boardId || !name || !color) {
        return res.status(400).json({ error: 'boardId, name, and color are required' });
      }
      const tag = await cardService.createTag(Number(boardId), name.trim(), color.trim());
      res.status(201).json(tag);
    } catch (err) {
      next(err);
    }
  }

  async deleteTag(req, res, next) {
    try {
      await cardService.deleteTag(Number(req.params.tagId));
      res.json({ message: 'Tag deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CardController();
