import client from './client'

export const crmAPI = {
  getCustomers: (params = {}) =>
    client.get('/crm/customers', { params }),

  getCustomer: (id) =>
    client.get(`/crm/customers/${id}`),

  createCustomer: (data) =>
    client.post('/crm/customers', data),

  updateCustomer: (id, data) =>
    client.patch(`/crm/customers/${id}`, data),

  getVisits: (customerId) =>
    client.get(`/crm/customers/${customerId}/visits`),

  addVisit: (customerId, amount) =>
    client.post(`/crm/customers/${customerId}/visits?amount=${amount}`),
}