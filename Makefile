# DineFlow Makefile
# This Makefile provides convenient commands for DineFlow deployment and management

.PHONY: help install build test deploy deploy-docker deploy-compose deploy-vercel backup monitor clean logs status

# Configuration
APP_NAME = dineflow
NODE_ENV ?= development
PORT ?= 3000

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

# Default target
help:
	@echo "$(BLUE)DineFlow Management Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make install     - Install dependencies"
	@echo "  make dev         - Start development server"
	@echo "  make build       - Build for production"
	@echo "  make test        - Run tests"
	@echo ""
	@echo "$(GREEN)Deployment:$(NC)"
	@echo "  make deploy      - Deploy to production (PM2)"
	@echo "  make deploy-docker - Deploy using Docker"
	@echo "  make deploy-compose - Deploy using Docker Compose"
	@echo "  make deploy-vercel - Deploy to Vercel"
	@echo ""
	@echo "$(GREEN)Management:$(NC)"
	@echo "  make backup      - Create backup"
	@echo "  make monitor     - Start monitoring"
	@echo "  make logs        - View logs"
	@echo "  make status      - Check application status"
	@echo "  make clean       - Clean build artifacts"
	@echo ""
	@echo "$(GREEN)Examples:$(NC)"
	@echo "  make deploy NODE_ENV=production"
	@echo "  make deploy-docker TAG=v1.0.0"
	@echo "  make backup RETENTION_DAYS=7"

# Development commands
install:
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm ci

dev:
	@echo "$(BLUE)Starting development server...$(NC)"
	npm run dev

build:
	@echo "$(BLUE)Building for production...$(NC)"
	npm run build

test:
	@echo "$(BLUE)Running tests...$(NC)"
	npm test

# Deployment commands
deploy:
	@echo "$(BLUE)Deploying to production...$(NC)"
	@chmod +x scripts/deploy.sh
	./scripts/deploy.sh $(NODE_ENV)

deploy-docker:
	@echo "$(BLUE)Deploying with Docker...$(NC)"
	@chmod +x scripts/deploy-docker.sh
	./scripts/deploy-docker.sh $(TAG) $(NODE_ENV)

deploy-compose:
	@echo "$(BLUE)Deploying with Docker Compose...$(NC)"
	@chmod +x scripts/deploy-compose.sh
	./scripts/deploy-compose.sh $(NODE_ENV)

deploy-vercel:
	@echo "$(BLUE)Deploying to Vercel...$(NC)"
	@chmod +x scripts/deploy-vercel.sh
	./scripts/deploy-vercel.sh $(NODE_ENV) $(PROJECT_NAME) $(DOMAIN)

# Management commands
backup:
	@echo "$(BLUE)Creating backup...$(NC)"
	@chmod +x scripts/backup.sh
	./scripts/backup.sh

monitor:
	@echo "$(BLUE)Starting monitoring...$(NC)"
	@chmod +x scripts/monitor.sh
	./scripts/monitor.sh $(INTERVAL)

