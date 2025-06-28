# DineFlow Advanced Monitoring Dashboards

This document provides comprehensive information about the DineFlow monitoring stack, including Grafana dashboards, Prometheus metrics, alerting, and observability tools.

## 🏗️ Monitoring Architecture

The DineFlow monitoring stack consists of the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DineFlow      │    │   Prometheus    │    │     Grafana     │
│   Application   │───▶│   (Metrics)     │───▶│   (Dashboards)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Node Exporter │    │  Alertmanager   │    │      Loki       │
│  (System Metrics)│   │   (Alerts)      │    │   (Logs)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    cAdvisor     │    │     Jaeger      │    │   Promtail      │
│ (Container Metrics)│  │   (Tracing)     │    │  (Log Collection)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Available Dashboards

### 1. System Overview Dashboard
**File:** `grafana/dashboards/dineflow-overview.json`
**Purpose:** High-level system health and business metrics

**Panels:**
- Active Bookings Count
- Total Restaurants
- Total Users
- HTTP Request Rate
- Booking Creation Rate
- Check-in Rate
- Memory Usage
- CPU Usage
- Database Connections
- Notification Success Rate

### 2. Business Analytics Dashboard
**File:** `grafana/dashboards/dineflow-business.json`
**Purpose:** Business performance and revenue metrics

**Panels:**
- Daily Revenue Trends
- Booking Trends by Hour
- Restaurant Performance Table
- Cancellation Rate Gauge
- Check-in Rate Gauge
- Weekly Booking Patterns
- User Growth
- Notification Success Rate
- Peak Hours Analysis
- Booking Status Distribution
- Revenue by Restaurant

### 3. System Performance Dashboard
**File:** `grafana/dashboards/dineflow-performance.json`
**Purpose:** Infrastructure and application performance

**Panels:**
- CPU Usage Trends
- Memory Usage (Heap, RSS)
- Disk Usage
- Database Connections
- HTTP Request Rate
- HTTP Response Time
- Error Rate
- Application Uptime
- Memory Usage Percentage
- Request Status Distribution
- Top Endpoints by Response Time
- System Load
- Network I/O

### 4. Alerts & Issues Dashboard
**File:** `grafana/dashboards/dineflow-alerts.json`
**Purpose:** Alert monitoring and issue tracking

**Panels:**
- Active Alerts Count
- Critical Issues
- Error Rate Trends
- High Memory Usage Alert
- High CPU Usage Alert
- Database Connection Alert
- Response Time Alert
- Notification Failure Alert
- Booking Failure Alert
- Alert History Table
- Service Health Status
- Uptime Status

## 🔧 Setup Instructions

### Quick Start

1. **Clone and navigate to the project:**
   ```bash
   cd dineflow-backend
   ```

2. **Run the monitoring setup script:**
   ```bash
   chmod +x scripts/monitoring-setup.sh
   ./scripts/monitoring-setup.sh
   ```

3. **Import dashboards:**
   ```bash
   chmod +x scripts/monitoring-dashboard.sh
   ./scripts/monitoring-dashboard.sh --import
   ```

### Manual Setup

1. **Start the monitoring stack:**
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. **Access Grafana:**
   - URL: http://localhost:3001
   - Username: `admin`
   - Password: `dineflow123`

3. **Add Prometheus as data source:**
   - Go to Configuration → Data Sources
   - Add Prometheus
   - URL: `http://prometheus:9090`

4. **Import dashboards:**
   - Go to Dashboards → Import
   - Upload the JSON files from `grafana/dashboards/`

## 📈 Metrics Collection

### Application Metrics

The DineFlow application exposes the following Prometheus metrics:

#### Business Metrics
- `active_bookings_total` - Number of active bookings
- `restaurants_total` - Total number of restaurants
- `users_total` - Total number of users
- `bookings_created_total` - Booking creation rate
- `bookings_cancelled_total` - Booking cancellation rate
- `checkins_total` - Check-in rate
- `notifications_sent_total` - Notification success/failure rate

#### Performance Metrics
- `http_requests_total` - HTTP request count by method, route, status
- `http_request_duration_seconds` - HTTP response time
- `memory_usage_bytes` - Memory usage by type
- `cpu_usage_percent` - CPU usage percentage
- `database_connections_active` - Active database connections
- `application_uptime_seconds` - Application uptime

### System Metrics

- **Node Exporter:** System metrics (CPU, memory, disk, network)
- **cAdvisor:** Container metrics
- **MongoDB Exporter:** Database metrics
- **Redis Exporter:** Cache metrics
- **Nginx Exporter:** Web server metrics

## 🚨 Alerting Rules

### Critical Alerts
- Service Down
- High CPU Usage (>90%)
- High Memory Usage (>90%)
- High Error Rate (>20%)
- Critical Response Time (>5s)
- Booking Failures (>5%)

