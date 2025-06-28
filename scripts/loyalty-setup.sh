#!/bin/bash

# Loyalty Program Setup Script for DineFlow
# This script sets up the complete loyalty program system

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
LOG_FILE="$PROJECT_ROOT/logs/loyalty-setup.log"
BACKUP_DIR="$PROJECT_ROOT/backups/loyalty-system"

# Create necessary directories
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$BACKUP_DIR"

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
    
    log "System requirements check completed"
}

# Install dependencies
install_dependencies() {
    log "Installing loyalty program dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install additional packages for loyalty system
    npm install --save \
        moment \
        uuid \
        crypto \
        jsonwebtoken \
        bcryptjs \
        validator \
        lodash \
        node-cron \
        winston \
        express-rate-limit \
        helmet \
        compression \
        morgan
    
    log "Loyalty program dependencies installed"
}

# Setup database indexes
setup_database_indexes() {
    log "Setting up database indexes for loyalty system..."
    
    cd "$PROJECT_ROOT"
    
    # Create MongoDB indexes for loyalty accounts
    cat > setup-loyalty-indexes.js << 'EOF'
const mongoose = require('mongoose');
require('dotenv').config();

async function setupIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dineflow');
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        
        // Create indexes for loyalty accounts collection
        await db.collection('loyaltyaccounts').createIndexes([
            { key: { userId: 1 }, unique: true },
            { key: { status: 1, 'points.current': -1 } },
            { key: { 'tier.level': 1, 'points.current': -1 } },
            { key: { 'membership.joinDate': -1 } },
            { key: { 'activity.lastActivity': -1 } },
            { key: { 'streaks.bookingStreak.current': -1 } },
            { key: { 'streaks.reviewStreak.current': -1 } },
            { key: { 'rewards.redeemed.status': 1, 'rewards.redeemed.expiresAt': 1 } },
            { key: { 'pointsHistory.date': -1 } },
            { key: { 'challenges.daily.completed': 1 } },
            { key: { 'challenges.weekly.completed': 1 } }
        ]);
        
        console.log('Loyalty account indexes created successfully');
        
        // Create indexes for loyalty programs collection
        await db.collection('loyaltyprograms').createIndexes([
            { key: { isActive: 1 } },
            { key: { 'partnerRestaurants.restaurantId': 1 } },
            { key: { 'rewards.isActive': 1 } },
            { key: { 'tiers.level': 1 } }
        ]);
        
        console.log('Loyalty program indexes created successfully');
        
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        
    } catch (error) {
        console.error('Error setting up indexes:', error);
        process.exit(1);
    }
}

setupIndexes();
EOF
    
    node setup-loyalty-indexes.js
    rm setup-loyalty-indexes.js
    
    log "Database indexes setup completed"
}

