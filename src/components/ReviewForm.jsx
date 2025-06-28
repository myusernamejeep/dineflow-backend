import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../utils/api';

const ReviewForm = ({ booking, restaurant, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    overallRating: 0,
    ratings: {
      food: 0,
      service: 0,
      ambiance: 0,
      value: 0
    },
    title: '',
    content: '',
    photos: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const ratingLabels = {
    food: 'Food Quality',
    service: 'Service',
    ambiance: 'Ambiance',
    value: 'Value for Money'
  };

  const handleRatingChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [type]: value
      }
    }));

    // Update overall rating
    const newRatings = {
      ...formData.ratings,
      [type]: value
    };
    const average = Math.round(
      (newRatings.food + newRatings.service + newRatings.ambiance + newRatings.value) / 4
    );
    setFormData(prev => ({ ...prev, overallRating: average }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.overallRating === 0) {
      newErrors.overallRating = 'Please provide an overall rating';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Please provide a review title';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Please provide review content';
    } else if (formData.content.length < 20) {
      newErrors.content = 'Review content must be at least 20 characters';
    }

    if (formData.ratings.food === 0) newErrors.food = 'Please rate food quality';
    if (formData.ratings.service === 0) newErrors.service = 'Please rate service';
    if (formData.ratings.ambiance === 0) newErrors.ambiance = 'Please rate ambiance';
    if (formData.ratings.value === 0) newErrors.value = 'Please rate value for money';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhotoUpload = async (files) => {
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (files.length + photoFiles.length > maxFiles) {
      alert(`You can upload maximum ${maxFiles} photos`);
      return;
    }

    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      return true;
    });

    setPhotoFiles(prev => [...prev, ...validFiles]);
  };

  const removePhoto = (index) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    if (photoFiles.length === 0) return [];

    const formData = new FormData();
    photoFiles.forEach(file => {
      formData.append('photos', file);
    });

    try {
      const response = await api.post('/upload/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      return response.data.urls;
    } catch (error) {
      console.error('Photo upload failed:', error);
      throw new Error('Failed to upload photos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Upload photos first
      const photoUrls = await uploadPhotos();
      
      const reviewData = {
        ...formData,
        restaurantId: restaurant._id,
        bookingId: booking._id,
        photos: photoUrls.map(url => ({ url }))
      };

      const response = await api.post('/reviews', reviewData);
      
      onSubmit(response.data);
    } catch (error) {
      console.error('Review submission failed:', error);
      alert(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const StarRating = ({ value, onChange, label, error }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl transition-colors ${
              star <= value
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {value > 0 ? `${value}/5` : 'Rate this'}
        </span>
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Write a Review</h2>
        <p className="text-gray-600">
          Share your experience at {restaurant.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Rating</h3>
          <StarRating
            value={formData.overallRating}
            onChange={(value) => setFormData(prev => ({ ...prev, overallRating: value }))}
            label="How would you rate your overall experience?"
            error={errors.overallRating}
          />
        </div>

        {/* Detailed Ratings */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Ratings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ratingLabels).map(([key, label]) => (
              <StarRating
                key={key}
                value={formData.ratings[key]}
                onChange={(value) => handleRatingChange(key, value)}
                label={label}
                error={errors[key]}
              />
            ))}
          </div>
        </div>

        {/* Review Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Summarize your experience"
            maxLength={100}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          <p className="text-gray-500 text-sm mt-1">
            {formData.title.length}/100 characters
          </p>
        </div>

        {/* Review Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Content *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Share the details of your experience..."
            maxLength={2000}
          />
          {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
          <p className="text-gray-500 text-sm mt-1">
            {formData.content.length}/2000 characters
          </p>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Photos (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e.target.files)}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
            >
              Click to upload photos
            </label>
            <p className="text-gray-500 text-sm mt-1">
              Maximum 5 photos, 5MB each
            </p>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Uploading photos... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Photo Preview */}
          {photoFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {photoFiles.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Booking Information</h4>
          <div className="text-sm text-gray-600">
            <p>Date: {new Date(booking.bookingTime).toLocaleDateString()}</p>
            <p>Time: {new Date(booking.bookingTime).toLocaleTimeString()}</p>
            <p>Party Size: {booking.partySize} people</p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm; 