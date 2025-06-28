const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { sendEmail } = require('../utils/notify');

class ReviewController {
  // Create a new review
  async createReview(ctx) {
    try {
      const {
        restaurantId,
        bookingId,
        overallRating,
        ratings,
        title,
        content,
        photos = []
      } = ctx.request.body;

      const userId = ctx.state.user.id;

      // Validate booking exists and belongs to user
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        ctx.status = 404;
        ctx.body = { error: 'Booking not found' };
        return;
      }

      if (booking.userId.toString() !== userId) {
        ctx.status = 403;
        ctx.body = { error: 'You can only review your own bookings' };
        return;
      }

      // Check if review already exists for this booking
      const existingReview = await Review.findOne({ bookingId });
      if (existingReview) {
        ctx.status = 400;
        ctx.body = { error: 'Review already exists for this booking' };
        return;
      }

      // Validate restaurant exists
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        ctx.status = 404;
        ctx.body = { error: 'Restaurant not found' };
        return;
      }

      // Perform sentiment analysis
      const sentiment = await this.analyzeSentiment(content);

      // Create review
      const review = new Review({
        userId,
        restaurantId,
        bookingId,
        overallRating,
        ratings,
        title,
        content,
        photos,
        sentiment,
        verifiedBooking: true
      });

      await review.save();

      // Populate user and restaurant info
      await review.populate('userId', 'name avatar');
      await review.populate('restaurantId', 'name');

      // Send notification to restaurant
      await this.notifyRestaurant(review);

