const listService = require('../services/listService');

class ListController {
  async create(req, res, next) {
    try {
      const { boardId, title } = req.body;
      if (!boardId) {
        return res.status(400).json({ error: 'boardId is required' });
      }
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
      }
      const list = await listService.createList(boardId, title.trim());
      res.status(201).json(list);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { title } = req.body;
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
      }
      const list = await listService.updateList(req.params.id, title.trim());
      if (!list) {
        return res.status(404).json({ error: 'List not found' });
      }
      res.json(list);
    } catch (err) {
      next(err);
    }
  }

  async updatePositions(req, res, next) {
    try {
      const { boardId, listOrder } = req.body;
      if (!boardId || !Array.isArray(listOrder)) {
        return res.status(400).json({ error: 'boardId and listOrder array are required' });
      }
      const lists = await listService.updateListPositions(boardId, listOrder);
      res.json(lists);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await listService.deleteList(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'List not found' });
      }
      res.json({ message: 'List deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ListController();
