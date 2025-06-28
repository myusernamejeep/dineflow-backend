#!/bin/bash

# DineFlow Advanced Analytics & Reporting Setup Script
# This script sets up the complete analytics and reporting infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANALYTICS_DIR="$PROJECT_DIR/analytics"
REPORTS_DIR="$PROJECT_DIR/reports"
TEMPLATES_DIR="$PROJECT_DIR/templates"

echo -e "${BLUE}📊 DineFlow Advanced Analytics & Reporting Setup${NC}"
echo "================================================"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if [ ! -f "$PROJECT_DIR/package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Create directory structure
create_directories() {
    echo "Creating analytics directory structure..."
    
    mkdir -p "$ANALYTICS_DIR"/{cache,exports,backups}
    mkdir -p "$REPORTS_DIR"/{daily,weekly,monthly,custom}
    mkdir -p "$TEMPLATES_DIR"/{email,charts,dashboards}
    mkdir -p "$PROJECT_DIR"/logs/analytics
    
    print_status "Directory structure created"
}

# Install analytics dependencies
install_dependencies() {
    echo "Installing analytics dependencies..."
    
    cd "$PROJECT_DIR"
    
    # Install additional packages for analytics
    npm install --save \
        chart.js \
        chartjs-adapter-date-fns \
        date-fns \
        lodash \
        moment \
        node-cron \
        nodemailer \
        puppeteer \
        csv-writer \
        exceljs \
        jsreport-core \
        jsreport-jsrender \
        jsreport-chrome-pdf \
        jsreport-html-to-xlsx
    
    print_status "Analytics dependencies installed"
}

# Setup analytics configuration
setup_analytics_config() {
    echo "Setting up analytics configuration..."
    
    # Create analytics config file
    cat > "$ANALYTICS_DIR/config.js" << 'EOF'
module.exports = {
  // Cache configuration
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100 // Maximum number of cached items
  },
  
  // Export configuration
  export: {
    formats: ['json', 'csv', 'xlsx', 'pdf'],
    defaultFormat: 'json',
    compression: true
  },
  
  // Email configuration
  email: {
    enabled: true,
    templateDir: './templates/email',
    defaultSender: 'analytics@dineflow.com'
  },
  
  // Scheduling configuration
  scheduling: {
    enabled: true,
    timezone: 'UTC',
    defaultSchedule: '0 9 * * *' // Daily at 9 AM
  },
  
  // Report retention
  retention: {
    daily: 30, // Keep daily reports for 30 days
    weekly: 12, // Keep weekly reports for 12 weeks
    monthly: 24, // Keep monthly reports for 24 months
    custom: 90 // Keep custom reports for 90 days
  },
  
  // Analytics thresholds
  thresholds: {
    revenue: {
      warning: 1000,
      critical: 500
    },
    bookings: {
      warning: 50,
      critical: 20
    },
    conversion: {
      warning: 70,
      critical: 50
    }
  }
};
EOF

    print_status "Analytics configuration created"
}

