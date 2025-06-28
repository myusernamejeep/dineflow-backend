# DineFlow Advanced Analytics & Reporting System

This document provides comprehensive information about the DineFlow analytics and reporting system, including features, setup, usage, and API documentation.

## 🎯 Overview

The DineFlow Analytics & Reporting System provides comprehensive business intelligence, automated reporting, and data analysis capabilities for the restaurant booking platform.

## 🚀 Features

### Core Analytics
- **Real-time Data Analysis**: Live metrics and insights
- **Business Intelligence**: Revenue, booking, and user analytics
- **Predictive Analytics**: Forecasting and trend analysis
- **Performance Monitoring**: System and business performance tracking

### Reporting System
- **Automated Reports**: Daily, weekly, and monthly reports
- **Custom Reports**: Flexible report generation with custom parameters
- **Multiple Formats**: JSON, CSV, XLSX, and PDF export
- **Email Delivery**: Automated email distribution
- **Scheduling**: Cron-based report scheduling

### Data Visualization
- **Interactive Dashboards**: Real-time charts and graphs
- **Trend Analysis**: Historical data visualization
- **Comparative Analytics**: Period-over-period analysis
- **Export Capabilities**: Chart and data export

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DineFlow      │    │   Analytics     │    │   Reporting     │
│   Application   │───▶│   Service       │───▶│   Engine        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Cache Layer   │    │   Email Service │
│   (MongoDB)     │    │   (Memory)      │    │   (Nodemailer)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data Export   │    │   Templates     │    │   Scheduling    │
│   (CSV/XLSX)    │    │   (Handlebars)  │    │   (Cron)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Analytics Components

### 1. Revenue Analytics
- Daily, weekly, monthly revenue tracking
- Revenue growth analysis
- Average revenue per booking
- Revenue by restaurant
- Seasonal revenue patterns

### 2. Booking Analytics
- Booking volume trends
- Conversion rate analysis
- Cancellation rate tracking
- Peak hours identification
- Booking status distribution

### 3. Restaurant Analytics
- Restaurant performance comparison
- Top-performing restaurants
- Revenue per restaurant
- Booking efficiency metrics
- Category performance analysis

### 4. User Analytics
- User growth tracking
- User retention analysis
- Average bookings per user
- User behavior patterns
- New user acquisition

### 5. Predictive Analytics
- Revenue forecasting
- Booking demand prediction
- Seasonal trend forecasting
- Growth rate predictions
- Confidence intervals

## 📈 Report Types

### Daily Reports
- **Content**: Daily summary of bookings, revenue, and user activity
- **Schedule**: Generated daily at 9:00 AM
- **Recipients**: Admin team
- **Format**: Email with key metrics and insights

### Weekly Reports
- **Content**: Weekly trends, performance analysis, and recommendations
- **Schedule**: Generated every Monday at 9:00 AM
- **Recipients**: Management team
- **Format**: Comprehensive email with charts and insights

### Monthly Reports
- **Content**: Monthly performance, seasonal analysis, and forecasts
- **Schedule**: Generated on the 1st of each month at 9:00 AM
- **Recipients**: Executive team
- **Format**: Detailed report with predictions and recommendations

### Custom Reports
- **Content**: User-defined metrics and date ranges
- **Schedule**: On-demand or custom scheduling
- **Recipients**: Configurable
- **Format**: Multiple export formats available

## 🔧 Setup Instructions

### Quick Start

1. **Run the setup script:**
   ```bash
   chmod +x scripts/analytics-setup.sh
   ./scripts/analytics-setup.sh
   ```

2. **Start the analytics service:**
   ```bash
   npm run start:analytics
   ```

3. **Access the analytics dashboard:**
   - URL: `http://localhost:3000/analytics`
   - Authentication required

### Manual Setup

1. **Install dependencies:**
   ```bash
   npm install chart.js chartjs-adapter-date-fns date-fns lodash moment node-cron nodemailer puppeteer csv-writer exceljs jsreport-core jsreport-jsrender jsreport-chrome-pdf jsreport-html-to-xlsx
   ```

2. **Create directories:**
   ```bash
   mkdir -p analytics/{cache,exports,backups}
   mkdir -p reports/{daily,weekly,monthly,custom}
   mkdir -p templates/{email,charts,dashboards}
   mkdir -p logs/analytics
   ```

3. **Configure analytics:**
   - Copy `analytics/config.js` to your project
   - Update email settings
   - Configure retention policies

## 📡 API Documentation

### Analytics Endpoints

#### Get Analytics Dashboard
```http
GET /analytics/dashboard?timeRange=30d
```
Returns comprehensive analytics data for the dashboard.

