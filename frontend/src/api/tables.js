import client from './client'

export const tablesAPI = {
  getTables: () =>
    client.get('/tables/'),

  createTable: (data) =>
    client.post('/tables/', data),

  updateTable: (id, data) =>
    client.patch(`/tables/${id}`, data),
}