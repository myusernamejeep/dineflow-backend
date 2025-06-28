import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../utils/api';
import { useAuth } from '../utils/auth';

const ReviewCard = ({ review, onUpdate, onDelete, showActions = true }) => {
  const { user } = useAuth();
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful?.count || 0);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagDescription, setFlagDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const flagReasons = [
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'spam', label: 'Spam or fake review' },
    { value: 'offensive', label: 'Offensive language' },
    { value: 'fake', label: 'Fake or misleading' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    // Check if current user has marked this review as helpful
    if (user && review.helpful?.users) {
      setIsHelpful(review.helpful.users.includes(user.id));
    }
  }, [user, review]);

  const handleHelpful = async () => {
    if (!user) {
      alert('Please log in to mark reviews as helpful');
      return;
    }

    try {
      if (isHelpful) {
        const response = await api.delete(`/reviews/${review._id}/helpful`);
        setHelpfulCount(response.data.data.helpfulCount);
        setIsHelpful(false);
      } else {
        const response = await api.post(`/reviews/${review._id}/helpful`);
        setHelpfulCount(response.data.data.helpfulCount);
        setIsHelpful(true);
      }
    } catch (error) {
      console.error('Failed to update helpful status:', error);
      alert('Failed to update helpful status');
    }
  };

  const handleFlag = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please log in to flag reviews');
      return;
    }

    if (!flagReason) {
      alert('Please select a reason for flagging');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/reviews/${review._id}/flag`, {
        reason: flagReason,
        description: flagDescription
      });
      
      setShowFlagModal(false);
      setFlagReason('');
      setFlagDescription('');
      alert('Review flagged successfully');
    } catch (error) {
      console.error('Failed to flag review:', error);
      alert('Failed to flag review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderDetailedRatings = () => {
    const { ratings } = review;
    const categories = [
      { key: 'food', label: 'Food' },
      { key: 'service', label: 'Service' },
      { key: 'ambiance', label: 'Ambiance' },
      { key: 'value', label: 'Value' }
    ];

    return (
      <div className="grid grid-cols-2 gap-2 mt-2">
        {categories.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{label}:</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  className={`${
                    star <= ratings[key] ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPhotos = () => {
    if (!review.photos || review.photos.length === 0) return null;

    return (
      <div className="mt-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {review.photos.slice(0, 6).map((photo, index) => (
            <div key={index} className="relative">
              <img
                src={photo.url}
                alt={photo.caption || `Review photo ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                onClick={() => {
                  // Open photo in modal or lightbox
                  window.open(photo.url, '_blank');
                }}
              />
              {index === 5 && review.photos.length > 6 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    +{review.photos.length - 6}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSentiment = () => {
    if (!review.sentiment) return null;

    const sentimentColors = {
      positive: 'text-green-600 bg-green-100',
      negative: 'text-red-600 bg-red-100',
      neutral: 'text-gray-600 bg-gray-100'
    };

    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${sentimentColors[review.sentiment.label]}`}>
        {review.sentiment.label.charAt(0).toUpperCase() + review.sentiment.label.slice(1)}
      </span>
    );
  };

  const renderStatus = () => {
    const statusColors = {
      pending: 'text-yellow-600 bg-yellow-100',
      approved: 'text-green-600 bg-green-100',
      rejected: 'text-red-600 bg-red-100',
      flagged: 'text-orange-600 bg-orange-100'
    };

    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[review.status]}`}>
        {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            {review.userId.avatar ? (
              <img
                src={review.userId.avatar}
                alt={review.userId.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 font-medium">
                {review.userId.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{review.userId.name}</div>
            <div className="text-sm text-gray-500">
              {formatDate(review.createdAt)}
              {review.verified && (
                <span className="ml-2 text-blue-600">✓ Verified</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {renderSentiment()}
          {review.status !== 'approved' && renderStatus()}
        </div>
      </div>

      {/* Overall Rating */}
      <div className="flex items-center space-x-2 mb-3">
        {renderStars(review.overallRating)}
        <span className="text-sm text-gray-600">{review.overallRating}/5</span>
      </div>

      {/* Review Title */}
      <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>

      {/* Review Content */}
      <div className="text-gray-700 mb-4">
        {showFullContent ? (
          <p>{review.content}</p>
        ) : (
          <p>
            {review.content.length > 200
              ? `${review.content.substring(0, 200)}...`
              : review.content}
          </p>
        )}
        
        {review.content.length > 200 && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1"
          >
            {showFullContent ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Detailed Ratings */}
      {renderDetailedRatings()}

      {/* Photos */}
      {renderPhotos()}

      {/* Review Actions */}
      {showActions && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleHelpful}
              className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                isHelpful
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span>👍</span>
              <span>Helpful ({helpfulCount})</span>
            </button>

            <button
              onClick={() => setShowFlagModal(true)}
              className="text-sm text-gray-600 hover:text-red-600 font-medium"
            >
              Flag
            </button>
          </div>

          {/* Admin Actions */}
          {user?.role === 'admin' && (
            <div className="flex items-center space-x-2">
              {review.status === 'pending' && (
                <>
                  <button
                    onClick={() => onUpdate(review._id, { status: 'approved' })}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onUpdate(review._id, { status: 'rejected' })}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => onDelete(review._id)}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Flag Review
            </h3>
            
            <form onSubmit={handleFlag}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a reason</option>
                  {flagReasons.map(reason => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please provide additional details..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFlagModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Flag Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard; 