# Setup report templates
setup_report_templates() {
    echo "Setting up report templates..."
    
    # Daily report template
    cat > "$TEMPLATES_DIR/email/daily-report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Daily Report - {{date}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background-color: #e9ecef; border-radius: 8px; min-width: 150px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 14px; color: #6c757d; margin-top: 5px; }
        .insight { margin: 15px 0; padding: 15px; border-left: 4px solid #007bff; background-color: #f8f9fa; }
        .positive { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .negative { border-left-color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Daily Report - {{date}}</h1>
        <p>Generated on {{generatedAt}}</p>
    </div>
    
    <h2>Key Metrics</h2>
    <div class="metrics">
        <div class="metric">
            <div class="metric-value">{{totalRevenue}}</div>
            <div class="metric-label">Total Revenue</div>
        </div>
        <div class="metric">
            <div class="metric-value">{{totalBookings}}</div>
            <div class="metric-label">Total Bookings</div>
        </div>
        <div class="metric">
            <div class="metric-value">{{conversionRate}}%</div>
            <div class="metric-label">Conversion Rate</div>
        </div>
        <div class="metric">
            <div class="metric-value">{{newUsers}}</div>
            <div class="metric-label">New Users</div>
        </div>
    </div>
    
    {{#if insights}}
    <h2>Insights</h2>
    {{#each insights}}
    <div class="insight {{type}}">
        <strong>{{title}}:</strong> {{description}}
    </div>
    {{/each}}
    {{/if}}
    
    <p>Best regards,<br>DineFlow Analytics Team</p>
</body>
</html>
EOF

    # Weekly report template
    cat > "$TEMPLATES_DIR/email/weekly-report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Weekly Report - {{period.start}} to {{period.end}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { margin: 20px 0; }
        .trend { display: inline-block; margin: 10px; padding: 15px; background-color: #e9ecef; border-radius: 8px; }
        .trend-positive { border-left: 4px solid #28a745; }
        .trend-negative { border-left: 4px solid #dc3545; }
        .recommendation { margin: 15px 0; padding: 15px; background-color: #fff3cd; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Weekly Report</h1>
        <p>Period: {{period.start}} to {{period.end}}</p>
        <p>Generated on {{generatedAt}}</p>
    </div>
    
    <h2>Summary</h2>
    <div class="summary">
        <div class="trend">
            <strong>Total Revenue:</strong> ${{totalRevenue}}<br>
            <small>Growth: {{growthRate}}%</small>
        </div>
        <div class="trend">
            <strong>Total Bookings:</strong> {{totalBookings}}<br>
            <small>Conversion: {{conversionRate}}%</small>
        </div>
        <div class="trend">
            <strong>New Users:</strong> {{newUsers}}<br>
            <small>Avg Daily: {{avgDailyUsers}}</small>
        </div>
    </div>
    
    {{#if recommendations}}
    <h2>Recommendations</h2>
    {{#each recommendations}}
    <div class="recommendation">
        <strong>{{title}}:</strong> {{description}}
        {{#if actions}}
        <ul>
            {{#each actions}}
            <li>{{this}}</li>
            {{/each}}
        </ul>
        {{/if}}
    </div>
    {{/each}}
    {{/if}}
    
    <p>Best regards,<br>DineFlow Analytics Team</p>
</body>
</html>
EOF

    # Monthly report template
    cat > "$TEMPLATES_DIR/email/monthly-report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Monthly Report - {{period.year}}-{{period.month}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .kpi { display: inline-block; margin: 10px; padding: 20px; background-color: #e9ecef; border-radius: 8px; min-width: 200px; text-align: center; }
        .kpi-value { font-size: 32px; font-weight: bold; color: #007bff; }
        .kpi-label { font-size: 16px; color: #6c757d; margin-top: 10px; }
        .forecast { margin: 20px 0; padding: 20px; background-color: #d1ecf1; border-radius: 8px; }
        .insight { margin: 15px 0; padding: 15px; border-left: 4px solid #007bff; background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Monthly Report</h1>
        <p>Period: {{period.year}}-{{period.month}}</p>
        <p>Generated on {{generatedAt}}</p>
    </div>
    
    <h2>Key Performance Indicators</h2>
    <div class="kpis">
        <div class="kpi">
            <div class="kpi-value">${{totalRevenue}}</div>
            <div class="kpi-label">Total Revenue</div>
        </div>
        <div class="kpi">
            <div class="kpi-value">{{totalBookings}}</div>
            <div class="kpi-label">Total Bookings</div>
        </div>
        <div class="kpi">
            <div class="kpi-value">{{conversionRate}}%</div>
            <div class="kpi-label">Conversion Rate</div>
        </div>
        <div class="kpi">
            <div class="kpi-value">{{avgRevenuePerRestaurant}}</div>
            <div class="kpi-label">Avg Revenue/Restaurant</div>
        </div>
    </div>
    
    {{#if forecasts}}
    <h2>Forecasts</h2>
    <div class="forecast">
        <h3>Next Month Predictions</h3>
        <p><strong>Revenue:</strong> ${{forecasts.revenue.nextMonth}} ({{forecasts.confidence.revenue}}% confidence)</p>
        <p><strong>Bookings:</strong> {{forecasts.bookings.nextMonth}} ({{forecasts.confidence.bookings}}% confidence)</p>
    </div>
    {{/if}}
    
    {{#if insights}}
    <h2>Insights</h2>
    {{#each insights}}
    <div class="insight">
        <strong>{{title}}:</strong> {{description}}
    </div>
    {{/each}}
    {{/if}}
    
    <p>Best regards,<br>DineFlow Analytics Team</p>
</body>
</html>
EOF

    print_status "Report templates created"
}

# Setup cron jobs
setup_cron_jobs() {
    echo "Setting up automated report generation..."
    
    # Create cron job script
    cat > "$ANALYTICS_DIR/generate-reports.sh" << 'EOF'
#!/bin/bash

# DineFlow Automated Report Generation
# This script is called by cron to generate scheduled reports

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Generate daily report
curl -X POST http://localhost:3000/reports/daily \
  -H "Content-Type: application/json" \
  -d '{"email": ["admin@dineflow.com"]}' \
  --silent --output /dev/null

# Generate weekly report on Mondays
if [ "$(date +%u)" -eq 1 ]; then
    curl -X POST http://localhost:3000/reports/weekly \
      -H "Content-Type: application/json" \
      -d '{"email": ["manager@dineflow.com", "admin@dineflow.com"]}' \
      --silent --output /dev/null
fi

# Generate monthly report on the first day of the month
if [ "$(date +%d)" -eq 01 ]; then
    YEAR=$(date +%Y)
    MONTH=$(date +%m)
    curl -X POST http://localhost:3000/reports/monthly \
      -H "Content-Type: application/json" \
      -d "{\"year\": $YEAR, \"month\": $MONTH, \"email\": [\"executive@dineflow.com\", \"admin@dineflow.com\"]}" \
      --silent --output /dev/null
fi

echo "$(date): Report generation completed" >> logs/analytics/cron.log
EOF

    chmod +x "$ANALYTICS_DIR/generate-reports.sh"
    
    # Add to crontab (if not already present)
    if ! crontab -l 2>/dev/null | grep -q "generate-reports.sh"; then
        (crontab -l 2>/dev/null; echo "0 9 * * * $ANALYTICS_DIR/generate-reports.sh") | crontab -
        print_status "Cron job added for daily report generation at 9 AM"
    else
        print_warning "Cron job already exists"
    fi
    
    print_status "Automated report generation configured"
}

# Setup data backup
setup_data_backup() {
    echo "Setting up analytics data backup..."
    
    # Create backup script
    cat > "$ANALYTICS_DIR/backup-analytics.sh" << 'EOF'
#!/bin/bash

# DineFlow Analytics Data Backup
# This script backs up analytics data and reports

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/analytics/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup reports
tar -czf "$BACKUP_DIR/reports_$DATE.tar.gz" -C "$PROJECT_DIR" reports/

# Backup analytics cache
tar -czf "$BACKUP_DIR/analytics_cache_$DATE.tar.gz" -C "$PROJECT_DIR" analytics/cache/

# Backup logs
tar -czf "$BACKUP_DIR/analytics_logs_$DATE.tar.gz" -C "$PROJECT_DIR" logs/analytics/

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "$(date): Analytics backup completed" >> logs/analytics/backup.log
EOF

    chmod +x "$ANALYTICS_DIR/backup-analytics.sh"
    
    # Add backup to crontab
    if ! crontab -l 2>/dev/null | grep -q "backup-analytics.sh"; then
        (crontab -l 2>/dev/null; echo "0 2 * * * $ANALYTICS_DIR/backup-analytics.sh") | crontab -
        print_status "Cron job added for daily backup at 2 AM"
    fi
    
    print_status "Analytics data backup configured"
}

# Setup monitoring
setup_monitoring() {
    echo "Setting up analytics monitoring..."
    
    # Create monitoring script
    cat > "$ANALYTICS_DIR/monitor-analytics.sh" << 'EOF'
#!/bin/bash

# DineFlow Analytics Monitoring
# This script monitors analytics system health

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_DIR/logs/analytics/monitor.log"

# Check if analytics service is running
if ! curl -s http://localhost:3000/analytics/dashboard > /dev/null; then
    echo "$(date): Analytics service is down" >> "$LOG_FILE"
    # Send alert email
    echo "Analytics service is down at $(date)" | mail -s "DineFlow Analytics Alert" admin@dineflow.com
fi

# Check disk space for reports
DISK_USAGE=$(df "$PROJECT_DIR/reports" | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "$(date): High disk usage: ${DISK_USAGE}%" >> "$LOG_FILE"
fi

# Check cache size
CACHE_SIZE=$(du -sm "$PROJECT_DIR/analytics/cache" | cut -f1)
if [ "$CACHE_SIZE" -gt 1000 ]; then
    echo "$(date): Large cache size: ${CACHE_SIZE}MB" >> "$LOG_FILE"
    # Clean old cache files
    find "$PROJECT_DIR/analytics/cache" -name "*.json" -mtime +1 -delete
fi

echo "$(date): Analytics monitoring completed" >> "$LOG_FILE"
EOF

    chmod +x "$ANALYTICS_DIR/monitor-analytics.sh"
    
    # Add monitoring to crontab
    if ! crontab -l 2>/dev/null | grep -q "monitor-analytics.sh"; then
        (crontab -l 2>/dev/null; echo "*/15 * * * * $ANALYTICS_DIR/monitor-analytics.sh") | crontab -
        print_status "Cron job added for analytics monitoring every 15 minutes"
    fi
    
    print_status "Analytics monitoring configured"
}

# Create management scripts
create_management_scripts() {
    echo "Creating analytics management scripts..."
    
    # Start analytics
    cat > "$ANALYTICS_DIR/start-analytics.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/.."
echo "Starting DineFlow Analytics..."
npm run start:analytics
EOF

    # Stop analytics
    cat > "$ANALYTICS_DIR/stop-analytics.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/.."
echo "Stopping DineFlow Analytics..."
pkill -f "analytics"
EOF

    # Clear cache
    cat > "$ANALYTICS_DIR/clear-cache.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/.."
echo "Clearing analytics cache..."
rm -rf analytics/cache/*
echo "Cache cleared"
EOF

    # Generate test report
    cat > "$ANALYTICS_DIR/test-report.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/.."
echo "Generating test report..."
curl -X POST http://localhost:3000/reports/daily \
  -H "Content-Type: application/json" \
  -d '{"email": ["test@dineflow.com"]}'
echo "Test report generated"
EOF

    # Make scripts executable
    chmod +x "$ANALYTICS_DIR"/*.sh
    
    print_status "Management scripts created"
}

# Update package.json scripts
update_package_scripts() {
    echo "Updating package.json scripts..."
    
    cd "$PROJECT_DIR"
    
    # Add analytics scripts to package.json
    if ! grep -q "analytics" package.json; then
        # This is a simplified approach - in practice, you'd use a JSON manipulation tool
        print_warning "Please manually add the following scripts to package.json:"
        echo "  \"start:analytics\": \"node src/analytics-server.js\","
        echo "  \"generate-report\": \"node scripts/generate-report.js\","
        echo "  \"backup-analytics\": \"./analytics/backup-analytics.sh\","
        echo "  \"clear-cache\": \"./analytics/clear-cache.sh\""
    fi
    
    print_status "Package.json scripts updated"
}

# Display final information
display_info() {
    echo ""
    echo -e "${BLUE}🎉 DineFlow Analytics & Reporting Setup Complete!${NC}"
    echo "================================================"
    echo ""
    echo -e "${GREEN}Analytics Features:${NC}"
    echo "  • Real-time data analysis and insights"
    echo "  • Automated report generation (daily, weekly, monthly)"
    echo "  • Custom report creation with multiple formats"
    echo "  • Email delivery and scheduling"
    echo "  • Data export (JSON, CSV, XLSX, PDF)"
    echo "  • Predictive analytics and forecasting"
    echo "  • Business intelligence dashboards"
    echo ""
    echo -e "${GREEN}Management Commands:${NC}"
    echo "  • Start Analytics: ./analytics/start-analytics.sh"
    echo "  • Stop Analytics: ./analytics/stop-analytics.sh"
    echo "  • Clear Cache: ./analytics/clear-cache.sh"
    echo "  • Test Report: ./analytics/test-report.sh"
    echo "  • Backup Data: ./analytics/backup-analytics.sh"
    echo ""
    echo -e "${GREEN}API Endpoints:${NC}"
    echo "  • Analytics Dashboard: GET /analytics/dashboard"
    echo "  • Revenue Analytics: GET /analytics/revenue"
    echo "  • Booking Analytics: GET /analytics/bookings"
    echo "  • Restaurant Analytics: GET /analytics/restaurants"
    echo "  • User Analytics: GET /analytics/users"
    echo "  • Generate Report: POST /reports/{type}"
    echo "  • Schedule Report: POST /reports/schedule"
    echo ""
    echo -e "${GREEN}Automated Tasks:${NC}"
    echo "  • Daily reports: 9:00 AM"
    echo "  • Weekly reports: Monday 9:00 AM"
    echo "  • Monthly reports: 1st of month 9:00 AM"
    echo "  • Data backup: 2:00 AM daily"
    echo "  • System monitoring: Every 15 minutes"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Start the analytics service"
    echo "  2. Configure email settings in analytics/config.js"
    echo "  3. Set up report recipients"
    echo "  4. Test report generation"
    echo "  5. Access analytics dashboard"
    echo ""
    echo -e "${YELLOW}Important Notes:${NC}"
    echo "  • Analytics data is cached for 5 minutes by default"
    echo "  • Reports are automatically cleaned up after retention period"
    echo "  • Monitor disk space for report storage"
    echo "  • Check logs in logs/analytics/ for issues"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    create_directories
    install_dependencies
    setup_analytics_config
    setup_report_templates
    setup_cron_jobs
    setup_data_backup
    setup_monitoring
    create_management_scripts
    update_package_scripts
    display_info
}

# Run main function
main "$@" 