# Setup default loyalty program
setup_default_program() {
    log "Setting up default loyalty program..."
    
    cd "$PROJECT_ROOT"
    
    # Create default loyalty program
    cat > setup-default-program.js << 'EOF'
const mongoose = require('mongoose');
const LoyaltyProgram = require('./src/models/LoyaltyProgram');
require('dotenv').config();

async function setupDefaultProgram() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dineflow');
        console.log('Connected to MongoDB');
        
        // Check if program already exists
        const existingProgram = await LoyaltyProgram.getActiveProgram();
        if (existingProgram) {
            console.log('Loyalty program already exists');
            await mongoose.disconnect();
            return;
        }
        
        // Create default program
        const defaultProgram = new LoyaltyProgram({
            name: 'DineFlow Rewards',
            description: 'Earn points for every dining experience and unlock exclusive rewards',
            isActive: true,
            
            pointsConfig: {
                bookingPoints: {
                    basePoints: 100,
                    pointsPerDollar: 10,
                    maxPointsPerBooking: 1000
                },
                reviewPoints: 50,
                referralPoints: 200,
                socialSharePoints: 25,
                checkinPoints: 30,
                expirationDays: 365
            },
            
            tiers: [
                {
                    name: 'Bronze',
                    level: 1,
                    minPoints: 0,
                    maxPoints: 999,
                    benefits: [
                        {
                            type: 'discount',
                            value: 5,
                            description: '5% discount on all bookings'
                        }
                    ],
                    color: '#CD7F32',
                    icon: 'bronze'
                },
                {
                    name: 'Silver',
                    level: 2,
                    minPoints: 1000,
                    maxPoints: 4999,
                    benefits: [
                        {
                            type: 'discount',
                            value: 10,
                            description: '10% discount on all bookings'
                        },
                        {
                            type: 'priority_booking',
                            value: true,
                            description: 'Priority booking access'
                        }
                    ],
                    color: '#C0C0C0',
                    icon: 'silver'
                },
                {
                    name: 'Gold',
                    level: 3,
                    minPoints: 5000,
                    maxPoints: 19999,
                    benefits: [
                        {
                            type: 'discount',
                            value: 15,
                            description: '15% discount on all bookings'
                        },
                        {
                            type: 'priority_booking',
                            value: true,
                            description: 'Priority booking access'
                        },
                        {
                            type: 'free_item',
                            value: 'dessert',
                            description: 'Free dessert with every meal'
                        }
                    ],
                    color: '#FFD700',
                    icon: 'gold'
                },
                {
                    name: 'Platinum',
                    level: 4,
                    minPoints: 20000,
                    benefits: [
                        {
                            type: 'discount',
                            value: 20,
                            description: '20% discount on all bookings'
                        },
                        {
                            type: 'priority_booking',
                            value: true,
                            description: 'Priority booking access'
                        },
                        {
                            type: 'free_item',
                            value: 'appetizer',
                            description: 'Free appetizer with every meal'
                        },
                        {
                            type: 'exclusive_access',
                            value: 'vip_events',
                            description: 'Exclusive access to VIP events'
                        }
                    ],
                    color: '#E5E4E2',
                    icon: 'platinum'
                }
            ],
            
            rewards: [
                {
                    name: '$5 Off Next Booking',
                    description: 'Get $5 off your next restaurant booking',
                    pointsCost: 500,
                    type: 'discount',
                    value: 5,
                    category: 'discounts'
                },
                {
                    name: 'Free Dessert',
                    description: 'Enjoy a complimentary dessert with your meal',
                    pointsCost: 300,
                    type: 'free_item',
                    value: 'dessert',
                    category: 'food'
                },
                {
                    name: 'Free Appetizer',
                    description: 'Start your meal with a free appetizer',
                    pointsCost: 400,
                    type: 'free_item',
                    value: 'appetizer',
                    category: 'food'
                },
                {
                    name: 'Priority Booking',
                    description: 'Skip the queue with priority booking access',
                    pointsCost: 200,
                    type: 'exclusive_access',
                    value: 'priority_booking',
                    category: 'experiences'
                },
                {
                    name: 'DineFlow T-Shirt',
                    description: 'Show your loyalty with a DineFlow branded t-shirt',
                    pointsCost: 1000,
                    type: 'merchandise',
                    value: 'tshirt',
                    category: 'merchandise'
                }
            ],
            
            gamification: {
                dailyChallenges: [
                    {
                        name: 'Daily Diner',
                        description: 'Make a booking today',
                        type: 'booking',
                        target: 1,
                        pointsReward: 50
                    },
                    {
                        name: 'Review Master',
                        description: 'Write a review today',
                        type: 'review',
                        target: 1,
                        pointsReward: 25
                    },
                    {
                        name: 'Check-in Champion',
                        description: 'Check in at a restaurant today',
                        type: 'checkin',
                        target: 1,
                        pointsReward: 30
                    }
                ],
                weeklyChallenges: [
                    {
                        name: 'Weekend Warrior',
                        description: 'Make 3 bookings this week',
                        type: 'booking',
                        target: 3,
                        pointsReward: 200
                    },
                    {
                        name: 'Review Roundup',
                        description: 'Write 2 reviews this week',
                        type: 'review',
                        target: 2,
                        pointsReward: 100
                    }
                ],
                streaks: {
                    enabled: true,
                    bookingStreak: {
                        pointsPerDay: 10,
                        maxStreak: 30
                    },
                    reviewStreak: {
                        pointsPerDay: 5,
                        maxStreak: 7
                    }
                }
            },
            
            settings: {
                minRedemptionPoints: 100,
                pointsToCurrencyRate: 0.01,
                autoTierUpgrade: true,
                tierDowngradeGracePeriod: 90,
                welcomeBonus: 100,
                birthdayBonus: 200,
                anniversaryBonus: 500
            }
        });
        
        await defaultProgram.save();
        console.log('Default loyalty program created successfully');
        
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        
    } catch (error) {
        console.error('Error setting up default program:', error);
        process.exit(1);
    }
}

