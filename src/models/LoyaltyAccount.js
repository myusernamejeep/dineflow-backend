const mongoose = require('mongoose');

const loyaltyAccountSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Points and balance
  points: {
    current: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      default: 0,
      min: 0
    },
    expired: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Tier information
  tier: {
    current: {
      type: String,
      default: 'Bronze'
    },
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    pointsInTier: {
      type: Number,
      default: 0,
      min: 0
    },
    tierStartDate: {
      type: Date,
      default: Date.now
    },
    nextTierProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Account status
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active',
    index: true
  },

  // Membership information
  membership: {
    joinDate: {
      type: Date,
      default: Date.now
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    premiumStartDate: {
      type: Date
    },
    premiumEndDate: {
      type: Date
    }
  },

  // Activity tracking
  activity: {
    totalBookings: {
      type: Number,
      default: 0,
      min: 0
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCheckins: {
      type: Number,
      default: 0,
      min: 0
    },
    totalReferrals: {
      type: Number,
      default: 0,
      min: 0
    },
    totalSocialShares: {
      type: Number,
      default: 0,
      min: 0
    },
    lastBookingDate: {
      type: Date
    },
    lastReviewDate: {
      type: Date
    },
    lastCheckinDate: {
      type: Date
    }
  },

  // Streaks
  streaks: {
    bookingStreak: {
      current: {
        type: Number,
        default: 0,
        min: 0
      },
      longest: {
        type: Number,
        default: 0,
        min: 0
      },
      lastActivity: {
        type: Date
      }
    },
    reviewStreak: {
      current: {
        type: Number,
        default: 0,
        min: 0
      },
      longest: {
        type: Number,
        default: 0,
        min: 0
      },
      lastActivity: {
        type: Date
      }
    }
  },

  // Rewards and redemptions
  rewards: {
    redeemed: [{
      rewardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reward'
      },
      name: {
        type: String,
        required: true
      },
      pointsCost: {
        type: Number,
        required: true
      },
      redeemedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['active', 'used', 'expired'],
        default: 'active'
      },
      expiresAt: {
        type: Date
      },
      code: {
        type: String,
        unique: true
      }
    }],
    available: [{
      rewardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reward'
      },
      name: {
        type: String,
        required: true
      },
      description: {
        type: String
      },
      pointsCost: {
        type: Number,
        required: true
      },
      type: {
        type: String,
        enum: ['discount', 'free_item', 'cashback', 'gift_card', 'experience', 'merchandise'],
        required: true
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      expiresAt: {
        type: Date
      }
    }]
  },

  // Challenges and achievements
  challenges: {
    daily: [{
      challengeId: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['booking', 'review', 'checkin', 'referral', 'social_share'],
        required: true
      },
      target: {
        type: Number,
        required: true
      },
      progress: {
        type: Number,
        default: 0,
        min: 0
      },
      completed: {
        type: Boolean,
        default: false
      },
      pointsReward: {
        type: Number,
        required: true
      },
      claimed: {
        type: Boolean,
        default: false
      },
      date: {
        type: Date,
        default: Date.now
      }
    }],
    weekly: [{
      challengeId: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['booking', 'review', 'checkin', 'referral', 'social_share'],
        required: true
      },
      target: {
        type: Number,
        required: true
      },
      progress: {
        type: Number,
        default: 0,
        min: 0
      },
      completed: {
        type: Boolean,
        default: false
      },
      pointsReward: {
        type: Number,
        required: true
      },
      claimed: {
        type: Boolean,
        default: false
      },
      weekStart: {
        type: Date,
        required: true
      }
    }]
  },

  // Achievements
  achievements: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['booking', 'review', 'streak', 'tier', 'special'],
      required: true
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    pointsReward: {
      type: Number,
      default: 0
    }
  }],

  // Points history
  pointsHistory: [{
    type: {
      type: String,
      enum: ['earned', 'spent', 'expired', 'bonus', 'adjustment'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    source: {
      type: String,
      enum: ['booking', 'review', 'referral', 'challenge', 'streak', 'bonus', 'redemption', 'adjustment'],
      required: true
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId
    },
    date: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date
    }
  }],

  // Preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    autoRedeem: {
      type: Boolean,
      default: false
    },
    favoriteCategories: [{
      type: String,
      enum: ['food', 'drinks', 'experiences', 'merchandise', 'discounts']
    }]
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance - Fixed to remove boolean values
loyaltyAccountSchema.index({ userId: 1 });
loyaltyAccountSchema.index({ status: 1 });
loyaltyAccountSchema.index({ 'membership.lastActivity': -1 });
loyaltyAccountSchema.index({ 'points.current': -1 });
loyaltyAccountSchema.index({ 'tier.level': -1 });
loyaltyAccountSchema.index({ 'pointsHistory.date': -1 });
loyaltyAccountSchema.index({ 'rewards.redeemed.status': 1 });
loyaltyAccountSchema.index({ 'rewards.redeemed.expiresAt': 1 });
loyaltyAccountSchema.index({ 'challenges.daily.completed': 1 });
loyaltyAccountSchema.index({ 'challenges.weekly.completed': 1 });

// Virtual for total points value
loyaltyAccountSchema.virtual('pointsValue').get(function() {
  // This would be calculated based on the loyalty program's conversion rate
  return this.points.current * 0.01; // Default $0.01 per point
});

