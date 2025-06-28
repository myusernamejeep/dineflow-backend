#!/bin/bash

# DineFlow Backup Script
# This script creates comprehensive backups of DineFlow data and configuration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="dineflow"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${APP_NAME}_backup_${TIMESTAMP}"
LOG_FILE="./logs/backup_${TIMESTAMP}.log"
RETENTION_DAYS=30

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

# Start backup
log_message "Starting DineFlow backup"
print_status "DineFlow Backup Script"
print_status "Timestamp: $TIMESTAMP"

# Step 1: Database backup
print_status "Step 1: Database backup"

if command -v mongodump &> /dev/null; then
    log_message "Creating MongoDB backup"
    
    # Get database connection details from .env
    if [ -f ".env" ]; then
        source .env
        DB_URI=${MONGODB_URI:-"mongodb://localhost:27017/dineflow"}
        
        # Extract database name from URI
        DB_NAME=$(echo "$DB_URI" | sed 's/.*\///' | sed 's/?.*//')
        
        # Create database backup
        mongodump --uri="$DB_URI" --out="$BACKUP_DIR/$BACKUP_NAME/database"
        
        if [ $? -eq 0 ]; then
            print_success "Database backup completed"
        else
            print_error "Database backup failed"
            exit 1
        fi
    else
        print_warning ".env file not found, skipping database backup"
    fi
else
    print_warning "mongodump not found, skipping database backup"
fi

# Step 2: Application files backup
print_status "Step 2: Application files backup"

log_message "Creating application files backup"

# Create backup directory structure
mkdir -p "$BACKUP_DIR/$BACKUP_NAME/files"

# Backup source code
if [ -d "src" ]; then
    cp -r src "$BACKUP_DIR/$BACKUP_NAME/files/"
    print_success "Source code backed up"
fi

# Backup public files
if [ -d "public" ]; then
    cp -r public "$BACKUP_DIR/$BACKUP_NAME/files/"
    print_success "Public files backed up"
fi

# Backup configuration files
if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/$BACKUP_NAME/files/"
    print_success "Environment file backed up"
fi

if [ -f "package.json" ]; then
    cp package.json "$BACKUP_DIR/$BACKUP_NAME/files/"
    print_success "Package.json backed up"
fi

if [ -f "package-lock.json" ]; then
    cp package-lock.json "$BACKUP_DIR/$BACKUP_NAME/files/"
    print_success "Package-lock.json backed up"
fi

# Backup scripts
if [ -d "scripts" ]; then
    cp -r scripts "$BACKUP_DIR/$BACKUP_NAME/files/"
    print_success "Scripts backed up"
fi

# Backup logs (last 7 days)
if [ -d "logs" ]; then
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/files/logs"
    find logs -name "*.log" -mtime -7 -exec cp {} "$BACKUP_DIR/$BACKUP_NAME/files/logs/" \;
    print_success "Recent logs backed up"
fi

# Step 3: Docker volumes backup (if applicable)
print_status "Step 3: Docker volumes backup"

if command -v docker &> /dev/null; then
    log_message "Creating Docker volumes backup"
    
    # List Docker volumes
    VOLUMES=$(docker volume ls --format "{{.Name}}" | grep "$APP_NAME" || true)
    
    if [ -n "$VOLUMES" ]; then
        mkdir -p "$BACKUP_DIR/$BACKUP_NAME/docker"
        
        for volume in $VOLUMES; do
            log_message "Backing up Docker volume: $volume"
            
            # Create volume backup
            docker run --rm -v "$volume":/data -v "$(pwd)/$BACKUP_DIR/$BACKUP_NAME/docker":/backup alpine tar czf "/backup/${volume}.tar.gz" -C /data .
            
            if [ $? -eq 0 ]; then
                print_success "Docker volume $volume backed up"
            else
                print_warning "Failed to backup Docker volume $volume"
            fi
        done
    else
        print_warning "No Docker volumes found for $APP_NAME"
    fi
else
    print_warning "Docker not found, skipping Docker volumes backup"
fi

# Step 4: System configuration backup
print_status "Step 4: System configuration backup"

log_message "Creating system configuration backup"

mkdir -p "$BACKUP_DIR/$BACKUP_NAME/system"

