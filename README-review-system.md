# DineFlow Review and Rating System

## Overview
The DineFlow Review and Rating System provides comprehensive functionality for managing customer reviews, ratings, and feedback for restaurants. It includes advanced features like sentiment analysis, moderation workflows, analytics, and security measures.

## Features

### Core Features
- **Review Creation**: Users can create detailed reviews with ratings for multiple categories
- **Photo Upload**: Support for multiple photo uploads with validation and optimization
- **Rating System**: 1-5 star rating system with detailed category ratings (food, service, ambiance, value)
- **Sentiment Analysis**: Automatic sentiment analysis of review content using NLP
- **Moderation System**: Admin moderation with approval/rejection workflow and notes
- **Flagging System**: User flagging of inappropriate reviews with reason tracking
- **Helpful Votes**: Users can mark reviews as helpful with vote tracking
- **Verification**: Support for verified reviews from confirmed bookings

### Analytics Features
- **Review Analytics**: Comprehensive analytics and reporting dashboard
- **Trend Analysis**: Review trends over time with customizable time ranges
- **Sentiment Trends**: Sentiment analysis trends and patterns
- **Top Restaurants**: Ranking based on reviews, ratings, and helpful votes
- **Keyword Analysis**: Top keywords extraction from review content
- **Moderation Analytics**: Moderation workflow analytics and performance metrics
- **User Analytics**: Individual user review statistics and history

### Security Features
- **Rate Limiting**: Prevents spam and abuse with configurable limits
- **Content Filtering**: Automatic content filtering with customizable rules
- **File Validation**: Secure file upload validation with virus scanning
- **Access Control**: Role-based access control for different user types
- **Data Privacy**: GDPR compliance and user privacy protection

## API Endpoints

### Public Endpoints
- `GET /api/reviews/restaurant/:id` - Get reviews for a restaurant with filtering and pagination
- `GET /api/reviews/stats/:restaurantId` - Get review statistics for a restaurant
- `GET /api/reviews/:id` - Get a specific review with full details

### User Endpoints (Authenticated)
- `POST /api/reviews` - Create a new review with validation
- `GET /api/reviews/user/reviews` - Get user's review history
- `PUT /api/reviews/:id` - Update an existing review
- `DELETE /api/reviews/:id` - Delete a review (soft delete for admins)
- `POST /api/reviews/:id/helpful` - Mark review as helpful
- `DELETE /api/reviews/:id/helpful` - Remove helpful mark
- `POST /api/reviews/:id/flag` - Flag a review for moderation

### Admin Endpoints
- `GET /api/reviews/admin/pending` - Get pending reviews for moderation
- `GET /api/reviews/admin/flagged` - Get flagged reviews
- `POST /api/reviews/admin/:id/approve` - Approve a review with optional notes
- `POST /api/reviews/admin/:id/reject` - Reject a review with reason
- `POST /api/reviews/admin/:id/flags/:flagIndex/resolve` - Resolve a flag

### Analytics Endpoints
- `GET /api/review-analytics/overall` - Overall review statistics
- `GET /api/review-analytics/trends` - Review trends over time
- `GET /api/review-analytics/sentiment-trends` - Sentiment analysis trends
- `GET /api/review-analytics/moderation` - Moderation statistics
- `GET /api/review-analytics/keywords` - Top keywords from reviews
- `GET /api/review-analytics/top-restaurants` - Top performing restaurants
- `GET /api/review-analytics/user/:userId` - User review statistics
- `GET /api/review-analytics/compare` - Compare multiple restaurants
- `GET /api/review-analytics/export` - Export analytics data

## Database Schema

### Review Model
```javascript
{
  // Basic Information
  userId: ObjectId,           // Reference to User
  restaurantId: ObjectId,     // Reference to Restaurant
  bookingId: ObjectId,        // Reference to Booking
  
  // Rating System
  overallRating: Number,      // 1-5 stars
  ratings: {
    food: Number,             // 1-5 stars
    service: Number,          // 1-5 stars
    ambiance: Number,         // 1-5 stars
    value: Number             // 1-5 stars
  },
  
  // Content
  title: String,              // Review title (max 100 chars)
  content: String,            // Review content (max 2000 chars)
  photos: [{
    url: String,              // Photo URL
    caption: String,          // Optional caption
    uploadedAt: Date
  }],
  
  // Sentiment Analysis
  sentiment: {
    score: Number,            // -1 to 1
    label: String,            // 'positive', 'neutral', 'negative'
    confidence: Number        // 0 to 1
  },
  
  // Status and Moderation
  status: String,             // 'pending', 'approved', 'rejected', 'flagged'
  moderatedBy: ObjectId,      // Admin who moderated
  moderatedAt: Date,
  moderationNotes: String,
  
  // User Interactions
  helpful: {
    count: Number,
    users: [ObjectId]         // Users who marked as helpful
  },
  
  // Flagging System
  flags: [{
    userId: ObjectId,
    reason: String,           // 'inappropriate', 'spam', 'fake', 'offensive', 'other'
    description: String,
    createdAt: Date,
    status: String            // 'pending', 'resolved', 'dismissed'
  }],
  
  // Verification
  verified: Boolean,          // Verified review
  verifiedBooking: Boolean,   // From verified booking
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  
  // Soft Delete
  deleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId
}
```

