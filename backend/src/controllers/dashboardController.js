const dashboardService = require('../services/dashboardService');

class DashboardController {
  async getStats(req, res, next) {
    try {
      const metrics = await dashboardService.getMetrics();
      res.json(metrics);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
