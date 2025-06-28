const fs = require('fs').promises;
const path = require('path');
const { analyticsService } = require('./analytics');
const { sendEmail } = require('./notify');
const Booking = require('../models/Booking');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

class ReportingService {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../reports');
    this.templatesDir = path.join(__dirname, '../../templates');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      await fs.mkdir(this.templatesDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  // Generate Daily Report
  async generateDailyReport(date = new Date()) {
    const reportDate = new Date(date);
    const startDate = new Date(reportDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reportDate);
    endDate.setHours(23, 59, 59, 999);

    try {
      // Get daily metrics
      const dailyMetrics = await this.getDailyMetrics(startDate, endDate);
      
      // Generate report content
      const report = {
        type: 'daily',
        date: reportDate.toISOString().split('T')[0],
        generatedAt: new Date().toISOString(),
        metrics: dailyMetrics,
        summary: this.generateDailySummary(dailyMetrics),
        insights: this.generateDailyInsights(dailyMetrics)
      };

      // Save report
      const filename = `daily-report-${reportDate.toISOString().split('T')[0]}.json`;
      await this.saveReport(filename, report);

      return report;
    } catch (error) {
      console.error('Error generating daily report:', error);
      throw error;
    }
  }

  // Generate Weekly Report
  async generateWeeklyReport(startDate = new Date()) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    try {
      // Get weekly analytics
      const weeklyAnalytics = await analyticsService.getRevenueAnalytics('7d');
      const bookingAnalytics = await analyticsService.getBookingAnalytics('7d');
      const restaurantAnalytics = await analyticsService.getRestaurantAnalytics('7d');
      const userAnalytics = await analyticsService.getUserAnalytics('7d');

      // Generate report content
      const report = {
        type: 'weekly',
        period: {
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0]
        },
        generatedAt: new Date().toISOString(),
        analytics: {
          revenue: weeklyAnalytics,
          bookings: bookingAnalytics,
          restaurants: restaurantAnalytics,
          users: userAnalytics
        },
        summary: this.generateWeeklySummary(weeklyAnalytics, bookingAnalytics),
        insights: this.generateWeeklyInsights(weeklyAnalytics, bookingAnalytics, restaurantAnalytics),
        recommendations: this.generateWeeklyRecommendations(weeklyAnalytics, bookingAnalytics, restaurantAnalytics)
      };

      // Save report
      const filename = `weekly-report-${weekStart.toISOString().split('T')[0]}.json`;
      await this.saveReport(filename, report);

      return report;
    } catch (error) {
      console.error('Error generating weekly report:', error);
      throw error;
    }
  }

  // Generate Monthly Report
  async generateMonthlyReport(year, month) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    try {
      // Get monthly analytics
      const monthlyAnalytics = await analyticsService.getRevenueAnalytics('30d');
      const bookingAnalytics = await analyticsService.getBookingAnalytics('30d');
      const restaurantAnalytics = await analyticsService.getRestaurantAnalytics('30d');
      const userAnalytics = await analyticsService.getUserAnalytics('30d');
      const seasonalTrends = await analyticsService.getSeasonalTrends('1y');
      const predictiveAnalytics = await analyticsService.getPredictiveAnalytics();

      // Generate comprehensive report
      const report = {
        type: 'monthly',
        period: {
          year,
          month,
          start: monthStart.toISOString().split('T')[0],
          end: monthEnd.toISOString().split('T')[0]
        },
        generatedAt: new Date().toISOString(),
        analytics: {
          revenue: monthlyAnalytics,
          bookings: bookingAnalytics,
          restaurants: restaurantAnalytics,
          users: userAnalytics,
          seasonal: seasonalTrends,
          predictive: predictiveAnalytics
        },
        summary: this.generateMonthlySummary(monthlyAnalytics, bookingAnalytics, restaurantAnalytics),
        insights: this.generateMonthlyInsights(monthlyAnalytics, bookingAnalytics, restaurantAnalytics, seasonalTrends),
        recommendations: this.generateMonthlyRecommendations(monthlyAnalytics, bookingAnalytics, restaurantAnalytics, predictiveAnalytics),
        forecasts: this.generateForecasts(predictiveAnalytics)
      };

      // Save report
      const filename = `monthly-report-${year}-${month.toString().padStart(2, '0')}.json`;
      await this.saveReport(filename, report);

      return report;
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  }

  // Generate Custom Report
  async generateCustomReport(options) {
    const {
      type = 'custom',
      startDate,
      endDate,
      metrics = ['revenue', 'bookings', 'restaurants', 'users'],
      format = 'json',
      includeInsights = true,
      includeRecommendations = true
    } = options;

    try {
      const reportData = {};

      // Collect requested metrics
      if (metrics.includes('revenue')) {
        reportData.revenue = await analyticsService.getRevenueAnalytics('custom');
      }
      if (metrics.includes('bookings')) {
        reportData.bookings = await analyticsService.getBookingAnalytics('custom');
      }
      if (metrics.includes('restaurants')) {
        reportData.restaurants = await analyticsService.getRestaurantAnalytics('custom');
      }
      if (metrics.includes('users')) {
        reportData.users = await analyticsService.getUserAnalytics('custom');
      }

      // Generate report
      const report = {
        type,
        period: {
          start: startDate,
          end: endDate
        },
        generatedAt: new Date().toISOString(),
        data: reportData,
        summary: this.generateCustomSummary(reportData),
        insights: includeInsights ? this.generateCustomInsights(reportData) : null,
        recommendations: includeRecommendations ? this.generateCustomRecommendations(reportData) : null
      };

      // Save report
      const filename = `custom-report-${new Date().toISOString().split('T')[0]}.json`;
      await this.saveReport(filename, report);

      return report;
    } catch (error) {
      console.error('Error generating custom report:', error);
      throw error;
    }
  }

  // Get Daily Metrics
  async getDailyMetrics(startDate, endDate) {
    const [
      bookings,
      revenue,
      newUsers,
      restaurantStats
    ] = await Promise.all([
      Booking.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['confirmed', 'checked_in'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        }
      ]),
      User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$restaurantId',
            bookings: { $sum: 1 },
            revenue: {
              $sum: { $cond: [{ $in: ['$status', ['confirmed', 'checked_in']] }, '$totalAmount', 0] }
            }
          }
        },
        {
          $group: {
            _id: null,
            activeRestaurants: { $sum: 1 },
            avgBookingsPerRestaurant: { $avg: '$bookings' },
            avgRevenuePerRestaurant: { $avg: '$revenue' }
          }
        }
      ])
    ]);

    return {
      bookings: {
        total: bookings,
        confirmed: revenue[0]?.count || 0,
        cancelled: bookings - (revenue[0]?.count || 0)
      },
      revenue: {
        total: revenue[0]?.total || 0,
        avgPerBooking: bookings > 0 ? (revenue[0]?.total || 0) / bookings : 0
      },
      users: {
        new: newUsers
      },
      restaurants: restaurantStats[0] || {
        activeRestaurants: 0,
        avgBookingsPerRestaurant: 0,
        avgRevenuePerRestaurant: 0
      }
    };
  }

  // Generate Daily Summary
  generateDailySummary(metrics) {
    return {
      totalBookings: metrics.bookings.total,
      totalRevenue: metrics.revenue.total,
      newUsers: metrics.users.new,
      activeRestaurants: metrics.restaurants.activeRestaurants,
      conversionRate: metrics.bookings.total > 0 ? 
        (metrics.bookings.confirmed / metrics.bookings.total) * 100 : 0,
      avgRevenuePerBooking: metrics.revenue.avgPerBooking
    };
  }

  // Generate Daily Insights
  generateDailyInsights(metrics) {
    const insights = [];

    if (metrics.bookings.total === 0) {
      insights.push({
        type: 'warning',
        title: 'No Bookings Today',
        description: 'No bookings were made today',
        impact: 'high'
      });
    }

    if (metrics.revenue.total > 0 && metrics.revenue.avgPerBooking > 100) {
      insights.push({
        type: 'positive',
        title: 'High Average Booking Value',
        description: `Average booking value is $${metrics.revenue.avgPerBooking.toFixed(2)}`,
        impact: 'medium'
      });
    }

    if (metrics.users.new > 10) {
      insights.push({
        type: 'positive',
        title: 'Strong User Growth',
        description: `${metrics.users.new} new users registered today`,
        impact: 'medium'
      });
    }

    return insights;
  }

  // Generate Weekly Summary
  generateWeeklySummary(revenueData, bookingData) {
    return {
      totalRevenue: revenueData.summary.totalRevenue,
      totalBookings: bookingData.summary.totalBookings,
      conversionRate: bookingData.summary.conversionRate,
      avgDailyRevenue: revenueData.summary.avgDailyRevenue,
      growthRate: revenueData.trends.percentage,
      newUsers: bookingData.summary.totalBookings * 0.1 // Estimate
    };
  }

  // Generate Weekly Insights
  generateWeeklyInsights(revenueData, bookingData, restaurantData) {
    const insights = [];

    if (revenueData.trends.trend === 'increasing') {
      insights.push({
        type: 'positive',
        title: 'Revenue Growth',
        description: `Revenue grew by ${revenueData.trends.percentage}% this week`,
        impact: 'high'
      });
    }

    if (bookingData.summary.conversionRate < 70) {
      insights.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        description: `Conversion rate is ${bookingData.summary.conversionRate.toFixed(1)}%`,
        impact: 'medium'
      });
    }

    return insights;
  }

  // Generate Weekly Recommendations
  generateWeeklyRecommendations(revenueData, bookingData, restaurantData) {
    const recommendations = [];

    if (bookingData.summary.conversionRate < 70) {
      recommendations.push({
        priority: 'high',
        title: 'Improve Booking Conversion',
        description: 'Review and optimize the booking flow',
        actions: [
          'Analyze booking abandonment points',
          'Simplify the booking process',
          'Add booking incentives'
        ]
      });
    }

    if (revenueData.trends.trend === 'decreasing') {
      recommendations.push({
        priority: 'medium',
        title: 'Revenue Decline',
        description: 'Investigate causes of revenue decline',
        actions: [
          'Review pricing strategy',
          'Analyze customer feedback',
          'Check competitor pricing'
        ]
      });
    }

    return recommendations;
  }

  // Generate Monthly Summary
  generateMonthlySummary(revenueData, bookingData, restaurantData) {
    return {
      totalRevenue: revenueData.summary.totalRevenue,
      totalBookings: bookingData.summary.totalBookings,
      conversionRate: bookingData.summary.conversionRate,
      avgRevenuePerRestaurant: restaurantData.summary.avgRevenuePerRestaurant,
      growthRate: revenueData.trends.percentage,
      topRestaurant: restaurantData.topPerformers.byRevenue[0]?.restaurantName || 'N/A'
    };
  }

  // Generate Monthly Insights
  generateMonthlyInsights(revenueData, bookingData, restaurantData, seasonalData) {
    const insights = [];

    // Revenue insights
    if (revenueData.trends.trend === 'increasing') {
      insights.push({
        type: 'positive',
        title: 'Strong Revenue Growth',
        description: `Monthly revenue grew by ${revenueData.trends.percentage}%`,
        impact: 'high'
      });
    }

    // Seasonal insights
    if (seasonalData.seasonalPatterns.peakMonths.length > 0) {
      insights.push({
        type: 'info',
        title: 'Seasonal Patterns Detected',
        description: `Peak months: ${seasonalData.seasonalPatterns.peakMonths.join(', ')}`,
        impact: 'medium'
      });
    }

    return insights;
  }

  // Generate Monthly Recommendations
  generateMonthlyRecommendations(revenueData, bookingData, restaurantData, predictiveData) {
    const recommendations = [];

    // Based on predictive analytics
    if (predictiveData.revenuePrediction.nextMonth > revenueData.summary.totalRevenue * 1.1) {
      recommendations.push({
        priority: 'high',
        title: 'Prepare for Growth',
        description: 'Revenue is predicted to increase next month',
        actions: [
          'Increase staffing levels',
          'Stock up on inventory',
          'Prepare marketing campaigns'
        ]
      });
    }

    return recommendations;
  }

  // Generate Forecasts
  generateForecasts(predictiveData) {
    return {
      revenue: {
        nextWeek: predictiveData.revenuePrediction.nextWeek,
        nextMonth: predictiveData.revenuePrediction.nextMonth,
        confidence: predictiveData.confidence.revenue
      },
      bookings: {
        nextWeek: predictiveData.bookingPrediction.nextWeek,
        nextMonth: predictiveData.bookingPrediction.nextMonth,
        confidence: predictiveData.confidence.bookings
      }
    };
  }

  // Generate Custom Summary
  generateCustomSummary(data) {
    const summary = {};

    if (data.revenue) {
      summary.totalRevenue = data.revenue.summary.totalRevenue;
      summary.avgDailyRevenue = data.revenue.summary.avgDailyRevenue;
    }

    if (data.bookings) {
      summary.totalBookings = data.bookings.summary.totalBookings;
      summary.conversionRate = data.bookings.summary.conversionRate;
    }

    return summary;
  }

  // Generate Custom Insights
  generateCustomInsights(data) {
    const insights = [];

    if (data.revenue && data.revenue.trends.trend === 'increasing') {
      insights.push({
        type: 'positive',
        title: 'Revenue Growth',
        description: `Revenue is growing by ${data.revenue.trends.percentage}%`,
        impact: 'medium'
      });
    }

    return insights;
  }

  // Generate Custom Recommendations
  generateCustomRecommendations(data) {
    const recommendations = [];

    if (data.bookings && data.bookings.summary.conversionRate < 70) {
      recommendations.push({
        priority: 'medium',
        title: 'Improve Conversion Rate',
        description: 'Focus on improving booking conversion',
        actions: ['Review booking flow', 'Add incentives']
      });
    }

    return recommendations;
  }

  // Save Report
  async saveReport(filename, report) {
    try {
      const filepath = path.join(this.reportsDir, filename);
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      console.log(`Report saved: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  }

  // Send Report via Email
  async sendReportEmail(report, recipients, subject) {
    try {
      const emailContent = this.generateEmailContent(report);
      
      await sendEmail({
        to: recipients,
        subject: subject || `${report.type} Report - ${new Date().toLocaleDateString()}`,
        html: emailContent
      });

      console.log(`Report email sent to: ${recipients.join(', ')}`);
    } catch (error) {
      console.error('Error sending report email:', error);
      throw error;
    }
  }

  // Generate Email Content
  generateEmailContent(report) {
    const summary = report.summary || {};
    
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { background-color: #f8f9fa; padding: 20px; }
            .summary { margin: 20px 0; }
            .metric { display: inline-block; margin: 10px; padding: 10px; background-color: #e9ecef; border-radius: 5px; }
            .insights { margin: 20px 0; }
            .insight { margin: 10px 0; padding: 10px; border-left: 4px solid #007bff; }
            .recommendations { margin: 20px 0; }
            .recommendation { margin: 10px 0; padding: 10px; background-color: #fff3cd; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report</h1>
            <p>Generated on: ${new Date(report.generatedAt).toLocaleString()}</p>
          </div>
          
          <div class="summary">
            <h2>Summary</h2>
            ${Object.entries(summary).map(([key, value]) => 
              `<div class="metric"><strong>${key}:</strong> ${typeof value === 'number' ? value.toLocaleString() : value}</div>`
            ).join('')}
          </div>
          
          ${report.insights ? `
            <div class="insights">
              <h2>Insights</h2>
              ${report.insights.map(insight => 
                `<div class="insight">
                  <strong>${insight.title}:</strong> ${insight.description}
                </div>`
              ).join('')}
            </div>
          ` : ''}
          
          ${report.recommendations ? `
            <div class="recommendations">
              <h2>Recommendations</h2>
              ${report.recommendations.map(rec => 
                `<div class="recommendation">
                  <strong>${rec.title}:</strong> ${rec.description}
                  ${rec.actions ? `<ul>${rec.actions.map(action => `<li>${action}</li>`).join('')}</ul>` : ''}
                </div>`
              ).join('')}
            </div>
          ` : ''}
        </body>
      </html>
    `;
  }

  // Get Report History
  async getReportHistory(limit = 10) {
    try {
      const files = await fs.readdir(this.reportsDir);
      const reports = [];

      for (const file of files.slice(-limit)) {
        if (file.endsWith('.json')) {
          const filepath = path.join(this.reportsDir, file);
          const content = await fs.readFile(filepath, 'utf8');
          const report = JSON.parse(content);
          reports.push({
            filename: file,
            type: report.type,
            generatedAt: report.generatedAt,
            period: report.period
          });
        }
      }

      return reports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    } catch (error) {
      console.error('Error getting report history:', error);
      return [];
    }
  }

  // Delete Old Reports
  async cleanupOldReports(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const files = await fs.readdir(this.reportsDir);
      let deletedCount = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filepath = path.join(this.reportsDir, file);
          const stats = await fs.stat(filepath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filepath);
            deletedCount++;
          }
        }
      }

      console.log(`Cleaned up ${deletedCount} old reports`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old reports:', error);
      throw error;
    }
  }
}

// Create singleton instance
const reportingService = new ReportingService();

module.exports = {
  reportingService,
  ReportingService
}; 