#### Get Revenue Analytics
```http
GET /analytics/revenue?timeRange=30d
```
Returns revenue analytics data.

**Response:**
```json
{
  "success": true,
  "data": {
    "dailyRevenue": [...],
    "summary": {
      "totalRevenue": 50000,
      "avgDailyRevenue": 1667,
      "growthRate": 15.5
    },
    "trends": {
      "trend": "increasing",
      "percentage": 15.5
    }
  }
}
```

#### Get Booking Analytics
```http
GET /analytics/bookings?timeRange=30d
```
Returns booking analytics data.

#### Get Restaurant Analytics
```http
GET /analytics/restaurants?timeRange=30d
```
Returns restaurant performance analytics.

#### Get User Analytics
```http
GET /analytics/users?timeRange=30d
```
Returns user analytics data.

#### Get Peak Hours Analytics
```http
GET /analytics/peak-hours?timeRange=30d
```
Returns peak hours analysis.

#### Get Seasonal Trends
```http
GET /analytics/seasonal-trends?timeRange=1y
```
Returns seasonal trend analysis.

#### Get Predictive Analytics
```http
GET /analytics/predictive
```
Returns predictive analytics data.

#### Export Analytics Data
```http
GET /analytics/export?type=revenue&timeRange=30d&format=csv
```
Exports analytics data in specified format.

### Reporting Endpoints

#### Generate Daily Report
```http
POST /reports/daily
Content-Type: application/json

{
  "date": "2024-01-15",
  "email": ["admin@dineflow.com"]
}
```

#### Generate Weekly Report
```http
POST /reports/weekly
Content-Type: application/json

{
  "startDate": "2024-01-08",
  "email": ["manager@dineflow.com"]
}
```

#### Generate Monthly Report
```http
POST /reports/monthly
Content-Type: application/json

{
  "year": 2024,
  "month": 1,
  "email": ["executive@dineflow.com"]
}
```

#### Generate Custom Report
```http
POST /reports/custom
Content-Type: application/json

{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "metrics": ["revenue", "bookings", "restaurants"],
  "includeInsights": true,
  "includeRecommendations": true,
  "email": ["user@dineflow.com"]
}
```

#### Schedule Report
```http
POST /reports/schedule
Content-Type: application/json

{
  "type": "weekly",
  "schedule": "0 10 * * 1",
  "recipients": ["manager@dineflow.com"],
  "parameters": {
    "includeInsights": true
  }
}
```

#### Get Report History
```http
GET /reports/history?limit=10
```
Returns recent report history.

#### Download Report
```http
GET /reports/{filename}/download
```
Downloads a specific report file.

#### Send Report via Email
```http
POST /reports/{filename}/send
Content-Type: application/json

{
  "recipients": ["user@dineflow.com"],
  "subject": "Custom Report"
}
```

## 🎨 Frontend Components

### AnalyticsDashboard
Main analytics dashboard component with interactive charts and metrics.

**Features:**
- Real-time data visualization
- Interactive filters
- Export capabilities
- Responsive design

**Usage:**
```jsx
import AnalyticsDashboard from './components/AnalyticsDashboard';

<AnalyticsDashboard />
```

### ReportGenerator
Report generation and management component.

**Features:**
- Template selection
- Custom report configuration
- Scheduling interface
- Report history management

**Usage:**
```jsx
import ReportGenerator from './components/ReportGenerator';

<ReportGenerator />
```

## 📊 Data Models

### Analytics Data Structure
```javascript
{
  // Revenue Analytics
  revenue: {
    dailyRevenue: Array,
    summary: {
      totalRevenue: Number,
      avgDailyRevenue: Number,
      growthRate: Number
    },
    trends: {
      trend: String, // 'increasing', 'decreasing', 'stable'
      percentage: Number
    }
  },
  
  // Booking Analytics
  bookings: {
    dailyBookings: Array,
    summary: {
      totalBookings: Number,
      conversionRate: Number,
      cancellationRate: Number
    }
  },
  
  // Restaurant Analytics
  restaurants: {
    restaurantPerformance: Array,
    topPerformers: {
      byRevenue: Array,
      byBookings: Array,
      byConversion: Array
    }
  },
  
  // User Analytics
  users: {
    newUsers: Number,
    userStats: {
      avgBookingsPerUser: Number,
      retentionRate: Number
    }
  }
}
```

## 🔄 Automation

### Scheduled Tasks

#### Daily Reports
- **Time**: 9:00 AM daily
- **Command**: `./analytics/generate-reports.sh`
- **Output**: Email to admin team

#### Weekly Reports
- **Time**: Monday 9:00 AM
- **Command**: `./analytics/generate-reports.sh`
- **Output**: Email to management team

