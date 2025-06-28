#!/bin/bash

# DineFlow Dashboard Management Script
# This script manages Grafana dashboards for DineFlow monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GRAFANA_URL="http://localhost:3001"
GRAFANA_USER="admin"
GRAFANA_PASSWORD="dineflow123"
DASHBOARDS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../grafana/dashboards" && pwd)"

echo -e "${BLUE}📊 DineFlow Dashboard Management${NC}"
echo "=================================="

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

# Check if Grafana is running
check_grafana() {
    echo "Checking Grafana availability..."
    
    if ! curl -s "$GRAFANA_URL/api/health" > /dev/null; then
        print_error "Grafana is not accessible at $GRAFANA_URL"
        print_warning "Make sure the monitoring stack is running"
        exit 1
    fi
    
    print_status "Grafana is accessible"
}

# Get Grafana API key
get_api_key() {
    echo "Getting Grafana API key..."
    
    # Try to get existing API key
    API_KEY=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
        "$GRAFANA_URL/api/auth/keys" | \
        jq -r '.[] | select(.name=="dineflow-monitoring") | .key' 2>/dev/null || echo "")
    
    if [ -z "$API_KEY" ]; then
        # Create new API key
        API_KEY=$(curl -s -X POST -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
            -H "Content-Type: application/json" \
            -d '{"name":"dineflow-monitoring","role":"Admin"}' \
            "$GRAFANA_URL/api/auth/keys" | \
            jq -r '.key' 2>/dev/null || echo "")
        
        if [ -z "$API_KEY" ]; then
            print_error "Failed to create API key"
            exit 1
        fi
        
        print_status "API key created"
    else
        print_status "Using existing API key"
    fi
}

# Create dashboard directory structure
create_dashboard_structure() {
    echo "Creating dashboard directory structure..."
    
    mkdir -p "$DASHBOARDS_DIR"
    
    # Create overview dashboard
    cat > "$DASHBOARDS_DIR/dineflow-overview.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "DineFlow System Overview",
    "tags": ["dineflow", "overview"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Active Bookings",
        "type": "stat",
        "targets": [
          {
            "expr": "active_bookings_total",
            "legendFormat": "Active Bookings"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 50 },
                { "color": "red", "value": 100 }
              ]
            }
          }
        },
        "gridPos": { "h": 8, "w": 6, "x": 0, "y": 0 }
      },
      {
        "id": 2,
        "title": "Total Restaurants",
        "type": "stat",
        "targets": [
          {
            "expr": "restaurants_total",
            "legendFormat": "Restaurants"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            }
          }
        },
        "gridPos": { "h": 8, "w": 6, "x": 6, "y": 0 }
      },
      {
        "id": 3,
        "title": "Total Users",
        "type": "stat",
        "targets": [
          {
            "expr": "users_total",
            "legendFormat": "Users"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            }
          }
        },
        "gridPos": { "h": 8, "w": 6, "x": 12, "y": 0 }
      },
      {
        "id": 4,
        "title": "HTTP Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            }
          }
        },
        "gridPos": { "h": 8, "w": 12, "x": 18, "y": 0 }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s",
    "schemaVersion": 27,
    "version": 1,
    "uid": "dineflow-overview"
  }
}
EOF

    # Create business analytics dashboard
    cat > "$DASHBOARDS_DIR/dineflow-business.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "DineFlow Business Analytics",
    "tags": ["dineflow", "business"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Booking Creation Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(bookings_created_total[5m])",
            "legendFormat": "{{restaurant_id}} - {{status}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            }
          }
        },
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 }
      },
      {
        "id": 2,
        "title": "Check-in Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(checkins_total[5m])",
            "legendFormat": "{{restaurant_id}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            }
          }
        },
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 }
      },
      {
        "id": 3,
        "title": "Cancellation Rate",
        "type": "gauge",
        "targets": [
          {
            "expr": "sum(rate(bookings_cancelled_total[24h])) / sum(rate(bookings_created_total[24h])) * 100",
            "legendFormat": "Cancellation Rate (%)"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 10 },
                { "color": "red", "value": 20 }
              ]
            },
            "unit": "percent"
          }
        },
        "gridPos": { "h": 8, "w": 6, "x": 0, "y": 8 }
      }
    ],
    "time": {
      "from": "now-7d",
      "to": "now"
    },
    "refresh": "1m",
    "schemaVersion": 27,
    "version": 1,
    "uid": "dineflow-business"
  }
}
EOF

    # Create system performance dashboard
    cat > "$DASHBOARDS_DIR/dineflow-performance.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "DineFlow System Performance",
    "tags": ["dineflow", "performance"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "CPU Usage",
        "type": "timeseries",
        "targets": [
          {
            "expr": "cpu_usage_percent",
            "legendFormat": "CPU Usage"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 70 },
                { "color": "red", "value": 90 }
              ]
            },
            "unit": "percent"
          }
        },
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 }
      },
      {
        "id": 2,
        "title": "Memory Usage",
        "type": "timeseries",
        "targets": [
          {
            "expr": "memory_usage_bytes{type=\"heap_used\"} / 1024 / 1024",
            "legendFormat": "Heap Used (MB)"
          },
          {
            "expr": "memory_usage_bytes{type=\"heap_total\"} / 1024 / 1024",
            "legendFormat": "Heap Total (MB)"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            },
            "unit": "bytes"
          }
        },
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 }
      },
      {
        "id": 3,
        "title": "HTTP Response Time",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            },
            "unit": "s"
          }
        },
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s",
    "schemaVersion": 27,
    "version": 1,
    "uid": "dineflow-performance"
  }
}
EOF

    # Create alerts dashboard
    cat > "$DASHBOARDS_DIR/dineflow-alerts.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "DineFlow Alerts & Issues",
    "tags": ["dineflow", "alerts"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Active Alerts",
        "type": "stat",
        "targets": [
          {
            "expr": "count(ALERTS{alertstate=\"firing\"})",
            "legendFormat": "Firing Alerts"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 1 },
                { "color": "red", "value": 5 }
              ]
            }
          }
        },
        "gridPos": { "h": 8, "w": 6, "x": 0, "y": 0 }
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
            "legendFormat": "5xx Errors"
          },
          {
            "expr": "rate(http_requests_total{status_code=~\"4..\"}[5m])",
            "legendFormat": "4xx Errors"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            }
          }
        },
        "gridPos": { "h": 8, "w": 12, "x": 6, "y": 0 }
      }
    ],
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "refresh": "30s",
    "schemaVersion": 27,
    "version": 1,
    "uid": "dineflow-alerts"
  }
}
EOF

    print_status "Dashboard files created"
}

