const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Basic review information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },

  // Rating system (1-5 stars)
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number between 1 and 5'
    }
  },

  // Detailed ratings
  ratings: {
    food: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    service: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    ambiance: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    value: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  },

  // Review content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },

  // Review metadata
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },

  // Photos and media
  photos: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      maxlength: 200
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Sentiment analysis
  sentiment: {
    score: {
      type: Number,
      min: -1,
      max: 1,
      default: 0
    },
    label: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  },

  // Moderation and status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending',
    index: true
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  },
  moderationNotes: {
    type: String,
    maxlength: 500
  },

  // Flags and reports
  flags: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other'],
      required: true
    },
    description: {
      type: String,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }],

  // Verification
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBooking: {
    type: Boolean,
    default: false
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Soft delete
  deleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance
reviewSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ overallRating: 1, status: 1 });
reviewSchema.index({ 'sentiment.label': 1, status: 1 });
reviewSchema.index({ verified: 1, status: 1 });

// Virtual for average rating calculation
reviewSchema.virtual('averageRating').get(function() {
  const ratings = this.ratings;
  return Math.round((ratings.food + ratings.service + ratings.ambiance + ratings.value) / 4);
});

// Pre-save middleware
reviewSchema.pre('save', function(next) {
  // Update overall rating based on detailed ratings
  if (this.ratings) {
    this.overallRating = Math.round(
      (this.ratings.food + this.ratings.service + this.ratings.ambiance + this.ratings.value) / 4
    );
  }

  // Update sentiment label based on score
  if (this.sentiment.score !== undefined) {
    if (this.sentiment.score > 0.1) {
      this.sentiment.label = 'positive';
    } else if (this.sentiment.score < -0.1) {
      this.sentiment.label = 'negative';
    } else {
      this.sentiment.label = 'neutral';
    }
  }

  this.updatedAt = new Date();
  next();
});

// Static methods
reviewSchema.statics = {
  // Get average rating for a restaurant
  async getAverageRating(restaurantId) {
    const result = await this.aggregate([
      {
        $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          status: 'approved',
          deleted: false
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$overallRating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$overallRating'
          }
        }
      }
    ]);

    if (result.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result[0].ratingDistribution.forEach(rating => {
      ratingDistribution[rating]++;
    });

    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
      ratingDistribution
    };
  },

  // Get detailed ratings for a restaurant
  async getDetailedRatings(restaurantId) {
    const result = await this.aggregate([
      {
        $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          status: 'approved',
          deleted: false
        }
      },
      {
        $group: {
          _id: null,
          food: { $avg: '$ratings.food' },
          service: { $avg: '$ratings.service' },
          ambiance: { $avg: '$ratings.ambiance' },
          value: { $avg: '$ratings.value' }
        }
      }
    ]);

    if (result.length === 0) {
      return {
        food: 0,
        service: 0,
        ambiance: 0,
        value: 0
      };
    }

    return {
      food: Math.round(result[0].food * 10) / 10,
      service: Math.round(result[0].service * 10) / 10,
      ambiance: Math.round(result[0].ambiance * 10) / 10,
      value: Math.round(result[0].value * 10) / 10
    };
  },

  // Get recent reviews for a restaurant
  async getRecentReviews(restaurantId, limit = 10, skip = 0) {
    return this.find({
      restaurantId,
      status: 'approved',
      deleted: false
    })
    .populate('userId', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
  },

  // Get helpful reviews for a restaurant
  async getHelpfulReviews(restaurantId, limit = 10) {
    return this.find({
      restaurantId,
      status: 'approved',
      deleted: false
    })
    .populate('userId', 'name avatar')
    .sort({ 'helpful.count': -1, createdAt: -1 })
    .limit(limit);
  },

  // Get reviews by rating
  async getReviewsByRating(restaurantId, rating, limit = 10, skip = 0) {
    return this.find({
      restaurantId,
      overallRating: rating,
      status: 'approved',
      deleted: false
    })
    .populate('userId', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
  },

  // Get pending reviews for moderation
  async getPendingReviews(limit = 20, skip = 0) {
    return this.find({
      status: 'pending',
      deleted: false
    })
    .populate('userId', 'name')
    .populate('restaurantId', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
  },

  // Get flagged reviews
  async getFlaggedReviews(limit = 20, skip = 0) {
    return this.find({
      'flags.0': { $exists: true },
      deleted: false
    })
    .populate('userId', 'name')
    .populate('restaurantId', 'name')
    .sort({ 'flags.createdAt': -1 })
    .limit(limit)
    .skip(skip);
  }
};

// Instance methods
reviewSchema.methods = {
  // Mark review as helpful
  async markHelpful(userId) {
    if (!this.helpful.users.includes(userId)) {
      this.helpful.users.push(userId);
      this.helpful.count = this.helpful.users.length;
      await this.save();
    }
    return this.helpful.count;
  },

  // Remove helpful mark
  async removeHelpful(userId) {
    const index = this.helpful.users.indexOf(userId);
    if (index > -1) {
      this.helpful.users.splice(index, 1);
      this.helpful.count = this.helpful.users.length;
      await this.save();
    }
    return this.helpful.count;
  },

  // Flag review
  async flagReview(userId, reason, description) {
    const existingFlag = this.flags.find(flag => 
      flag.userId.toString() === userId.toString() && flag.status === 'pending'
    );

    if (!existingFlag) {
      this.flags.push({
        userId,
        reason,
        description,
        createdAt: new Date()
      });

      // Auto-flag if multiple flags
      if (this.flags.filter(f => f.status === 'pending').length >= 3) {
        this.status = 'flagged';
      }

      await this.save();
    }

    return this.flags;
  },

  // Approve review
  async approveReview(moderatorId, notes = '') {
    this.status = 'approved';
    this.moderatedBy = moderatorId;
    this.moderatedAt = new Date();
    this.moderationNotes = notes;
    await this.save();
  },

  // Reject review
  async rejectReview(moderatorId, notes = '') {
    this.status = 'rejected';
    this.moderatedBy = moderatorId;
    this.moderatedAt = new Date();
    this.moderationNotes = notes;
    await this.save();
  },

  // Soft delete review
  async softDelete(deletedBy) {
    this.deleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    await this.save();
  },

  // Restore review
  async restore() {
    this.deleted = false;
    this.deletedAt = undefined;
    this.deletedBy = undefined;
    await this.save();
  }
};

// Middleware to update restaurant rating when review is saved/deleted
reviewSchema.post('save', async function() {
  if (this.status === 'approved' && !this.deleted) {
    await this.constructor.updateRestaurantRating(this.restaurantId);
  }
});

reviewSchema.post('remove', async function() {
  await this.constructor.updateRestaurantRating(this.restaurantId);
});

// Static method to update restaurant rating
reviewSchema.statics.updateRestaurantRating = async function(restaurantId) {
  const Restaurant = mongoose.model('Restaurant');
  const ratingData = await this.getAverageRating(restaurantId);
  const detailedRatings = await this.getDetailedRatings(restaurantId);

  await Restaurant.findByIdAndUpdate(restaurantId, {
    rating: ratingData.averageRating,
    totalReviews: ratingData.totalReviews,
    ratingDistribution: ratingData.ratingDistribution,
    detailedRatings: detailedRatings
  });
};

module.exports = mongoose.model('Review', reviewSchema); 