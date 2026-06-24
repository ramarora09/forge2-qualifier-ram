const db = require('../config/database');

class DashboardService {
  async getMetrics() {
    const now = new Date().toISOString();

    const boardsRes = await db.get('SELECT COUNT(*) as count FROM boards');
    const cardsRes = await db.get('SELECT COUNT(*) as count FROM cards');
    
    // Completed cards are cards in any list whose title is 'done' (case-insensitive)
    const completedRes = await db.get(
      `SELECT COUNT(c.id) as count FROM cards c 
       JOIN lists l ON c.list_id = l.id 
       WHERE LOWER(l.title) = 'done'`
    );

    // Overdue cards are cards with due_date in the past that are not completed (i.e. not in a 'done' list)
    const overdueRes = await db.get(
      `SELECT COUNT(c.id) as count FROM cards c 
       JOIN lists l ON c.list_id = l.id 
       WHERE c.due_date IS NOT NULL 
         AND c.due_date < ? 
         AND LOWER(l.title) != 'done'`,
      [now]
    );

    // Also fetch some helpful dashboard listings:
    // 1. Cards due soon (next 3 days, not completed)
    const threeDaysLater = new Date(Date.now() + 86400000 * 3).toISOString();
    const upcomingCards = await db.all(
      `SELECT c.*, l.title as list_title, b.title as board_title FROM cards c
       JOIN lists l ON c.list_id = l.id
       JOIN boards b ON l.board_id = b.id
       WHERE c.due_date IS NOT NULL 
         AND c.due_date >= ?
         AND c.due_date <= ?
         AND LOWER(l.title) != 'done'
       ORDER BY c.due_date ASC
       LIMIT 5`,
      [now, threeDaysLater]
    );

    // 2. Overdue cards details
    const overdueCardsDetails = await db.all(
      `SELECT c.*, l.title as list_title, b.title as board_title FROM cards c
       JOIN lists l ON c.list_id = l.id
       JOIN boards b ON l.board_id = b.id
       WHERE c.due_date IS NOT NULL 
         AND c.due_date < ?
         AND LOWER(l.title) != 'done'
       ORDER BY c.due_date ASC
       LIMIT 5`,
      [now]
    );

    return {
      totalBoards: boardsRes ? boardsRes.count : 0,
      totalCards: cardsRes ? cardsRes.count : 0,
      completedCards: completedRes ? completedRes.count : 0,
      overdueCards: overdueRes ? overdueRes.count : 0,
      upcomingCards,
      overdueCardsDetails
    };
  }
}

module.exports = new DashboardService();
