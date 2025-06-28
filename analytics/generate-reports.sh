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
