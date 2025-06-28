#!/bin/bash

# DineFlow Deployment Script
# This script handles the complete deployment process for DineFlow

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="dineflow"
DEPLOYMENT_ENV=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
LOG_FILE="./logs/deploy_${TIMESTAMP}.log"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
mkdir -p "$BACKUP_DIR"
mkdir -p "./logs"

# Start deployment
log_message "Starting DineFlow deployment for environment: $DEPLOYMENT_ENV"

print_status "DineFlow Deployment Script"
print_status "Environment: $DEPLOYMENT_ENV"
print_status "Timestamp: $TIMESTAMP"

# Step 1: Pre-deployment checks
print_status "Step 1: Pre-deployment checks"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi

print_success "npm version: $(npm -v)"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create .env file from .env.example"
    exit 1
fi

print_success ".env file found"

# Check if MongoDB is accessible (if local)
if grep -q "mongodb://localhost" .env; then
    if ! command -v mongod &> /dev/null; then
        print_warning "MongoDB not found locally. Make sure MongoDB is running or using cloud database."
    else
        print_success "MongoDB found locally"
    fi
fi

# Step 2: Backup current deployment
print_status "Step 2: Creating backup"

if [ -d "dist" ]; then
    BACKUP_NAME="${APP_NAME}_backup_${TIMESTAMP}.tar.gz"
    tar -czf "$BACKUP_DIR/$BACKUP_NAME" dist/
    print_success "Backup created: $BACKUP_NAME"
else
    print_warning "No existing dist directory to backup"
fi

# Step 3: Install dependencies
print_status "Step 3: Installing dependencies"

log_message "Installing npm dependencies"
npm ci --production=false

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 4: Environment-specific setup
print_status "Step 4: Environment-specific setup"

case $DEPLOYMENT_ENV in
    "development")
        print_status "Setting up development environment"
        export NODE_ENV=development
        ;;
    "staging")
        print_status "Setting up staging environment"
        export NODE_ENV=staging
        ;;
    "production")
        print_status "Setting up production environment"
        export NODE_ENV=production
        ;;
    *)
        print_error "Invalid environment: $DEPLOYMENT_ENV"
        print_status "Valid environments: development, staging, production"
        exit 1
        ;;
esac

# Step 5: Build application
print_status "Step 5: Building application"

log_message "Building frontend assets"
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend build completed"
else
    print_error "Frontend build failed"
    exit 1
fi

# Step 6: Database migration (if needed)
print_status "Step 6: Database migration"

# Check if migration script exists
if [ -f "scripts/migrate.js" ]; then
    log_message "Running database migrations"
    node scripts/migrate.js
    print_success "Database migration completed"
else
    print_warning "No migration script found"
fi

# Step 7: Run tests (if in development/staging)
if [ "$DEPLOYMENT_ENV" != "production" ]; then
    print_status "Step 7: Running tests"
    
    if [ -f "package.json" ] && grep -q "\"test\":" package.json; then
        log_message "Running tests"
        npm test
        
        if [ $? -eq 0 ]; then
            print_success "Tests passed"
        else
            print_error "Tests failed"
            exit 1
        fi
    else
        print_warning "No test script found"
    fi
fi

# Step 8: Security checks
print_status "Step 8: Security checks"

# Check for common security issues
if grep -q "password.*=.*'123456'" .env; then
    print_error "Weak password detected in .env file"
    exit 1
fi

if grep -q "JWT_SECRET.*=.*'default'" .env; then
    print_error "Default JWT secret detected. Please change it."
    exit 1
fi

print_success "Security checks passed"

# Step 9: Start application
print_status "Step 9: Starting application"

# Create PM2 ecosystem file if it doesn't exist
if [ ! -f "ecosystem.config.js" ]; then
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'dineflow',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_staging: {
      NODE_ENV: 'staging'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF
    print_success "PM2 ecosystem file created"
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2"
    npm install -g pm2
fi

# Start application with PM2
log_message "Starting application with PM2"
pm2 start ecosystem.config.js --env $DEPLOYMENT_ENV

if [ $? -eq 0 ]; then
    print_success "Application started successfully"
else
    print_error "Failed to start application"
    exit 1
fi

# Step 10: Health check
print_status "Step 10: Health check"

# Wait for application to start
sleep 5

# Check if application is responding
HEALTH_CHECK_URL="http://localhost:${PORT:-3000}/health"
if curl -f "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
    print_success "Health check passed"
else
    print_warning "Health check failed - application may still be starting"
fi

# Step 11: Post-deployment tasks
print_status "Step 11: Post-deployment tasks"

# Save PM2 process list
pm2 save

# Setup PM2 startup script
pm2 startup

print_success "PM2 startup script configured"

# Step 12: Cleanup
print_status "Step 12: Cleanup"

# Remove old backups (keep last 5)
cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs -r rm
cd ..

print_success "Old backups cleaned up"

# Final status
print_status "Deployment completed successfully!"
print_status "Application is running on: http://localhost:${PORT:-3000}"
print_status "PM2 status: pm2 status"
print_status "PM2 logs: pm2 logs dineflow"
print_status "Deployment log: $LOG_FILE"

# Display PM2 status
pm2 status

log_message "Deployment completed successfully" 