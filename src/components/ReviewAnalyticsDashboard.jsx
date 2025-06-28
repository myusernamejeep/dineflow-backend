import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../utils/api';

const ReviewAnalyticsDashboard = ({ restaurantId = null }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState({
    overall: null,
    trends: null,
    sentiment: null,
    moderation: null,
    topRestaurants: null,
    keywords: null
  });

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoints = restaurantId 
        ? [
            `/review-analytics/stats/${restaurantId}?timeRange=${timeRange}`,
            `/review-analytics/keywords?restaurantId=${restaurantId}&timeRange=${timeRange}`
          ]
        : [
            '/review-analytics/overall',
            '/review-analytics/trends',
            '/review-analytics/sentiment-trends',
            '/review-analytics/moderation',
            '/review-analytics/top-restaurants',
            '/review-analytics/keywords'
          ].map(endpoint => `${endpoint}?timeRange=${timeRange}`);

      const responses = await Promise.all(
        endpoints.map(endpoint => api.get(endpoint))
      );

      const newData = { ...data };
      
      if (restaurantId) {
        newData.restaurant = responses[0].data.data;
        newData.keywords = responses[1].data.data;
      } else {
        newData.overall = responses[0].data.data;
        newData.trends = responses[1].data.data;
        newData.sentiment = responses[2].data.data;
        newData.moderation = responses[3].data.data;
        newData.topRestaurants = responses[4].data.data;
        newData.keywords = responses[5].data.data;
      }

      setData(newData);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRange, restaurantId]);

  const MetricCard = ({ title, value, subtitle, trend = null, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className={`text-sm font-medium ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </div>
  );

  const RatingDistributionChart = ({ distribution }) => {
    if (!distribution) return null;

    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = distribution[rating] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center">
                <span className="w-8 text-sm text-gray-600">{rating}★</span>
                <div className="flex-1 mx-3 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-sm text-gray-600 text-right">
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SentimentChart = ({ sentimentData }) => {
    if (!sentimentData || !Array.isArray(sentimentData)) return null;

    const latestData = sentimentData[sentimentData.length - 1];
    if (!latestData) return null;

    const { positiveReviews, neutralReviews, negativeReviews, totalReviews } = latestData;
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Analysis</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{positiveReviews}</div>
            <div className="text-sm text-gray-600">Positive</div>
            <div className="text-xs text-gray-500">
              {totalReviews > 0 ? ((positiveReviews / totalReviews) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{neutralReviews}</div>
            <div className="text-sm text-gray-600">Neutral</div>
            <div className="text-xs text-gray-500">
              {totalReviews > 0 ? ((neutralReviews / totalReviews) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{negativeReviews}</div>
            <div className="text-sm text-gray-600">Negative</div>
            <div className="text-xs text-gray-500">
              {totalReviews > 0 ? ((negativeReviews / totalReviews) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TrendsChart = ({ trends }) => {
    if (!trends || !Array.isArray(trends)) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Trends</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {trends.slice(-14).map((trend, index) => {
            const maxCount = Math.max(...trends.slice(-14).map(t => t.count));
            const height = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t transition-all duration-300"
                  style={{ height: `${height}%` }}
                />
                <div className="text-xs text-gray-500 mt-2 text-center">
                  {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const TopRestaurantsTable = ({ restaurants }) => {
    if (!restaurants || !Array.isArray(restaurants)) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Restaurants</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviews
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Helpful
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {restaurants.map((restaurant, index) => (
                <tr key={restaurant.restaurantId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {restaurant.restaurantImage ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={restaurant.restaurantImage}
                            alt={restaurant.restaurantName}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {restaurant.restaurantName.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {index + 1}. {restaurant.restaurantName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 font-medium">
                        {restaurant.averageRating}
                      </span>
                      <div className="ml-2 flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span
                            key={star}
                            className={`text-xs ${
                              star <= restaurant.averageRating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {restaurant.totalReviews}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {restaurant.totalHelpful}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const KeywordsCloud = ({ keywords }) => {
    if (!keywords || !Array.isArray(keywords)) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Keywords</h3>
        <div className="flex flex-wrap gap-2">
          {keywords.slice(0, 20).map((keyword, index) => {
            const size = Math.max(12, 20 - index);
            const opacity = Math.max(0.3, 1 - (index * 0.05));
            
            return (
              <span
                key={keyword.word}
                className="px-2 py-1 rounded-full bg-blue-100 text-blue-800"
                style={{
                  fontSize: `${size}px`,
                  opacity: opacity
                }}
              >
                {keyword.word} ({keyword.count})
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const ModerationStats = ({ moderation }) => {
    if (!moderation) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Moderation Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {moderation.statusBreakdown?.approved || 0}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {moderation.statusBreakdown?.pending || 0}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {moderation.statusBreakdown?.rejected || 0}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {moderation.statusBreakdown?.flagged || 0}
            </div>
            <div className="text-sm text-gray-600">Flagged</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Review Analytics
              {restaurantId && <span className="text-gray-500 text-lg ml-2">(Restaurant)</span>}
            </h2>
            <p className="text-gray-600 mt-1">
              Comprehensive insights into review performance and trends
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {!restaurantId && data.overall && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Reviews"
            value={data.overall.overall.totalReviews}
            subtitle="All time"
          />
          <MetricCard
            title="Average Rating"
            value={data.overall.overall.averageRating.toFixed(1)}
            subtitle="Out of 5 stars"
          />
          <MetricCard
            title="Helpful Votes"
            value={data.overall.overall.totalHelpful}
            subtitle="Total helpful marks"
          />
          <MetricCard
            title="Pending Reviews"
            value={data.overall.overall.pendingReviews}
            subtitle="Awaiting moderation"
            color="yellow"
          />
        </div>
      )}

      {/* Restaurant-specific metrics */}
      {restaurantId && data.restaurant && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Reviews"
            value={data.restaurant.stats.totalReviews}
            subtitle="In selected period"
          />
          <MetricCard
            title="Average Rating"
            value={data.restaurant.stats.averageRating.toFixed(1)}
            subtitle="Out of 5 stars"
          />
          <MetricCard
            title="Helpful Votes"
            value={data.restaurant.stats.totalHelpful}
            subtitle="Total helpful marks"
          />
          <MetricCard
            title="Photos Shared"
            value={data.restaurant.stats.totalPhotos}
            subtitle="User photos"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        {!restaurantId && data.overall && (
          <RatingDistributionChart distribution={data.overall.ratingDistribution} />
        )}

        {/* Sentiment Analysis */}
        <SentimentChart sentimentData={data.sentiment} />

        {/* Trends Chart */}
        <TrendsChart trends={data.trends} />

        {/* Moderation Stats */}
        <ModerationStats moderation={data.moderation} />
      </div>

      {/* Top Restaurants */}
      {!restaurantId && data.topRestaurants && (
        <TopRestaurantsTable restaurants={data.topRestaurants} />
      )}

      {/* Keywords Cloud */}
      <KeywordsCloud keywords={data.keywords} />

      {/* Detailed Ratings (Restaurant-specific) */}
      {restaurantId && data.restaurant && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Ratings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.restaurant.stats.detailedRatings).map(([category, rating]) => (
              <div key={category} className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {rating.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {category}
                </div>
                <div className="flex justify-center mt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`text-sm ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewAnalyticsDashboard; 