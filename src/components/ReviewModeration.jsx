import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../utils/api';
import ReviewCard from './ReviewCard';

const ReviewModeration = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingReviews, setPendingReviews] = useState([]);
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    pending: { page: 1, total: 0, pages: 0 },
    flagged: { page: 1, total: 0, pages: 0 }
  });

  const loadPendingReviews = async (page = 1) => {
    try {
      const response = await api.get(`/reviews/admin/pending?page=${page}&limit=10`);
      setPendingReviews(response.data.data.reviews);
      setPagination(prev => ({
        ...prev,
        pending: response.data.data.pagination
      }));
    } catch (error) {
      console.error('Failed to load pending reviews:', error);
      setError('Failed to load pending reviews');
    }
  };

  const loadFlaggedReviews = async (page = 1) => {
    try {
      const response = await api.get(`/reviews/admin/flagged?page=${page}&limit=10`);
      setFlaggedReviews(response.data.data.reviews);
      setPagination(prev => ({
        ...prev,
        flagged: response.data.data.pagination
      }));
    } catch (error) {
      console.error('Failed to load flagged reviews:', error);
      setError('Failed to load flagged reviews');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadPendingReviews(),
          loadFlaggedReviews()
        ]);
      } catch (error) {
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleApprove = async (reviewId, notes = '') => {
    try {
      await api.post(`/reviews/admin/${reviewId}/approve`, { notes });
      
      // Remove from pending list
      setPendingReviews(prev => prev.filter(review => review._id !== reviewId));
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        pending: {
          ...prev.pending,
          total: prev.pending.total - 1
        }
      }));
      
      alert('Review approved successfully');
    } catch (error) {
      console.error('Failed to approve review:', error);
      alert('Failed to approve review');
    }
  };

  const handleReject = async (reviewId, notes = '') => {
    try {
      await api.post(`/reviews/admin/${reviewId}/reject`, { notes });
      
      // Remove from pending list
      setPendingReviews(prev => prev.filter(review => review._id !== reviewId));
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        pending: {
          ...prev.pending,
          total: prev.pending.total - 1
        }
      }));
      
      alert('Review rejected successfully');
    } catch (error) {
      console.error('Failed to reject review:', error);
      alert('Failed to reject review');
    }
  };

  const handleResolveFlag = async (reviewId, flagIndex, action) => {
    try {
      await api.post(`/reviews/admin/${reviewId}/flags/${flagIndex}/resolve`, { action });
      
      // Reload flagged reviews
      await loadFlaggedReviews(pagination.flagged.page);
      
      alert(`Flag ${action}d successfully`);
    } catch (error) {
      console.error('Failed to resolve flag:', error);
      alert('Failed to resolve flag');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/reviews/${reviewId}`);
      
      // Remove from appropriate list
      if (activeTab === 'pending') {
        setPendingReviews(prev => prev.filter(review => review._id !== reviewId));
        setPagination(prev => ({
          ...prev,
          pending: {
            ...prev.pending,
            total: prev.pending.total - 1
          }
        }));
      } else {
        setFlaggedReviews(prev => prev.filter(review => review._id !== reviewId));
        setPagination(prev => ({
          ...prev,
          flagged: {
            ...prev.flagged,
            total: prev.flagged.total - 1
          }
        }));
      }
      
      alert('Review deleted successfully');
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('Failed to delete review');
    }
  };

  const handlePageChange = (tab, page) => {
    if (tab === 'pending') {
      loadPendingReviews(page);
    } else {
      loadFlaggedReviews(page);
    }
  };

  const ModerationModal = ({ review, action, onClose, onSubmit }) => {
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(review._id, notes);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {action === 'approve' ? 'Approve' : 'Reject'} Review
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Add notes for ${action === 'approve' ? 'approval' : 'rejection'}...`}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-white rounded-md ${
                  action === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const FlagDetails = ({ review }) => {
    const pendingFlags = review.flags.filter(flag => flag.status === 'pending');
    
    return (
      <div className="mt-4 p-4 bg-red-50 rounded-lg">
        <h4 className="font-medium text-red-900 mb-2">
          Flagged {pendingFlags.length} time{pendingFlags.length !== 1 ? 's' : ''}
        </h4>
        <div className="space-y-2">
          {pendingFlags.map((flag, index) => (
            <div key={index} className="text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-red-800">
                    {flag.reason.charAt(0).toUpperCase() + flag.reason.slice(1)}:
                  </span>
                  {flag.description && (
                    <p className="text-red-700 mt-1">{flag.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleResolveFlag(review._id, index, 'resolve')}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => handleResolveFlag(review._id, index, 'dismiss')}
                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-6">
        <nav className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="px-3 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Moderation</h2>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Reviews ({pagination.pending.total})
            </button>
            <button
              onClick={() => setActiveTab('flagged')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'flagged'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Flagged Reviews ({pagination.flagged.total})
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'pending' ? (
          <>
            {pendingReviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">No pending reviews</div>
              </div>
            ) : (
              pendingReviews.map(review => (
                <div key={review._id} className="bg-white rounded-lg shadow">
                  <ReviewCard
                    review={review}
                    showActions={false}
                  />
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleApprove(review._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(review._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            <Pagination
              currentPage={pagination.pending.page}
              totalPages={pagination.pending.pages}
              onPageChange={(page) => handlePageChange('pending', page)}
            />
          </>
        ) : (
          <>
            {flaggedReviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">No flagged reviews</div>
              </div>
            ) : (
              flaggedReviews.map(review => (
                <div key={review._id} className="bg-white rounded-lg shadow">
                  <ReviewCard
                    review={review}
                    showActions={false}
                  />
                  <FlagDetails review={review} />
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                      >
                        Delete Review
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            <Pagination
              currentPage={pagination.flagged.page}
              totalPages={pagination.flagged.pages}
              onPageChange={(page) => handlePageChange('flagged', page)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewModeration; 