setupDefaultProgram();
EOF
    
    node setup-default-program.js
    rm setup-default-program.js
    
    log "Default loyalty program setup completed"
}

# Setup cron jobs
setup_cron_jobs() {
    log "Setting up cron jobs for loyalty system..."
    
    cd "$PROJECT_ROOT"
    
    # Create cron job script
    cat > scripts/loyalty-cron.js << 'EOF'
const cron = require('node-cron');
const mongoose = require('mongoose');
const LoyaltyAccount = require('../src/models/LoyaltyAccount');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Daily tasks (run at 2 AM)
cron.schedule('0 2 * * *', async () => {
    console.log('Running daily loyalty tasks...');
    
    try {
        // Reset daily challenges
        await LoyaltyAccount.updateMany(
            {},
            {
                $set: {
                    'challenges.daily.$[].progress': 0,
                    'challenges.daily.$[].completed': false,
                    'challenges.daily.$[].claimed': false
                }
            }
        );
        
        // Check for expired points
        const accounts = await LoyaltyAccount.find({});
        for (const account of accounts) {
            await account.checkExpiredPoints();
        }
        
        // Check for tier upgrades/downgrades
        for (const account of accounts) {
            await account.checkTierChanges();
        }
        
        console.log('Daily loyalty tasks completed');
    } catch (error) {
        console.error('Error in daily loyalty tasks:', error);
    }
});

// Weekly tasks (run on Monday at 3 AM)
cron.schedule('0 3 * * 1', async () => {
    console.log('Running weekly loyalty tasks...');
    
    try {
        // Reset weekly challenges
        await LoyaltyAccount.updateMany(
            {},
            {
                $set: {
                    'challenges.weekly.$[].progress': 0,
                    'challenges.weekly.$[].completed': false,
                    'challenges.weekly.$[].claimed': false
                }
            }
        );
        
        // Generate weekly reports
        // This would integrate with your reporting system
        
        console.log('Weekly loyalty tasks completed');
    } catch (error) {
        console.error('Error in weekly loyalty tasks:', error);
    }
});

// Monthly tasks (run on 1st of month at 4 AM)
cron.schedule('0 4 1 * *', async () => {
    console.log('Running monthly loyalty tasks...');
    
    try {
        // Check for birthday bonuses
        const accounts = await LoyaltyAccount.find({});
        for (const account of accounts) {
            await account.checkBirthdayBonus();
        }
        
        // Check for anniversary bonuses
        for (const account of accounts) {
            await account.checkAnniversaryBonus();
        }
        
        console.log('Monthly loyalty tasks completed');
    } catch (error) {
        console.error('Error in monthly loyalty tasks:', error);
    }
});

console.log('Loyalty cron jobs started');
EOF
    
    # Create PM2 ecosystem file for cron jobs
    cat > ecosystem.loyalty.json << 'EOF'
{
  "apps": [
    {
      "name": "loyalty-cron",
      "script": "./scripts/loyalty-cron.js",
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "1G",
      "env": {
        "NODE_ENV": "production"
      }
    }
  ]
}
EOF
    
    log "Cron jobs setup completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring for loyalty system..."
    
    cd "$PROJECT_ROOT"
    
    # Create monitoring configuration
    cat > monitoring/loyalty-metrics.yml << 'EOF'
# Loyalty System Metrics Configuration
groups:
  - name: loyalty_metrics
    rules:
      - alert: HighLoyaltyPointsAwarded
        expr: rate(loyalty_points_awarded_total[5m]) > 100
        for: 2m
        labels:
          severity: info
        annotations:
          summary: "High loyalty points awarded"
          description: "Loyalty points awarded at {{ $value }} per second"

      - alert: LowLoyaltyEngagement
        expr: rate(loyalty_activities_total[1h]) < 10
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Low loyalty program engagement"
          description: "Only {{ $value }} activities per hour"

      - alert: HighRewardRedemptions
        expr: rate(loyalty_rewards_redeemed_total[5m]) > 50
        for: 2m
        labels:
          severity: info
        annotations:
          summary: "High reward redemption rate"
          description: "{{ $value }} rewards redeemed per second"

      - alert: LoyaltySystemError
        expr: rate(loyalty_errors_total[5m]) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Loyalty system errors detected"
          description: "{{ $value }} errors per second"
EOF
    
    log "Monitoring setup completed"
}

