import { h } from 'preact';
import { Component } from 'preact';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f9fa',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            {/* Error Icon */}
            <div style={{
              fontSize: '4rem',
              marginBottom: '20px',
              color: '#e74c3c'
            }}>
              ⚠️
            </div>

            {/* Error Title */}
            <h1 style={{
              color: '#2c3e50',
              margin: '0 0 15px 0',
              fontSize: '1.8rem',
              fontWeight: '600'
            }}>
              Oops! Something went wrong
            </h1>

            {/* Error Message */}
            <p style={{
              color: '#7f8c8d',
              margin: '0 0 25px 0',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              We encountered an unexpected error. Don't worry, our team has been notified and is working to fix it.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '25px',
                textAlign: 'left'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#2c3e50',
                  marginBottom: '10px'
                }}>
                  Error Details (Development)
                </summary>
                <div style={{
                  fontSize: '12px',
                  color: '#e74c3c',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🔄 Try Again
              </button>

              <button
                onClick={this.handleGoBack}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                ⬅️ Go Back
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🏠 Go Home
              </button>
            </div>

            {/* Contact Support */}
            <div style={{
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #eee'
            }}>
              <p style={{
                color: '#7f8c8d',
                margin: '0 0 10px 0',
                fontSize: '14px'
              }}>
                Still having issues?
              </p>
              <a
                href="mailto:support@dineflow.com"
                style={{
                  color: '#3498db',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                📧 Contact Support
              </a>
            </div>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

// Higher-order component for error boundary
export const withErrorBoundary = (Component, fallback = null) => {
  return (props) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

// Hook for error handling
export const useErrorHandler = () => {
  const handleError = (error, errorInfo = null) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // You can add custom error handling logic here
    // For example, sending to error reporting service
    
    // Show user-friendly error message
    alert('An error occurred. Please try again.');
  };

  return { handleError };
};

// Global error handler
export const globalErrorHandler = {
  // Handle unhandled promise rejections
  handleUnhandledRejection: (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // You can add custom handling here
  },

  // Handle uncaught errors
  handleUncaughtError: (event) => {
    console.error('Uncaught error:', event.error);
    // You can add custom handling here
  },

  // Set up global error handlers
  setup: () => {
    window.addEventListener('unhandledrejection', globalErrorHandler.handleUnhandledRejection);
    window.addEventListener('error', globalErrorHandler.handleUncaughtError);
  },

  // Clean up global error handlers
  cleanup: () => {
    window.removeEventListener('unhandledrejection', globalErrorHandler.handleUnhandledRejection);
    window.removeEventListener('error', globalErrorHandler.handleUncaughtError);
  }
}; 