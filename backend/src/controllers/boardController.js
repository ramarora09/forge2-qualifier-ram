const boardService = require('../services/boardService');

class BoardController {
  async getAll(req, res, next) {
    try {
      const boards = await boardService.getAllBoards();
      res.json(boards);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const board = await boardService.getBoardById(req.params.id);
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }
      res.json(board);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { title, description } = req.body;
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
      }
      const board = await boardService.createBoard(title.trim(), description || '');
      res.status(201).json(board);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { title, description } = req.body;
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
      }
      const board = await boardService.updateBoard(req.params.id, title.trim(), description || '');
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }
      res.json(board);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await boardService.deleteBoard(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Board not found' });
      }
      res.json({ message: 'Board deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BoardController();
