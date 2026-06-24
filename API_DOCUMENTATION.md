# API Documentation - KanbanFlow REST API

This document describes the REST API endpoints provided by the backend Express server. All request bodies must be JSON and all responses are returned as JSON.

---

## 🚦 Server Base URL
* Dev Endpoint: `http://localhost:5000/api`

---

## 📋 Table of Contents
1. [Boards API](#1-boards-api)
2. [Lists API](#2-lists-api)
3. [Cards API](#3-cards-api)
4. [Members API](#4-members-api)
5. [Dashboard API](#5-dashboard-api)

---

## 1. Boards API

### GET /boards
Returns all boards in the workspace.
* **Response Status**: `200 OK`
* **Response Example**:
  ```json
  [
    {
      "id": 1,
      "title": "Project Alpha Kanban",
      "description": "Primary workspace",
      "created_at": "2026-06-24T12:00:00.000Z",
      "updated_at": "2026-06-24T12:00:00.000Z"
    }
  ]
  ```

### GET /boards/:id
Returns a deep nested board object including its lists, lists containing cards, card tags, card members, and board tag definitions.
* **Response Status**: `200 OK` (or `404 Not Found` if board does not exist)
* **Response Example**:
  ```json
  {
    "id": 1,
    "title": "Project Alpha Kanban",
    "description": "Primary workspace",
    "created_at": "2026-06-24T12:00:00.000Z",
    "updated_at": "2026-06-24T12:00:00.000Z",
    "lists": [
      {
        "id": 1,
        "board_id": 1,
        "title": "To Do",
        "position": 0,
        "cards": [
          {
            "id": 1,
            "list_id": 1,
            "title": "Setup Express REST API",
            "description": "Create structures",
            "position": 0,
            "due_date": "2026-06-26T12:00:00.000Z",
            "tags": [{ "id": 1, "name": "High Priority", "color": "#EF4444" }],
            "members": [{ "id": 1, "name": "Alex River", "email": "alex@company.com", "avatar_url": "..." }]
          }
        ]
      }
    ],
    "tags": [
      { "id": 1, "board_id": 1, "name": "High Priority", "color": "#EF4444" }
    ]
  }
  ```

### POST /boards
Creates a new board. Automatically initializes default lists: "To Do", "Doing", "Done", and default colored tags.
* **Request Body**:
  ```json
  {
    "title": "Marketing Launch",
    "description": "Board for marketing activities"
  }
  ```
* **Response Status**: `201 Created`

### PUT /boards/:id
Updates a board's basic details.
* **Request Body**:
  ```json
  {
    "title": "Updated Title",
    "description": "New description"
  }
  ```

### DELETE /boards/:id
Deletes a board and all nested components (cascade delete).
* **Response Status**: `200 OK`

---

## 2. Lists API

### POST /lists
Creates a new list inside a board at the last position index.
* **Request Body**:
  ```json
  {
    "boardId": 1,
    "title": "Backlog"
  }
  ```
* **Response Status**: `201 Created`

### PUT /lists/:id
Updates a list's title.
* **Request Body**:
  ```json
  {
    "title": "Needs Review"
  }
  ```

### PUT /lists/positions/reorder
Bulk updates list positions inside a board.
* **Request Body**:
  ```json
  {
    "boardId": 1,
    "listOrder": [2, 1, 3] // Array of list IDs in the desired order
  }
  ```

### DELETE /lists/:id
Deletes a list and all cards inside it.
* **Response Status**: `200 OK`

---

## 3. Cards API

### POST /cards
Creates a new card inside a list at the last position.
* **Request Body**:
  ```json
  {
    "listId": 1,
    "title": "Write Unit Tests",
    "description": "Optional desc",
    "dueDate": "2026-06-28T18:00:00.000Z" // Optional
  }
  ```
* **Response Status**: `201 Created`

### PUT /cards/:id
Updates a card's title, description, and due date.
* **Request Body**:
  ```json
  {
    "title": "Write Complete Suite of Unit Tests",
    "description": "Updated description text",
    "dueDate": "2026-06-30T12:00:00.000Z"
  }
  ```

### PUT /cards/:id/move
Moves a card within the same list or to a different list, updating positions of subsequent items.
* **Request Body**:
  ```json
  {
    "targetListId": 2,
    "targetPosition": 1 // 0-based target index
  }
  ```

### DELETE /cards/:id
Deletes a card.
* **Response Status**: `200 OK`

### POST /cards/:id/tags
Assigns an existing board tag to the card.
* **Request Body**:
  ```json
  {
    "tagId": 1
  }
  ```

### DELETE /cards/:id/tags/:tagId
Unassigns a tag from the card.
* **Response Status**: `200 OK`

### POST /cards/:id/members
Assigns a team member to the card.
* **Request Body**:
  ```json
  {
    "memberId": 2
  }
  ```

### DELETE /cards/:id/members/:memberId
Unassigns a member from the card.

### POST /cards/tags/manage
Creates a new tag definition for a board.
* **Request Body**:
  ```json
  {
    "boardId": 1,
    "name": "Urgent",
    "color": "#EF4444"
  }
  ```

---

## 4. Members API

### GET /members
Returns all team members in the directory.
* **Response Status**: `200 OK`

### POST /members
Registers a new team member.
* **Request Body**:
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@company.com",
    "avatarUrl": "https://api.dicebear.com/7.x/adventurer/svg?seed=Jane" // Optional
  }
  ```

### DELETE /members/:id
Deletes a member from the directory.

---

## 5. Dashboard API

### GET /dashboard
Returns workspace KPIs and upcoming/overdue card queues.
* **Response Status**: `200 OK`
* **Response Example**:
  ```json
  {
    "totalBoards": 1,
    "totalCards": 3,
    "completedCards": 1,
    "overdueCards": 0,
    "upcomingCards": [
      {
        "id": 1,
        "list_id": 1,
        "title": "Setup Express REST API",
        "due_date": "2026-06-26T12:00:00.000Z",
        "list_title": "To Do",
        "board_title": "Project Alpha Kanban"
      }
    ],
    "overdueCardsDetails": []
  }
  ```
