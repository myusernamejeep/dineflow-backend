# DineFlow - Restaurant Booking System

A modern, full-stack restaurant booking system built with Node.js, Koa.js, MongoDB, and Preact. Features LINE OAuth2 authentication, QR code check-in, real-time notifications, and PWA capabilities.

## 🚀 Features

### Core Functionality
- **Restaurant Management**: Add, edit, and manage restaurant information
- **Table Booking**: Real-time table availability and booking system
- **User Authentication**: LINE OAuth2 integration with JWT tokens
- **QR Code Check-in**: Admin QR scanner for customer check-in
- **Booking Management**: Create, view, cancel, and manage bookings
- **Payment Integration**: Secure payment processing with refund logic
- **Notifications**: LINE Messaging API and email notifications

### Advanced Features
- **PWA Support**: Progressive Web App with offline capabilities
- **Multi-language**: Internationalization (i18n) support (English, Thai, Chinese, Japanese)
- **Real-time Updates**: WebSocket integration for live updates
- **Admin Dashboard**: Comprehensive analytics and management tools
- **Error Handling**: Robust error boundaries and validation
- **Security**: Authentication guards and role-based access control

### Technical Features
- **Modern Stack**: Koa.js, MongoDB, Preact, Tailwind CSS
- **Modular Architecture**: Clean separation of concerns
- **API-First Design**: RESTful API with comprehensive endpoints
- **Type Safety**: JSDoc documentation and type checking
- **Performance**: Optimized caching and lazy loading
- **Scalability**: Microservices-ready architecture

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Frontend Components](#frontend-components)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [PWA Features](#pwa-features)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🛠️ Installation

### Prerequisites
- Node.js 16+ 
- MongoDB 5+
- LINE Developer Account
- SMTP Email Service

### Backend Setup
```bash
# Clone the repository
git clone <repository-url>
cd dineflow-backend

# Install dependencies
npm install

# Copy environment variables
cp env.example .env

# Configure environment variables
# Edit .env file with your settings

# Start development server
npm run dev

# Start production server
npm start
```

### Frontend Setup
```bash
# Install frontend dependencies
npm install

# Build frontend assets
npm run build

# Start frontend development server
npm run dev:frontend
```

## ⚙️ Configuration

### Environment Variables
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/dineflow

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# LINE OAuth2
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CALLBACK_URL=http://localhost:3000/auth/line/callback

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password

# LINE Messaging API
LINE_MESSAGING_TOKEN=your-line-messaging-token
LINE_MESSAGING_SECRET=your-line-messaging-secret

# Payment Gateway (Stripe)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# PWA Configuration
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/line/login     - LINE OAuth2 login
POST /api/auth/line/callback  - LINE OAuth2 callback
POST /api/auth/logout         - Logout user
GET  /api/auth/me            - Get current user
```

### Restaurant Endpoints
```
GET    /api/restaurants           - Get all restaurants
GET    /api/restaurants/:id       - Get restaurant by ID
POST   /api/restaurants           - Create restaurant (admin)
PUT    /api/restaurants/:id       - Update restaurant (admin)
DELETE /api/restaurants/:id       - Delete restaurant (admin)
```

### Booking Endpoints
```
GET    /api/bookings              - Get user bookings
GET    /api/bookings/:id          - Get booking by ID
POST   /api/bookings              - Create booking
PUT    /api/bookings/:id          - Update booking
DELETE /api/bookings/:id          - Cancel booking
POST   /api/bookings/:id/checkin  - Check-in booking (admin)
```

### Admin Endpoints
```
GET    /api/admin/dashboard       - Admin dashboard stats
GET    /api/admin/restaurants     - Admin restaurant management
GET    /api/admin/bookings        - Admin booking management
GET    /api/admin/analytics       - Analytics data
```

## 🎨 Frontend Components

### Core Components
- `App.jsx` - Main application component
- `LoadingOverlay.jsx` - Loading state component
- `ErrorBoundary.jsx` - Error handling component
- `UserInfoBar.jsx` - User information display

### Page Components
- `Home.jsx` - Landing page
- `Login.jsx` - Authentication page
- `Profile.jsx` - User profile management
- `Booking.jsx` - Booking creation and management
- `Admin.jsx` - Admin dashboard
- `QrCheckin.jsx` - QR code check-in

### Feature Components
- `RestaurantList.jsx` - Restaurant browsing
- `RestaurantCard.jsx` - Individual restaurant display
- `BookingForm.jsx` - Booking form with validation
- `BookingHistory.jsx` - Booking history display
- `BookingQrModal.jsx` - QR code display modal
- `CheckinQrScanner.jsx` - QR code scanner
- `AdminDashboard.jsx` - Admin statistics dashboard
- `AdminRestaurantTable.jsx` - Restaurant management table
- `AdminBookingTable.jsx` - Booking management table
- `AnalyticsDashboard.jsx` - Analytics visualization

## 🗄️ Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  lineId: String,
  displayName: String,
  email: String,
  phone: String,
  role: String, // 'user' | 'admin'
  profilePicture: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Restaurant Model
```javascript
{
  _id: ObjectId,
  name: String,
  address: String,
  phone: String,
  email: String,
  website: String,
  cuisine: String,
  description: String,
  openingTime: String,
  closingTime: String,
  capacity: Number,
  numTables: Number,
  priceRange: String,
  rating: Number,
  image: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  restaurantId: ObjectId,
  tableId: String,
  bookingDate: Date,
  bookingTime: String,
  numGuests: Number,
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  specialRequests: String,
  dietaryRestrictions: String,
  bookingStatus: String, // 'pending' | 'confirmed' | 'cancelled' | 'checked-in' | 'completed'
  paymentStatus: String, // 'pending' | 'paid' | 'refunded'
  amount: Number,
  qrCode: String,
  checkedInAt: Date,
  cancelledAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication

### LINE OAuth2 Flow
1. User clicks LINE login button
2. Redirect to LINE OAuth2 authorization
3. LINE redirects back with authorization code
4. Server exchanges code for access token
5. Server gets user profile from LINE
6. Create/update user in database
7. Generate JWT token
8. Redirect to application with token

### JWT Token Structure
```javascript
{
  userId: String,
  lineId: String,
  role: String,
  iat: Number,
  exp: Number
}
```

### Role-Based Access Control
- **User**: Can book tables, view bookings, manage profile
- **Admin**: Can manage restaurants, view all bookings, access analytics

## 📱 PWA Features

### Service Worker
- Caches static assets and API responses
- Provides offline functionality
- Handles background sync
- Manages push notifications

### Manifest Features
- App installation prompt
- Splash screen configuration
- Theme colors and icons
- Shortcuts for quick access

### Offline Support
- Cached restaurant data
- Offline booking preparation
- Background sync when online
- Offline page with helpful information

## 🚀 Deployment

### Production Build
```bash
# Build frontend assets
npm run build

# Set production environment
NODE_ENV=production

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t dineflow .

# Run container
docker run -p 3000:3000 dineflow
```

### Environment Setup
1. Configure production environment variables
2. Set up MongoDB Atlas or production database
3. Configure LINE OAuth2 for production domain
4. Set up SSL certificates
5. Configure reverse proxy (nginx)

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and commit: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create Pull Request

### Code Standards
- Use ESLint and Prettier
- Follow JSDoc documentation
- Write unit tests for new features
- Maintain consistent code style

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact: support@dineflow.com
- Documentation: [docs.dineflow.com](https://docs.dineflow.com)

## 🙏 Acknowledgments

- LINE Corporation for OAuth2 integration
- MongoDB for database solution
- Preact team for lightweight React alternative
- Tailwind CSS for utility-first styling
- All contributors and supporters

---

**DineFlow** - Making restaurant booking simple and delightful! 🍽️✨ 