# Backup nginx configuration (if exists)
if [ -f "/etc/nginx/sites-available/$APP_NAME" ]; then
    cp "/etc/nginx/sites-available/$APP_NAME" "$BACKUP_DIR/$BACKUP_NAME/system/"
    print_success "Nginx configuration backed up"
fi

# Backup systemd service (if exists)
if [ -f "/etc/systemd/system/$APP_NAME.service" ]; then
    cp "/etc/systemd/system/$APP_NAME.service" "$BACKUP_DIR/$BACKUP_NAME/system/"
    print_success "Systemd service backed up"
fi

# Backup SSL certificates (if exists)
if [ -d "/etc/letsencrypt/live" ]; then
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/system/ssl"
    cp -r /etc/letsencrypt/live "$BACKUP_DIR/$BACKUP_NAME/system/ssl/"
    print_success "SSL certificates backed up"
fi

# Step 5: Create backup manifest
print_status "Step 5: Creating backup manifest"

log_message "Creating backup manifest"

cat > "$BACKUP_DIR/$BACKUP_NAME/manifest.txt" << EOF
DineFlow Backup Manifest
========================
Timestamp: $(date)
Version: $(node -v 2>/dev/null || echo "Node.js not found")
Environment: ${NODE_ENV:-"unknown"}

Backup Contents:
- Database: $(if [ -d "$BACKUP_DIR/$BACKUP_NAME/database" ]; then echo "Yes"; else echo "No"; fi)
- Application Files: $(if [ -d "$BACKUP_DIR/$BACKUP_NAME/files" ]; then echo "Yes"; else echo "No"; fi)
- Docker Volumes: $(if [ -d "$BACKUP_DIR/$BACKUP_NAME/docker" ]; then echo "Yes"; else echo "No"; fi)
- System Configuration: $(if [ -d "$BACKUP_DIR/$BACKUP_NAME/system" ]; then echo "Yes"; else echo "No"; fi)

File Sizes:
$(du -sh "$BACKUP_DIR/$BACKUP_NAME"/* 2>/dev/null || echo "Unable to calculate sizes")

Backup Location: $BACKUP_DIR/$BACKUP_NAME
EOF

print_success "Backup manifest created"

# Step 6: Compress backup
print_status "Step 6: Compressing backup"

log_message "Compressing backup archive"

cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"

if [ $? -eq 0 ]; then
    print_success "Backup compressed successfully"
    
    # Remove uncompressed directory
    rm -rf "$BACKUP_NAME"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
    print_success "Backup size: $BACKUP_SIZE"
else
    print_error "Failed to compress backup"
    exit 1
fi

cd - > /dev/null

# Step 7: Cleanup old backups
print_status "Step 7: Cleaning up old backups"

log_message "Removing backups older than $RETENTION_DAYS days"

find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

print_success "Old backups cleaned up"

# Step 8: Verify backup
print_status "Step 8: Verifying backup"

log_message "Verifying backup integrity"

if [ -f "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" ]; then
    # Test archive integrity
    if tar -tzf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" > /dev/null 2>&1; then
        print_success "Backup verification passed"
    else
        print_error "Backup verification failed"
        exit 1
    fi
else
    print_error "Backup file not found"
    exit 1
fi

# Step 9: Final status
print_status "Step 9: Final status"

BACKUP_PATH="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)

print_success "Backup completed successfully!"
echo "  Backup file: $BACKUP_PATH"
echo "  Backup size: $BACKUP_SIZE"
echo "  Backup log: $LOG_FILE"

# Display backup information
echo ""
print_status "Backup Information:"
echo "  Total backups: $(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)"
echo "  Total size: $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)"
echo "  Retention: $RETENTION_DAYS days"

# Usage instructions
echo ""
print_status "Restore Instructions:"
echo "  1. Extract backup: tar -xzf $BACKUP_PATH"
echo "  2. Restore database: mongorestore --uri='your-db-uri' backup/database/"
echo "  3. Restore files: cp -r backup/files/* ."
echo "  4. Restore Docker volumes: docker volume create volume-name && docker run --rm -v volume-name:/data -v backup/docker:/backup alpine tar xzf /backup/volume-name.tar.gz -C /data"

log_message "Backup completed successfully" 