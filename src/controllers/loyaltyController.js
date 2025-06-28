const LoyaltyAccount = require('../models/LoyaltyAccount');
const LoyaltyProgram = require('../models/LoyaltyProgram');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { sendEmail } = require('../utils/notify');

class LoyaltyController {
  // Get user's loyalty account
  async getLoyaltyAccount(ctx) {
    try {
      const userId = ctx.state.user.id;

      let account = await LoyaltyAccount.getByUserId(userId);
      
      if (!account) {
        // Create new loyalty account
        account = new LoyaltyAccount({
          userId,
          points: { current: 0, total: 0, expired: 0 },
          tier: { current: 'Bronze', level: 1, pointsInTier: 0 },
          membership: { joinDate: new Date(), lastActivity: new Date() }
        });
        await account.save();
      }

      // Get loyalty program for additional info
      const program = await LoyaltyProgram.getActiveProgram();
      
      // Calculate tier progress
      if (program) {
        const currentTier = await program.getTierByPoints(account.points.current);
        const nextTier = await program.getNextTier(account.points.current);
        
        if (currentTier && currentTier.level !== account.tier.level) {
          await account.updateTier(currentTier.name, currentTier.level, account.points.current);
        }
        
        if (nextTier) {
          const pointsNeeded = nextTier.minPoints - account.points.current;
          const tierRange = nextTier.maxPoints - nextTier.minPoints;
          account.tier.nextTierProgress = Math.round(((account.points.current - nextTier.minPoints) / tierRange) * 100);
        }
      }

      ctx.body = {
        success: true,
        data: {
          account,
          program: program ? {
            name: program.name,
            description: program.description,
            tiers: program.tiers,
            rewards: await program.getAvailableRewards()
          } : null
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Award points for booking
  async awardBookingPoints(ctx) {
    try {
      const { bookingId, amount, restaurantId } = ctx.request.body;
      const userId = ctx.state.user.id;

      const account = await LoyaltyAccount.getByUserId(userId);
      if (!account) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty account not found' };
        return;
      }

      const program = await LoyaltyProgram.getActiveProgram();
      if (!program) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty program not found' };
        return;
      }

      // Calculate points
      const points = program.calculateBookingPoints(amount, restaurantId);
      
      // Add points
      const newBalance = await account.addPoints(
        points,
        'booking',
        `Points for booking #${bookingId}`,
        bookingId
      );

      // Update activity
      account.activity.totalBookings += 1;
      account.activity.lastBookingDate = new Date();
      await account.save();

      // Update streaks
      await account.updateStreak('booking', true);

      // Check for challenges
      await this.updateChallenges(account, 'booking', 1);

      // Send notification
      await this.sendPointsNotification(userId, points, 'booking', newBalance);

      ctx.body = {
        success: true,
        data: {
          pointsAwarded: points,
          newBalance,
          message: `Earned ${points} points for your booking!`
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Award points for review
  async awardReviewPoints(ctx) {
    try {
      const { reviewId, restaurantId } = ctx.request.body;
      const userId = ctx.state.user.id;

      const account = await LoyaltyAccount.getByUserId(userId);
      if (!account) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty account not found' };
        return;
      }

      const program = await LoyaltyProgram.getActiveProgram();
      if (!program) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty program not found' };
        return;
      }

      // Calculate points
      const points = program.calculateReviewPoints(restaurantId);
      
      // Add points
      const newBalance = await account.addPoints(
        points,
        'review',
        `Points for review`,
        reviewId
      );

      // Update activity
      account.activity.totalReviews += 1;
      account.activity.lastReviewDate = new Date();
      await account.save();

      // Update streaks
      await account.updateStreak('review', true);

      // Check for challenges
      await this.updateChallenges(account, 'review', 1);

      // Send notification
      await this.sendPointsNotification(userId, points, 'review', newBalance);

      ctx.body = {
        success: true,
        data: {
          pointsAwarded: points,
          newBalance,
          message: `Earned ${points} points for your review!`
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Award points for check-in
  async awardCheckinPoints(ctx) {
    try {
      const { restaurantId } = ctx.request.body;
      const userId = ctx.state.user.id;

      const account = await LoyaltyAccount.getByUserId(userId);
      if (!account) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty account not found' };
        return;
      }

      const program = await LoyaltyProgram.getActiveProgram();
      if (!program) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty program not found' };
        return;
      }

      // Check if already checked in today
      const today = new Date().toDateString();
      const lastCheckin = account.activity.lastCheckinDate?.toDateString();
      
      if (lastCheckin === today) {
        ctx.status = 400;
        ctx.body = { error: 'Already checked in today' };
        return;
      }

      // Calculate points
      const points = program.pointsConfig.checkinPoints;
      
      // Add points
      const newBalance = await account.addPoints(
        points,
        'checkin',
        `Daily check-in points`,
        restaurantId
      );

      // Update activity
      account.activity.totalCheckins += 1;
      account.activity.lastCheckinDate = new Date();
      await account.save();

      // Check for challenges
      await this.updateChallenges(account, 'checkin', 1);

      // Send notification
      await this.sendPointsNotification(userId, points, 'checkin', newBalance);

      ctx.body = {
        success: true,
        data: {
          pointsAwarded: points,
          newBalance,
          message: `Earned ${points} points for checking in!`
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Award referral points
  async awardReferralPoints(ctx) {
    try {
      const { referredUserId } = ctx.request.body;
      const userId = ctx.state.user.id;

      const account = await LoyaltyAccount.getByUserId(userId);
      if (!account) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty account not found' };
        return;
      }

      const program = await LoyaltyProgram.getActiveProgram();
      if (!program) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty program not found' };
        return;
      }

      // Check if already referred this user
      const existingReferral = account.pointsHistory.find(
        h => h.source === 'referral' && h.sourceId?.toString() === referredUserId
      );

      if (existingReferral) {
        ctx.status = 400;
        ctx.body = { error: 'Already referred this user' };
        return;
      }

      // Calculate points
      const points = program.pointsConfig.referralPoints;
      
      // Add points
      const newBalance = await account.addPoints(
        points,
        'referral',
        `Referral bonus`,
        referredUserId
      );

      // Update activity
      account.activity.totalReferrals += 1;
      await account.save();

      // Check for challenges
      await this.updateChallenges(account, 'referral', 1);

      // Send notification
      await this.sendPointsNotification(userId, points, 'referral', newBalance);

      ctx.body = {
        success: true,
        data: {
          pointsAwarded: points,
          newBalance,
          message: `Earned ${points} points for the referral!`
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Get available rewards
  async getAvailableRewards(ctx) {
    try {
      const userId = ctx.state.user.id;

      const account = await LoyaltyAccount.getByUserId(userId);
      if (!account) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty account not found' };
        return;
      }

      const program = await LoyaltyProgram.getActiveProgram();
      if (!program) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty program not found' };
        return;
      }

      const availableRewards = await program.getAvailableRewards();
      
      // Filter rewards user can afford
      const affordableRewards = availableRewards.filter(reward => 
        account.points.current >= reward.pointsCost
      );

      ctx.body = {
        success: true,
        data: {
          rewards: affordableRewards,
          userPoints: account.points.current,
          canRedeem: affordableRewards.length > 0
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Redeem reward
  async redeemReward(ctx) {
    try {
      const { rewardId } = ctx.request.body;
      const userId = ctx.state.user.id;

      const account = await LoyaltyAccount.getByUserId(userId);
      if (!account) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty account not found' };
        return;
      }

      const program = await LoyaltyProgram.getActiveProgram();
      if (!program) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty program not found' };
        return;
      }

      const reward = program.rewards.find(r => r._id.toString() === rewardId);
      if (!reward) {
        ctx.status = 404;
        ctx.body = { error: 'Reward not found' };
        return;
      }

      if (!program.isRewardAvailable(rewardId)) {
        ctx.status = 400;
        ctx.body = { error: 'Reward not available' };
        return;
      }

      if (!account.canRedeemReward(reward)) {
        ctx.status = 400;
        ctx.body = { error: 'Insufficient points or account inactive' };
        return;
      }

      // Redeem reward
      const code = await account.redeemReward(reward);
      
      // Update program redemption count
      program.incrementRewardRedemptions(rewardId);
      await program.save();

      // Send notification
      await this.sendRewardNotification(userId, reward, code);

      ctx.body = {
        success: true,
        data: {
          reward: {
            name: reward.name,
            type: reward.type,
            value: reward.value,
            code
          },
          newBalance: account.points.current,
          message: `Successfully redeemed ${reward.name}!`
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Get user's redeemed rewards
  async getRedeemedRewards(ctx) {
    try {
      const userId = ctx.state.user.id;

      const account = await LoyaltyAccount.getByUserId(userId);
      if (!account) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty account not found' };
        return;
      }

      const activeRewards = account.rewards.redeemed.filter(reward => 
        reward.status === 'active' && 
        (!reward.expiresAt || reward.expiresAt > new Date())
      );

      ctx.body = {
        success: true,
        data: {
          rewards: activeRewards,
          total: account.rewards.redeemed.length
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Get challenges
  async getChallenges(ctx) {
    try {
      const userId = ctx.state.user.id;

      const account = await LoyaltyAccount.getByUserId(userId);
      if (!account) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty account not found' };
        return;
      }

      const activeChallenges = account.getActiveChallenges();

      ctx.body = {
        success: true,
        data: activeChallenges
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Claim challenge reward
  async claimChallengeReward(ctx) {
    try {
      const { challengeId, type } = ctx.request.body;
      const userId = ctx.state.user.id;

      const account = await LoyaltyAccount.getByUserId(userId);
      if (!account) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty account not found' };
        return;
      }

      const challenges = account.challenges[type];
      const challenge = challenges.find(c => c.challengeId === challengeId);

      if (!challenge) {
        ctx.status = 404;
        ctx.body = { error: 'Challenge not found' };
        return;
      }

      if (!challenge.completed) {
        ctx.status = 400;
        ctx.body = { error: 'Challenge not completed' };
        return;
      }

      if (challenge.claimed) {
        ctx.status = 400;
        ctx.body = { error: 'Challenge already claimed' };
        return;
      }

      // Award points
      const newBalance = await account.addPoints(
        challenge.pointsReward,
        'challenge',
        `Challenge reward: ${challenge.name}`
      );

      challenge.claimed = true;
      await account.save();

      ctx.body = {
        success: true,
        data: {
          pointsAwarded: challenge.pointsReward,
          newBalance,
          message: `Challenge completed! Earned ${challenge.pointsReward} points.`
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Get points history
  async getPointsHistory(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { page = 1, limit = 20 } = ctx.query;

      const account = await LoyaltyAccount.getByUserId(userId);
      if (!account) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty account not found' };
        return;
      }

      const skip = (page - 1) * limit;
      const history = account.pointsHistory
        .sort((a, b) => b.date - a.date)
        .slice(skip, skip + parseInt(limit));

      const total = account.pointsHistory.length;

      ctx.body = {
        success: true,
        data: {
          history,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Get leaderboard
  async getLeaderboard(ctx) {
    try {
      const { type = 'points', limit = 10 } = ctx.query;

      let accounts;
      switch (type) {
        case 'points':
          accounts = await LoyaltyAccount.getTopEarners(parseInt(limit));
          break;
        case 'streaks':
          accounts = await LoyaltyAccount.find({ status: 'active' })
            .populate('userId', 'name avatar')
            .sort({ 'streaks.bookingStreak.longest': -1 })
            .limit(parseInt(limit));
          break;
        case 'activity':
          accounts = await LoyaltyAccount.find({ status: 'active' })
            .populate('userId', 'name avatar')
            .sort({ 'activity.totalBookings': -1 })
            .limit(parseInt(limit));
          break;
        default:
          accounts = await LoyaltyAccount.getTopEarners(parseInt(limit));
      }

      ctx.body = {
        success: true,
        data: {
          leaderboard: accounts,
          type
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Update user preferences
  async updatePreferences(ctx) {
    try {
      const userId = ctx.state.user.id;
      const preferences = ctx.request.body;

      const account = await LoyaltyAccount.getByUserId(userId);
      if (!account) {
        ctx.status = 404;
        ctx.body = { error: 'Loyalty account not found' };
        return;
      }

      account.preferences = { ...account.preferences, ...preferences };
      await account.save();

      ctx.body = {
        success: true,
        data: {
          preferences: account.preferences,
          message: 'Preferences updated successfully'
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Helper methods

  // Update challenges for user
  async updateChallenges(account, type, increment = 1) {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));

    // Update daily challenges
    account.challenges.daily.forEach(challenge => {
      if (challenge.type === type && 
          challenge.date.toDateString() === new Date().toDateString() &&
          !challenge.completed) {
        challenge.progress += increment;
        challenge.completed = challenge.progress >= challenge.target;
      }
    });

    // Update weekly challenges
    account.challenges.weekly.forEach(challenge => {
      if (challenge.type === type && 
          challenge.weekStart.toDateString() === weekStart.toDateString() &&
          !challenge.completed) {
        challenge.progress += increment;
        challenge.completed = challenge.progress >= challenge.target;
      }
    });

    await account.save();
  }

  // Send points notification
  async sendPointsNotification(userId, points, source, newBalance) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.email) return;

      const sourceNames = {
        booking: 'booking',
        review: 'review',
        checkin: 'check-in',
        referral: 'referral',
        challenge: 'challenge',
        streak: 'streak bonus'
      };

      await sendEmail({
        to: user.email,
        subject: `🎉 You earned ${points} points!`,
        html: `
          <h2>Points Earned!</h2>
          <p>Congratulations! You earned <strong>${points} points</strong> for your ${sourceNames[source]}.</p>
          <p>Your new balance: <strong>${newBalance} points</strong></p>
          <p>Keep earning points to unlock more rewards!</p>
        `
      });
    } catch (error) {
      console.error('Failed to send points notification:', error);
    }
  }

  // Send reward notification
  async sendRewardNotification(userId, reward, code) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.email) return;

      await sendEmail({
        to: user.email,
        subject: `🎁 Your reward is ready: ${reward.name}`,
        html: `
          <h2>Reward Redeemed!</h2>
          <p>You successfully redeemed <strong>${reward.name}</strong> for ${reward.pointsCost} points.</p>
          <p>Your reward code: <strong>${code}</strong></p>
          <p>${reward.description}</p>
          <p>Show this code at the restaurant to claim your reward!</p>
        `
      });
    } catch (error) {
      console.error('Failed to send reward notification:', error);
    }
  }
}

module.exports = new LoyaltyController(); 