// Pre-save middleware
loyaltyAccountSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
loyaltyAccountSchema.statics = {
  // Get account by user ID
  async getByUserId(userId) {
    return this.findOne({ userId }).populate('userId', 'name email avatar');
  },

  // Get top earners
  async getTopEarners(limit = 10) {
    return this.find({ status: 'active' })
      .populate('userId', 'name avatar')
      .sort({ 'points.total': -1 })
      .limit(limit);
  },

  // Get accounts by tier
  async getByTier(tierLevel) {
    return this.find({ 
      'tier.level': tierLevel,
      status: 'active'
    }).populate('userId', 'name email avatar');
  },

  // Get inactive accounts
  async getInactiveAccounts(days = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.find({
      'membership.lastActivity': { $lt: cutoffDate },
      status: 'active'
    }).populate('userId', 'name email');
  },

  // Get accounts expiring soon
  async getExpiringAccounts(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    
    return this.find({
      'membership.premiumEndDate': { $lte: cutoffDate, $gt: new Date() },
      status: 'active'
    }).populate('userId', 'name email');
  }
};

// Instance methods
loyaltyAccountSchema.methods = {
  // Add points
  async addPoints(amount, source, description, sourceId = null, expiresAt = null) {
    this.points.current += amount;
    this.points.total += amount;
    
    this.pointsHistory.push({
      type: 'earned',
      amount,
      description,
      source,
      sourceId,
      expiresAt
    });
    
    this.membership.lastActivity = new Date();
    await this.save();
    
    return this.points.current;
  },

  // Spend points
  async spendPoints(amount, description, sourceId = null) {
    if (this.points.current < amount) {
      throw new Error('Insufficient points');
    }
    
    this.points.current -= amount;
    
    this.pointsHistory.push({
      type: 'spent',
      amount: -amount,
      description,
      source: 'redemption',
      sourceId
    });
    
    await this.save();
    return this.points.current;
  },

  // Update tier
  async updateTier(newTier, newLevel, pointsInTier) {
    const oldLevel = this.tier.level;
    
    this.tier.current = newTier;
    this.tier.level = newLevel;
    this.tier.pointsInTier = pointsInTier;
    
    if (newLevel > oldLevel) {
      this.tier.tierStartDate = new Date();
      // Add tier upgrade bonus
      await this.addPoints(100, 'tier_upgrade', `Tier upgrade bonus to ${newTier}`);
    }
    
    await this.save();
  },

  // Update streak
  async updateStreak(type, increment = true) {
    const streakKey = `${type}Streak`;
    
    if (increment) {
      this.streaks[streakKey].current += 1;
      this.streaks[streakKey].lastActivity = new Date();
      
      if (this.streaks[streakKey].current > this.streaks[streakKey].longest) {
        this.streaks[streakKey].longest = this.streaks[streakKey].current;
      }
    } else {
      this.streaks[streakKey].current = 0;
    }
    
    await this.save();
  },

  // Add achievement
  async addAchievement(achievement) {
    const existing = this.achievements.find(a => a.id === achievement.id);
    if (!existing) {
      this.achievements.push(achievement);
      if (achievement.pointsReward > 0) {
        await this.addPoints(achievement.pointsReward, 'achievement', `Achievement: ${achievement.name}`);
      }
      await this.save();
    }
  },

  // Update challenge progress
  async updateChallengeProgress(challengeId, progress, type = 'daily') {
    const challenges = this.challenges[type];
    const challenge = challenges.find(c => c.challengeId === challengeId);
    
    if (challenge && !challenge.completed) {
      challenge.progress = Math.min(progress, challenge.target);
      challenge.completed = challenge.progress >= challenge.target;
      
      if (challenge.completed && !challenge.claimed) {
        await this.addPoints(challenge.pointsReward, 'challenge', `Challenge completed: ${challenge.name}`);
        challenge.claimed = true;
      }
      
      await this.save();
    }
  },

  // Redeem reward
  async redeemReward(reward) {
    if (this.points.current < reward.pointsCost) {
      throw new Error('Insufficient points');
    }
    
    await this.spendPoints(reward.pointsCost, `Redeemed: ${reward.name}`, reward._id);
    
    // Generate unique code
    const code = this.generateRewardCode();
    
    this.rewards.redeemed.push({
      rewardId: reward._id,
      name: reward.name,
      pointsCost: reward.pointsCost,
      code,
      expiresAt: reward.validUntil
    });
    
    await this.save();
    return code;
  },

  // Generate unique reward code
  generateRewardCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // Check if user can redeem reward
  canRedeemReward(reward) {
    return this.points.current >= reward.pointsCost && this.status === 'active';
  },

  // Get available rewards
  getAvailableRewards() {
    return this.rewards.available.filter(reward => 
      this.points.current >= reward.pointsCost &&
      (!reward.expiresAt || reward.expiresAt > new Date())
    );
  },

  // Get active challenges
  getActiveChallenges() {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    
    return {
      daily: this.challenges.daily.filter(c => 
        c.date.toDateString() === new Date().toDateString()
      ),
      weekly: this.challenges.weekly.filter(c => 
        c.weekStart.toDateString() === weekStart.toDateString()
      )
    };
  },

  // Calculate tier progress
  calculateTierProgress() {
    // This would be calculated based on the loyalty program configuration
    return Math.min(100, Math.max(0, this.tier.pointsInTier));
  }
};

module.exports = mongoose.model('LoyaltyAccount', loyaltyAccountSchema); 