### Warning Alerts
- High CPU Usage (>80%)
- High Memory Usage (>80%)
- High Database Connections (>80)
- High Response Time (>2s)
- Notification Failures (>10%)

### Business Alerts
- No Bookings Today
- High Cancellation Rate (>30%)
- Low Check-in Rate (<50%)

## 📝 Log Management

### Log Collection
- **Promtail:** Collects application and system logs
- **Loki:** Stores and indexes logs
- **Grafana:** Visualizes logs with queries

### Log Sources
- Application logs: `/var/log/dineflow/*.log`
- System logs: `/var/log/syslog`
- Docker logs: `/var/lib/docker/containers/*/*-json.log`
- Nginx logs: `/var/log/nginx/*.log`

## 🔍 Distributed Tracing

### Jaeger Integration
- **URL:** http://localhost:16686
- **Purpose:** Trace request flows across services
- **Features:** Request tracing, performance analysis, error tracking

## 🛠️ Management Commands

### Monitoring Stack
```bash
# Start monitoring
./monitoring/start-monitoring.sh

# Stop monitoring
./monitoring/stop-monitoring.sh

# Restart monitoring
./monitoring/restart-monitoring.sh

# Check status
./monitoring/status-monitoring.sh

# View logs
./monitoring/logs-monitoring.sh
```

### Dashboard Management
```bash
# Import all dashboards
./scripts/monitoring-dashboard.sh --import

# List existing dashboards
./scripts/monitoring-dashboard.sh --list

# Create datasource
./scripts/monitoring-dashboard.sh --datasource
```

## 🔧 Configuration

### Prometheus Configuration
- **File:** `prometheus/prometheus.yml`
- **Scrape Interval:** 15s
- **Retention:** 200 hours
- **Targets:** DineFlow app, Node Exporter, cAdvisor

### Alertmanager Configuration
- **File:** `alertmanager/alertmanager.yml`
- **Email Notifications:** Configure SMTP settings
- **Slack Integration:** Add webhook URL
- **LINE Integration:** Add bot token

### Grafana Configuration
- **Admin User:** admin
- **Admin Password:** dineflow123
- **Port:** 3001
- **Plugins:** Clock panel, Simple JSON datasource

## 📊 Dashboard Customization

### Adding New Panels
1. Open Grafana dashboard
2. Click "Add Panel"
3. Select visualization type
4. Configure Prometheus query
5. Set thresholds and styling
6. Save dashboard

### Creating Custom Queries
```promql
# Booking success rate
rate(bookings_created_total{status="confirmed"}[5m]) / rate(bookings_created_total[5m]) * 100

# Average response time
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# Error rate percentage
rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100
```

## 🔒 Security Considerations

### Access Control
- Grafana authentication required
- API keys for automation
- Role-based access control
- Secure communication (HTTPS)

### Data Protection
- Metrics retention policies
- Log rotation and cleanup
- Sensitive data filtering
- Backup and recovery

## 🚀 Performance Optimization

### Prometheus Optimization
- Increase scrape intervals for less critical metrics
- Use recording rules for complex queries
- Configure proper retention policies
- Monitor Prometheus resource usage

### Grafana Optimization
- Use dashboard caching
- Optimize query performance
- Limit concurrent users
- Monitor Grafana resource usage

## 📞 Troubleshooting

### Common Issues

1. **Grafana not accessible:**
   ```bash
   docker-compose -f docker-compose.monitoring.yml ps
   docker-compose -f docker-compose.monitoring.yml logs grafana
   ```

2. **Prometheus not scraping metrics:**
   ```bash
   curl http://localhost:9090/api/v1/targets
   curl http://localhost:3000/monitoring/metrics
   ```

3. **Alerts not firing:**
   ```bash
   curl http://localhost:9090/api/v1/rules
   curl http://localhost:9093/api/v1/alerts
   ```

4. **Dashboard panels showing no data:**
   - Check data source connection
   - Verify Prometheus queries
   - Check time range settings
   - Review metric names and labels

### Debug Commands
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check alert rules
curl http://localhost:9090/api/v1/rules

# Check Alertmanager alerts
curl http://localhost:9093/api/v1/alerts

# Check Grafana health
curl http://localhost:3001/api/health

# Check Loki logs
curl http://localhost:3100/ready
```

## 📚 Additional Resources

### Documentation
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Loki Documentation](https://grafana.com/docs/loki/)

### Community
- [Prometheus Community](https://prometheus.io/community/)
- [Grafana Community](https://community.grafana.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/prometheus)

### Monitoring Best Practices
- Set appropriate alert thresholds
- Use meaningful alert descriptions
- Implement proper escalation procedures
- Regular dashboard reviews and updates
- Monitor the monitoring system itself

---

For support or questions about the monitoring setup, please refer to the main project documentation or create an issue in the repository. 