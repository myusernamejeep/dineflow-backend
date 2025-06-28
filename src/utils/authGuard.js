import { getCurrentUser } from './auth';

// Check if user is authenticated
export const isAuthenticated = () => {
  const user = getCurrentUser();
  return !!user;
};

// Check if user is admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return user && user.role === 'admin';
};

// Check if user has specific role
export const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.role === role;
};

// Check if user has any of the specified roles
export const hasAnyRole = (roles) => {
  const user = getCurrentUser();
  return user && roles.includes(user.role);
};

// Redirect to login if not authenticated
export const requireAuth = (redirectUrl = '/login') => {
  if (!isAuthenticated()) {
    window.location.href = redirectUrl;
    return false;
  }
  return true;
};

// Redirect to home if not admin
export const requireAdmin = (redirectUrl = '/') => {
  if (!requireAuth('/login')) {
    return false;
  }
  
  if (!isAdmin()) {
    window.location.href = redirectUrl;
    return false;
  }
  return true;
};

// Redirect to home if not authorized
export const requireRole = (role, redirectUrl = '/') => {
  if (!requireAuth('/login')) {
    return false;
  }
  
  if (!hasRole(role)) {
    window.location.href = redirectUrl;
    return false;
  }
  return true;
};

// Redirect to home if not authorized for any of the roles
export const requireAnyRole = (roles, redirectUrl = '/') => {
  if (!requireAuth('/login')) {
    return false;
  }
  
  if (!hasAnyRole(roles)) {
    window.location.href = redirectUrl;
    return false;
  }
  return true;
};

// Higher-order component for protecting routes
export const withAuth = (Component, options = {}) => {
  const {
    requireAdmin: needsAdmin = false,
    requireRole: requiredRole = null,
    requireAnyRole: requiredRoles = null,
    redirectUrl = '/'
  } = options;

  return (props) => {
    // Check authentication first
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return null;
    }

    // Check admin requirement
    if (needsAdmin && !isAdmin()) {
      window.location.href = redirectUrl;
      return null;
    }

    // Check specific role requirement
    if (requiredRole && !hasRole(requiredRole)) {
      window.location.href = redirectUrl;
      return null;
    }

    // Check any role requirement
    if (requiredRoles && !hasAnyRole(requiredRoles)) {
      window.location.href = redirectUrl;
      return null;
    }

    return <Component {...props} />;
  };
};

// Hook for checking authentication status
export const useAuthGuard = () => {
  return {
    isAuthenticated: isAuthenticated(),
    isAdmin: isAdmin(),
    user: getCurrentUser(),
    requireAuth: () => requireAuth(),
    requireAdmin: () => requireAdmin(),
    requireRole: (role) => requireRole(role),
    requireAnyRole: (roles) => requireAnyRole(roles)
  };
};

// Route guard for navigation
export const routeGuard = {
  // Public routes - no authentication required
  public: ['/', '/login', '/register'],
  
  // Protected routes - authentication required
  protected: ['/profile', '/booking', '/bookings', '/qr-checkin'],
  
  // Admin routes - admin role required
  admin: ['/admin', '/admin/restaurants', '/admin/bookings', '/admin/analytics', '/qr-checkin'],
  
  // Check if route requires authentication
  requiresAuth: (path) => {
    return !routeGuard.public.includes(path) && 
           (routeGuard.protected.includes(path) || routeGuard.admin.includes(path));
  },
  
  // Check if route requires admin
  requiresAdmin: (path) => {
    return routeGuard.admin.includes(path);
  },
  
  // Check if user can access route
  canAccess: (path) => {
    if (!routeGuard.requiresAuth(path)) {
      return true;
    }
    
    if (!isAuthenticated()) {
      return false;
    }
    
    if (routeGuard.requiresAdmin(path) && !isAdmin()) {
      return false;
    }
    
    return true;
  }
};

// Navigation guard
export const navigationGuard = {
  // Check before navigation
  beforeNavigate: (to) => {
    if (!routeGuard.canAccess(to)) {
      if (!isAuthenticated()) {
        window.location.href = '/login';
        return false;
      } else if (routeGuard.requiresAdmin(to) && !isAdmin()) {
        window.location.href = '/';
        return false;
      }
    }
    return true;
  },
  
  // Get redirect URL for unauthorized access
  getRedirectUrl: (path) => {
    if (!isAuthenticated()) {
      return '/login';
    }
    
    if (routeGuard.requiresAdmin(path) && !isAdmin()) {
      return '/';
    }
    
    return '/';
  }
};

// Error boundary for authentication errors
export const authErrorHandler = (error) => {
  if (error.status === 401) {
    // Unauthorized - redirect to login
    window.location.href = '/login';
    return;
  }
  
  if (error.status === 403) {
    // Forbidden - redirect to home
    window.location.href = '/';
    return;
  }
  
  // Other errors - log and continue
  console.error('Authentication error:', error);
};

// Session timeout handler
export const sessionTimeoutHandler = {
  checkSession: () => {
    const user = getCurrentUser();
    if (!user) {
      return false;
    }
    
    // Check if token is expired (if you have token expiration)
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Token expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return false;
        }
      } catch (error) {
        // Invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return false;
      }
    }
    
    return true;
  },
  
  // Set up session monitoring
  setupSessionMonitoring: () => {
    // Check session every 5 minutes
    setInterval(() => {
      sessionTimeoutHandler.checkSession();
    }, 5 * 60 * 1000);
    
    // Check session on page focus
    window.addEventListener('focus', () => {
      sessionTimeoutHandler.checkSession();
    });
  }
}; 