const mongoose = require('mongoose');

const loyaltyProgramSchema = new mongoose.Schema({
  // Basic program information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Points configuration
  pointsConfig: {
    // Points earned per booking
    bookingPoints: {
      basePoints: {
        type: Number,
        default: 100,
        min: 0
      },
      pointsPerDollar: {
        type: Number,
        default: 10,
        min: 0
      },
      maxPointsPerBooking: {
        type: Number,
        default: 1000,
        min: 0
      }
    },

    // Points earned for reviews
    reviewPoints: {
      type: Number,
      default: 50,
      min: 0
    },

    // Points earned for referrals
    referralPoints: {
      type: Number,
      default: 200,
      min: 0
    },

    // Points earned for social sharing
    socialSharePoints: {
      type: Number,
      default: 25,
      min: 0
    },

    // Points earned for check-ins
    checkinPoints: {
      type: Number,
      default: 30,
      min: 0
    },

    // Points expiration (in days, 0 = never expire)
    expirationDays: {
      type: Number,
      default: 365,
      min: 0
    }
  },

  // Tier system
  tiers: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: Number,
      required: true,
      min: 1
    },
    minPoints: {
      type: Number,
      required: true,
      min: 0
    },
    maxPoints: {
      type: Number,
      min: 0
    },
    benefits: [{
      type: {
        type: String,
        enum: ['discount', 'free_item', 'priority_booking', 'exclusive_access', 'bonus_points', 'waived_fees'],
        required: true
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      description: {
        type: String,
        required: true
      }
    }],
    color: {
      type: String,
      default: '#6B7280'
    },
    icon: {
      type: String,
      default: 'star'
    }
  }],

  // Rewards catalog
  rewards: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    pointsCost: {
      type: Number,
      required: true,
      min: 0
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
    isActive: {
      type: Boolean,
      default: true
    },
    maxRedemptions: {
      type: Number,
      default: -1 // -1 = unlimited
    },
    currentRedemptions: {
      type: Number,
      default: 0
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date
    },
    image: {
      type: String
    },
    category: {
      type: String,
      enum: ['food', 'drinks', 'experiences', 'merchandise', 'discounts'],
      default: 'food'
    }
  }],

  // Gamification features
  gamification: {
    // Daily challenges
    dailyChallenges: [{
      name: {
        type: String,
        required: true
      },
      description: {
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
        required: true,
        min: 1
      },
      pointsReward: {
        type: Number,
        required: true,
        min: 0
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],

    // Weekly challenges
    weeklyChallenges: [{
      name: {
        type: String,
        required: true
      },
      description: {
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
        required: true,
        min: 1
      },
      pointsReward: {
        type: Number,
        required: true,
        min: 0
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],

    // Streaks
    streaks: {
      enabled: {
        type: Boolean,
        default: true
      },
      bookingStreak: {
        pointsPerDay: {
          type: Number,
          default: 10,
          min: 0
        },
        maxStreak: {
          type: Number,
          default: 30,
          min: 1
        }
      },
      reviewStreak: {
        pointsPerDay: {
          type: Number,
          default: 5,
          min: 0
        },
        maxStreak: {
          type: Number,
          default: 7,
          min: 1
        }
      }
    }
  },

  // Partner restaurants
  partnerRestaurants: [{
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    participationLevel: {
      type: String,
      enum: ['full', 'partial', 'basic'],
      default: 'full'
    },
    customPoints: {
      bookingPoints: Number,
      reviewPoints: Number
    },
    exclusiveRewards: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reward'
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Program settings
  settings: {
    // Minimum points for redemption
    minRedemptionPoints: {
      type: Number,
      default: 100,
      min: 0
    },

    // Points to currency conversion rate
    pointsToCurrencyRate: {
      type: Number,
      default: 0.01, // 1 point = $0.01
      min: 0
    },

    // Auto-tier upgrade
    autoTierUpgrade: {
      type: Boolean,
      default: true
    },

    // Tier downgrade grace period (days)
    tierDowngradeGracePeriod: {
      type: Number,
      default: 90,
      min: 0
    },

    // Welcome bonus for new members
    welcomeBonus: {
      type: Number,
      default: 100,
      min: 0
    },

    // Birthday bonus
    birthdayBonus: {
      type: Number,
      default: 200,
      min: 0
    },

    // Anniversary bonus
    anniversaryBonus: {
      type: Number,
      default: 500,
      min: 0
    }
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

// Indexes for performance
loyaltyProgramSchema.index({ isActive: 1 });
loyaltyProgramSchema.index({ 'partnerRestaurants.restaurantId': 1 });
loyaltyProgramSchema.index({ 'rewards.isActive': 1 });

// Static methods
loyaltyProgramSchema.statics = {
  // Get active loyalty program
  async getActiveProgram() {
    return this.findOne({ isActive: true });
  },

  // Get program by restaurant
  async getProgramByRestaurant(restaurantId) {
    return this.findOne({
      isActive: true,
      'partnerRestaurants.restaurantId': restaurantId,
      'partnerRestaurants.isActive': true
    });
  },

  // Get available rewards
  async getAvailableRewards() {
    const program = await this.getActiveProgram();
    if (!program) return [];

    const now = new Date();
    return program.rewards.filter(reward => 
      reward.isActive &&
      (reward.maxRedemptions === -1 || reward.currentRedemptions < reward.maxRedemptions) &&
      (!reward.validUntil || reward.validUntil > now)
    );
  },

  // Get tier by points
  async getTierByPoints(points) {
    const program = await this.getActiveProgram();
    if (!program) return null;

    return program.tiers
      .filter(tier => points >= tier.minPoints)
      .sort((a, b) => b.level - a.level)[0] || null;
  },

  // Get next tier
  async getNextTier(currentPoints) {
    const program = await this.getActiveProgram();
    if (!program) return null;

    return program.tiers
      .filter(tier => tier.minPoints > currentPoints)
      .sort((a, b) => a.minPoints - b.minPoints)[0] || null;
  }
};

// Instance methods
loyaltyProgramSchema.methods = {
  // Calculate points for booking
  calculateBookingPoints(amount, restaurantId = null) {
    let points = this.pointsConfig.bookingPoints.basePoints;
    
    // Add points based on amount
    const amountPoints = Math.floor(amount * this.pointsConfig.bookingPoints.pointsPerDollar);
    points += amountPoints;
    
    // Check restaurant-specific points
    if (restaurantId) {
      const partner = this.partnerRestaurants.find(p => 
        p.restaurantId.toString() === restaurantId.toString()
      );
      if (partner && partner.customPoints && partner.customPoints.bookingPoints) {
        points = partner.customPoints.bookingPoints;
      }
    }
    
    // Apply maximum limit
    return Math.min(points, this.pointsConfig.bookingPoints.maxPointsPerBooking);
  },

  // Calculate points for review
  calculateReviewPoints(restaurantId = null) {
    let points = this.pointsConfig.reviewPoints;
    
    // Check restaurant-specific points
    if (restaurantId) {
      const partner = this.partnerRestaurants.find(p => 
        p.restaurantId.toString() === restaurantId.toString()
      );
      if (partner && partner.customPoints && partner.customPoints.reviewPoints) {
        points = partner.customPoints.reviewPoints;
      }
    }
    
    return points;
  },

  // Get tier benefits
  getTierBenefits(tierLevel) {
    const tier = this.tiers.find(t => t.level === tierLevel);
    return tier ? tier.benefits : [];
  },

  // Check if reward is available
  isRewardAvailable(rewardId) {
    const reward = this.rewards.find(r => r._id.toString() === rewardId.toString());
    if (!reward || !reward.isActive) return false;
    
    const now = new Date();
    if (reward.validUntil && reward.validUntil <= now) return false;
    
    if (reward.maxRedemptions !== -1 && reward.currentRedemptions >= reward.maxRedemptions) {
      return false;
    }
    
    return true;
  },

  // Increment reward redemptions
  incrementRewardRedemptions(rewardId) {
    const reward = this.rewards.find(r => r._id.toString() === rewardId.toString());
    if (reward) {
      reward.currentRedemptions += 1;
    }
  }
};

module.exports = mongoose.model('LoyaltyProgram', loyaltyProgramSchema); 