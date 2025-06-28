#!/bin/bash

# Review and Rating System Setup Script for DineFlow
# This script sets up the complete review and rating system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/review-system-setup.log"
BACKUP_DIR="$PROJECT_ROOT/backups/review-system"

# Create necessary directories
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$BACKUP_DIR"
mkdir -p "$PROJECT_ROOT/uploads/review-photos"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 16 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 16 ]]; then
        error "Node.js version 16 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed."
        exit 1
    fi
    
    # Check MongoDB
    if ! command -v mongod &> /dev/null; then
        warning "MongoDB is not installed. Please install MongoDB for local development."
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        info "Docker is available"
    else
        warning "Docker is not installed. Some features may not work."
    fi
    
    log "System requirements check completed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install npm packages
    if [[ -f "package.json" ]]; then
        npm install
        log "npm dependencies installed"
    else
        error "package.json not found"
        exit 1
    fi
    
    # Install additional packages for review system
    npm install --save \
        multer \
        sharp \
        koa-ratelimit \
        natural \
        compromise \
        sentiment \
        wordcloud \
        chart.js \
        moment
    
    log "Review system dependencies installed"
}

# Setup database indexes
setup_database_indexes() {
    log "Setting up database indexes for review system..."
    
    cd "$PROJECT_ROOT"
    
    # Create MongoDB indexes for reviews
    cat > setup-review-indexes.js << 'EOF'
const mongoose = require('mongoose');
require('dotenv').config();

async function setupIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dineflow');
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        
        // Create indexes for reviews collection
        await db.collection('reviews').createIndexes([
            { key: { restaurantId: 1, status: 1, createdAt: -1 } },
            { key: { userId: 1, createdAt: -1 } },
            { key: { overallRating: 1, status: 1 } },
            { key: { 'sentiment.label': 1, status: 1 } },
            { key: { verified: 1, status: 1 } },
            { key: { status: 1, deleted:1  } }, 
            { key: { bookingId: 1 }, unique: true },
            { key: { createdAt: 1 }, expireAfterSeconds: 7776000 } // 90 days TTL for soft-deleted reviews
        ]);
        
        console.log('Review indexes created successfully');
        
        // Create text index for search
        await db.collection('reviews').createIndex({
            title: 'text',
            content: 'text'
        });
        
        console.log('Text search index created');
        
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        
    } catch (error) {
        console.error('Error setting up indexes:', error);
        process.exit(1);
    }
}

setupIndexes();
EOF
    
    node setup-review-indexes.js
    rm setup-review-indexes.js
    
    log "Database indexes setup completed"
}

# Setup file upload configuration
setup_file_upload() {
    log "Setting up file upload configuration..."
    
    # Create upload directories
    mkdir -p "$PROJECT_ROOT/uploads/review-photos"
    mkdir -p "$PROJECT_ROOT/uploads/temp"
    
    # Set permissions
    chmod 755 "$PROJECT_ROOT/uploads"
    chmod 755 "$PROJECT_ROOT/uploads/review-photos"
    chmod 755 "$PROJECT_ROOT/uploads/temp"
    
    # Create .gitkeep files
    touch "$PROJECT_ROOT/uploads/review-photos/.gitkeep"
    touch "$PROJECT_ROOT/uploads/temp/.gitkeep"
    
    log "File upload configuration completed"
}

# Setup environment variables
setup_environment() {
    log "Setting up environment variables..."
    
    cd "$PROJECT_ROOT"
    
    # Check if .env exists
    if [[ ! -f ".env" ]]; then
        if [[ -f "env.example" ]]; then
            cp env.example .env
            warning "Created .env from env.example. Please update with your configuration."
        else
            error ".env file not found and no env.example available"
            exit 1
        fi
    fi
    
    # Add review system specific environment variables
    if ! grep -q "REVIEW_PHOTO_MAX_SIZE" .env; then
        echo "" >> .env
        echo "# Review System Configuration" >> .env
        echo "REVIEW_PHOTO_MAX_SIZE=5242880" >> .env
        echo "REVIEW_PHOTO_MAX_COUNT=5" >> .env
        echo "REVIEW_RATE_LIMIT_MAX=3" >> .env
        echo "REVIEW_RATE_LIMIT_DURATION=60000" >> .env
        echo "SENTIMENT_ANALYSIS_ENABLED=true" >> .env
        echo "REVIEW_MODERATION_ENABLED=true" >> .env
        echo "REVIEW_AUTO_APPROVE_RATING_THRESHOLD=4" >> .env
    fi
    
    log "Environment variables setup completed"
}

