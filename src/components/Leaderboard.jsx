import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../utils/api';

const Leaderboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [type, setType] = useState('points');
  const [timeRange, setTimeRange] = useState('all');
  const [userRank, setUserRank] = useState(null);

  const leaderboardTypes = [
    { value: 'points', label: 'Most Points', icon: '⭐' },
    { value: 'streaks', label: 'Longest Streaks', icon: '🔥' },
    { value: 'activity', label: 'Most Active', icon: '🏃' },
    { value: 'reviews', label: 'Top Reviewers', icon: '✍️' },
    { value: 'referrals', label: 'Top Referrers', icon: '👥' }
  ];

  const timeRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'month', label: 'This Month' },
    { value: 'week', label: 'This Week' },
    { value: 'today', label: 'Today' }
  ];

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/loyalty/leaderboard', {
        params: { type, timeRange }
      });
      
      setLeaderboard(response.data.data.leaderboard);
      
      // Find user's rank
      const currentUser = response.data.data.leaderboard.find(
        entry => entry.userId._id === response.data.data.currentUserId
      );
      setUserRank(currentUser ? response.data.data.leaderboard.indexOf(currentUser) + 1 : null);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [type, timeRange]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2: return 'bg-gray-100 text-gray-800 border-gray-200';
      case 3: return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-white text-gray-600 border-gray-200';
    }
  };

  const getValueDisplay = (entry) => {
    switch (type) {
      case 'points':
        return `${entry.points?.current || 0} points`;
      case 'streaks':
        return `${entry.streaks?.bookingStreak?.current || 0} days`;
      case 'activity':
        return `${entry.activity?.totalBookings || 0} bookings`;
      case 'reviews':
        return `${entry.activity?.totalReviews || 0} reviews`;
      case 'referrals':
        return `${entry.activity?.totalReferrals || 0} referrals`;
      default:
        return entry.points?.current || 0;
    }
  };

  const getValueLabel = () => {
    switch (type) {
      case 'points': return 'Points';
      case 'streaks': return 'Streak';
      case 'activity': return 'Bookings';
      case 'reviews': return 'Reviews';
      case 'referrals': return 'Referrals';
      default: return 'Value';
    }
  };

  const LeaderboardEntry = ({ entry, rank }) => {
    const isCurrentUser = entry.userId._id === userRank?.userId?._id;
    
    return (
      <div className={`flex items-center p-4 border rounded-lg transition-colors ${
        isCurrentUser ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'
      }`}>
        {/* Rank */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
          getRankColor(rank)
        }`}>
          {getRankIcon(rank)}
        </div>

        {/* User Info */}
        <div className="flex-1 ml-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
              {entry.userId.avatar ? (
                <img
                  src={entry.userId.avatar}
                  alt={entry.userId.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-medium">
                  {entry.userId.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {entry.userId.name}
                {isCurrentUser && (
                  <span className="ml-2 text-blue-600 text-sm">(You)</span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {entry.tier?.current || 'Bronze'} • Member since {new Date(entry.membership?.joinDate).getFullYear()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">
            {getValueDisplay(entry)}
          </div>
          <div className="text-sm text-gray-500">
            {getValueLabel()}
          </div>
        </div>

        {/* Additional Stats */}
        {type === 'points' && (
          <div className="ml-4 text-right">
            <div className="text-sm text-gray-600">
              {entry.activity?.totalBookings || 0} bookings
            </div>
            <div className="text-sm text-gray-600">
              {entry.activity?.totalReviews || 0} reviews
            </div>
          </div>
        )}

        {type === 'streaks' && (
          <div className="ml-4 text-right">
            <div className="text-sm text-gray-600">
              {entry.streaks?.reviewStreak?.current || 0} review streak
            </div>
            <div className="text-sm text-gray-600">
              {entry.streaks?.bookingStreak?.longest || 0} longest
            </div>
          </div>
        )}

        {type === 'activity' && (
          <div className="ml-4 text-right">
            <div className="text-sm text-gray-600">
              {entry.activity?.totalReviews || 0} reviews
            </div>
            <div className="text-sm text-gray-600">
              {entry.activity?.totalCheckins || 0} check-ins
            </div>
          </div>
        )}
      </div>
    );
  };

  const UserRankCard = () => {
    if (!userRank) return null;

    const currentUser = leaderboard.find(entry => entry.userId._id === userRank.userId?._id);
    if (!currentUser) return null;

    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Ranking</h2>
            <p className="text-blue-100">Keep up the great work!</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold mb-1">
              {getRankIcon(userRank)}
            </div>
            <div className="text-blue-100">Rank #{userRank}</div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{currentUser.points?.current || 0}</div>
            <div className="text-sm text-blue-100">Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{currentUser.activity?.totalBookings || 0}</div>
            <div className="text-sm text-blue-100">Bookings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{currentUser.streaks?.bookingStreak?.current || 0}</div>
            <div className="text-sm text-blue-100">Day Streak</div>
          </div>
        </div>
      </div>
    );
  };

  const FilterBar = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Leaderboard Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leaderboard Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {leaderboardTypes.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeRanges.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Total Participants */}
        <div className="text-sm text-gray-600">
          {leaderboard.length} participants
        </div>
      </div>
    </div>
  );

  const TopThree = () => {
    const topThree = leaderboard.slice(0, 3);
    if (topThree.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {topThree.map((entry, index) => (
          <div key={entry.userId._id} className={`text-center p-6 rounded-lg ${
            index === 0 ? 'bg-yellow-50 border-2 border-yellow-200' :
            index === 1 ? 'bg-gray-50 border-2 border-gray-200' :
            'bg-orange-50 border-2 border-orange-200'
          }`}>
            <div className="text-4xl mb-2">
              {getRankIcon(index + 1)}
            </div>
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-3">
              {entry.userId.avatar ? (
                <img
                  src={entry.userId.avatar}
                  alt={entry.userId.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-medium text-xl">
                  {entry.userId.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{entry.userId.name}</h3>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {getValueDisplay(entry)}
            </div>
            <div className="text-sm text-gray-500">
              {entry.tier?.current || 'Bronze'} Member
            </div>
          </div>
        ))}
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
          onClick={loadLeaderboard}
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
        <p className="text-gray-600">
          Compete with other members and climb the rankings
        </p>
      </div>

      {/* User Rank Card */}
      <UserRankCard />

      {/* Filters */}
      <FilterBar />

      {/* Top 3 Podium */}
      <TopThree />

      {/* Full Leaderboard */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Full Rankings</h2>
        
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">No data available for this leaderboard</div>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <LeaderboardEntry 
                key={entry.userId._id} 
                entry={entry} 
                rank={index + 1} 
              />
            ))}
          </div>
        )}
      </div>

      {/* How to Climb */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Climb the Rankings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🍽️</div>
            <div className="font-medium text-gray-900">Book Tables</div>
            <div className="text-sm text-gray-600">Earn points for every booking</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">⭐</div>
            <div className="font-medium text-gray-900">Write Reviews</div>
            <div className="text-sm text-gray-600">Get bonus points for reviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📍</div>
            <div className="font-medium text-gray-900">Check In Daily</div>
            <div className="text-sm text-gray-600">Build streaks for extra points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">👥</div>
            <div className="font-medium text-gray-900">Refer Friends</div>
            <div className="text-sm text-gray-600">Earn referral bonuses</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard; 