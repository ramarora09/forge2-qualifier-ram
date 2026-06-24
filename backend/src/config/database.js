const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../database.sqlite');

// Ensure db directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database at:', dbPath);
    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) console.error('Failed to enable foreign keys:', err.message);
    });
  }
});

// Async wrappers
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('SQL Run Error:', sql, params, err);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('SQL Get Error:', sql, params, err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('SQL All Error:', sql, params, err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Transaction wrapper (basic helper)
const exec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Migration / Schema Setup
const initializeDatabase = async () => {
  try {
    // 1. Boards
    await run(`
      CREATE TABLE IF NOT EXISTS boards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Lists
    await run(`
      CREATE TABLE IF NOT EXISTS lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        board_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        position INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      )
    `);

    // 3. Cards
    await run(`
      CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        position INTEGER NOT NULL,
        due_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
      )
    `);

    // 4. Members
    await run(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Card Members (Junction Table)
    await run(`
      CREATE TABLE IF NOT EXISTS card_members (
        card_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        PRIMARY KEY (card_id, member_id),
        FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `);

    // 6. Tags
    await run(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        board_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      )
    `);

    // 7. Card Tags (Junction Table)
    await run(`
      CREATE TABLE IF NOT EXISTS card_tags (
        card_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (card_id, tag_id),
        FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);

    // Seed default data if empty
    const boardsCount = await get('SELECT COUNT(*) as count FROM boards');
    if (boardsCount.count === 0) {
      console.log('Seeding initial data...');
      
      // Default board
      const { id: boardId } = await run(
        'INSERT INTO boards (title, description) VALUES (?, ?)',
        ['Project Alpha Kanban', 'Primary workspace for development activities']
      );

      // Default lists
      const { id: listTodoId } = await run(
        'INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)',
        [boardId, 'To Do', 0]
      );
      const { id: listDoingId } = await run(
        'INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)',
        [boardId, 'Doing', 1]
      );
      const { id: listDoneId } = await run(
        'INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)',
        [boardId, 'Done', 2]
      );

      // Default members
      const { id: m1 } = await run(
        'INSERT INTO members (name, email, avatar_url) VALUES (?, ?, ?)',
        ['Alex River', 'alex@company.com', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex']
      );
      const { id: m2 } = await run(
        'INSERT INTO members (name, email, avatar_url) VALUES (?, ?, ?)',
        ['Jordan Croft', 'jordan@company.com', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan']
      );
      const { id: m3 } = await run(
        'INSERT INTO members (name, email, avatar_url) VALUES (?, ?, ?)',
        ['Taylor Vance', 'taylor@company.com', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Taylor']
      );

      // Default board tags
      const { id: tagHigh } = await run(
        'INSERT INTO tags (board_id, name, color) VALUES (?, ?, ?)',
        [boardId, 'High Priority', '#EF4444'] // Red
      );
      const { id: tagFeature } = await run(
        'INSERT INTO tags (board_id, name, color) VALUES (?, ?, ?)',
        [boardId, 'Feature', '#3B82F6'] // Blue
      );
      const { id: tagBug } = await run(
        'INSERT INTO tags (board_id, name, color) VALUES (?, ?, ?)',
        [boardId, 'Bug', '#F97316'] // Orange
      );
      const { id: tagDesign } = await run(
        'INSERT INTO tags (board_id, name, color) VALUES (?, ?, ?)',
        [boardId, 'Design', '#8B5CF6'] // Purple
      );

      // Default cards
      const { id: card1 } = await run(
        'INSERT INTO cards (list_id, title, description, position, due_date) VALUES (?, ?, ?, ?, ?)',
        [
          listTodoId,
          'Setup Express REST API',
          'Create folder structures, controllers, services, database tables, and verify the backend routers run properly.',
          0,
          new Date(Date.now() + 86400000 * 2).toISOString() // 2 days from now
        ]
      );
      // Link card1 to tags & members
      await run('INSERT INTO card_tags (card_id, tag_id) VALUES (?, ?)', [card1, tagHigh]);
      await run('INSERT INTO card_tags (card_id, tag_id) VALUES (?, ?)', [card1, tagFeature]);
      await run('INSERT INTO card_members (card_id, member_id) VALUES (?, ?)', [card1, m1]);

      const { id: card2 } = await run(
        'INSERT INTO cards (list_id, title, description, position, due_date) VALUES (?, ?, ?, ?, ?)',
        [
          listDoingId,
          'Design Kanban Board Frontend',
          'Create responsive Tailwind CSS layouts, grid lists, task cards, board selectors, and dashboard analytics summary view.',
          0,
          new Date(Date.now() + 86400000 * 5).toISOString() // 5 days from now
        ]
      );
      await run('INSERT INTO card_tags (card_id, tag_id) VALUES (?, ?)', [card2, tagDesign]);
      await run('INSERT INTO card_members (card_id, member_id) VALUES (?, ?)', [card2, m2]);

      const { id: card3 } = await run(
        'INSERT INTO cards (list_id, title, description, position, due_date) VALUES (?, ?, ?, ?, ?)',
        [
          listDoneId,
          'Gather SaaS Requirements',
          'Coordinate with stakeholders to document core functional metrics, board layouts, dashboard counters, and user journeys.',
          0,
          new Date(Date.now() - 86400000 * 1).toISOString() // 1 day ago (overdue, but in Done, so not counted as overdue in dashboard if we filter by non-completed)
        ]
      );
      await run('INSERT INTO card_tags (card_id, tag_id) VALUES (?, ?)', [card3, tagFeature]);
      await run('INSERT INTO card_members (card_id, member_id) VALUES (?, ?)', [card3, m3]);
      
      console.log('Seeding completed successfully!');
    }
  } catch (error) {
    console.error('Database migration/seeding failed:', error);
  }
};

module.exports = {
  run,
  get,
  all,
  db,
  initializeDatabase
};