# Setup backup configuration
setup_backup() {
    log "Setting up backup configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Create backup script
    cat > scripts/backup-loyalty.sh << 'EOF'
#!/bin/bash

# Loyalty System Backup Script
BACKUP_DIR="/path/to/dineflow/backups/loyalty-system"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="loyalty_backup_$DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup loyalty collections
mongodump --db dineflow --collection loyaltyaccounts --out "$BACKUP_DIR/$BACKUP_NAME"
mongodump --db dineflow --collection loyaltyprograms --out "$BACKUP_DIR/$BACKUP_NAME"

# Backup configuration files
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" \
    monitoring/loyalty-metrics.yml \
    ecosystem.loyalty.json \
    scripts/loyalty-cron.js

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "loyalty_backup_*" -mtime +7 -delete

echo "Loyalty system backup completed: $BACKUP_NAME"
EOF
    
    chmod +x scripts/backup-loyalty.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 1 * * * /path/to/dineflow/scripts/backup-loyalty.sh") | crontab -
    
    log "Backup configuration completed"
}

# Setup security configuration
setup_security() {
    log "Setting up security configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Create security configuration
    cat > config/loyalty-security.js << 'EOF'
// Loyalty System Security Configuration
module.exports = {
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP'
    },
    
    // Points validation
    pointsValidation: {
        maxPointsPerTransaction: 10000,
        minPointsForRedemption: 100,
        maxDailyPointsEarned: 5000,
        maxDailyRedemptions: 10
    },
    
    // Fraud prevention
    fraudPrevention: {
        enabled: true,
        suspiciousActivityThreshold: 5,
        maxPointsPerHour: 1000,
        requireVerification: {
            largeRedemptions: 1000,
            highValueRewards: 5000
        }
    },
    
    // Data protection
    dataProtection: {
        encryptSensitiveData: true,
        maskPersonalInfo: true,
        retentionPolicy: {
            pointsHistory: '2 years',
            activityLogs: '1 year',
            challengeHistory: '6 months'
        }
    }
};
EOF
    
    log "Security configuration completed"
}

# Setup testing
setup_testing() {
    log "Setting up testing for loyalty system..."
    
    cd "$PROJECT_ROOT"
    
    # Create test configuration
    cat > tests/loyalty-system.test.js << 'EOF'
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const LoyaltyAccount = require('../src/models/LoyaltyAccount');
const LoyaltyProgram = require('../src/models/LoyaltyProgram');

describe('Loyalty System', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/dineflow-test');
    });
    
    afterAll(async () => {
        await mongoose.connection.close();
    });
    
    beforeEach(async () => {
        await LoyaltyAccount.deleteMany({});
        await LoyaltyProgram.deleteMany({});
    });
    
    describe('GET /api/loyalty/account', () => {
        it('should get user loyalty account', async () => {
            const response = await request(app)
                .get('/api/loyalty/account')
                .set('Authorization', 'Bearer test-token')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data.account).toBeDefined();
        });
    });
    
    describe('POST /api/loyalty/points/booking', () => {
        it('should award points for booking', async () => {
            const response = await request(app)
                .post('/api/loyalty/points/booking')
                .set('Authorization', 'Bearer test-token')
                .send({
                    bookingId: new mongoose.Types.ObjectId(),
                    amount: 50,
                    restaurantId: new mongoose.Types.ObjectId()
                })
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data.pointsAwarded).toBeGreaterThan(0);
        });
    });
    
    describe('GET /api/loyalty/rewards', () => {
        it('should get available rewards', async () => {
            const response = await request(app)
                .get('/api/loyalty/rewards')
                .set('Authorization', 'Bearer test-token')
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.rewards)).toBe(true);
        });
    });
});
EOF
    
    # Add test script to package.json
    if [[ -f "package.json" ]]; then
        npm pkg set scripts.test:loyalty="jest tests/loyalty-system.test.js"
    fi
    
    log "Testing setup completed"
}

