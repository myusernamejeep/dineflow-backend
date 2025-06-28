#!/bin/bash

# DineFlow Monitoring Script
# This script monitors the health and performance of DineFlow

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="dineflow"
MONITOR_INTERVAL=${1:-60}  # seconds
LOG_FILE="./logs/monitor_$(date +%Y%m%d).log"
ALERT_EMAIL="admin@dineflow.com"
HEALTH_CHECK_URL="http://localhost:3000/health"
METRICS_URL="http://localhost:3000/metrics"

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

# Function to send alert
send_alert() {
    local message="$1"
    local subject="DineFlow Alert: $2"
    
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
    fi
    
    # Log alert
    log_message "ALERT: $message"
}

# Function to check application health
check_health() {
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" 2>/dev/null || echo "000")
    
    if [ "$response_code" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Function to check application metrics
check_metrics() {
    local response=$(curl -s "$METRICS_URL" 2>/dev/null || echo "")
    
    if [ -n "$response" ]; then
        echo "$response"
    else
        echo ""
    fi
}

# Function to check disk usage
check_disk_usage() {
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    echo "$usage"
}

# Function to check memory usage
check_memory_usage() {
    local usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    echo "$usage"
}

# Function to check CPU usage
check_cpu_usage() {
    local usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    echo "$usage"
}

# Function to check database connection
check_database() {
    if command -v mongosh &> /dev/null; then
        mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1
        return $?
    else
        return 0  # Skip if mongosh not available
    fi
}

# Function to check container status (if using Docker)
check_container() {
    if command -v docker &> /dev/null; then
        if docker ps | grep -q "$APP_NAME"; then
            return 0
        else
            return 1
        fi
    else
        return 0  # Skip if Docker not available
    fi
}

# Function to restart application
restart_application() {
    log_message "Attempting to restart application"
    
    if command -v docker &> /dev/null && docker ps | grep -q "$APP_NAME"; then
        # Docker restart
        docker restart "$APP_NAME"
        log_message "Docker container restarted"
    elif command -v pm2 &> /dev/null; then
        # PM2 restart
        pm2 restart "$APP_NAME"
        log_message "PM2 process restarted"
    else
        # Systemd restart
        sudo systemctl restart "$APP_NAME"
        log_message "Systemd service restarted"
    fi
}

# Function to generate report
generate_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local health_status=$1
    local disk_usage=$2
    local memory_usage=$3
    local cpu_usage=$4
    local db_status=$5
    local container_status=$6
    
    echo "=== DineFlow Monitoring Report ==="
    echo "Timestamp: $timestamp"
    echo "Application Health: $health_status"
    echo "Disk Usage: ${disk_usage}%"
    echo "Memory Usage: ${memory_usage}%"
    echo "CPU Usage: ${cpu_usage}%"
    echo "Database Status: $db_status"
    echo "Container Status: $container_status"
    echo "================================"
}

# Main monitoring loop
main() {
    log_message "Starting DineFlow monitoring"
    print_status "Monitoring interval: ${MONITOR_INTERVAL}s"
    
    while true; do
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        
        # Check application health
        if check_health; then
            health_status="HEALTHY"
        else
            health_status="UNHEALTHY"
            send_alert "Application is not responding to health checks" "Application Down"
            restart_application
        fi
        
        # Check system resources
        local disk_usage=$(check_disk_usage)
        local memory_usage=$(check_memory_usage)
        local cpu_usage=$(check_cpu_usage)
        
        # Check database
        if check_database; then
            db_status="CONNECTED"
        else
            db_status="DISCONNECTED"
            send_alert "Database connection failed" "Database Issue"
        fi
        
        # Check container
        if check_container; then
            container_status="RUNNING"
        else
            container_status="STOPPED"
            send_alert "Application container is not running" "Container Down"
        fi
        
        # Generate and log report
        local report=$(generate_report "$health_status" "$disk_usage" "$memory_usage" "$cpu_usage" "$db_status" "$container_status")
        log_message "$report"
        
        # Check for resource thresholds
        if [ "$disk_usage" -gt 90 ]; then
            send_alert "Disk usage is high: ${disk_usage}%" "High Disk Usage"
        fi
        
        if [ "$memory_usage" -gt 90 ]; then
            send_alert "Memory usage is high: ${memory_usage}%" "High Memory Usage"
        fi
        
        if [ "$cpu_usage" -gt 90 ]; then
            send_alert "CPU usage is high: ${cpu_usage}%" "High CPU Usage"
        fi
        
        # Wait for next check
        sleep "$MONITOR_INTERVAL"
    done
}

# Handle script interruption
trap 'log_message "Monitoring stopped by user"; exit 0' INT TERM

# Start monitoring
main 