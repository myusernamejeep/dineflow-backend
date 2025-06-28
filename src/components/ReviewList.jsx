import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../utils/api';
import ReviewCard from './ReviewCard';

const ReviewList = ({ restaurantId, showFilters = true, limit = 10 }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    rating: '',
    sort: 'recent',
    page: 1
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    detailedRatings: { food: 0, service: 0, ambiance: 0, value: 0 }
  });

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'helpful', label: 'Most Helpful' },
    { value: 'rating', label: 'Highest Rated' }
  ];

  const ratingOptions = [
    { value: '', label: 'All Ratings' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4+ Stars' },
    { value: '3', label: '3+ Stars' },
    { value: '2', label: '2+ Stars' },
    { value: '1', label: '1+ Stars' }
  ];

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: filters.page,
        limit: pagination.limit,
        sort: filters.sort
      });

      if (filters.rating) {
        params.append('rating', filters.rating);
      }

      const response = await api.get(`/reviews/restaurant/${restaurantId}?${params}`);
      
      setReviews(response.data.data.reviews);
      setPagination(response.data.data.pagination);
      setStats(response.data.data.statistics);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/reviews/stats/${restaurantId}`);
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to load review stats:', err);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [restaurantId, filters]);

  useEffect(() => {
    loadStats();
  }, [restaurantId]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleReviewUpdate = (reviewId, updatedReview) => {
    setReviews(prev => 
      prev.map(review => 
        review._id === reviewId ? updatedReview : review
      )
    );
  };

  const handleReviewDelete = (reviewId) => {
    setReviews(prev => prev.filter(review => review._id !== reviewId));
    // Reload stats after deletion
    loadStats();
  };

  const RatingDistribution = () => (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(rating => {
          const count = stats.ratingDistribution[rating] || 0;
          const percentage = stats.totalReviews > 0 
            ? Math.round((count / stats.totalReviews) * 100) 
            : 0;
          
          return (
            <div key={rating} className="flex items-center">
              <span className="w-8 text-sm text-gray-600">{rating}★</span>
              <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-12 text-sm text-gray-600 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const DetailedRatings = () => (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Ratings</h3>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(stats.detailedRatings).map(([key, rating]) => (
          <div key={key} className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {rating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {key}
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
  );

  const FilterBar = () => (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ratingOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {reviews.length} of {pagination.total} reviews
        </div>
      </div>
    </div>
  );

  const Pagination = () => {
    if (pagination.pages <= 1) return null;

    const pages = [];
    const currentPage = pagination.page;
    const totalPages = pagination.pages;

    // Always show first page
    pages.push(1);

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return (
      <div className="flex justify-center mt-6">
        <nav className="flex items-center space-x-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {/* Page Numbers */}
          {pages.map((page, index) => {
            const isCurrent = page === currentPage;
            const showEllipsis = index > 0 && page - pages[index - 1] > 1;

            return (
              <div key={page} className="flex items-center">
                {showEllipsis && (
                  <span className="px-2 text-gray-500">...</span>
                )}
                <button
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              </div>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      </div>
    );
  };

  if (loading && reviews.length === 0) {
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
          onClick={loadReviews}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RatingDistribution />
        </div>
        <div>
          <DetailedRatings />
        </div>
      </div>

      {/* Overall Rating Summary */}
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {stats.averageRating.toFixed(1)}
        </div>
        <div className="flex justify-center mb-2">
          {[1, 2, 3, 4, 5].map(star => (
            <span
              key={star}
              className={`text-2xl ${
                star <= stats.averageRating ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              ★
            </span>
          ))}
        </div>
        <div className="text-gray-600">
          Based on {stats.totalReviews} reviews
        </div>
      </div>

      {/* Filters */}
      {showFilters && <FilterBar />}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No reviews found</div>
            {filters.rating && (
              <button
                onClick={() => handleFilterChange('rating', '')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          reviews.map(review => (
            <ReviewCard
              key={review._id}
              review={review}
              onUpdate={handleReviewUpdate}
              onDelete={handleReviewDelete}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination />
    </div>
  );
};

export default ReviewList; 