# Import dashboard to Grafana
import_dashboard() {
    local dashboard_file="$1"
    local dashboard_name=$(basename "$dashboard_file" .json)
    
    echo "Importing dashboard: $dashboard_name"
    
    # Check if dashboard already exists
    local existing_id=$(curl -s -H "Authorization: Bearer $API_KEY" \
        "$GRAFANA_URL/api/search?query=$dashboard_name" | \
        jq -r '.[] | select(.title | contains("'$dashboard_name'")) | .id' 2>/dev/null || echo "")
    
    if [ -n "$existing_id" ]; then
        print_warning "Dashboard $dashboard_name already exists (ID: $existing_id)"
        return
    fi
    
    # Import dashboard
    local result=$(curl -s -X POST \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$dashboard_file" \
        "$GRAFANA_URL/api/dashboards/db")
    
    local success=$(echo "$result" | jq -r '.success' 2>/dev/null || echo "false")
    
    if [ "$success" = "true" ]; then
        local dashboard_id=$(echo "$result" | jq -r '.id' 2>/dev/null || echo "")
        print_status "Dashboard $dashboard_name imported successfully (ID: $dashboard_id)"
    else
        local error=$(echo "$result" | jq -r '.message' 2>/dev/null || echo "Unknown error")
        print_error "Failed to import dashboard $dashboard_name: $error"
    fi
}

# Import all dashboards
import_all_dashboards() {
    echo "Importing all dashboards..."
    
    for dashboard_file in "$DASHBOARDS_DIR"/*.json; do
        if [ -f "$dashboard_file" ]; then
            import_dashboard "$dashboard_file"
        fi
    done
    
    print_status "All dashboards imported"
}

# List existing dashboards
list_dashboards() {
    echo "Listing existing dashboards..."
    
    local dashboards=$(curl -s -H "Authorization: Bearer $API_KEY" \
        "$GRAFANA_URL/api/search" | \
        jq -r '.[] | "\(.id): \(.title) (\(.type))"' 2>/dev/null || echo "")
    
    if [ -n "$dashboards" ]; then
        echo "$dashboards"
    else
        print_warning "No dashboards found"
    fi
}

# Delete dashboard
delete_dashboard() {
    local dashboard_id="$1"
    
    if [ -z "$dashboard_id" ]; then
        print_error "Dashboard ID is required"
        return
    fi
    
    echo "Deleting dashboard ID: $dashboard_id"
    
    local result=$(curl -s -X DELETE \
        -H "Authorization: Bearer $API_KEY" \
        "$GRAFANA_URL/api/dashboards/uid/$dashboard_id")
    
    print_status "Dashboard deleted"
}

# Create datasource
create_datasource() {
    echo "Creating Prometheus datasource..."
    
    local datasource_config='{
        "name": "Prometheus",
        "type": "prometheus",
        "access": "proxy",
        "url": "http://prometheus:9090",
        "isDefault": true,
        "editable": true,
        "jsonData": {
            "timeInterval": "15s",
            "queryTimeout": "60s",
            "httpMethod": "POST"
        }
    }'
    
    local result=$(curl -s -X POST \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$datasource_config" \
        "$GRAFANA_URL/api/datasources")
    
    local success=$(echo "$result" | jq -r '.datasource.id' 2>/dev/null || echo "")
    
    if [ -n "$success" ]; then
        print_status "Prometheus datasource created successfully"
    else
        local error=$(echo "$result" | jq -r '.message' 2>/dev/null || echo "Unknown error")
        print_error "Failed to create datasource: $error"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}Dashboard Management Options:${NC}"
    echo "1. Import all dashboards"
    echo "2. List existing dashboards"
    echo "3. Create Prometheus datasource"
    echo "4. Check Grafana status"
    echo "5. Exit"
    echo ""
    read -p "Select an option (1-5): " choice
    
    case $choice in
        1)
            import_all_dashboards
            ;;
        2)
            list_dashboards
            ;;
        3)
            create_datasource
            ;;
        4)
            check_grafana
            ;;
        5)
            echo "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid option"
            ;;
    esac
}

# Main execution
main() {
    check_grafana
    get_api_key
    create_dashboard_structure
    
    if [ "$1" = "--import" ]; then
        import_all_dashboards
    elif [ "$1" = "--list" ]; then
        list_dashboards
    elif [ "$1" = "--datasource" ]; then
        create_datasource
    else
        while true; do
            show_menu
        done
    fi
}

# Run main function
main "$@" 