## Configuration

### Environment Variables
```bash
# Review System Configuration
REVIEW_PHOTO_MAX_SIZE=5242880          # 5MB in bytes
REVIEW_PHOTO_MAX_COUNT=5               # Maximum photos per review
REVIEW_RATE_LIMIT_MAX=3                # Rate limit max requests
REVIEW_RATE_LIMIT_DURATION=60000       # Rate limit window (ms)
SENTIMENT_ANALYSIS_ENABLED=true        # Enable sentiment analysis
REVIEW_MODERATION_ENABLED=true         # Enable moderation system
REVIEW_AUTO_APPROVE_RATING_THRESHOLD=4 # Auto-approve threshold
REVIEW_CONTENT_FILTER_ENABLED=true     # Enable content filtering
REVIEW_HELPFUL_VOTE_ENABLED=true       # Enable helpful voting
REVIEW_FLAG_ENABLED=true               # Enable review flagging
```

### Security Configuration
```javascript
// config/review-security.js
module.exports = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
  },
  
  upload: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
    virusScan: true
  },
  
  contentFilter: {
    enabled: true,
    blockedWords: ['spam', 'fake', 'scam', 'hate', 'discrimination'],
    maxLength: 2000,
    minLength: 20
  },
  
  moderation: {
    autoApprove: {
      enabled: true,
      minRating: 4,
      minLength: 50,
      verifiedUserOnly: false
    },
    autoFlag: {
      enabled: true,
      maxFlags: 3,
      flagThreshold: 0.3
    }
  }
};
```

## Usage Examples

### Creating a Review
```javascript
const review = await api.post('/reviews', {
  restaurantId: 'restaurant_id',
  bookingId: 'booking_id',
  overallRating: 5,
  ratings: {
    food: 5,
    service: 4,
    ambiance: 5,
    value: 4
  },
  title: 'Amazing Experience!',
  content: 'Great food and excellent service. The ambiance was perfect for our date night.',
  photos: [
    { url: 'https://example.com/photo1.jpg', caption: 'Our delicious meal' }
  ]
});
```

### Getting Restaurant Reviews with Filters
```javascript
const reviews = await api.get('/reviews/restaurant/restaurant_id', {
  params: {
    page: 1,
    limit: 10,
    sort: 'recent',        // 'recent', 'helpful', 'rating'
    rating: 5,            // Filter by rating
    status: 'approved'    // Filter by status
  }
});

// Response includes:
// - reviews array
// - pagination info
// - statistics (average rating, total reviews, etc.)
```

### Admin Moderation
```javascript
// Approve a review
await api.post('/reviews/admin/review_id/approve', {
  notes: 'Approved after review - content meets guidelines'
});

// Reject a review
await api.post('/reviews/admin/review_id/reject', {
  notes: 'Content violates community guidelines - inappropriate language'
});

// Resolve a flag
await api.post('/reviews/admin/review_id/flags/0/resolve', {
  action: 'resolve' // or 'dismiss'
});
```

### Analytics Usage
```javascript
// Get overall statistics
const overallStats = await api.get('/review-analytics/overall', {
  params: { timeRange: '30d' }
});

// Get review trends
const trends = await api.get('/review-analytics/trends', {
  params: { 
    timeRange: '90d',
    groupBy: 'day' // 'hour', 'day', 'week', 'month'
  }
});

// Get sentiment trends
const sentiment = await api.get('/review-analytics/sentiment-trends', {
  params: { timeRange: '30d' }
});

// Export analytics data
const csvData = await api.get('/review-analytics/export', {
  params: {
    type: 'trends',
    timeRange: '30d',
    format: 'csv'
  }
});
```

## Frontend Components

### ReviewForm Component
```jsx
<ReviewForm
  booking={booking}
  restaurant={restaurant}
  onSubmit={(review) => console.log('Review submitted:', review)}
  onCancel={() => console.log('Cancelled')}
/>
```

