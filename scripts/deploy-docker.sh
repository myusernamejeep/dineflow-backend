#!/bin/bash

# DineFlow Docker Deployment Script
# This script handles Docker-based deployment for DineFlow

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="dineflow"
DOCKER_IMAGE_NAME="dineflow"
DOCKER_TAG=${1:-latest}
DEPLOYMENT_ENV=${2:-production}
CONTAINER_NAME="${APP_NAME}-${DEPLOYMENT_ENV}"
NETWORK_NAME="${APP_NAME}-network"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="./logs/docker-deploy_${TIMESTAMP}.log"

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
log_message "Starting DineFlow Docker deployment"
log_message "Environment: $DEPLOYMENT_ENV"
log_message "Docker tag: $DOCKER_TAG"

print_status "DineFlow Docker Deployment Script"
print_status "Environment: $DEPLOYMENT_ENV"
print_status "Docker tag: $DOCKER_TAG"
print_status "Container name: $CONTAINER_NAME"

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

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create .env file from .env.example"
    exit 1
fi

print_success ".env file found"

# Step 2: Create Docker network
print_status "Step 2: Creating Docker network"

if ! docker network ls | grep -q "$NETWORK_NAME"; then
    log_message "Creating Docker network: $NETWORK_NAME"
    docker network create "$NETWORK_NAME"
    print_success "Docker network created: $NETWORK_NAME"
else
    print_success "Docker network already exists: $NETWORK_NAME"
fi

# Step 3: Build Docker image
print_status "Step 3: Building Docker image"

log_message "Building Docker image: $DOCKER_IMAGE_NAME:$DOCKER_TAG"

# Build the image
docker build -t "$DOCKER_IMAGE_NAME:$DOCKER_TAG" .

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully: $DOCKER_IMAGE_NAME:$DOCKER_TAG"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Step 4: Stop existing container
print_status "Step 4: Stopping existing container"

if docker ps -a | grep -q "$CONTAINER_NAME"; then
    log_message "Stopping existing container: $CONTAINER_NAME"
    docker stop "$CONTAINER_NAME" || true
    docker rm "$CONTAINER_NAME" || true
    print_success "Existing container stopped and removed"
else
    print_warning "No existing container found"
fi

# Step 5: Create and start new container
print_status "Step 5: Creating and starting new container"

# Environment variables for container
ENV_VARS=""
if [ -f ".env" ]; then
    ENV_VARS="--env-file .env"
fi

# Port mapping
PORT=${PORT:-3000}
CONTAINER_PORT=3000

# Volume mounts
VOLUME_MOUNTS=""
if [ "$DEPLOYMENT_ENV" = "development" ]; then
    VOLUME_MOUNTS="-v $(pwd)/src:/app/src -v $(pwd)/public:/app/public"
fi

# Run the container
log_message "Starting container: $CONTAINER_NAME"
docker run -d \
    --name "$CONTAINER_NAME" \
    --network "$NETWORK_NAME" \
    -p "$PORT:$CONTAINER_PORT" \
    $ENV_VARS \
    $VOLUME_MOUNTS \
    --restart unless-stopped \
    "$DOCKER_IMAGE_NAME:$DOCKER_TAG"

if [ $? -eq 0 ]; then
    print_success "Container started successfully"
else
    print_error "Failed to start container"
    exit 1
fi

# Step 6: Health check
print_status "Step 6: Health check"

# Wait for container to start
sleep 10

# Check if container is running
if docker ps | grep -q "$CONTAINER_NAME"; then
    print_success "Container is running"
else
    print_error "Container is not running"
    docker logs "$CONTAINER_NAME"
    exit 1
fi

# Check application health
HEALTH_CHECK_URL="http://localhost:$PORT/health"
if curl -f "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
    print_success "Application health check passed"
else
    print_warning "Health check failed - checking container logs"
    docker logs "$CONTAINER_NAME"
fi

# Step 7: Setup reverse proxy (optional)
print_status "Step 7: Setting up reverse proxy"

# Check if nginx is available
if command -v nginx &> /dev/null; then
    print_status "Nginx found - setting up reverse proxy"
    
    # Create nginx configuration
    NGINX_CONF="/etc/nginx/sites-available/dineflow"
    sudo tee "$NGINX_CONF" > /dev/null << EOF
server {
    listen 80;
    server_name localhost;
    
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files
    location /static/ {
        proxy_pass http://localhost:$PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Service worker
    location /sw.js {
        proxy_pass http://localhost:$PORT;
        add_header Cache-Control "no-cache";
    }
    
    # Manifest
    location /manifest.json {
        proxy_pass http://localhost:$PORT;
        add_header Cache-Control "no-cache";
    }
}
EOF

    # Enable site
    sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    if sudo nginx -t; then
        sudo systemctl reload nginx
        print_success "Nginx reverse proxy configured"
    else
        print_warning "Nginx configuration test failed"
    fi
else
    print_warning "Nginx not found - skipping reverse proxy setup"
fi

# Step 8: Setup SSL with Let's Encrypt (optional)
print_status "Step 8: Setting up SSL (optional)"

# Check if certbot is available
if command -v certbot &> /dev/null; then
    DOMAIN=${DOMAIN:-""}
    if [ -n "$DOMAIN" ]; then
        print_status "Setting up SSL for domain: $DOMAIN"
        
        # Update nginx config for SSL
        sudo tee "$NGINX_CONF" > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

        # Obtain SSL certificate
        sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@$DOMAIN
        
        print_success "SSL certificate obtained for $DOMAIN"
    else
        print_warning "DOMAIN not set - skipping SSL setup"
    fi
else
    print_warning "Certbot not found - skipping SSL setup"
fi

# Step 9: Setup monitoring
print_status "Step 9: Setting up monitoring"

# Create monitoring script
cat > scripts/monitor.sh << 'EOF'
#!/bin/bash

CONTAINER_NAME="dineflow-production"
LOG_FILE="./logs/monitor.log"

while true; do
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        echo "$(date) - Container $CONTAINER_NAME is down, restarting..." >> "$LOG_FILE"
        docker start "$CONTAINER_NAME"
    fi
    
    sleep 60
done
EOF

chmod +x scripts/monitor.sh

print_success "Monitoring script created"

# Step 10: Cleanup old images
print_status "Step 10: Cleaning up old images"

# Remove old images (keep last 3)
docker images "$DOCKER_IMAGE_NAME" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | tail -n +4 | awk '{print $1}' | xargs -r docker rmi

print_success "Old images cleaned up"

# Step 11: Final status
print_status "Step 11: Final status"

print_success "Docker deployment completed successfully!"
print_status "Application URL: http://localhost:$PORT"
print_status "Container name: $CONTAINER_NAME"
print_status "Docker image: $DOCKER_IMAGE_NAME:$DOCKER_TAG"

# Display container status
docker ps | grep "$CONTAINER_NAME"

# Display container logs
print_status "Recent container logs:"
docker logs --tail 20 "$CONTAINER_NAME"

log_message "Docker deployment completed successfully"

# Usage instructions
echo ""
print_status "Useful commands:"
echo "  View logs: docker logs -f $CONTAINER_NAME"
echo "  Stop app: docker stop $CONTAINER_NAME"
echo "  Start app: docker start $CONTAINER_NAME"
echo "  Restart app: docker restart $CONTAINER_NAME"
echo "  Shell access: docker exec -it $CONTAINER_NAME /bin/bash"
echo "  Monitor: ./scripts/monitor.sh" 