# Setup monitoring and logging
setup_monitoring() {
    log "Setting up monitoring for review system..."
    
    cd "$PROJECT_ROOT"
    
    # Create monitoring configuration
    cat > monitoring/review-metrics.yml << 'EOF'
# Review System Metrics Configuration
groups:
  - name: review_metrics
    rules:
      - alert: HighReviewSubmissionRate
        expr: rate(review_submissions_total[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High review submission rate detected"
          description: "Review submission rate is {{ $value }} per second"

      - alert: ReviewModerationBacklog
        expr: review_pending_count > 50
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Review moderation backlog detected"
          description: "{{ $value }} reviews pending moderation"

      - alert: LowReviewRating
        expr: avg(review_rating) < 3.0
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low average review rating"
          description: "Average rating is {{ $value }}"

      - alert: HighFlaggedReviews
        expr: review_flagged_count > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High number of flagged reviews"
          description: "{{ $value }} reviews are flagged"
EOF
    
    # Create log rotation configuration
    sudo tee /etc/logrotate.d/dineflow-reviews > /dev/null << 'EOF'
/path/to/dineflow/logs/review-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload dineflow
    endscript
}
EOF
    
    log "Monitoring setup completed"
}

# Setup backup configuration
setup_backup() {
    log "Setting up backup configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Create backup script
    cat > scripts/backup-reviews.sh << 'EOF'
#!/bin/bash

# Review System Backup Script
BACKUP_DIR="/path/to/dineflow/backups/review-system"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="reviews_backup_$DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup MongoDB reviews collection
mongodump --db dineflow --collection reviews --out "$BACKUP_DIR/$BACKUP_NAME"

# Backup uploaded photos
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_photos.tar.gz" -C /path/to/dineflow/uploads review-photos

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "reviews_backup_*" -mtime +7 -delete

echo "Review system backup completed: $BACKUP_NAME"
EOF
    
    chmod +x scripts/backup-reviews.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * /path/to/dineflow/scripts/backup-reviews.sh") | crontab -
    
    log "Backup configuration completed"
}

# Setup security configuration
setup_security() {
    log "Setting up security configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Create security configuration
    cat > config/review-security.js << 'EOF'
// Review System Security Configuration
module.exports = {
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP'
    },
    
    // File upload security
    upload: {
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
        virusScan: true
    },
    
    // Content filtering
    contentFilter: {
        enabled: true,
        blockedWords: [
            'spam', 'fake', 'scam', 'hate', 'discrimination'
        ],
        maxLength: 2000,
        minLength: 20
    },
    
    // Moderation
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
EOF
    
    log "Security configuration completed"
}

# Setup testing
setup_testing() {
    log "Setting up testing for review system..."
    
    cd "$PROJECT_ROOT"
    
    # Create test configuration
    cat > tests/review-system.test.js << 'EOF'
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Review = require('../src/models/Review');

describe('Review System', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/dineflow-test');
    });
    
    afterAll(async () => {
        await mongoose.connection.close();
    });
    
    beforeEach(async () => {
        await Review.deleteMany({});
    });
    
    describe('POST /api/reviews', () => {
        it('should create a new review', async () => {
            const reviewData = {
                restaurantId: new mongoose.Types.ObjectId(),
                bookingId: new mongoose.Types.ObjectId(),
                overallRating: 5,
                ratings: {
                    food: 5,
                    service: 5,
                    ambiance: 5,
                    value: 5
                },
                title: 'Great experience!',
                content: 'Amazing food and service. Highly recommended!'
            };
            
            const response = await request(app)
                .post('/api/reviews')
                .send(reviewData)
                .expect(201);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(reviewData.title);
        });
    });
    
    describe('GET /api/reviews/restaurant/:id', () => {
        it('should get reviews for a restaurant', async () => {
            const restaurantId = new mongoose.Types.ObjectId();
            
            // Create test reviews
            await Review.create([
                {
                    userId: new mongoose.Types.ObjectId(),
                    restaurantId,
                    bookingId: new mongoose.Types.ObjectId(),
                    overallRating: 5,
                    ratings: { food: 5, service: 5, ambiance: 5, value: 5 },
                    title: 'Great!',
                    content: 'Amazing!',
                    status: 'approved'
                }
            ]);
            
            const response = await request(app)
                .get(`/api/reviews/restaurant/${restaurantId}`)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data.reviews).toHaveLength(1);
        });
    });
});
EOF
    
    # Add test script to package.json
    if [[ -f "package.json" ]]; then
        npm pkg set scripts.test:reviews="jest tests/review-system.test.js"
    fi
    
    log "Testing setup completed"
}

