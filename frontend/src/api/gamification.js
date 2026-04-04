import client from './client'

export const gamificationAPI = {
  getMyScores: (limit = 50) =>
    client.get('/gamification/my-scores', { params: { limit } }),

  getMyStats: () =>
    client.get('/gamification/my-stats'),

  getUserScores: (userId, limit = 50) =>
    client.get(`/gamification/scores/${userId}`, { params: { limit } }),

  getLeaderboard: (date = null) =>
    client.get('/gamification/leaderboard', { params: { target_date: date } }),

  getAchievements: () =>
    client.get('/gamification/achievements'),

  createAchievement: (data) =>
    client.post('/gamification/achievements', data),

  getSpeedBonuses: () =>
    client.get('/gamification/speed-bonuses'),

  createSpeedBonus: (data) =>
    client.post('/gamification/speed-bonuses', data),

  awardPoints: (userId, points, bonusType, description) =>
    client.post('/gamification/award-points', null, {
      params: { user_id: userId, points, bonus_type: bonusType, description },
    }),
}