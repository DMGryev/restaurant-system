import client from './client'

export const authAPI = {
  login: (username, password) =>
    client.post('/auth/login', { username, password }),

  loginByCard: (card_id) =>
    client.post('/auth/login/card', { card_id }),

  getMe: () =>
    client.get('/auth/me'),

  registerUser: (data) =>
    client.post('/auth/register', data),
}