# Setup documentation
setup_documentation() {
    log "Setting up documentation..."
    
    cd "$PROJECT_ROOT"
    
    # Create README for review system
    cat > README-review-system.md << 'EOF'
# DineFlow Review and Rating System

## Overview
The DineFlow Review and Rating System provides comprehensive functionality for managing customer reviews, ratings, and feedback for restaurants.

## Features

### Core Features
- **Review Creation**: Users can create detailed reviews with ratings for multiple categories
- **Photo Upload**: Support for multiple photo uploads with validation
- **Rating System**: 1-5 star rating system with detailed category ratings
- **Sentiment Analysis**: Automatic sentiment analysis of review content
- **Moderation System**: Admin moderation with approval/rejection workflow
- **Flagging System**: User flagging of inappropriate reviews
- **Helpful Votes**: Users can mark reviews as helpful

### Analytics Features
- **Review Analytics**: Comprehensive analytics and reporting
- **Trend Analysis**: Review trends over time
- **Sentiment Trends**: Sentiment analysis trends
- **Top Restaurants**: Ranking based on reviews and ratings
- **Keyword Analysis**: Top keywords from reviews
- **Moderation Analytics**: Moderation workflow analytics

### Security Features
- **Rate Limiting**: Prevents spam and abuse
- **Content Filtering**: Automatic content filtering
- **File Validation**: Secure file upload validation
- **Access Control**: Role-based access control

## API Endpoints

### Public Endpoints
- `GET /api/reviews/restaurant/:id` - Get reviews for a restaurant
- `GET /api/reviews/stats/:restaurantId` - Get review statistics
- `GET /api/reviews/:id` - Get a specific review

### User Endpoints (Authenticated)
- `POST /api/reviews` - Create a new review
- `GET /api/reviews/user/reviews` - Get user's reviews
- `PUT /api/reviews/:id` - Update a review
- `DELETE /api/reviews/:id` - Delete a review
- `POST /api/reviews/:id/helpful` - Mark review as helpful
- `DELETE /api/reviews/:id/helpful` - Remove helpful mark
- `POST /api/reviews/:id/flag` - Flag a review

### Admin Endpoints
- `GET /api/reviews/admin/pending` - Get pending reviews
- `GET /api/reviews/admin/flagged` - Get flagged reviews
- `POST /api/reviews/admin/:id/approve` - Approve a review
- `POST /api/reviews/admin/:id/reject` - Reject a review
- `POST /api/reviews/admin/:id/flags/:flagIndex/resolve` - Resolve a flag

### Analytics Endpoints
- `GET /api/review-analytics/overall` - Overall review statistics
- `GET /api/review-analytics/trends` - Review trends
- `GET /api/review-analytics/sentiment-trends` - Sentiment trends
- `GET /api/review-analytics/moderation` - Moderation statistics
- `GET /api/review-analytics/keywords` - Top keywords

## Database Schema

### Review Model
```javascript
{
  userId: ObjectId,
  restaurantId: ObjectId,
  bookingId: ObjectId,
  overallRating: Number (1-5),
  ratings: {
    food: Number (1-5),
    service: Number (1-5),
    ambiance: Number (1-5),
    value: Number (1-5)
  },
  title: String,
  content: String,
  photos: [{
    url: String,
    caption: String
  }],
  sentiment: {
    score: Number (-1 to 1),
    label: String,
    confidence: Number
  },
  status: String (pending/approved/rejected/flagged),
  helpful: {
    count: Number,
    users: [ObjectId]
  },
  flags: [{
    userId: ObjectId,
    reason: String,
    description: String,
    status: String
  }],
  verified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Configuration

### Environment Variables
- `REVIEW_PHOTO_MAX_SIZE`: Maximum photo file size (default: 5MB)
- `REVIEW_PHOTO_MAX_COUNT`: Maximum photos per review (default: 5)
- `REVIEW_RATE_LIMIT_MAX`: Rate limit max requests (default: 3)
- `REVIEW_RATE_LIMIT_DURATION`: Rate limit window (default: 60000ms)
- `SENTIMENT_ANALYSIS_ENABLED`: Enable sentiment analysis (default: true)
- `REVIEW_MODERATION_ENABLED`: Enable moderation (default: true)
- `REVIEW_AUTO_APPROVE_RATING_THRESHOLD`: Auto-approve threshold (default: 4)

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
  content: 'Great food and excellent service...'
});
```

### Getting Restaurant Reviews
```javascript
const reviews = await api.get('/reviews/restaurant/restaurant_id', {
  params: {
    page: 1,
    limit: 10,
    sort: 'recent',
    rating: 5
  }
});
```

### Admin Moderation
```javascript
// Approve a review
await api.post('/reviews/admin/review_id/approve', {
  notes: 'Approved after review'
});

// Reject a review
await api.post('/reviews/admin/review_id/reject', {
  notes: 'Content violates guidelines'
});
```

## Monitoring

### Metrics
- Review submission rate
- Moderation backlog
- Average rating trends
- Sentiment analysis accuracy
- Flagged review rate

### Alerts
- High review submission rate
- Large moderation backlog
- Low average ratings
- High flagged review count

## Security Considerations

1. **Input Validation**: All inputs are validated and sanitized
2. **Rate Limiting**: Prevents abuse and spam
3. **File Upload Security**: Validates file types and sizes
4. **Content Filtering**: Filters inappropriate content
5. **Access Control**: Role-based permissions
6. **Data Privacy**: Respects user privacy and GDPR compliance

## Troubleshooting

### Common Issues

1. **Review not appearing**: Check if review is pending moderation
2. **Photo upload failed**: Verify file size and type restrictions
3. **Rate limit exceeded**: Wait before submitting another review
4. **Permission denied**: Ensure user has proper authentication

### Debug Mode
Enable debug logging by setting `DEBUG=review-system:*` environment variable.

## Support

For support and questions about the review system, please contact the development team or create an issue in the project repository.
EOF
    
    log "Documentation setup completed"
}

# Main setup function
main() {
    log "Starting Review and Rating System Setup..."
    
    check_root
    check_requirements
    install_dependencies
    setup_database_indexes
    setup_file_upload
    setup_environment
    setup_monitoring
    setup_backup
    setup_security
    setup_testing
    setup_documentation
    
    log "Review and Rating System Setup Completed Successfully!"
    log "Next steps:"
    log "1. Update .env file with your configuration"
    log "2. Start the application: npm start"
    log "3. Access the admin panel to manage reviews"
    log "4. Monitor logs at: $LOG_FILE"
}

# Run main function
main "$@" 