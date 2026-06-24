# Architecture Documentation - KanbanFlow

This document details the system architecture, component design, database design, and key interaction flows for the KanbanFlow platform.

---

## 🏗️ Architectural Overview

KanbanFlow follows a decoupled client-server architecture:

```
┌────────────────────────────────┐       HTTP / JSON       ┌────────────────────────────────┐
│      React 19 Frontend         │ <─────────────────────> │      Express.js Backend        │
│    Vite 8 / Tailwind CSS v4    │  (Proxy via localhost)  │      SQLite Database Layer     │
└────────────────────────────────┘                         └────────────────────────────────┘
```

1. **Client (Frontend)**: Single Page Application (SPA) built with React 19, routed using React Router, and styled with Tailwind CSS v4. Data retrieval is done via Axios. It implements a local state management approach utilizing React hooks and synchronizes state optimistically during interactions like dragging cards.
2. **Server (Backend)**: Stateless REST API using Express.js. It features a modular, layered structure (Routing -> Controller -> Service -> Database) enforcing separation of concerns.
3. **Database Layer**: A normalized SQLite schema stored in a local file (`backend/database.sqlite`). Connections use asynchronous wrappers, enabling safe promise-based query resolution in Node.js.

---

## 🗄️ Database Schema Design

The SQLite database is fully normalized. The relationships are depicted below:

```
  ┌──────────────┐
  │    boards    │◄─────────────────┐
  └──────────────┘                  │
          ▲                         │
          │ (1 to Many)             │ (1 to Many)
  ┌───────┴──────┐                  │
  │    lists     │                  │
  └──────────────┘                  │
          ▲                         │
          │ (1 to Many)             │
  ┌───────┴──────┐           ┌──────┴──────┐
  │    cards     │           │    tags     │
  └──────────────┘           └─────────────┘
     ▲        ▲                 ▲
     │        └──────┐          │
     │ (Many to Many)│          │ (Many to Many)
     ▼               ▼          ▼
┌──────────┐   ┌───────────┐ ┌───────────┐
│ card_    │   │ members   │ │ card_tags │
│ members  │   └───────────┘ └───────────┘
└──────────┘
```

### Table Details

1. **boards**: Holds board name, description, and audit logs.
   * `id` (INTEGER, Primary Key, Auto-increment)
   * `title` (TEXT, Not Null)
   * `description` (TEXT, Nullable)
   * `created_at` (DATETIME, default CURRENT_TIMESTAMP)
   * `updated_at` (DATETIME, default CURRENT_TIMESTAMP)

2. **lists**: Holds vertical lane groupings inside boards. Linked with a cascade delete to the board.
   * `id` (INTEGER, Primary Key)
   * `board_id` (INTEGER, Foreign Key referencing boards, ON DELETE CASCADE)
   * `title` (TEXT, Not Null)
   * `position` (INTEGER, Not Null - maintains vertical list order)
   * `created_at`/`updated_at` (DATETIME)

3. **cards**: Holds tasks. Linked with a cascade delete to the list.
   * `id` (INTEGER, Primary Key)
   * `list_id` (INTEGER, Foreign Key referencing lists, ON DELETE CASCADE)
   * `title` (TEXT, Not Null)
   * `description` (TEXT, Nullable)
   * `position` (INTEGER, Not Null - maintains sorting order inside list)
   * `due_date` (DATETIME, Nullable)
   * `created_at`/`updated_at` (DATETIME)

4. **members**: Directory of team members.
   * `id` (INTEGER, Primary Key)
   * `name` (TEXT, Not Null)
   * `email` (TEXT, Unique, Not Null)
   * `avatar_url` (TEXT, Nullable)
   * `created_at` (DATETIME)

5. **card_members**: Junction table linking card assignments.
   * `card_id` (INTEGER, Foreign Key referencing cards, ON DELETE CASCADE)
   * `member_id` (INTEGER, Foreign Key referencing members, ON DELETE CASCADE)
   * Primary Key: `(card_id, member_id)`

6. **tags**: Color definitions for label categorization.
   * `id` (INTEGER, Primary Key)
   * `board_id` (INTEGER, Foreign Key referencing boards, ON DELETE CASCADE)
   * `name` (TEXT, Not Null)
   * `color` (TEXT, Not Null)

7. **card_tags**: Junction table associating tags to cards.
   * `card_id` (INTEGER, Foreign Key referencing cards, ON DELETE CASCADE)
   * `tag_id` (INTEGER, Foreign Key referencing tags, ON DELETE CASCADE)
   * Primary Key: `(card_id, tag_id)`

---

## 🔗 Key Interaction Workflows

### Drag-and-Drop Card Reordering

The platform implements an efficient reindexing method to ensure database positions are kept tidy:

1. **Native HTML5 Drag**: User picks up a card. The client stores the card's ID, source list ID, and source index.
2. **Hovering**: Hovering over cards inside lists records the hover index.
3. **Drop**: User drops the card.
4. **State Update (Optimistic)**:
   * If moved in the **same list**: The client shifts elements in between the old index and new index, re-assigning sequential `position` attributes starting from `0`.
   * If moved to a **different list**: The client removes the card from the source array (decrementing indices for subsequent cards) and inserts it into the target array at the target index (incrementing indices for subsequent cards).
5. **API Sync**: Client makes a PUT request to `/api/cards/:id/move` passing `{ targetListId, targetPosition }`.
6. **Database Shift Execution**:
   * The backend runs transaction queries to shift positions of subsequent records in the SQLite database to accommodate the drop, keeping the positions perfectly indexed.

### Manual Dark Mode Toggling

1. Theme state (boolean) resides in `App.jsx`, checking `localStorage` on init.
2. When the toggle is clicked, the state toggles and adds/removes the `.dark` class to `document.body`.
3. In CSS, we define `@custom-variant dark (&:where(.dark, .dark *));`. This tells Tailwind v4 that whenever the `.dark` class is set on an ancestor container, the `dark:` utility styles apply.