#### Monthly Reports
- **Time**: 1st of month 9:00 AM
- **Command**: `./analytics/generate-reports.sh`
- **Output**: Email to executive team

#### Data Backup
- **Time**: 2:00 AM daily
- **Command**: `./analytics/backup-analytics.sh`
- **Output**: Compressed backup files

#### System Monitoring
- **Time**: Every 15 minutes
- **Command**: `./analytics/monitor-analytics.sh`
- **Output**: Health checks and alerts

### Cron Configuration
```bash
# Daily report generation
0 9 * * * /path/to/dineflow/analytics/generate-reports.sh

# Daily backup
0 2 * * * /path/to/dineflow/analytics/backup-analytics.sh

# System monitoring
*/15 * * * * /path/to/dineflow/analytics/monitor-analytics.sh
```

## 🛠️ Management Commands

### Service Management
```bash
# Start analytics service
./analytics/start-analytics.sh

# Stop analytics service
./analytics/stop-analytics.sh

# Restart analytics service
./analytics/restart-analytics.sh
```

### Data Management
```bash
# Clear analytics cache
./analytics/clear-cache.sh

# Backup analytics data
./analytics/backup-analytics.sh

# Generate test report
./analytics/test-report.sh
```

### Monitoring
```bash
# Check analytics health
curl http://localhost:3000/analytics/dashboard

# View analytics logs
tail -f logs/analytics/analytics.log

# Check scheduled reports
crontab -l | grep analytics
```

## 📧 Email Configuration

### SMTP Settings
```javascript
// analytics/config.js
module.exports = {
  email: {
    enabled: true,
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'analytics@dineflow.com',
        pass: 'your-password'
      }
    },
    defaultSender: 'analytics@dineflow.com'
  }
};
```

### Email Templates
- **Daily Report**: `templates/email/daily-report.html`
- **Weekly Report**: `templates/email/weekly-report.html`
- **Monthly Report**: `templates/email/monthly-report.html`

## 🔒 Security Considerations

### Access Control
- All analytics endpoints require authentication
- Role-based access control for sensitive data
- API rate limiting for analytics endpoints

### Data Protection
- Sensitive data encryption
- Secure email transmission
- Backup encryption
- Audit logging

### Privacy Compliance
- GDPR compliance for user data
- Data retention policies
- User consent management
- Data anonymization options

## 📈 Performance Optimization

### Caching Strategy
- **Memory Cache**: 5-minute TTL for analytics data
- **File Cache**: Persistent cache for reports
- **CDN**: Static assets caching

### Database Optimization
- **Indexing**: Optimized indexes for analytics queries
- **Aggregation**: Pre-computed aggregations
- **Partitioning**: Time-based data partitioning

### Query Optimization
- **Pagination**: Large dataset pagination
- **Filtering**: Efficient data filtering
- **Projection**: Selective field retrieval

## 🚨 Troubleshooting

### Common Issues

#### Analytics Service Not Starting
```bash
# Check logs
tail -f logs/analytics/error.log

# Check dependencies
npm list

# Check port availability
netstat -tulpn | grep 3000
```

#### Reports Not Generating
```bash
# Check cron jobs
crontab -l

# Check permissions
ls -la analytics/generate-reports.sh

# Test manually
./analytics/generate-reports.sh
```

#### Email Not Sending
```bash
# Check SMTP settings
cat analytics/config.js

# Test email configuration
node -e "require('./src/utils/notify').sendEmail({to: 'test@example.com', subject: 'Test', html: 'Test'})"
```

#### High Memory Usage
```bash
# Clear cache
./analytics/clear-cache.sh

# Check cache size
du -sh analytics/cache/

# Monitor memory usage
top -p $(pgrep -f analytics)
```

### Debug Commands
```bash
# Check analytics health
curl -X GET http://localhost:3000/analytics/dashboard

# Test report generation
curl -X POST http://localhost:3000/reports/daily -H "Content-Type: application/json" -d '{}'

# Check cache status
curl -X GET http://localhost:3000/analytics/cache/stats

# View system logs
journalctl -u dineflow-analytics -f
```

## 📚 Additional Resources

### Documentation
- [Analytics API Reference](api-reference.md)
- [Report Templates Guide](templates-guide.md)
- [Dashboard Customization](dashboard-customization.md)
- [Performance Tuning](performance-tuning.md)

### Community
- [Analytics Forum](https://community.dineflow.com/analytics)
- [GitHub Issues](https://github.com/dineflow/analytics/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/dineflow-analytics)

### Support
- **Email**: analytics-support@dineflow.com
- **Documentation**: https://docs.dineflow.com/analytics
- **Status Page**: https://status.dineflow.com

---

For questions or support with the analytics system, please refer to the documentation or contact the analytics team. 