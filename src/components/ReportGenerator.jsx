import { h, Component } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../utils/api';

const ReportGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [reportHistory, setReportHistory] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    type: 'daily',
    startDate: '',
    endDate: '',
    metrics: ['revenue', 'bookings', 'restaurants', 'users'],
    includeInsights: true,
    includeRecommendations: true,
    email: [],
    schedule: '',
    recipients: []
  });

  // Load initial data
  useEffect(() => {
    loadReportHistory();
    loadScheduledReports();
    loadTemplates();
  }, []);

  // Load report history
  const loadReportHistory = async () => {
    try {
      const response = await api.get('/reports/history?limit=20');
      setReportHistory(response.data);
    } catch (err) {
      console.error('Failed to load report history:', err);
    }
  };

  // Load scheduled reports
  const loadScheduledReports = async () => {
    try {
      const response = await api.get('/reports/scheduled');
      setScheduledReports(response.data);
    } catch (err) {
      console.error('Failed to load scheduled reports:', err);
    }
  };

  // Load report templates
  const loadTemplates = async () => {
    try {
      const response = await api.get('/reports/templates');
      setTemplates(response.data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      type: template.id,
      ...template.defaults
    }));
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle email input
  const handleEmailChange = (value) => {
    const emails = value.split(',').map(email => email.trim()).filter(email => email);
    handleInputChange('email', emails);
  };

  // Generate report
  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const endpoint = `/reports/${formData.type}`;
      const payload = { ...formData };

      // Remove email from payload if empty
      if (payload.email.length === 0) {
        delete payload.email;
      }

      const response = await api.post(endpoint, payload);

      setSuccess(`Report generated successfully! ${response.data.message}`);
      loadReportHistory(); // Refresh history
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Schedule report
  const scheduleReport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const payload = {
        type: formData.type,
        schedule: formData.schedule,
        recipients: formData.recipients,
        parameters: {
          startDate: formData.startDate,
          endDate: formData.endDate,
          metrics: formData.metrics,
          includeInsights: formData.includeInsights,
          includeRecommendations: formData.includeRecommendations
        }
      };

      await api.post('/reports/schedule', payload);

      setSuccess('Report scheduled successfully!');
      loadScheduledReports(); // Refresh scheduled reports
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Download report
  const downloadReport = async (filename) => {
    try {
      const response = await api.get(`/reports/${filename}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download report');
    }
  };

  // Send report via email
  const sendReport = async (filename) => {
    try {
      const recipients = prompt('Enter email addresses (comma-separated):');
      if (!recipients) return;

      const emails = recipients.split(',').map(email => email.trim());
      
      await api.post(`/reports/${filename}/send`, {
        recipients: emails,
        subject: `Report: ${filename}`
      });

      setSuccess('Report sent successfully!');
    } catch (err) {
      setError('Failed to send report');
    }
  };

  // Delete report
  const deleteReport = async (filename) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await api.delete(`/reports/${filename}`);
      setSuccess('Report deleted successfully!');
      loadReportHistory();
    } catch (err) {
      setError('Failed to delete report');
    }
  };

  // Delete scheduled report
  const deleteScheduledReport = async (id) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) return;

    try {
      await api.delete(`/reports/scheduled/${id}`);
      setSuccess('Scheduled report deleted successfully!');
      loadScheduledReports();
    } catch (err) {
      setError('Failed to delete scheduled report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Generator</h1>
          <p className="text-gray-600">Create and schedule automated reports</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Generator Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h2>

          {/* Template Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Template
            </label>
            <div className="grid grid-cols-1 gap-2">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-3 text-left border rounded-lg ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Report Configuration */}
          {selectedTemplate && (
            <div className="space-y-4">
              {/* Date Range for Custom Reports */}
              {formData.type === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </>
              )}

              {/* Metrics Selection */}
              {formData.type === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Include Metrics
                  </label>
                  <div className="space-y-2">
                    {['revenue', 'bookings', 'restaurants', 'users'].map(metric => (
                      <label key={metric} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.metrics.includes(metric)}
                          onChange={(e) => {
                            const newMetrics = e.target.checked
                              ? [...formData.metrics, metric]
                              : formData.metrics.filter(m => m !== metric);
                            handleInputChange('metrics', newMetrics);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{metric}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              {formData.type === 'custom' && (
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includeInsights}
                      onChange={(e) => handleInputChange('includeInsights', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Insights</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.includeRecommendations}
                      onChange={(e) => handleInputChange('includeRecommendations', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Recommendations</span>
                  </label>
                </div>
              )}

              {/* Email Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Recipients (optional)
                </label>
                <input
                  type="text"
                  placeholder="email1@example.com, email2@example.com"
                  value={formData.email.join(', ')}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={generateReport}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Schedule Report */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Report</h2>

          <div className="space-y-4">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="custom">Custom Report</option>
              </select>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule (Cron Format)
              </label>
              <input
                type="text"
                placeholder="0 9 * * * (Daily at 9 AM)"
                value={formData.schedule}
                onChange={(e) => handleInputChange('schedule', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: minute hour day month dayOfWeek
              </p>
            </div>

            {/* Recipients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipients
              </label>
              <input
                type="text"
                placeholder="email1@example.com, email2@example.com"
                value={formData.recipients.join(', ')}
                onChange={(e) => {
                  const recipients = e.target.value.split(',').map(email => email.trim()).filter(email => email);
                  handleInputChange('recipients', recipients);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Schedule Button */}
            <button
              onClick={scheduleReport}
              disabled={loading || !formData.schedule || formData.recipients.length === 0}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled Reports */}
      {scheduledReports.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Reports</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduledReports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {report.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.schedule}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.recipients.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.nextRun).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteScheduledReport(report.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report History */}
      {reportHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportHistory.map((report) => (
                  <tr key={report.filename}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {report.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.generatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.period ? `${report.period.start} - ${report.period.end}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => downloadReport(report.filename)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => sendReport(report.filename)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => deleteReport(report.filename)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator; 