import client from './client'

export const menuAPI = {
  getCategories: () =>
    client.get('/menu/categories'),

  getCategoryWithItems: (id) =>
    client.get(`/menu/categories/${id}`),

  createCategory: (data) =>
    client.post('/menu/categories', data),

  updateCategory: (id, data) =>
    client.patch(`/menu/categories/${id}`, data),

  getItems: (params = {}) =>
    client.get('/menu/items', { params }),

  createItem: (data) =>
    client.post('/menu/items', data),

  updateItem: (id, data) =>
    client.patch(`/menu/items/${id}`, data),

  deleteItem: (id) =>
    client.delete(`/menu/items/${id}`),
}