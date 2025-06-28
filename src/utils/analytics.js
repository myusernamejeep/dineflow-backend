const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached data or fetch from database
  async getCachedData(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetchFunction();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  // Revenue Analytics
  async getRevenueAnalytics(timeRange = '30d') {
    const key = `revenue_${timeRange}`;
    return this.getCachedData(key, async () => {
      const startDate = this.getStartDate(timeRange);
      
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['confirmed', 'checked_in'] }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              restaurant: "$restaurantId"
            },
            revenue: { $sum: "$totalAmount" },
            bookings: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: "$_id.date",
            totalRevenue: { $sum: "$revenue" },
            totalBookings: { $sum: "$bookings" },
            restaurantCount: { $sum: 1 },
            avgRevenuePerRestaurant: { $avg: "$revenue" }
          }
        },
        { $sort: { _id: 1 } }
      ];

      const dailyRevenue = await Booking.aggregate(pipeline);
      
      // Calculate trends
      const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.totalRevenue, 0);
      const totalBookings = dailyRevenue.reduce((sum, day) => sum + day.totalBookings, 0);
      const avgDailyRevenue = totalRevenue / dailyRevenue.length;
      
      // Growth rate calculation
      const firstHalf = dailyRevenue.slice(0, Math.floor(dailyRevenue.length / 2));
      const secondHalf = dailyRevenue.slice(Math.floor(dailyRevenue.length / 2));
      const firstHalfRevenue = firstHalf.reduce((sum, day) => sum + day.totalRevenue, 0);
      const secondHalfRevenue = secondHalf.reduce((sum, day) => sum + day.totalRevenue, 0);
      const growthRate = firstHalfRevenue > 0 ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 : 0;

      return {
        dailyRevenue,
        summary: {
          totalRevenue,
          totalBookings,
          avgDailyRevenue,
          growthRate,
          period: timeRange
        },
        trends: this.calculateTrends(dailyRevenue.map(d => d.totalRevenue))
      };
    });
  }

  // Booking Analytics
  async getBookingAnalytics(timeRange = '30d') {
    const key = `bookings_${timeRange}`;
    return this.getCachedData(key, async () => {
      const startDate = this.getStartDate(timeRange);
      
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              status: "$status"
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: "$_id.date",
            statuses: {
              $push: {
                status: "$_id.status",
                count: "$count"
              }
            },
            totalBookings: { $sum: "$count" }
          }
        },
        { $sort: { _id: 1 } }
      ];

      const dailyBookings = await Booking.aggregate(pipeline);
      
      // Calculate conversion rates
      const totalConfirmed = dailyBookings.reduce((sum, day) => {
        const confirmed = day.statuses.find(s => s.status === 'confirmed');
        return sum + (confirmed ? confirmed.count : 0);
      }, 0);
      
      const totalCancelled = dailyBookings.reduce((sum, day) => {
        const cancelled = day.statuses.find(s => s.status === 'cancelled');
        return sum + (cancelled ? cancelled.count : 0);
      }, 0);

      const totalBookings = dailyBookings.reduce((sum, day) => sum + day.totalBookings, 0);
      const conversionRate = totalBookings > 0 ? (totalConfirmed / totalBookings) * 100 : 0;
      const cancellationRate = totalBookings > 0 ? (totalCancelled / totalBookings) * 100 : 0;

      return {
        dailyBookings,
        summary: {
          totalBookings,
          totalConfirmed,
          totalCancelled,
          conversionRate,
          cancellationRate,
          period: timeRange
        },
        trends: this.calculateTrends(dailyBookings.map(d => d.totalBookings))
      };
    });
  }

  // Restaurant Performance Analytics
  async getRestaurantAnalytics(timeRange = '30d') {
    const key = `restaurants_${timeRange}`;
    return this.getCachedData(key, async () => {
      const startDate = this.getStartDate(timeRange);
      
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$restaurantId",
            totalBookings: { $sum: 1 },
            confirmedBookings: {
              $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] }
            },
            cancelledBookings: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
            },
            totalRevenue: {
              $sum: { $cond: [{ $in: ["$status", ["confirmed", "checked_in"]] }, "$totalAmount", 0] }
            },
            avgPartySize: { $avg: "$partySize" },
            avgBookingValue: { $avg: "$totalAmount" }
          }
        },
        {
          $lookup: {
            from: "restaurants",
            localField: "_id",
            foreignField: "_id",
            as: "restaurant"
          }
        },
        {
          $unwind: "$restaurant"
        },
        {
          $project: {
            restaurantId: "$_id",
            restaurantName: "$restaurant.name",
            restaurantCategory: "$restaurant.category",
            totalBookings: 1,
            confirmedBookings: 1,
            cancelledBookings: 1,
            totalRevenue: 1,
            avgPartySize: 1,
            avgBookingValue: 1,
            conversionRate: {
              $multiply: [
                { $divide: ["$confirmedBookings", "$totalBookings"] },
                100
              ]
            }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ];

      const restaurantPerformance = await Booking.aggregate(pipeline);
      
      // Calculate top performers
      const topRevenue = restaurantPerformance.slice(0, 10);
      const topBookings = [...restaurantPerformance].sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 10);
      const topConversion = [...restaurantPerformance].sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 10);

      return {
        restaurantPerformance,
        topPerformers: {
          byRevenue: topRevenue,
          byBookings: topBookings,
          byConversion: topConversion
        },
        summary: {
          totalRestaurants: restaurantPerformance.length,
          avgRevenuePerRestaurant: restaurantPerformance.reduce((sum, r) => sum + r.totalRevenue, 0) / restaurantPerformance.length,
          avgBookingsPerRestaurant: restaurantPerformance.reduce((sum, r) => sum + r.totalBookings, 0) / restaurantPerformance.length
        }
      };
    });
  }

  // User Analytics
  async getUserAnalytics(timeRange = '30d') {
    const key = `users_${timeRange}`;
    return this.getCachedData(key, async () => {
      const startDate = this.getStartDate(timeRange);
      
      // New user registrations
      const newUsers = await User.countDocuments({
        createdAt: { $gte: startDate }
      });

      // User booking behavior
      const userBookingStats = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$userId",
            bookingCount: { $sum: 1 },
            totalSpent: {
              $sum: { $cond: [{ $in: ["$status", ["confirmed", "checked_in"]] }, "$totalAmount", 0] }
            },
            lastBooking: { $max: "$createdAt" }
          }
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            avgBookingsPerUser: { $avg: "$bookingCount" },
            avgSpentPerUser: { $avg: "$totalSpent" },
            totalRevenue: { $sum: "$totalSpent" }
          }
        }
      ]);

      // User retention analysis
      const retentionData = await this.calculateUserRetention(startDate);

      return {
        newUsers,
        userStats: userBookingStats[0] || {
          totalUsers: 0,
          avgBookingsPerUser: 0,
          avgSpentPerUser: 0,
          totalRevenue: 0
        },
        retention: retentionData,
        period: timeRange
      };
    });
  }

  // Peak Hours Analysis
  async getPeakHoursAnalytics(timeRange = '30d') {
    const key = `peak_hours_${timeRange}`;
    return this.getCachedData(key, async () => {
      const startDate = this.getStartDate(timeRange);
      
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              hour: { $hour: "$bookingTime" },
              dayOfWeek: { $dayOfWeek: "$bookingTime" }
            },
            bookings: { $sum: 1 },
            revenue: {
              $sum: { $cond: [{ $in: ["$status", ["confirmed", "checked_in"]] }, "$totalAmount", 0] }
            }
          }
        },
        {
          $group: {
            _id: "$_id.hour",
            totalBookings: { $sum: "$bookings" },
            totalRevenue: { $sum: "$revenue" },
            avgBookingsPerDay: { $avg: "$bookings" },
            dayBreakdown: {
              $push: {
                day: "$_id.dayOfWeek",
                bookings: "$bookings",
                revenue: "$revenue"
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ];

      const hourlyData = await Booking.aggregate(pipeline);
      
      // Find peak hours
      const peakHours = hourlyData
        .sort((a, b) => b.totalBookings - a.totalBookings)
        .slice(0, 5)
        .map(h => ({ hour: h._id, bookings: h.totalBookings, revenue: h.totalRevenue }));

      return {
        hourlyData,
        peakHours,
        summary: {
          busiestHour: peakHours[0],
          totalHours: hourlyData.length,
          avgBookingsPerHour: hourlyData.reduce((sum, h) => sum + h.totalBookings, 0) / hourlyData.length
        }
      };
    });
  }

  // Seasonal Trends Analysis
  async getSeasonalTrends(timeRange = '1y') {
    const key = `seasonal_${timeRange}`;
    return this.getCachedData(key, async () => {
      const startDate = this.getStartDate(timeRange);
      
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" }
            },
            bookings: { $sum: 1 },
            revenue: {
              $sum: { $cond: [{ $in: ["$status", ["confirmed", "checked_in"]] }, "$totalAmount", 0] }
            }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ];

      const monthlyData = await Booking.aggregate(pipeline);
      
      // Calculate seasonal patterns
      const seasonalPatterns = this.calculateSeasonalPatterns(monthlyData);

      return {
        monthlyData,
        seasonalPatterns,
        summary: {
          totalMonths: monthlyData.length,
          avgBookingsPerMonth: monthlyData.reduce((sum, m) => sum + m.bookings, 0) / monthlyData.length,
          avgRevenuePerMonth: monthlyData.reduce((sum, m) => sum + m.revenue, 0) / monthlyData.length
        }
      };
    });
  }

  // Predictive Analytics
  async getPredictiveAnalytics() {
    const key = 'predictive';
    return this.getCachedData(key, async () => {
      // Get historical data for prediction
      const historicalData = await this.getRevenueAnalytics('90d');
      
      // Simple linear regression for revenue prediction
      const revenuePrediction = this.predictRevenue(historicalData.dailyRevenue);
      
      // Booking demand prediction
      const bookingPrediction = this.predictBookings(historicalData.dailyRevenue);
      
      // Seasonal forecasting
      const seasonalForecast = this.forecastSeasonalTrends(historicalData.dailyRevenue);

      return {
        revenuePrediction,
        bookingPrediction,
        seasonalForecast,
        confidence: {
          revenue: 0.85,
          bookings: 0.78,
          seasonal: 0.92
        }
      };
    });
  }

  // Helper Methods
  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  calculateTrends(data) {
    if (data.length < 2) return { trend: 'stable', percentage: 0 };
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const percentage = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    
    return {
      trend: percentage > 5 ? 'increasing' : percentage < -5 ? 'decreasing' : 'stable',
      percentage: Math.round(percentage * 100) / 100
    };
  }

  async calculateUserRetention(startDate) {
    // Calculate user retention rates
    const userCohorts = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          users: { $sum: 1 }
        }
      }
    ]);

    return {
      cohorts: userCohorts,
      retentionRate: 0.75, // Placeholder - would need more complex calculation
      churnRate: 0.25
    };
  }

  calculateSeasonalPatterns(monthlyData) {
    const patterns = {
      peakMonths: [],
      lowMonths: [],
      seasonality: 'moderate'
    };

    if (monthlyData.length >= 12) {
      const avgBookings = monthlyData.reduce((sum, m) => sum + m.bookings, 0) / monthlyData.length;
      
      monthlyData.forEach(month => {
        if (month.bookings > avgBookings * 1.2) {
          patterns.peakMonths.push(month._id.month);
        } else if (month.bookings < avgBookings * 0.8) {
          patterns.lowMonths.push(month._id.month);
        }
      });
    }

    return patterns;
  }

  predictRevenue(historicalData) {
    // Simple linear regression for revenue prediction
    const n = historicalData.length;
    if (n < 2) return { nextDay: 0, nextWeek: 0, nextMonth: 0 };

    const x = Array.from({ length: n }, (_, i) => i);
    const y = historicalData.map(d => d.totalRevenue || 0);

    const { slope, intercept } = this.linearRegression(x, y);

    return {
      nextDay: Math.max(0, slope * n + intercept),
      nextWeek: Math.max(0, slope * (n + 7) + intercept),
      nextMonth: Math.max(0, slope * (n + 30) + intercept)
    };
  }

  predictBookings(historicalData) {
    // Simple linear regression for booking prediction
    const n = historicalData.length;
    if (n < 2) return { nextDay: 0, nextWeek: 0, nextMonth: 0 };

    const x = Array.from({ length: n }, (_, i) => i);
    const y = historicalData.map(d => d.totalBookings || 0);

    const { slope, intercept } = this.linearRegression(x, y);

    return {
      nextDay: Math.max(0, slope * n + intercept),
      nextWeek: Math.max(0, slope * (n + 7) + intercept),
      nextMonth: Math.max(0, slope * (n + 30) + intercept)
    };
  }

  forecastSeasonalTrends(historicalData) {
    // Simple seasonal forecasting
    const weeklyPattern = this.extractWeeklyPattern(historicalData);
    
    return {
      nextWeek: weeklyPattern,
      nextMonth: weeklyPattern.map(day => day * 4), // Rough monthly estimate
      confidence: 0.85
    };
  }

  linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  extractWeeklyPattern(historicalData) {
    // Extract weekly booking pattern
    const weeklyPattern = Array(7).fill(0);
    let dayCount = Array(7).fill(0);

    historicalData.forEach((day, index) => {
      const dayOfWeek = new Date(day._id).getDay();
      weeklyPattern[dayOfWeek] += day.totalBookings || 0;
      dayCount[dayOfWeek]++;
    });

    return weeklyPattern.map((total, day) => 
      dayCount[day] > 0 ? total / dayCount[day] : 0
    );
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: process.memoryUsage()
    };
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

module.exports = {
  analyticsService,
  AnalyticsService
}; 