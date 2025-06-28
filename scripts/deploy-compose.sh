#!/bin/bash

# DineFlow Docker Compose Deployment Script
# This script handles multi-service deployment using Docker Compose

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
COMPOSE_FILE="docker-compose.yml"
COMPOSE_OVERRIDE_FILE="docker-compose.${DEPLOYMENT_ENV}.yml"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="./logs/compose-deploy_${TIMESTAMP}.log"

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
log_message "Starting DineFlow Docker Compose deployment"
log_message "Environment: $DEPLOYMENT_ENV"

print_status "DineFlow Docker Compose Deployment Script"
print_status "Environment: $DEPLOYMENT_ENV"
print_status "Compose file: $COMPOSE_FILE"

# Step 1: Pre-deployment checks
print_status "Step 1: Pre-deployment checks"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

print_success "Docker version: $(docker --version)"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Docker Compose version: $(docker-compose --version)"

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "Docker Compose file not found: $COMPOSE_FILE"
    exit 1
fi

print_success "Docker Compose file found: $COMPOSE_FILE"

# Check if environment override file exists
if [ -f "$COMPOSE_OVERRIDE_FILE" ]; then
    print_success "Environment override file found: $COMPOSE_OVERRIDE_FILE"
else
    print_warning "Environment override file not found: $COMPOSE_OVERRIDE_FILE"
fi

# Step 2: Create Docker Compose file if it doesn't exist
print_status "Step 2: Creating Docker Compose configuration"

if [ ! -f "$COMPOSE_FILE" ]; then
    cat > "$COMPOSE_FILE" << 'EOF'
version: '3.8'

services:
  # Main application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: dineflow-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
    depends_on:
      - mongodb
      - redis
    networks:
      - dineflow-network
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # MongoDB database
  mongodb:
    image: mongo:6.0
    container_name: dineflow-mongodb
    restart: unless-stopped
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
      - MONGO_INITDB_DATABASE=dineflow
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - dineflow-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    container_name: dineflow-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - dineflow-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: dineflow-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - dineflow-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Monitoring with Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: dineflow-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - dineflow-network

  # Grafana for visualization
  grafana:
    image: grafana/grafana:latest
    container_name: dineflow-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./grafana/datasources:/etc/grafana/provisioning/datasources:ro
    depends_on:
      - prometheus
    networks:
      - dineflow-network

  # Backup service
  backup:
    image: mongo:6.0
    container_name: dineflow-backup
    restart: "no"
    volumes:
      - ./backups:/backups
      - mongodb_data:/data/db
    networks:
      - dineflow-network
    command: >
      bash -c "
        mongodump --host mongodb --port 27017 --username admin --password password --authenticationDatabase admin --db dineflow --out /backups/backup_$$(date +%Y%m%d_%H%M%S)
      "

networks:
  dineflow-network:
    driver: bridge

volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
EOF

    print_success "Docker Compose file created: $COMPOSE_FILE"
fi

# Step 3: Create environment-specific override file
print_status "Step 3: Creating environment-specific configuration"

case $DEPLOYMENT_ENV in
    "development")
        cat > "$COMPOSE_OVERRIDE_FILE" << 'EOF'
version: '3.8'

services:
  app:
    environment:
      - NODE_ENV=development
    volumes:
      - ./src:/app/src
      - ./public:/app/public
      - ./logs:/app/logs
    command: npm run dev

  nginx:
    ports:
      - "8080:80"

  prometheus:
    ports:
      - "9091:9090"

  grafana:
    ports:
      - "3002:3000"
EOF
        ;;
    "staging")
        cat > "$COMPOSE_OVERRIDE_FILE" << 'EOF'
version: '3.8'

services:
  app:
    environment:
      - NODE_ENV=staging

  nginx:
    ports:
      - "8080:80"
      - "8443:443"

  prometheus:
    ports:
      - "9091:9090"

  grafana:
    ports:
      - "3002:3000"
EOF
        ;;
    "production")
        cat > "$COMPOSE_OVERRIDE_FILE" << 'EOF'
version: '3.8'

services:
  app:
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  mongodb:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  redis:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
EOF
        ;;
esac

print_success "Environment override file created: $COMPOSE_OVERRIDE_FILE"

# Step 4: Create Nginx configuration
print_status "Step 4: Creating Nginx configuration"

cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app_servers {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    server {
        listen 80;
        server_name localhost;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # API endpoints with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app_servers;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Login endpoint with stricter rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://app_servers;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files
        location /static/ {
            proxy_pass http://app_servers;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Service worker
        location /sw.js {
            proxy_pass http://app_servers;
            add_header Cache-Control "no-cache";
        }

        # Manifest
        location /manifest.json {
            proxy_pass http://app_servers;
            add_header Cache-Control "no-cache";
        }

        # Main application
        location / {
            proxy_pass http://app_servers;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF

print_success "Nginx configuration created"

# Step 5: Create Prometheus configuration
print_status "Step 5: Creating Prometheus configuration"

mkdir -p grafana/dashboards grafana/datasources

cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'dineflow-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
    metrics_path: '/nginx_status'
    scrape_interval: 10s
EOF

print_success "Prometheus configuration created"

# Step 6: Create Grafana datasource
print_status "Step 6: Creating Grafana configuration"

cat > grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

print_success "Grafana datasource configuration created"

# Step 7: Create MongoDB initialization script
print_status "Step 7: Creating MongoDB initialization script"

cat > scripts/mongo-init.js << 'EOF'
// MongoDB initialization script
db = db.getSiblingDB('dineflow');

// Create collections
db.createCollection('users');
db.createCollection('restaurants');
db.createCollection('bookings');

// Create indexes
db.users.createIndex({ "lineId": 1 }, { unique: true });
db.users.createIndex({ "email": 1 });
db.restaurants.createIndex({ "name": 1 });
db.restaurants.createIndex({ "cuisine": 1 });
db.bookings.createIndex({ "userId": 1 });
db.bookings.createIndex({ "restaurantId": 1 });
db.bookings.createIndex({ "bookingDate": 1 });
db.bookings.createIndex({ "bookingStatus": 1 });

// Create admin user
db.users.insertOne({
    lineId: "admin",
    displayName: "Admin User",
    email: "admin@dineflow.com",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date()
});

print("MongoDB initialized successfully");
EOF

print_success "MongoDB initialization script created"

# Step 8: Build and start services
print_status "Step 8: Building and starting services"

# Build images
log_message "Building Docker images"
docker-compose -f "$COMPOSE_FILE" -f "$COMPOSE_OVERRIDE_FILE" build

if [ $? -eq 0 ]; then
    print_success "Docker images built successfully"
else
    print_error "Failed to build Docker images"
    exit 1
fi

# Start services
log_message "Starting services"
docker-compose -f "$COMPOSE_FILE" -f "$COMPOSE_OVERRIDE_FILE" up -d

if [ $? -eq 0 ]; then
    print_success "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

# Step 9: Health checks
print_status "Step 9: Health checks"

# Wait for services to start
sleep 30

# Check service status
log_message "Checking service health"
docker-compose -f "$COMPOSE_FILE" -f "$COMPOSE_OVERRIDE_FILE" ps

# Check application health
HEALTH_CHECK_URL="http://localhost:3000/health"
if curl -f "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
    print_success "Application health check passed"
else
    print_warning "Application health check failed"
fi

# Step 10: Setup monitoring
print_status "Step 10: Setting up monitoring"

# Create monitoring dashboard
cat > grafana/dashboards/dineflow-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "DineFlow Dashboard",
    "tags": ["dineflow"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Application Requests",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      }
    ]
  }
}
EOF

print_success "Monitoring dashboard created"

# Step 11: Setup backup cron job
print_status "Step 11: Setting up backup schedule"

# Create backup script
cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# Backup script for DineFlow
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p "$BACKUP_DIR"

# Run backup container
docker-compose run --rm backup

# Compress backup
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" backup_$TIMESTAMP

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/backup_$TIMESTAMP"

# Keep only last 7 backups
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup_$TIMESTAMP.tar.gz"
EOF

chmod +x scripts/backup.sh

print_success "Backup script created"

# Step 12: Final status
print_status "Step 12: Final status"

print_success "Docker Compose deployment completed successfully!"

# Display service status
docker-compose -f "$COMPOSE_FILE" -f "$COMPOSE_OVERRIDE_FILE" ps

# Display access information
echo ""
print_status "Access Information:"
echo "  Application: http://localhost:3000"
echo "  Nginx: http://localhost:80"
echo "  Grafana: http://localhost:3001 (admin/admin)"
echo "  Prometheus: http://localhost:9090"

# Display useful commands
echo ""
print_status "Useful Commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo "  Scale app: docker-compose up -d --scale app=3"
echo "  Backup: ./scripts/backup.sh"
echo "  Monitor: docker-compose logs -f app"

log_message "Docker Compose deployment completed successfully" 