# Setup documentation
setup_documentation() {
    log "Setting up documentation..."
    
    cd "$PROJECT_ROOT"
    
    # Create README for loyalty system
    cat > README-loyalty-system.md << 'EOF'
# DineFlow Loyalty Program System

## Overview
The DineFlow Loyalty Program System provides comprehensive customer loyalty management with points, rewards, tiers, and gamification features.

## Features

### Core Features
- **Points System**: Earn points for bookings, reviews, check-ins, and referrals
- **Tier System**: Bronze, Silver, Gold, and Platinum tiers with exclusive benefits
- **Rewards Catalog**: Redeemable rewards including discounts, free items, and experiences
- **Gamification**: Daily and weekly challenges, streaks, and leaderboards
- **Analytics**: Comprehensive loyalty analytics and reporting

### Points Earning
- **Bookings**: Base points + points per dollar spent
- **Reviews**: Points for writing reviews
- **Check-ins**: Daily check-in bonuses
- **Referrals**: Referral bonuses for new users
- **Challenges**: Bonus points for completing challenges
- **Streaks**: Bonus points for maintaining streaks

### Tier Benefits
- **Bronze**: 5% discount on bookings
- **Silver**: 10% discount + priority booking
- **Gold**: 15% discount + priority booking + free dessert
- **Platinum**: 20% discount + priority booking + free appetizer + VIP access

### Rewards
- **Discounts**: Percentage off bookings
- **Free Items**: Complimentary food and drinks
- **Experiences**: Priority booking, VIP events
- **Merchandise**: Branded items
- **Cashback**: Points to cash conversion

### Gamification
- **Daily Challenges**: Daily tasks for bonus points
- **Weekly Challenges**: Weekly goals for larger rewards
- **Streaks**: Maintain booking and review streaks
- **Leaderboards**: Compete with other members
- **Achievements**: Unlock badges and milestones

## API Endpoints

### Account Management
- `GET /api/loyalty/account` - Get user loyalty account
- `PUT /api/loyalty/preferences` - Update preferences

### Points Earning
- `POST /api/loyalty/points/booking` - Award booking points
- `POST /api/loyalty/points/review` - Award review points
- `POST /api/loyalty/points/checkin` - Award check-in points
- `POST /api/loyalty/points/referral` - Award referral points

### Rewards
- `GET /api/loyalty/rewards` - Get available rewards
- `POST /api/loyalty/rewards/redeem` - Redeem reward
- `GET /api/loyalty/rewards/redeemed` - Get redeemed rewards

### Challenges
- `GET /api/loyalty/challenges` - Get active challenges
- `POST /api/loyalty/challenges/claim` - Claim challenge reward

### Analytics
- `GET /api/loyalty/history` - Get points history
- `GET /api/loyalty/leaderboard` - Get leaderboard

## Database Schema

### LoyaltyAccount Model
```javascript
{
  userId: ObjectId,
  points: {
    current: Number,
    total: Number,
    expired: Number
  },
  tier: {
    current: String,
    level: Number,
    pointsInTier: Number
  },
  membership: {
    joinDate: Date,
    lastActivity: Date
  },
  activity: {
    totalBookings: Number,
    totalReviews: Number,
    totalCheckins: Number,
    totalReferrals: Number
  },
  streaks: {
    bookingStreak: { current: Number, longest: Number },
    reviewStreak: { current: Number, longest: Number }
  },
  challenges: {
    daily: [Challenge],
    weekly: [Challenge]
  },
  rewards: {
    redeemed: [RedeemedReward]
  },
  pointsHistory: [PointsTransaction],
  preferences: Object,
  status: String
}
```

### LoyaltyProgram Model
```javascript
{
  name: String,
  description: String,
  isActive: Boolean,
  pointsConfig: {
    bookingPoints: Object,
    reviewPoints: Number,
    referralPoints: Number,
    expirationDays: Number
  },
  tiers: [Tier],
  rewards: [Reward],
  gamification: {
    dailyChallenges: [Challenge],
    weeklyChallenges: [Challenge],
    streaks: Object
  },
  settings: Object
}
```

## Configuration

### Environment Variables
- `LOYALTY_POINTS_EXPIRATION_DAYS`: Points expiration period
- `LOYALTY_WELCOME_BONUS`: Welcome bonus points
- `LOYALTY_BIRTHDAY_BONUS`: Birthday bonus points
- `LOYALTY_ANNIVERSARY_BONUS`: Anniversary bonus points
- `LOYALTY_MIN_REDEMPTION_POINTS`: Minimum points for redemption
- `LOYALTY_POINTS_TO_CURRENCY_RATE`: Points to currency conversion rate

### Security Settings
- Rate limiting for API endpoints
- Points validation and fraud prevention
- Data encryption and privacy protection
- Activity monitoring and alerts

## Usage Examples

### Awarding Points
```javascript
// Award points for booking
await loyaltyController.awardBookingPoints({
  bookingId: 'booking_id',
  amount: 50,
  restaurantId: 'restaurant_id'
});

// Award points for review
await loyaltyController.awardReviewPoints({
  reviewId: 'review_id',
  restaurantId: 'restaurant_id'
});
```

### Redeeming Rewards
```javascript
// Redeem a reward
const result = await loyaltyController.redeemReward({
  rewardId: 'reward_id'
});

// Get redemption code
const code = result.data.reward.code;
```

### Managing Challenges
```javascript
// Get active challenges
const challenges = await loyaltyController.getChallenges();

// Claim challenge reward
await loyaltyController.claimChallengeReward({
  challengeId: 'challenge_id',
  type: 'daily'
});
```

## Monitoring

### Key Metrics
- Points awarded per day/week/month
- Reward redemption rates
- Tier distribution
- Challenge completion rates
- User engagement levels
- Fraud detection alerts

### Alerts
- High points awarded (potential fraud)
- Low engagement (needs attention)
- High redemption rates (popular rewards)
- System errors (technical issues)

## Maintenance

### Daily Tasks
- Reset daily challenges
- Check for expired points
- Process tier changes
- Update activity metrics

### Weekly Tasks
- Reset weekly challenges
- Generate weekly reports
- Analyze user behavior
- Update leaderboards

### Monthly Tasks
- Process birthday bonuses
- Process anniversary bonuses
- Generate monthly reports
- Review and update rewards

## Support

For support and questions about the loyalty system, please contact the development team or create an issue in the project repository.
EOF
    
    log "Documentation setup completed"
}

# Main setup function
main() {
    log "Starting Loyalty Program System Setup..."
    
    check_root
    check_requirements
    install_dependencies
    setup_database_indexes
    setup_default_program
    setup_cron_jobs
    setup_monitoring
    setup_backup
    setup_security
    setup_testing
    setup_documentation
    
    log "Loyalty Program System Setup Completed Successfully!"
    log "Next steps:"
    log "1. Update .env file with loyalty configuration"
    log "2. Start the application: npm start"
    log "3. Start cron jobs: pm2 start ecosystem.loyalty.json"
    log "4. Access the loyalty dashboard"
    log "5. Monitor logs at: $LOG_FILE"
}

# Run main function
main "$@" 