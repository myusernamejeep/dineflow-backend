const Router = require('koa-router');
const { reportingService } = require('../utils/reporting');
const { authGuard } = require('../utils/authGuard');

const router = new Router({ prefix: '/reports' });

// Apply authentication guard to all report routes
router.use(authGuard);

// Generate Daily Report
router.post('/daily', async (ctx) => {
  try {
    const { date, email } = ctx.request.body;
    
    const report = await reportingService.generateDailyReport(date ? new Date(date) : new Date());
    
    // Send email if requested
    if (email && Array.isArray(email)) {
      await reportingService.sendReportEmail(
        report,
        email,
        `Daily Report - ${new Date(report.date).toLocaleDateString()}`
      );
    }
    
    ctx.body = {
      success: true,
      data: report,
      message: 'Daily report generated successfully'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Generate Weekly Report
router.post('/weekly', async (ctx) => {
  try {
    const { startDate, email } = ctx.request.body;
    
    const report = await reportingService.generateWeeklyReport(startDate ? new Date(startDate) : new Date());
    
    // Send email if requested
    if (email && Array.isArray(email)) {
      await reportingService.sendReportEmail(
        report,
        email,
        `Weekly Report - ${report.period.start} to ${report.period.end}`
      );
    }
    
    ctx.body = {
      success: true,
      data: report,
      message: 'Weekly report generated successfully'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Generate Monthly Report
router.post('/monthly', async (ctx) => {
  try {
    const { year, month, email } = ctx.request.body;
    
    const currentDate = new Date();
    const reportYear = year || currentDate.getFullYear();
    const reportMonth = month || currentDate.getMonth() + 1;
    
    const report = await reportingService.generateMonthlyReport(reportYear, reportMonth);
    
    // Send email if requested
    if (email && Array.isArray(email)) {
      await reportingService.sendReportEmail(
        report,
        email,
        `Monthly Report - ${reportYear}-${reportMonth.toString().padStart(2, '0')}`
      );
    }
    
    ctx.body = {
      success: true,
      data: report,
      message: 'Monthly report generated successfully'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Generate Custom Report
router.post('/custom', async (ctx) => {
  try {
    const {
      startDate,
      endDate,
      metrics,
      format,
      includeInsights,
      includeRecommendations,
      email
    } = ctx.request.body;
    
    if (!startDate || !endDate) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'startDate and endDate are required'
      };
      return;
    }
    
    const report = await reportingService.generateCustomReport({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      metrics: metrics || ['revenue', 'bookings', 'restaurants', 'users'],
      format: format || 'json',
      includeInsights: includeInsights !== false,
      includeRecommendations: includeRecommendations !== false
    });
    
    // Send email if requested
    if (email && Array.isArray(email)) {
      await reportingService.sendReportEmail(
        report,
        email,
        `Custom Report - ${startDate} to ${endDate}`
      );
    }
    
    ctx.body = {
      success: true,
      data: report,
      message: 'Custom report generated successfully'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Get Report History
router.get('/history', async (ctx) => {
  try {
    const { limit = 10 } = ctx.query;
    const reports = await reportingService.getReportHistory(parseInt(limit));
    
    ctx.body = {
      success: true,
      data: reports,
      count: reports.length
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Get Specific Report
router.get('/:filename', async (ctx) => {
  try {
    const { filename } = ctx.params;
    const filepath = path.join(reportingService.reportsDir, filename);
    
    const content = await fs.readFile(filepath, 'utf8');
    const report = JSON.parse(content);
    
    ctx.body = {
      success: true,
      data: report
    };
  } catch (error) {
    ctx.status = 404;
    ctx.body = {
      success: false,
      error: 'Report not found'
    };
  }
});

// Download Report
router.get('/:filename/download', async (ctx) => {
  try {
    const { filename } = ctx.params;
    const filepath = path.join(reportingService.reportsDir, filename);
    
    // Set headers for file download
    ctx.set('Content-Type', 'application/json');
    ctx.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    ctx.body = fs.createReadStream(filepath);
  } catch (error) {
    ctx.status = 404;
    ctx.body = {
      success: false,
      error: 'Report not found'
    };
  }
});

// Send Report via Email
router.post('/:filename/send', async (ctx) => {
  try {
    const { filename } = ctx.params;
    const { recipients, subject } = ctx.request.body;
    
    if (!recipients || !Array.isArray(recipients)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'recipients array is required'
      };
      return;
    }
    
    const filepath = path.join(reportingService.reportsDir, filename);
    const content = await fs.readFile(filepath, 'utf8');
    const report = JSON.parse(content);
    
    await reportingService.sendReportEmail(
      report,
      recipients,
      subject || `${report.type} Report`
    );
    
    ctx.body = {
      success: true,
      message: `Report sent to ${recipients.join(', ')}`
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Delete Report
router.delete('/:filename', async (ctx) => {
  try {
    const { filename } = ctx.params;
    const filepath = path.join(reportingService.reportsDir, filename);
    
    await fs.unlink(filepath);
    
    ctx.body = {
      success: true,
      message: 'Report deleted successfully'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Cleanup Old Reports
router.post('/cleanup', async (ctx) => {
  try {
    const { daysToKeep = 30 } = ctx.request.body;
    const deletedCount = await reportingService.cleanupOldReports(daysToKeep);
    
    ctx.body = {
      success: true,
      message: `Cleaned up ${deletedCount} old reports`,
      deletedCount
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Get Report Templates
router.get('/templates', async (ctx) => {
  try {
    const templates = [
      {
        id: 'daily',
        name: 'Daily Report',
        description: 'Daily summary of bookings, revenue, and user activity',
        parameters: [
          { name: 'date', type: 'date', required: false, description: 'Report date (defaults to today)' },
          { name: 'email', type: 'array', required: false, description: 'Email recipients' }
        ]
      },
      {
        id: 'weekly',
        name: 'Weekly Report',
        description: 'Weekly analytics with trends and insights',
        parameters: [
          { name: 'startDate', type: 'date', required: false, description: 'Week start date' },
          { name: 'email', type: 'array', required: false, description: 'Email recipients' }
        ]
      },
      {
        id: 'monthly',
        name: 'Monthly Report',
        description: 'Comprehensive monthly analysis with forecasts',
        parameters: [
          { name: 'year', type: 'number', required: false, description: 'Report year' },
          { name: 'month', type: 'number', required: false, description: 'Report month (1-12)' },
          { name: 'email', type: 'array', required: false, description: 'Email recipients' }
        ]
      },
      {
        id: 'custom',
        name: 'Custom Report',
        description: 'Custom report with specific metrics and date range',
        parameters: [
          { name: 'startDate', type: 'date', required: true, description: 'Report start date' },
          { name: 'endDate', type: 'date', required: true, description: 'Report end date' },
          { name: 'metrics', type: 'array', required: false, description: 'Metrics to include' },
          { name: 'includeInsights', type: 'boolean', required: false, description: 'Include insights' },
          { name: 'includeRecommendations', type: 'boolean', required: false, description: 'Include recommendations' },
          { name: 'email', type: 'array', required: false, description: 'Email recipients' }
        ]
      }
    ];
    
    ctx.body = {
      success: true,
      data: templates
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Get Report Statistics
router.get('/stats', async (ctx) => {
  try {
    const reports = await reportingService.getReportHistory(1000);
    
    const stats = {
      totalReports: reports.length,
      byType: {},
      byMonth: {},
      totalSize: 0
    };
    
    reports.forEach(report => {
      // Count by type
      stats.byType[report.type] = (stats.byType[report.type] || 0) + 1;
      
      // Count by month
      const month = new Date(report.generatedAt).toISOString().substring(0, 7);
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
    });
    
    // Calculate total size
    const files = await fs.readdir(reportingService.reportsDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filepath = path.join(reportingService.reportsDir, file);
        const stats = await fs.stat(filepath);
        stats.totalSize += stats.size;
      }
    }
    
    ctx.body = {
      success: true,
      data: stats
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Schedule Report Generation
router.post('/schedule', async (ctx) => {
  try {
    const {
      type,
      schedule,
      recipients,
      parameters = {}
    } = ctx.request.body;
    
    if (!type || !schedule || !recipients) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'type, schedule, and recipients are required'
      };
      return;
    }
    
    // This would integrate with a job scheduler like node-cron
    // For now, we'll just validate and return success
    const validTypes = ['daily', 'weekly', 'monthly', 'custom'];
    if (!validTypes.includes(type)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Invalid report type'
      };
      return;
    }
    
    // Schedule validation (basic cron format)
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    
    if (!cronRegex.test(schedule)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Invalid schedule format. Use cron format: minute hour day month dayOfWeek'
      };
      return;
    }
    
    // In a real implementation, this would save to a database and set up a cron job
    const scheduledJob = {
      id: `report_${Date.now()}`,
      type,
      schedule,
      recipients,
      parameters,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    ctx.body = {
      success: true,
      data: scheduledJob,
      message: 'Report scheduled successfully'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Get Scheduled Reports
router.get('/scheduled', async (ctx) => {
  try {
    // In a real implementation, this would fetch from a database
    const scheduledReports = [
      {
        id: 'daily_report',
        type: 'daily',
        schedule: '0 9 * * *', // Daily at 9 AM
        recipients: ['admin@dineflow.com'],
        status: 'active',
        lastRun: '2024-01-15T09:00:00Z',
        nextRun: '2024-01-16T09:00:00Z'
      },
      {
        id: 'weekly_report',
        type: 'weekly',
        schedule: '0 10 * * 1', // Weekly on Monday at 10 AM
        recipients: ['manager@dineflow.com', 'admin@dineflow.com'],
        status: 'active',
        lastRun: '2024-01-15T10:00:00Z',
        nextRun: '2024-01-22T10:00:00Z'
      }
    ];
    
    ctx.body = {
      success: true,
      data: scheduledReports
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Update Scheduled Report
router.put('/scheduled/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    const { schedule, recipients, status, parameters } = ctx.request.body;
    
    // In a real implementation, this would update the database
    const updatedJob = {
      id,
      schedule: schedule || '0 9 * * *',
      recipients: recipients || ['admin@dineflow.com'],
      status: status || 'active',
      parameters: parameters || {},
      updatedAt: new Date().toISOString()
    };
    
    ctx.body = {
      success: true,
      data: updatedJob,
      message: 'Scheduled report updated successfully'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Delete Scheduled Report
router.delete('/scheduled/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    
    // In a real implementation, this would remove from database and cancel cron job
    
    ctx.body = {
      success: true,
      message: 'Scheduled report deleted successfully'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

module.exports = router; 