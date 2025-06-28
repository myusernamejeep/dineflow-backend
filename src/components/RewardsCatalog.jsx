import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../utils/api';

const RewardsCatalog = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [filters, setFilters] = useState({
    category: 'all',
    minPoints: 0,
    maxPoints: null,
    type: 'all'
  });
  const [sortBy, setSortBy] = useState('points');
  const [redeeming, setRedeeming] = useState(null);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'food', label: 'Food & Drinks' },
    { value: 'experiences', label: 'Experiences' },
    { value: 'merchandise', label: 'Merchandise' },
    { value: 'discounts', label: 'Discounts' }
  ];

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'discount', label: 'Discounts' },
    { value: 'free_item', label: 'Free Items' },
    { value: 'cashback', label: 'Cashback' },
    { value: 'gift_card', label: 'Gift Cards' },
    { value: 'experience', label: 'Experiences' },
    { value: 'merchandise', label: 'Merchandise' }
  ];

  const sortOptions = [
    { value: 'points', label: 'Points (Low to High)' },
    { value: 'points-desc', label: 'Points (High to Low)' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'popularity', label: 'Most Popular' }
  ];

  const loadRewards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/loyalty/rewards');
      setRewards(response.data.data.rewards);
      setUserPoints(response.data.data.userPoints);
    } catch (err) {
      console.error('Failed to load rewards:', err);
      setError('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  const handleRedeem = async (rewardId) => {
    try {
      setRedeeming(rewardId);
      const response = await api.post('/loyalty/rewards/redeem', { rewardId });
      
      // Show success modal
      showSuccessModal(response.data.data.reward);
      
      // Reload rewards
      loadRewards();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to redeem reward');
    } finally {
      setRedeeming(null);
    }
  };

  const showSuccessModal = (reward) => {
    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="text-center">
          <div class="text-6xl mb-4">🎉</div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Reward Redeemed!</h3>
          <p class="text-gray-600 mb-4">You successfully redeemed <strong>${reward.name}</strong></p>
          <div class="bg-gray-100 rounded-lg p-4 mb-4">
            <div class="text-sm text-gray-600 mb-1">Your reward code:</div>
            <div class="text-lg font-mono font-bold text-blue-600">${reward.code}</div>
          </div>
          <p class="text-sm text-gray-500 mb-4">Show this code at the restaurant to claim your reward!</p>
          <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Got it!
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  // Filter and sort rewards
  const filteredRewards = rewards
    .filter(reward => {
      if (filters.category !== 'all' && reward.category !== filters.category) return false;
      if (filters.type !== 'all' && reward.type !== filters.type) return false;
      if (filters.minPoints > 0 && reward.pointsCost < filters.minPoints) return false;
      if (filters.maxPoints && reward.pointsCost > filters.maxPoints) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return a.pointsCost - b.pointsCost;
        case 'points-desc':
          return b.pointsCost - a.pointsCost;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popularity':
          return (b.currentRedemptions || 0) - (a.currentRedemptions || 0);
        default:
          return 0;
      }
    });

  const RewardCard = ({ reward }) => {
    const canAfford = userPoints >= reward.pointsCost;
    const isExpiring = reward.validUntil && new Date(reward.validUntil) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {reward.image && (
          <div className="relative">
            <img
              src={reward.image}
              alt={reward.name}
              className="w-full h-48 object-cover"
            />
            {isExpiring && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                Expiring Soon
              </div>
            )}
            {reward.maxRedemptions > 0 && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                {reward.maxRedemptions - reward.currentRedemptions} left
              </div>
            )}
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-lg">{reward.name}</h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{reward.pointsCost}</div>
              <div className="text-xs text-gray-500">points</div>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
          
          <div className="flex items-center justify-between mb-3">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              reward.category === 'food' ? 'bg-green-100 text-green-800' :
              reward.category === 'experiences' ? 'bg-purple-100 text-purple-800' :
              reward.category === 'merchandise' ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {reward.category}
            </span>
            
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              reward.type === 'discount' ? 'bg-red-100 text-red-800' :
              reward.type === 'free_item' ? 'bg-green-100 text-green-800' :
              reward.type === 'cashback' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {reward.type.replace('_', ' ')}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {reward.validUntil && (
                <div>Valid until {new Date(reward.validUntil).toLocaleDateString()}</div>
              )}
            </div>
            
            <button
              onClick={() => handleRedeem(reward._id)}
              disabled={!canAfford || redeeming === reward._id}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                canAfford
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {redeeming === reward._id ? 'Redeeming...' : 'Redeem'}
            </button>
          </div>
          
          {!canAfford && (
            <div className="mt-2 text-sm text-red-600">
              Need {reward.pointsCost - userPoints} more points
            </div>
          )}
        </div>
      </div>
    );
  };

  const FilterBar = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {types.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Min Points Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Points
          </label>
          <input
            type="number"
            value={filters.minPoints}
            onChange={(e) => setFilters(prev => ({ ...prev, minPoints: parseInt(e.target.value) || 0 }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* Max Points Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Points
          </label>
          <input
            type="number"
            value={filters.maxPoints || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || null }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="No limit"
          />
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setFilters({ category: 'all', minPoints: 0, maxPoints: null, type: 'all' })}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Clear all filters
        </button>
        
        <div className="text-sm text-gray-600">
          {filteredRewards.length} of {rewards.length} rewards
        </div>
      </div>
    </div>
  );

  const PointsSummary = () => (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Your Points</h2>
          <p className="text-blue-100">Redeem rewards with your earned points</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold">{userPoints}</div>
          <div className="text-blue-100">Available Points</div>
        </div>
      </div>
    </div>
  );

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
          onClick={loadRewards}
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rewards Catalog</h1>
        <p className="text-gray-600">
          Browse and redeem exciting rewards with your loyalty points
        </p>
      </div>

      {/* Points Summary */}
      <PointsSummary />

      {/* Filters */}
      <FilterBar />

      {/* Rewards Grid */}
      {filteredRewards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No rewards match your filters</div>
          <button
            onClick={() => setFilters({ category: 'all', minPoints: 0, maxPoints: null, type: 'all' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRewards.map(reward => (
            <RewardCard key={reward._id} reward={reward} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RewardsCatalog; 