### ReviewList Component
```jsx
<ReviewList
  restaurantId="restaurant_id"
  showFilters={true}
  limit={10}
/>
```

### ReviewCard Component
```jsx
<ReviewCard
  review={review}
  showActions={true}
  onUpdate={(id, data) => console.log('Updated:', id, data)}
  onDelete={(id) => console.log('Deleted:', id)}
/>
```

### ReviewModeration Component
```jsx
<ReviewModeration />
```

### ReviewAnalyticsDashboard Component
```jsx
<ReviewAnalyticsDashboard restaurantId="optional_restaurant_id" />
```

## Monitoring and Analytics

### Key Metrics
- **Review Submission Rate**: Number of reviews submitted per time period
- **Moderation Backlog**: Number of pending reviews awaiting moderation
- **Average Rating Trends**: Changes in average ratings over time
- **Sentiment Distribution**: Distribution of positive/neutral/negative reviews
- **Flagged Review Rate**: Percentage of reviews that get flagged
- **Helpful Vote Rate**: Percentage of reviews that receive helpful votes

### Alerts
- High review submission rate (potential spam)
- Large moderation backlog (needs attention)
- Low average ratings (quality issues)
- High flagged review count (content problems)

### Dashboard Features
- Interactive charts and graphs
- Real-time metrics
- Export functionality
- Customizable time ranges
- Comparative analysis

## Security Considerations

### Input Validation
- All text inputs are validated and sanitized
- File uploads are validated for type, size, and content
- Rating values are constrained to valid ranges
- Content length limits are enforced

### Rate Limiting
- Review submission rate limiting
- API endpoint rate limiting
- IP-based and user-based limits
- Configurable thresholds and windows

### Content Filtering
- Automatic detection of inappropriate content
- Configurable blocked word lists
- Sentiment-based flagging
- Manual review workflow

### Access Control
- Role-based permissions (user, admin)
- Authentication required for all user actions
- Admin-only moderation endpoints
- Audit trail for all admin actions

### Data Privacy
- GDPR compliance
- User data anonymization options
- Data retention policies
- Export and deletion capabilities

## Performance Optimization

### Database Indexes
```javascript
// Optimized indexes for performance
{ restaurantId: 1, status: 1, createdAt: -1 }
{ userId: 1, createdAt: -1 }
{ overallRating: 1, status: 1 }
{ 'sentiment.label': 1, status: 1 }
{ verified: 1, status: 1 }
{ status: 1, deleted: false }
{ 'flags.0': { $exists: true }, deleted: false }
{ bookingId: 1 } // Unique index
{ createdAt: 1 } // TTL index for soft-deleted reviews
```

### Caching Strategy
- Redis caching for frequently accessed data
- Review statistics caching
- Analytics result caching
- User session caching

### Image Optimization
- Automatic image compression
- Multiple size variants
- CDN integration
- Lazy loading support

## Troubleshooting

### Common Issues

1. **Review not appearing**
   - Check if review is pending moderation
   - Verify user permissions
   - Check review status

2. **Photo upload failed**
   - Verify file size limits
   - Check file type restrictions
   - Ensure upload directory permissions

3. **Rate limit exceeded**
   - Wait before submitting another review
   - Check rate limit configuration
   - Verify user authentication

4. **Permission denied**
   - Ensure user is authenticated
   - Check user role permissions
   - Verify API endpoint access

5. **Analytics not loading**
   - Check database connectivity
   - Verify analytics service status
   - Check time range parameters

### Debug Mode
Enable debug logging:
```bash
DEBUG=review-system:* npm start
```

### Log Files
- Application logs: `logs/app.log`
- Review system logs: `logs/review-system.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

## Testing

### Unit Tests
```bash
npm run test:reviews
```

### Integration Tests
```bash
npm run test:integration:reviews
```

### Load Testing
```bash
npm run test:load:reviews
```

## Deployment

### Production Setup
1. Set up environment variables
2. Configure database indexes
3. Set up file storage (S3 recommended)
4. Configure monitoring and alerts
5. Set up backup procedures
6. Configure CDN for images
7. Set up SSL certificates

### Docker Deployment
```bash
# Build and run with Docker
docker-compose -f docker-compose.reviews.yml up -d
```

### Monitoring Setup
```bash
# Set up monitoring stack
./scripts/monitoring-setup.sh
```

## Support and Maintenance

### Regular Maintenance
- Database index optimization
- Log rotation and cleanup
- Backup verification
- Performance monitoring
- Security updates

### Support Channels
- Documentation: This README
- Issues: GitHub repository
- Email: support@dineflow.com
- Chat: Slack channel

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License
This review system is part of the DineFlow project and is licensed under the MIT License. 