      ctx.status = 201;
      ctx.body = {
        success: true,
        data: review,
        message: 'Review submitted successfully and is pending approval'
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Get reviews for a restaurant
  async getRestaurantReviews(ctx) {
    try {
      const { restaurantId } = ctx.params;
      const { 
        page = 1, 
        limit = 10, 
        rating, 
        sort = 'recent',
        status = 'approved'
      } = ctx.query;

      const skip = (page - 1) * limit;
      let reviews;

      // Validate restaurant exists
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        ctx.status = 404;
        ctx.body = { error: 'Restaurant not found' };
        return;
      }

      // Build query
      const query = {
        restaurantId,
        status,
        deleted: false
      };

      if (rating) {
        query.overallRating = parseInt(rating);
      }

      // Get reviews based on sort parameter
      switch (sort) {
        case 'helpful':
          reviews = await Review.getHelpfulReviews(restaurantId, parseInt(limit));
          break;
        case 'rating':
          reviews = await Review.find(query)
            .populate('userId', 'name avatar')
            .sort({ overallRating: -1, createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);
          break;
        case 'recent':
        default:
          reviews = await Review.find(query)
            .populate('userId', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);
          break;
      }

      // Get total count for pagination
      const total = await Review.countDocuments(query);

      // Get rating statistics
      const ratingStats = await Review.getAverageRating(restaurantId);
      const detailedRatings = await Review.getDetailedRatings(restaurantId);

      ctx.body = {
        success: true,
        data: {
          reviews,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          statistics: {
            ...ratingStats,
            detailedRatings
          }
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Get user's reviews
  async getUserReviews(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { page = 1, limit = 10 } = ctx.query;
      const skip = (page - 1) * limit;

      const reviews = await Review.find({
        userId,
        deleted: false
      })
      .populate('restaurantId', 'name image')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

      const total = await Review.countDocuments({
        userId,
        deleted: false
      });

      ctx.body = {
        success: true,
        data: {
          reviews,
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

  // Get single review
  async getReview(ctx) {
    try {
      const { id } = ctx.params;

      const review = await Review.findById(id)
        .populate('userId', 'name avatar')
        .populate('restaurantId', 'name image')
        .populate('bookingId', 'bookingTime partySize');

      if (!review || review.deleted) {
        ctx.status = 404;
        ctx.body = { error: 'Review not found' };
        return;
      }

      ctx.body = {
        success: true,
        data: review
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Update review
  async updateReview(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;
      const updateData = ctx.request.body;

      const review = await Review.findById(id);

      if (!review || review.deleted) {
        ctx.status = 404;
        ctx.body = { error: 'Review not found' };
        return;
      }

      // Check if user owns the review or is admin
      if (review.userId.toString() !== userId && ctx.state.user.role !== 'admin') {
        ctx.status = 403;
        ctx.body = { error: 'You can only edit your own reviews' };
        return;
      }

      // Only allow updates if review is pending or user is admin
      if (review.status !== 'pending' && ctx.state.user.role !== 'admin') {
        ctx.status = 400;
        ctx.body = { error: 'Cannot edit approved/rejected reviews' };
        return;
      }

      // Update sentiment if content changed
      if (updateData.content && updateData.content !== review.content) {
        updateData.sentiment = await this.analyzeSentiment(updateData.content);
      }

      // Reset status to pending if content changed
      if (updateData.content || updateData.overallRating || updateData.ratings) {
        updateData.status = 'pending';
      }

      const updatedReview = await Review.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
      .populate('userId', 'name avatar')
      .populate('restaurantId', 'name');

      ctx.body = {
        success: true,
        data: updatedReview,
        message: 'Review updated successfully'
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Delete review
  async deleteReview(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;

      const review = await Review.findById(id);

      if (!review || review.deleted) {
        ctx.status = 404;
        ctx.body = { error: 'Review not found' };
        return;
      }

      // Check if user owns the review or is admin
      if (review.userId.toString() !== userId && ctx.state.user.role !== 'admin') {
        ctx.status = 403;
        ctx.body = { error: 'You can only delete your own reviews' };
        return;
      }

      if (ctx.state.user.role === 'admin') {
        await review.remove();
      } else {
        await review.softDelete(userId);
      }

      ctx.body = {
        success: true,
        message: 'Review deleted successfully'
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Mark review as helpful
  async markHelpful(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;

      const review = await Review.findById(id);

      if (!review || review.deleted || review.status !== 'approved') {
        ctx.status = 404;
        ctx.body = { error: 'Review not found' };
        return;
      }

      const helpfulCount = await review.markHelpful(userId);

      ctx.body = {
        success: true,
        data: { helpfulCount },
        message: 'Review marked as helpful'
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Remove helpful mark
  async removeHelpful(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;

      const review = await Review.findById(id);

      if (!review || review.deleted) {
        ctx.status = 404;
        ctx.body = { error: 'Review not found' };
        return;
      }

      const helpfulCount = await review.removeHelpful(userId);

      ctx.body = {
        success: true,
        data: { helpfulCount },
        message: 'Helpful mark removed'
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Flag review
  async flagReview(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;
      const { reason, description } = ctx.request.body;

      const review = await Review.findById(id);

      if (!review || review.deleted) {
        ctx.status = 404;
        ctx.body = { error: 'Review not found' };
        return;
      }

      // Prevent users from flagging their own reviews
      if (review.userId.toString() === userId) {
        ctx.status = 400;
        ctx.body = { error: 'Cannot flag your own review' };
        return;
      }

      const flags = await review.flagReview(userId, reason, description);

      ctx.body = {
        success: true,
        data: { flags },
        message: 'Review flagged successfully'
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Admin: Get pending reviews for moderation
  async getPendingReviews(ctx) {
    try {
      if (ctx.state.user.role !== 'admin') {
        ctx.status = 403;
        ctx.body = { error: 'Admin access required' };
        return;
      }

      const { page = 1, limit = 20 } = ctx.query;
      const skip = (page - 1) * limit;

      const reviews = await Review.getPendingReviews(parseInt(limit), skip);
      const total = await Review.countDocuments({ status: 'pending', deleted: false });

      ctx.body = {
        success: true,
        data: {
          reviews,
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

  // Admin: Get flagged reviews
  async getFlaggedReviews(ctx) {
    try {
      if (ctx.state.user.role !== 'admin') {
        ctx.status = 403;
        ctx.body = { error: 'Admin access required' };
        return;
      }

      const { page = 1, limit = 20 } = ctx.query;
      const skip = (page - 1) * limit;

      const reviews = await Review.getFlaggedReviews(parseInt(limit), skip);
      const total = await Review.countDocuments({ 'flags.0': { $exists: true }, deleted: false });

      ctx.body = {
        success: true,
        data: {
          reviews,
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

  // Admin: Approve review
  async approveReview(ctx) {
    try {
      if (ctx.state.user.role !== 'admin') {
        ctx.status = 403;
        ctx.body = { error: 'Admin access required' };
        return;
      }

      const { id } = ctx.params;
      const { notes } = ctx.request.body;
      const moderatorId = ctx.state.user.id;

      const review = await Review.findById(id);

      if (!review || review.deleted) {
        ctx.status = 404;
        ctx.body = { error: 'Review not found' };
        return;
      }

      await review.approveReview(moderatorId, notes);

      // Notify user that review was approved
      await this.notifyUserReviewApproved(review);

      ctx.body = {
        success: true,
        message: 'Review approved successfully'
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Admin: Reject review
  async rejectReview(ctx) {
    try {
      if (ctx.state.user.role !== 'admin') {
        ctx.status = 403;
        ctx.body = { error: 'Admin access required' };
        return;
      }

      const { id } = ctx.params;
      const { notes } = ctx.request.body;
      const moderatorId = ctx.state.user.id;

      const review = await Review.findById(id);

      if (!review || review.deleted) {
        ctx.status = 404;
        ctx.body = { error: 'Review not found' };
        return;
      }

      await review.rejectReview(moderatorId, notes);

      // Notify user that review was rejected
      await this.notifyUserReviewRejected(review, notes);

      ctx.body = {
        success: true,
        message: 'Review rejected successfully'
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Admin: Resolve flag
  async resolveFlag(ctx) {
    try {
      if (ctx.state.user.role !== 'admin') {
        ctx.status = 403;
        ctx.body = { error: 'Admin access required' };
        return;
      }

      const { id, flagIndex } = ctx.params;
      const { action } = ctx.request.body; // 'resolve' or 'dismiss'

      const review = await Review.findById(id);

      if (!review || review.deleted) {
        ctx.status = 404;
        ctx.body = { error: 'Review not found' };
        return;
      }

      if (!review.flags[flagIndex]) {
        ctx.status = 404;
        ctx.body = { error: 'Flag not found' };
        return;
      }

      review.flags[flagIndex].status = action === 'resolve' ? 'resolved' : 'dismissed';
      await review.save();

      ctx.body = {
        success: true,
        message: `Flag ${action}d successfully`
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Get review statistics
  async getReviewStats(ctx) {
    try {
      const { restaurantId } = ctx.params;

      const [ratingStats, detailedRatings, recentReviews] = await Promise.all([
        Review.getAverageRating(restaurantId),
        Review.getDetailedRatings(restaurantId),
        Review.getRecentReviews(restaurantId, 5)
      ]);

      ctx.body = {
        success: true,
        data: {
          ratingStats,
          detailedRatings,
          recentReviews
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  }

  // Helper methods

  // Analyze sentiment of review content
  async analyzeSentiment(content) {
    // Simple sentiment analysis (in production, use a proper NLP service)
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'delicious', 'perfect', 'love', 'enjoyed'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'disappointed', 'worst', 'poor', 'mediocre'];

    const words = content.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const total = words.length;
    const positiveScore = positiveCount / total;
    const negativeScore = negativeCount / total;
    const score = positiveScore - negativeScore;

    return {
      score: Math.max(-1, Math.min(1, score)),
      confidence: Math.abs(score),
      label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral'
    };
  }

  // Notify restaurant of new review
  async notifyRestaurant(review) {
    try {
      const restaurant = await Restaurant.findById(review.restaurantId);
      if (restaurant.email) {
        await sendEmail({
          to: restaurant.email,
          subject: `New Review for ${restaurant.name}`,
          html: `
            <h2>New Review Received</h2>
            <p>A new review has been submitted for ${restaurant.name}.</p>
            <p><strong>Rating:</strong> ${review.overallRating}/5</p>
            <p><strong>Title:</strong> ${review.title}</p>
            <p><strong>Content:</strong> ${review.content.substring(0, 200)}...</p>
            <p>The review is pending approval and will be visible once approved.</p>
          `
        });
      }
    } catch (error) {
      console.error('Failed to notify restaurant:', error);
    }
  }

  // Notify user that review was approved
  async notifyUserReviewApproved(review) {
    try {
      const user = await User.findById(review.userId);
      const restaurant = await Restaurant.findById(review.restaurantId);
      
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Your Review Has Been Approved',
          html: `
            <h2>Review Approved</h2>
            <p>Your review for ${restaurant.name} has been approved and is now visible on our platform.</p>
            <p><strong>Title:</strong> ${review.title}</p>
            <p><strong>Rating:</strong> ${review.overallRating}/5</p>
            <p>Thank you for sharing your experience!</p>
          `
        });
      }
    } catch (error) {
      console.error('Failed to notify user of approval:', error);
    }
  }

  // Notify user that review was rejected
  async notifyUserReviewRejected(review, notes) {
    try {
      const user = await User.findById(review.userId);
      const restaurant = await Restaurant.findById(review.restaurantId);
      
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Review Update',
          html: `
            <h2>Review Status Update</h2>
            <p>Your review for ${restaurant.name} could not be published at this time.</p>
            ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ''}
            <p>You can edit your review and resubmit it for approval.</p>
          `
        });
      }
    } catch (error) {
      console.error('Failed to notify user of rejection:', error);
    }
  }
}

module.exports = new ReviewController(); 