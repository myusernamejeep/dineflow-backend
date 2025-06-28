import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../utils/api';

const LoyaltyDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    account: null,
    program: null
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/loyalty/account');
      setData(response.data.data);
    } catch (err) {
      console.error('Failed to load loyalty data:', err);
      setError('Failed to load loyalty data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const PointsDisplay = ({ points, tier }) => (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Loyalty Points</h2>
        <div className="text-right">
          <div className="text-sm opacity-90">Current Tier</div>
          <div className="text-lg font-semibold">{tier?.current || 'Bronze'}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{points?.current || 0}</div>
          <div className="text-sm opacity-90">Current</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{points?.total || 0}</div>
          <div className="text-sm opacity-90">Total Earned</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{points?.expired || 0}</div>
          <div className="text-sm opacity-90">Expired</div>
        </div>
      </div>

      {tier?.nextTierProgress !== undefined && (
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress to next tier</span>
            <span>{tier.nextTierProgress}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${tier.nextTierProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const TierBenefits = ({ tier, program }) => {
    if (!program?.tiers) return null;

    const currentTier = program.tiers.find(t => t.name === tier?.current);
    const nextTier = program.tiers.find(t => t.level === (tier?.level || 0) + 1);

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tier Benefits</h3>
        
        {currentTier && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Current Tier: {currentTier.name}</h4>
            <div className="space-y-2">
              {currentTier.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  {benefit.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {nextTier && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Next Tier: {nextTier.name}</h4>
            <div className="space-y-2">
              {nextTier.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center text-sm text-gray-500">
                  <span className="text-gray-400 mr-2">○</span>
                  {benefit.description}
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              {nextTier.minPoints - (data.account?.points?.current || 0)} more points needed
            </div>
          </div>
        )}
      </div>
    );
  };

  const AvailableRewards = ({ rewards, userPoints }) => {
    const [redeeming, setRedeeming] = useState(null);

    const handleRedeem = async (rewardId) => {
      try {
        setRedeeming(rewardId);
        const response = await api.post('/loyalty/rewards/redeem', { rewardId });
        
        // Show success message
        alert(`Successfully redeemed ${response.data.data.reward.name}!`);
        
        // Reload data
        loadData();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to redeem reward');
      } finally {
        setRedeeming(null);
      }
    };

    if (!rewards || rewards.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Rewards</h3>
          <p className="text-gray-500">No rewards available at the moment.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Rewards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map(reward => (
            <div key={reward._id} className="border rounded-lg p-4">
              {reward.image && (
                <img
                  src={reward.image}
                  alt={reward.name}
                  className="w-full h-32 object-cover rounded mb-3"
                />
              )}
              <h4 className="font-medium text-gray-900 mb-1">{reward.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-600">
                  {reward.pointsCost} points
                </span>
                <button
                  onClick={() => handleRedeem(reward._id)}
                  disabled={userPoints < reward.pointsCost || redeeming === reward._id}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    userPoints >= reward.pointsCost
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {redeeming === reward._id ? 'Redeeming...' : 'Redeem'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Challenges = ({ challenges }) => {
    const [claiming, setClaiming] = useState(null);

    const handleClaim = async (challengeId, type) => {
      try {
        setClaiming(challengeId);
        const response = await api.post('/loyalty/challenges/claim', { challengeId, type });
        
        alert(`Challenge completed! Earned ${response.data.data.pointsAwarded} points.`);
        loadData();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to claim challenge');
      } finally {
        setClaiming(null);
      }
    };

    if (!challenges || (!challenges.daily?.length && !challenges.weekly?.length)) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Challenges</h3>
          <p className="text-gray-500">No active challenges at the moment.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Challenges</h3>
        
        {/* Daily Challenges */}
        {challenges.daily?.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Daily Challenges</h4>
            <div className="space-y-3">
              {challenges.daily.map(challenge => (
                <div key={challenge.challengeId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{challenge.name}</h5>
                    <span className="text-sm text-blue-600 font-medium">
                      {challenge.pointsReward} points
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{challenge.progress}/{challenge.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            challenge.completed ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%` }}
                        />
                      </div>
                    </div>
                    {challenge.completed && !challenge.claimed && (
                      <button
                        onClick={() => handleClaim(challenge.challengeId, 'daily')}
                        disabled={claiming === challenge.challengeId}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                      >
                        {claiming === challenge.challengeId ? 'Claiming...' : 'Claim'}
                      </button>
                    )}
                    {challenge.claimed && (
                      <span className="text-sm text-green-600 font-medium">Claimed ✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Challenges */}
        {challenges.weekly?.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Weekly Challenges</h4>
            <div className="space-y-3">
              {challenges.weekly.map(challenge => (
                <div key={challenge.challengeId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{challenge.name}</h5>
                    <span className="text-sm text-blue-600 font-medium">
                      {challenge.pointsReward} points
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{challenge.progress}/{challenge.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            challenge.completed ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%` }}
                        />
                      </div>
                    </div>
                    {challenge.completed && !challenge.claimed && (
                      <button
                        onClick={() => handleClaim(challenge.challengeId, 'weekly')}
                        disabled={claiming === challenge.challengeId}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                      >
                        {claiming === challenge.challengeId ? 'Claiming...' : 'Claim'}
                      </button>
                    )}
                    {challenge.claimed && (
                      <span className="text-sm text-green-600 font-medium">Claimed ✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ActivityStats = ({ activity, streaks }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Stats</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{activity?.totalBookings || 0}</div>
          <div className="text-sm text-gray-600">Total Bookings</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{activity?.totalReviews || 0}</div>
          <div className="text-sm text-gray-600">Reviews</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{activity?.totalCheckins || 0}</div>
          <div className="text-sm text-gray-600">Check-ins</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{activity?.totalReferrals || 0}</div>
          <div className="text-sm text-gray-600">Referrals</div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Current Streaks</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">
              {streaks?.bookingStreak?.current || 0} days
            </div>
            <div className="text-sm text-gray-600">Booking Streak</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {streaks?.reviewStreak?.current || 0} days
            </div>
            <div className="text-sm text-gray-600">Review Streak</div>
          </div>
        </div>
      </div>
    </div>
  );

  const QuickActions = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => window.location.href = '/booking'}
          className="p-4 border rounded-lg hover:bg-blue-50 transition-colors"
        >
          <div className="text-2xl mb-2">🍽️</div>
          <div className="text-sm font-medium">Book a Table</div>
        </button>
        
        <button
          onClick={() => window.location.href = '/reviews'}
          className="p-4 border rounded-lg hover:bg-green-50 transition-colors"
        >
          <div className="text-2xl mb-2">⭐</div>
          <div className="text-sm font-medium">Write Review</div>
        </button>
        
        <button
          onClick={() => window.location.href = '/checkin'}
          className="p-4 border rounded-lg hover:bg-purple-50 transition-colors"
        >
          <div className="text-2xl mb-2">📍</div>
          <div className="text-sm font-medium">Check In</div>
        </button>
        
        <button
          onClick={() => window.location.href = '/refer'}
          className="p-4 border rounded-lg hover:bg-orange-50 transition-colors"
        >
          <div className="text-2xl mb-2">👥</div>
          <div className="text-sm font-medium">Refer Friends</div>
        </button>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loyalty Program</h1>
        <p className="text-gray-600">
          Earn points, unlock rewards, and enjoy exclusive benefits
        </p>
      </div>

      {/* Points Display */}
      <PointsDisplay 
        points={data.account?.points} 
        tier={data.account?.tier} 
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <TierBenefits 
            tier={data.account?.tier} 
            program={data.program} 
          />
          <ActivityStats 
            activity={data.account?.activity} 
            streaks={data.account?.streaks} 
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <AvailableRewards 
            rewards={data.program?.rewards} 
            userPoints={data.account?.points?.current} 
          />
          <Challenges challenges={data.account?.challenges} />
        </div>
      </div>
    </div>
  );
};

export default LoyaltyDashboard; 