logs:
	@echo "$(BLUE)Viewing logs...$(NC)"
	@if command -v pm2 >/dev/null 2>&1; then \
		pm2 logs $(APP_NAME); \
	elif command -v docker >/dev/null 2>&1; then \
		docker logs -f $(APP_NAME)-$(NODE_ENV); \
	else \
		tail -f logs/*.log; \
	fi

status:
	@echo "$(BLUE)Checking application status...$(NC)"
	@if command -v pm2 >/dev/null 2>&1; then \
		pm2 status; \
	elif command -v docker >/dev/null 2>&1; then \
		docker ps | grep $(APP_NAME); \
	else \
		echo "No process manager found"; \
	fi

# Utility commands
clean:
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf dist/
	rm -rf node_modules/
	rm -rf logs/
	rm -rf backups/
	@echo "$(GREEN)Clean completed$(NC)"

setup:
	@echo "$(BLUE)Setting up DineFlow...$(NC)"
	@if [ ! -f .env ]; then \
		cp env.example .env; \
		echo "$(YELLOW)Please configure .env file$(NC)"; \
	fi
	make install
	@echo "$(GREEN)Setup completed$(NC)"

# Database commands
db-backup:
	@echo "$(BLUE)Creating database backup...$(NC)"
	@if command -v mongodump >/dev/null 2>&1; then \
		mongodump --uri="$(MONGODB_URI)" --out="./backups/db_$(shell date +%Y%m%d_%H%M%S)"; \
		echo "$(GREEN)Database backup completed$(NC)"; \
	else \
		echo "$(RED)mongodump not found$(NC)"; \
	fi

db-restore:
	@echo "$(BLUE)Restoring database...$(NC)"
	@if command -v mongorestore >/dev/null 2>&1; then \
		mongorestore --uri="$(MONGODB_URI)" $(BACKUP_PATH); \
		echo "$(GREEN)Database restore completed$(NC)"; \
	else \
		echo "$(RED)mongorestore not found$(NC)"; \
	fi

# Security commands
security-check:
	@echo "$(BLUE)Running security checks...$(NC)"
	@if [ -f .env ]; then \
		if grep -q "password.*=.*'123456'" .env; then \
			echo "$(RED)Weak password detected$(NC)"; \
		fi; \
		if grep -q "JWT_SECRET.*=.*'default'" .env; then \
			echo "$(RED)Default JWT secret detected$(NC)"; \
		fi; \
		echo "$(GREEN)Security checks completed$(NC)"; \
	else \
		echo "$(YELLOW).env file not found$(NC)"; \
	fi

# Performance commands
performance-test:
	@echo "$(BLUE)Running performance tests...$(NC)"
	@if command -v autocannon >/dev/null 2>&1; then \
		autocannon -c 10 -d 5 http://localhost:$(PORT); \
	else \
		echo "$(YELLOW)autocannon not found, install with: npm install -g autocannon$(NC)"; \
	fi

# Docker commands
docker-build:
	@echo "$(BLUE)Building Docker image...$(NC)"
	docker build -t $(APP_NAME):$(TAG) .

docker-run:
	@echo "$(BLUE)Running Docker container...$(NC)"
	docker run -d --name $(APP_NAME)-$(NODE_ENV) -p $(PORT):3000 $(APP_NAME):$(TAG)

docker-stop:
	@echo "$(BLUE)Stopping Docker container...$(NC)"
	docker stop $(APP_NAME)-$(NODE_ENV) || true
	docker rm $(APP_NAME)-$(NODE_ENV) || true

# Environment-specific commands
dev-setup:
	@echo "$(BLUE)Setting up development environment...$(NC)"
	export NODE_ENV=development
	make setup
	make security-check

prod-setup:
	@echo "$(BLUE)Setting up production environment...$(NC)"
	export NODE_ENV=production
	make setup
	make security-check
	make build

# Quick commands
quick-deploy:
	@echo "$(BLUE)Quick deployment...$(NC)"
	make build
	make deploy

quick-test:
	@echo "$(BLUE)Quick test...$(NC)"
	make test
	make security-check

# Maintenance commands
maintenance-on:
	@echo "$(BLUE)Enabling maintenance mode...$(NC)"
	@echo "maintenance" > .maintenance
	@echo "$(GREEN)Maintenance mode enabled$(NC)"

maintenance-off:
	@echo "$(BLUE)Disabling maintenance mode...$(NC)"
	@rm -f .maintenance
	@echo "$(GREEN)Maintenance mode disabled$(NC)"

# Health check
health:
	@echo "$(BLUE)Checking application health...$(NC)"
	@curl -f http://localhost:$(PORT)/health > /dev/null 2>&1 && \
		echo "$(GREEN)Application is healthy$(NC)" || \
		echo "$(RED)Application is not responding$(NC)"

# Version info
version:
	@echo "$(BLUE)DineFlow Version Information$(NC)"
	@echo "Node.js: $(shell node -v)"
	@echo "npm: $(shell npm -v)"
	@if command -v docker >/dev/null 2>&1; then \
		echo "Docker: $(shell docker --version)"; \
	fi
	@if command -v pm2 >/dev/null 2>&1; then \
		echo "PM2: $(shell pm2 -v)"; \
	fi

# Documentation
docs:
	@echo "$(BLUE)Generating documentation...$(NC)"
	@if command -v jsdoc >/dev/null 2>&1; then \
		jsdoc src/ -d docs/; \
		echo "$(GREEN)Documentation generated in docs/$(NC)"; \
	else \
		echo "$(YELLOW)jsdoc not found, install with: npm install -g jsdoc$(NC)"; \
	fi

# Linting and formatting
lint:
	@echo "$(BLUE)Running linter...$(NC)"
	@if [ -f package.json ] && grep -q "\"lint\":" package.json; then \
		npm run lint; \
	else \
		echo "$(YELLOW)No lint script found$(NC)"; \
	fi

format:
	@echo "$(BLUE)Formatting code...$(NC)"
	@if command -v prettier >/dev/null 2>&1; then \
		prettier --write "src/**/*.{js,jsx,ts,tsx}"; \
		echo "$(GREEN)Code formatted$(NC)"; \
	else \
		echo "$(YELLOW)prettier not found, install with: npm install -g prettier$(NC)"; \
	fi 