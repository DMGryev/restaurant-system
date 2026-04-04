import client from './client'

export const ordersAPI = {
  getOrders: (params = {}) =>
    client.get('/orders/', { params }),

  getActiveOrders: () =>
    client.get('/orders/active'),

  getOrder: (id) =>
    client.get(`/orders/${id}`),

  createOrder: (data) =>
    client.post('/orders/', data),

  updateOrder: (id, data) =>
    client.patch(`/orders/${id}`, data),

  updateItemStatus: (orderId, itemId, data) =>
    client.patch(`/orders/${orderId}/items/${itemId}`, data),
}