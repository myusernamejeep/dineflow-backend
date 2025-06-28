#!/bin/bash

# DineFlow Vercel Deployment Script
# This script handles Vercel serverless deployment for DineFlow

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
VERCEL_PROJECT_NAME=${2:-"dineflow"}
CUSTOM_DOMAIN=${3:-""}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="./logs/vercel-deploy_${TIMESTAMP}.log"

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
mkdir -p "./logs"

# Start deployment
log_message "Starting DineFlow Vercel deployment"
log_message "Environment: $DEPLOYMENT_ENV"
log_message "Project: $VERCEL_PROJECT_NAME"

print_status "DineFlow Vercel Deployment Script"
print_status "Environment: $DEPLOYMENT_ENV"
print_status "Project: $VERCEL_PROJECT_NAME"

# Step 1: Pre-deployment checks
print_status "Step 1: Pre-deployment checks"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed. Please install it first: npm i -g vercel"
    exit 1
fi

print_success "Vercel CLI version: $(vercel --version)"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create .env file from .env.example"
    exit 1
fi

print_success ".env file found"

# Step 2: Build application
print_status "Step 2: Building application"

log_message "Building frontend assets"
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend build completed"
else
    print_error "Frontend build failed"
    exit 1
fi

# Step 3: Deploy to Vercel
print_status "Step 3: Deploying to Vercel"

log_message "Deploying to Vercel"

# Deploy command
if [ "$DEPLOYMENT_ENV" = "production" ]; then
    vercel --prod --yes
else
    vercel --yes
fi

if [ $? -eq 0 ]; then
    print_success "Vercel deployment completed"
else
    print_error "Vercel deployment failed"
    exit 1
fi

# Step 4: Configure custom domain (if provided)
if [ -n "$CUSTOM_DOMAIN" ]; then
    print_status "Step 4: Configuring custom domain"
    
    log_message "Adding custom domain: $CUSTOM_DOMAIN"
    vercel domains add "$CUSTOM_DOMAIN"
    
    if [ $? -eq 0 ]; then
        print_success "Custom domain configured: $CUSTOM_DOMAIN"
    else
        print_warning "Failed to configure custom domain"
    fi
fi

# Step 5: Display deployment information
print_status "Step 5: Deployment information"

DEPLOYMENT_URL=$(vercel ls | grep "$VERCEL_PROJECT_NAME" | head -1 | awk '{print $2}')

echo ""
print_success "Deployment completed successfully!"
echo "  URL: $DEPLOYMENT_URL"
if [ -n "$CUSTOM_DOMAIN" ]; then
    echo "  Custom Domain: $CUSTOM_DOMAIN"
fi
echo "  Environment: $DEPLOYMENT_ENV"
echo "  Project: $VERCEL_PROJECT_NAME"

# Display useful commands
echo ""
print_status "Useful Commands:"
echo "  View deployments: vercel ls"
echo "  View logs: vercel logs"
echo "  Rollback: vercel rollback"
echo "  Remove deployment: vercel remove"

log_message "Vercel deployment completed successfully" 