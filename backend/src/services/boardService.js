const db = require('../config/database');

class BoardService {
  async getAllBoards() {
    return await db.all('SELECT * FROM boards ORDER BY created_at DESC');
  }

  async getBoardById(id) {
    const board = await db.get('SELECT * FROM boards WHERE id = ?', [id]);
    if (!board) return null;

    // Fetch lists
    const lists = await db.all('SELECT * FROM lists WHERE board_id = ? ORDER BY position ASC', [id]);
    const listIds = lists.map(l => l.id);

    // Fetch board tags
    const tags = await db.all('SELECT * FROM tags WHERE board_id = ?', [id]);

    if (listIds.length === 0) {
      board.lists = [];
      board.tags = tags;
      return board;
    }

    // Fetch cards for these lists
    const placeholders = listIds.map(() => '?').join(',');
    const cards = await db.all(
      `SELECT * FROM cards WHERE list_id IN (${placeholders}) ORDER BY position ASC`,
      listIds
    );

    const cardIds = cards.map(c => c.id);

    // Fetch tags for these cards
    let cardTagsMap = {};
    let cardMembersMap = {};

    if (cardIds.length > 0) {
      const cardPlaceholders = cardIds.map(() => '?').join(',');
      
      // Get card-to-tag mappings
      const cardTagsRelation = await db.all(
        `SELECT ct.card_id, t.* FROM card_tags ct 
         JOIN tags t ON ct.tag_id = t.id 
         WHERE ct.card_id IN (${cardPlaceholders})`,
        cardIds
      );
      
      cardTagsRelation.forEach(rel => {
        if (!cardTagsMap[rel.card_id]) cardTagsMap[rel.card_id] = [];
        cardTagsMap[rel.card_id].push({ id: rel.id, name: rel.name, color: rel.color });
      });

      // Get card-to-member mappings
      const cardMembersRelation = await db.all(
        `SELECT cm.card_id, m.* FROM card_members cm 
         JOIN members m ON cm.member_id = m.id 
         WHERE cm.card_id IN (${cardPlaceholders})`,
        cardIds
      );

      cardMembersRelation.forEach(rel => {
        if (!cardMembersMap[rel.card_id]) cardMembersMap[rel.card_id] = [];
        cardMembersMap[rel.card_id].push({
          id: rel.id,
          name: rel.name,
          email: rel.email,
          avatar_url: rel.avatar_url
        });
      });
    }

    // Map tags and members into card items
    const cardsWithDetails = cards.map(card => ({
      ...card,
      tags: cardTagsMap[card.id] || [],
      members: cardMembersMap[card.id] || []
    }));

    // Nest cards into lists
    board.lists = lists.map(list => ({
      ...list,
      cards: cardsWithDetails.filter(c => c.list_id === list.id)
    }));

    board.tags = tags;

    return board;
  }

  async createBoard(title, description) {
    const { id: boardId } = await db.run(
      'INSERT INTO boards (title, description) VALUES (?, ?)',
      [title, description]
    );

    // Create default lists
    await db.run('INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)', [boardId, 'To Do', 0]);
    await db.run('INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)', [boardId, 'Doing', 1]);
    await db.run('INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)', [boardId, 'Done', 2]);

    // Create default tags for this board
    await db.run('INSERT INTO tags (board_id, name, color) VALUES (?, ?, ?)', [boardId, 'High Priority', '#EF4444']);
    await db.run('INSERT INTO tags (board_id, name, color) VALUES (?, ?, ?)', [boardId, 'Feature', '#3B82F6']);
    await db.run('INSERT INTO tags (board_id, name, color) VALUES (?, ?, ?)', [boardId, 'Bug', '#F97316']);
    await db.run('INSERT INTO tags (board_id, name, color) VALUES (?, ?, ?)', [boardId, 'Design', '#8B5CF6']);

    return await this.getBoardById(boardId);
  }

  async updateBoard(id, title, description) {
    await db.run(
      'UPDATE boards SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, id]
    );
    return await this.getBoardById(id);
  }

  async deleteBoard(id) {
    const board = await this.getBoardById(id);
    if (!board) return false;
    await db.run('DELETE FROM boards WHERE id = ?', [id]);
    return true;
  }
}

module.exports = new BoardService();
