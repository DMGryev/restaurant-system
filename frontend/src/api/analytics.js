import client from './client'

export const analyticsAPI = {
  getSalesSummary: (startDate, endDate) =>
    client.get('/analytics/sales-summary', {
      params: { start_date: startDate, end_date: endDate },
    }),

  getTopItems: (limit = 10) =>
    client.get('/analytics/top-items', { params: { limit } }),

  getWaiterPerformance: (days = 7) =>
    client.get('/analytics/waiter-performance', { params: { days } }),

  getHourlySales: (date = null) =>
    client.get('/analytics/hourly-sales', { params: { target_date: date } }),
}