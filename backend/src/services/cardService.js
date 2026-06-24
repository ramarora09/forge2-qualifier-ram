const db = require('../config/database');

class CardService {
  async getCardById(id) {
    const card = await db.get('SELECT * FROM cards WHERE id = ?', [id]);
    if (!card) return null;

    // Get tags
    card.tags = await db.all(
      `SELECT t.* FROM tags t
       JOIN card_tags ct ON t.id = ct.tag_id
       WHERE ct.card_id = ?`,
      [id]
    );

    // Get members
    card.members = await db.all(
      `SELECT m.* FROM members m
       JOIN card_members cm ON m.id = cm.member_id
       WHERE cm.card_id = ?`,
      [id]
    );

    return card;
  }

  async createCard(listId, title, description, dueDate) {
    // Find next position
    const result = await db.get('SELECT MAX(position) as maxPos FROM cards WHERE list_id = ?', [listId]);
    const position = result && result.maxPos !== null ? result.maxPos + 1 : 0;

    const { id } = await db.run(
      'INSERT INTO cards (list_id, title, description, position, due_date) VALUES (?, ?, ?, ?, ?)',
      [listId, title, description || '', position, dueDate || null]
    );

    return await this.getCardById(id);
  }

  async updateCard(id, title, description, dueDate) {
    await db.run(
      `UPDATE cards SET title = ?, description = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [title, description, dueDate || null, id]
    );
    return await this.getCardById(id);
  }

  async moveCard(id, targetListId, targetPosition) {
    const card = await db.get('SELECT * FROM cards WHERE id = ?', [id]);
    if (!card) return null;

    const sourceListId = card.list_id;
    const sourcePosition = card.position;

    if (sourceListId === targetListId) {
      if (sourcePosition < targetPosition) {
        // Moving down: shift cards in between up
        await db.run(
          `UPDATE cards SET position = position - 1 
           WHERE list_id = ? AND position > ? AND position <= ?`,
          [sourceListId, sourcePosition, targetPosition]
        );
      } else if (sourcePosition > targetPosition) {
        // Moving up: shift cards in between down
        await db.run(
          `UPDATE cards SET position = position + 1 
           WHERE list_id = ? AND position >= ? AND position < ?`,
          [sourceListId, targetPosition, sourcePosition]
        );
      }
    } else {
      // Shift cards in the source list up (close the gap)
      await db.run(
        'UPDATE cards SET position = position - 1 WHERE list_id = ? AND position > ?',
        [sourceListId, sourcePosition]
      );

      // Shift cards in the target list down (make space)
      await db.run(
        'UPDATE cards SET position = position + 1 WHERE list_id = ? AND position >= ?',
        [targetListId, targetPosition]
      );
    }

    // Update the moved card's list and position
    await db.run(
      'UPDATE cards SET list_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [targetListId, targetPosition, id]
    );

    return await this.getCardById(id);
  }

  async deleteCard(id) {
    const card = await db.get('SELECT * FROM cards WHERE id = ?', [id]);
    if (!card) return false;

    // Shift subsequent cards in the same list up
    await db.run(
      'UPDATE cards SET position = position - 1 WHERE list_id = ? AND position > ?',
      [card.list_id, card.position]
    );

    await db.run('DELETE FROM cards WHERE id = ?', [id]);
    return true;
  }

  // Tag Assignments
  async addTagToCard(cardId, tagId) {
    try {
      await db.run('INSERT INTO card_tags (card_id, tag_id) VALUES (?, ?)', [cardId, tagId]);
    } catch (err) {
      // Ignore if already added (unique constraint check)
      if (!err.message.includes('UNIQUE')) throw err;
    }
    return await this.getCardById(cardId);
  }

  async removeTagFromCard(cardId, tagId) {
    await db.run('DELETE FROM card_tags WHERE card_id = ? AND tag_id = ?', [cardId, tagId]);
    return await this.getCardById(cardId);
  }

  // Member Assignments
  async addMemberToCard(cardId, memberId) {
    try {
      await db.run('INSERT INTO card_members (card_id, member_id) VALUES (?, ?)', [cardId, memberId]);
    } catch (err) {
      // Ignore if already added (unique constraint check)
      if (!err.message.includes('UNIQUE')) throw err;
    }
    return await this.getCardById(cardId);
  }

  async removeMemberFromCard(cardId, memberId) {
    await db.run('DELETE FROM card_members WHERE card_id = ? AND member_id = ?', [cardId, memberId]);
    return await this.getCardById(cardId);
  }

  // Manage tags directly (create/delete)
  async createTag(boardId, name, color) {
    const { id } = await db.run(
      'INSERT INTO tags (board_id, name, color) VALUES (?, ?, ?)',
      [boardId, name, color]
    );
    return { id, board_id: boardId, name, color };
  }

  async deleteTag(tagId) {
    await db.run('DELETE FROM tags WHERE id = ?', [tagId]);
    return true;
  }
}

module.exports = new CardService();
