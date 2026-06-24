const API_URL = '/api';

import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const boardAPI = {
  getAll: () => api.get('/boards').then(res => res.data),
  getById: (id) => api.get(`/boards/${id}`).then(res => res.data),
  create: (title, description) => api.post('/boards', { title, description }).then(res => res.data),
  update: (id, title, description) => api.put(`/boards/${id}`, { title, description }).then(res => res.data),
  delete: (id) => api.delete(`/boards/${id}`).then(res => res.data),
};

export const listAPI = {
  create: (boardId, title) => api.post('/lists', { boardId, title }).then(res => res.data),
  update: (id, title) => api.put(`/lists/${id}`, { title }).then(res => res.data),
  reorder: (boardId, listOrder) => api.put('/lists/positions/reorder', { boardId, listOrder }).then(res => res.data),
  delete: (id) => api.delete(`/lists/${id}`).then(res => res.data),
};

export const cardAPI = {
  getById: (id) => api.get(`/cards/${id}`).then(res => res.data),
  create: (listId, title, description, dueDate) => 
    api.post('/cards', { listId, title, description, dueDate }).then(res => res.data),
  update: (id, title, description, dueDate) => 
    api.put(`/cards/${id}`, { title, description, dueDate }).then(res => res.data),
  move: (id, targetListId, targetPosition) => 
    api.put(`/cards/${id}/move`, { targetListId, targetPosition }).then(res => res.data),
  delete: (id) => api.delete(`/cards/${id}`).then(res => res.data),
  
  // Tags mapping
  addTag: (cardId, tagId) => api.post(`/cards/${cardId}/tags`, { tagId }).then(res => res.data),
  removeTag: (cardId, tagId) => api.delete(`/cards/${cardId}/tags/${tagId}`).then(res => res.data),
  
  // Members mapping
  addMember: (cardId, memberId) => api.post(`/cards/${cardId}/members`, { memberId }).then(res => res.data),
  removeMember: (cardId, memberId) => api.delete(`/cards/${cardId}/members/${memberId}`).then(res => res.data),

  // Board tags direct CRUD
  createTag: (boardId, name, color) => api.post('/cards/tags/manage', { boardId, name, color }).then(res => res.data),
  deleteTag: (tagId) => api.delete(`/cards/tags/manage/${tagId}`).then(res => res.data),
};

export const memberAPI = {
  getAll: () => api.get('/members').then(res => res.data),
  create: (name, email, avatarUrl) => api.post('/members', { name, email, avatarUrl }).then(res => res.data),
  delete: (id) => api.delete(`/members/${id}`).then(res => res.data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard').then(res => res.data),
};

export default api;
