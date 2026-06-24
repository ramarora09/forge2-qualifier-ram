const db = require('../config/database');

class ListService {
  async getListsByBoardId(boardId) {
    return await db.all('SELECT * FROM lists WHERE board_id = ? ORDER BY position ASC', [boardId]);
  }

  async getListById(id) {
    return await db.get('SELECT * FROM lists WHERE id = ?', [id]);
  }

  async createList(boardId, title) {
    // Determine the next position index
    const result = await db.get('SELECT MAX(position) as maxPos FROM lists WHERE board_id = ?', [boardId]);
    const position = result && result.maxPos !== null ? result.maxPos + 1 : 0;

    const { id } = await db.run(
      'INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)',
      [boardId, title, position]
    );

    return await this.getListById(id);
  }

  async updateList(id, title) {
    await db.run(
      'UPDATE lists SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, id]
    );
    return await this.getListById(id);
  }

  async updateListPositions(boardId, listOrder) {
    // listOrder is an array of list IDs in the desired order
    for (let i = 0; i < listOrder.length; i++) {
      const listId = listOrder[i];
      await db.run(
        'UPDATE lists SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND board_id = ?',
        [i, listId, boardId]
      );
    }
    return await this.getListsByBoardId(boardId);
  }

  async deleteList(id) {
    const list = await this.getListById(id);
    if (!list) return false;
    await db.run('DELETE FROM lists WHERE id = ?', [id]);
    return true;
  }
}

module.exports = new ListService();
