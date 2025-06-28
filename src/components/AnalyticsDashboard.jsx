import { h, Component } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { LineChart, BarChart, PieChart, AreaChart } from './charts';
import { DateRangePicker, MetricCard, FilterPanel } from './ui';
import { api } from '../utils/api';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState({
    revenue: null,
    bookings: null,
    restaurants: null,
    users: null,
    peakHours: null,
    seasonal: null,
    predictive: null
  });
  const [filters, setFilters] = useState({
    restaurantId: null,
    status: null,
    category: null
  });

  // Load analytics data
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        revenueData,
        bookingData,
        restaurantData,
        userData,
        peakHoursData,
        seasonalData,
        predictiveData
      ] = await Promise.all([
        api.get(`/analytics/revenue?timeRange=${timeRange}`),
        api.get(`/analytics/bookings?timeRange=${timeRange}`),
        api.get(`/analytics/restaurants?timeRange=${timeRange}`),
        api.get(`/analytics/users?timeRange=${timeRange}`),
        api.get(`/analytics/peak-hours?timeRange=${timeRange}`),
        api.get(`/analytics/seasonal-trends?timeRange=${timeRange}`),
        api.get('/analytics/predictive')
      ]);

      setData({
        revenue: revenueData.data,
        bookings: bookingData.data,
        restaurants: restaurantData.data,
        users: userData.data,
        peakHours: peakHoursData.data,
        seasonal: seasonalData.data,
        predictive: predictiveData.data
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and time range change
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  // Refresh data
  const handleRefresh = () => {
    loadAnalyticsData();
  };

  // Export data
  const handleExport = async (type) => {
    try {
      const response = await api.get(`/analytics/export?type=${type}&timeRange=${timeRange}&format=csv`);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Generate insights
  const generateInsights = () => {
    const insights = [];

    if (data.revenue?.trends?.trend === 'increasing') {
      insights.push({
        type: 'positive',
        title: 'Revenue Growth',
        description: `Revenue is growing by ${data.revenue.trends.percentage}%`,
        icon: '📈'
      });
    }

    if (data.bookings?.summary?.conversionRate < 70) {
      insights.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        description: `Booking conversion rate is ${data.bookings.summary.conversionRate.toFixed(1)}%`,
        icon: '⚠️'
      });
    }

    if (data.peakHours?.peakHours?.length > 0) {
      const peakHour = data.peakHours.peakHours[0];
      insights.push({
        type: 'info',
        title: 'Peak Hours',
        description: `Peak booking hour is ${peakHour.hour}:00`,
        icon: '🕐'
      });
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button
              onClick={handleRefresh}
              className="mt-3 text-sm font-medium text-red-800 hover:text-red-600"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your restaurant booking system</p>
        </div>
        <div className="flex space-x-3">
          <DateRangePicker
            value={timeRange}
            onChange={setTimeRange}
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: '1y', label: 'Last year' }
            ]}
          />
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        options={{
          restaurants: data.restaurants?.restaurantPerformance?.map(r => ({
            value: r.restaurantId,
            label: r.restaurantName
          })) || [],
          status: [
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'checked_in', label: 'Checked In' }
          ],
          category: [
            { value: 'italian', label: 'Italian' },
            { value: 'chinese', label: 'Chinese' },
            { value: 'japanese', label: 'Japanese' },
            { value: 'american', label: 'American' }
          ]
        }}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${data.revenue?.summary?.totalRevenue?.toLocaleString() || 0}`}
          change={data.revenue?.trends?.percentage || 0}
          trend={data.revenue?.trends?.trend || 'stable'}
          icon="💰"
        />
        <MetricCard
          title="Total Bookings"
          value={data.bookings?.summary?.totalBookings?.toLocaleString() || 0}
          change={data.bookings?.trends?.percentage || 0}
          trend={data.bookings?.trends?.trend || 'stable'}
          icon="📅"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${data.bookings?.summary?.conversionRate?.toFixed(1) || 0}%`}
          change={0}
          trend="stable"
          icon="📊"
        />
        <MetricCard
          title="New Users"
          value={data.users?.newUsers?.toLocaleString() || 0}
          change={0}
          trend="stable"
          icon="👥"
        />
      </div>

      {/* Insights */}
      {generateInsights().length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generateInsights().map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  insight.type === 'positive' ? 'border-green-200 bg-green-50' :
                  insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{insight.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{insight.title}</h3>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
            <button
              onClick={() => handleExport('revenue')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Export
            </button>
          </div>
          {data.revenue?.dailyRevenue && (
            <LineChart
              data={data.revenue.dailyRevenue}
              xKey="_id"
              yKey="totalRevenue"
              height={300}
              color="#3B82F6"
            />
          )}
        </div>

        {/* Booking Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Booking Trend</h2>
            <button
              onClick={() => handleExport('bookings')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Export
            </button>
          </div>
          {data.bookings?.dailyBookings && (
            <AreaChart
              data={data.bookings.dailyBookings}
              xKey="_id"
              yKey="totalBookings"
              height={300}
              color="#10B981"
            />
          )}
        </div>

        {/* Restaurant Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Restaurants</h2>
            <button
              onClick={() => handleExport('restaurants')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Export
            </button>
          </div>
          {data.restaurants?.topPerformers?.byRevenue && (
            <BarChart
              data={data.restaurants.topPerformers.byRevenue.slice(0, 10)}
              xKey="restaurantName"
              yKey="totalRevenue"
              height={300}
              color="#F59E0B"
            />
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Peak Hours</h2>
            <button
              onClick={() => handleExport('peak-hours')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Export
            </button>
          </div>
          {data.peakHours?.hourlyData && (
            <BarChart
              data={data.peakHours.hourlyData}
              xKey="_id"
              yKey="totalBookings"
              height={300}
              color="#8B5CF6"
            />
          )}
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Analytics</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">New Users</span>
              <span className="font-medium">{data.users?.newUsers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Bookings/User</span>
              <span className="font-medium">{data.users?.userStats?.avgBookingsPerUser?.toFixed(1) || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Retention Rate</span>
              <span className="font-medium">{data.users?.retention?.retentionRate * 100 || 0}%</span>
            </div>
          </div>
        </div>

        {/* Seasonal Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Trends</h2>
          {data.seasonal?.seasonalPatterns && (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Peak Months:</span>
                <div className="text-sm font-medium">
                  {data.seasonal.seasonalPatterns.peakMonths.join(', ') || 'None detected'}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Low Months:</span>
                <div className="text-sm font-medium">
                  {data.seasonal.seasonalPatterns.lowMonths.join(', ') || 'None detected'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Predictive Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Predictions</h2>
          {data.predictive?.revenuePrediction && (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Next Week Revenue:</span>
                <div className="text-sm font-medium">
                  ${data.predictive.revenuePrediction.nextWeek?.toFixed(0) || 0}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Next Month Revenue:</span>
                <div className="text-sm font-medium">
                  ${data.predictive.revenuePrediction.nextMonth?.toFixed(0) || 0}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Confidence:</span>
                <div className="text-sm font-medium">
                  {data.predictive.confidence?.revenue * 100 || 0}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export All Data */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleExport('revenue')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Export Revenue
          </button>
          <button
            onClick={() => handleExport('bookings')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export Bookings
          </button>
          <button
            onClick={() => handleExport('restaurants')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Export Restaurants
          </button>
          <button
            onClick={() => handleExport('users')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Export Users
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
