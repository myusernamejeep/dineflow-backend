// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const twilio = require('twilio');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Twilio Client setup
const twilioClient = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Nodemailer Transporter setup (for sending emails)
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services or SMTP directly
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.static('public')); // Serve static files from public directory

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully!');
        seedInitialData();
    })
    .catch(err => console.error('MongoDB connection error:', err));

/*
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dineflow', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        await mongoose.connection.db.collection('restaurants').deleteMany({});
        console.log('All restaurants deleted.');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    });
*/ 
// --- MongoDB Schemas & Models ---

// Restaurant Schema
const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    address: String,
    phone: String,
    image: String,
    depositPerPerson: { type: Number, default: 0 },
    tables: {
        type: [
            {
                tableId: { type: String, required: true },
                capacity: { type: Number, required: true },
                type:{ type: String, required: true },
            }
        ],
        default: []
    }
});
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    customerName: { type: String, required: true }, // For simplicity, in real app, link to Customer ID
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    bookingDate: { type: String, required: true }, // YYYY-MM-DD
    bookingTime: { type: String, required: true }, // HH:MM
    numGuests: { type: Number, required: true },
    tableId: { type: String, required: true }, // The specific table booked
    depositAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    bookingStatus: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'no-show'], default: 'pending' },
    stripePaymentIntentId: String,
    createdAt: { type: Date, default: Date.now }
});
const Booking = mongoose.model('Booking', bookingSchema);


// --- Helper Functions for Notifications ---

// Function to send SMS using Twilio
async function sendSms(to, body) {
    try {
        if (!process.env.TWILIO_PHONE_NUMBER || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            console.warn('Twilio credentials not set. SMS not sent.');
            return;
        }
        await twilioClient.messages.create({
            body: body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to,
        });
        console.log(`SMS sent to ${to}: ${body}`);
    } catch (error) {
        console.error('Error sending SMS:', error);
    }
}

// Function to send Email using Nodemailer
async function sendEmail(to, subject, htmlBody) {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not set. Email not sent.');
            return;
        }
        await transporter.sendMail({
            from: `"DineFlow" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlBody,
        });
        console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}


// --- API Endpoints ---

// Serve main application
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

// Serve test page
app.get('/payment-success', (req, res) => {
    res.sendFile(__dirname + '/public/payment-success.html');
});
// Serve test page
app.get('/test', (req, res) => {
    res.sendFile(__dirname + '/test.html');
});

// GET /api/restaurants - Get all restaurants
app.get('/api/restaurants', async (req, res) => {
    try {
        const restaurants = await Restaurant.find({});
        res.json(restaurants);
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/restaurants/:id/tables/available - Check table availability
app.get('/api/restaurants/:id/tables/available', async (req, res) => {
    try {
        const restaurantId = req.params.id;
        const { date, time, guests } = req.query;

        if (!restaurantId || !date || !time || !guests) {
            return res.status(400).json({ message: 'Missing required query parameters (date, time, guests).' });
        }

        const numGuests = parseInt(guests);
        if (isNaN(numGuests) || numGuests < 1) {
            return res.status(400).json({ message: 'Number of guests must be a positive integer.' });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        const allTables = restaurant.tables;

        // Find existing bookings for the specified date and time
        const existingBookings = await Booking.find({
            restaurantId: restaurantId,
            bookingDate: date,
            bookingTime: time,
            $or: [{ bookingStatus: 'pending' }, { bookingStatus: 'confirmed' }] // Consider pending and confirmed bookings
        });

        // Get IDs of tables that are already booked
        const bookedTableIds = new Set(existingBookings.map(booking => booking.tableId));

        // Filter out booked tables and tables that are too small
        const availableTables = allTables.filter(table =>
            table.capacity >= numGuests && !bookedTableIds.has(table.tableId)
        );

        res.json(availableTables);

    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/bookings - Create a new booking (initial step, payment status pending)
app.post('/api/bookings', async (req, res) => {
    try {
        const { restaurantId, customerName, customerEmail, customerPhone, bookingDate, bookingTime, numGuests, tableId } = req.body;

        // Basic validation
        if (!restaurantId || !customerName || !customerEmail || !customerPhone || !bookingDate || !bookingTime || !numGuests || !tableId) {
            return res.status(400).json({ message: 'Missing required booking details.' });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        const selectedTable = restaurant.tables.find(t => t.tableId === tableId);
        if (!selectedTable) {
            return res.status(400).json({ message: 'Selected table not found for this restaurant.' });
        }
        if (selectedTable.capacity < numGuests) {
            return res.status(400).json({ message: 'Selected table capacity is too small for the number of guests.' });
        }

        // Re-check availability just before creating booking to prevent double-booking
        const existingBookingForTable = await Booking.findOne({
            restaurantId: restaurantId,
            tableId: tableId,
            bookingDate: bookingDate,
            bookingTime: bookingTime,
            $or: [{ bookingStatus: 'pending' }, { bookingStatus: 'confirmed' }]
        });

        if (existingBookingForTable) {
            return res.status(409).json({ message: 'Selected table is no longer available at this time. Please choose another.' });
        }

        const depositAmount = restaurant.depositPerPerson * numGuests;

        const newBooking = new Booking({
            restaurantId,
            customerName,
            customerEmail,
            customerPhone,
            bookingDate,
            bookingTime,
            numGuests,
            tableId,
            depositAmount,
            paymentStatus: 'pending',
            bookingStatus: 'pending' // Initial status
        });

        await newBooking.save();

        res.status(201).json({
            message: 'Booking created successfully, awaiting payment.',
            bookingId: newBooking._id,
            depositAmount: depositAmount,
            restaurantName: restaurant.name,
            tableDetails: selectedTable
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/payments/process - Process payment for a booking
app.post('/api/payments/process', async (req, res) => {
    try {
        const { bookingId, paymentMethodId, amount } = req.body; // paymentMethodId from Stripe.js, amount in smallest currency unit (e.g., cents)

        if (!bookingId || !paymentMethodId || !amount) {
            return res.status(400).json({ message: 'Missing required payment details.' });
        }

        const booking = await Booking.findById(bookingId).populate('restaurantId'); // Populate restaurant details
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        if (booking.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Booking already paid.' });
        }

        // Ensure amount matches expected deposit amount (conversion needed if amount is in THB and Stripe expects smallest unit)
        // For Stripe, amounts are in cents/satangs. If 'amount' from frontend is in THB, convert to satangs.
        const expectedAmountInSatangs = Math.round(booking.depositAmount * 100);

        if (amount !== expectedAmountInSatangs) {
             console.warn(`Payment amount mismatch: Expected ${expectedAmountInSatangs}, Got ${amount}`);
             // return res.status(400).json({ message: 'Payment amount mismatch. Please try again.' });
             // For prototype, we might allow mismatch or just log it.
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: expectedAmountInSatangs, // Amount in satangs
            currency: 'thb', // Thai Baht
            payment_method: paymentMethodId,
            confirmation_method: 'manual', // Requires explicit confirmation
            confirm: true, // Confirm the payment intent immediately
            return_url: process.env.FRONTEND_DOMAIN + '/payment-success', // Optional: for 3D Secure redirects
            metadata: {
                bookingId: booking._id.toString(),
                restaurantId: booking.restaurantId._id.toString(),
                customerEmail: booking.customerEmail
            }
        });

        if (paymentIntent.status === 'succeeded') {
            booking.paymentStatus = 'paid';
            booking.bookingStatus = 'confirmed'; // Mark as confirmed after successful payment
            booking.stripePaymentIntentId = paymentIntent.id;
            await booking.save();

            // --- Send Notifications ---
            const restaurantName = booking.restaurantId.name;
            const bookingDetailsText = `การจองโต๊ะที่ ${restaurantName} สำหรับ ${booking.numGuests} ท่าน ในวันที่ ${booking.bookingDate} เวลา ${booking.bookingTime} ได้รับการยืนยันแล้ว หมายเลขการจอง: ${booking._id}`;
            const bookingDetailsHtml = `
                <p><strong>การจองของคุณได้รับการยืนยันแล้ว!</strong></p>
                <p><strong>ร้าน:</strong> ${restaurantName}</p>
                <p><strong>วันที่:</strong> ${booking.bookingDate}</p>
                <p><strong>เวลา:</strong> ${booking.bookingTime}</p>
                <p><strong>จำนวนคน:</strong> ${booking.numGuests} ท่าน</p>
                <p><strong>โต๊ะที่จอง:</strong> ${booking.tableId}</p>
                <p><strong>ยอดชำระมัดจำ:</strong> ${booking.depositAmount} บาท</p>
                <p><strong>หมายเลขการจอง:</strong> ${booking._id}</p>
                <p>ขอขอบคุณที่ใช้บริการ DineFlow</p>
            `;

            // Notify customer via SMS (if phone available and Twilio is configured)
            if (booking.customerPhone) {
                sendSms(booking.customerPhone, bookingDetailsText);
            }
            // Notify customer via Email
            sendEmail(booking.customerEmail, 'ยืนยันการจองโต๊ะ DineFlow ของคุณ', bookingDetailsHtml);

            // Notify restaurant admin via Email
            sendEmail(process.env.ADMIN_EMAIL, `การจองใหม่สำหรับ ${restaurantName}`, `
                <p>มีการจองใหม่เข้ามาที่ร้าน ${restaurantName}</p>
                <p><strong>ผู้จอง:</strong> ${booking.customerName} (${booking.customerEmail}, ${booking.customerPhone})</p>
                <p><strong>วันที่:</strong> ${booking.bookingDate}</p>
                <p><strong>เวลา:</strong> ${booking.bookingTime}</p>
                <p><strong>จำนวนคน:</strong> ${booking.numGuests} ท่าน</p>
                <p><strong>โต๊ะที่จอง:</strong> ${booking.tableId}</p>
                <p><strong>ยอดมัดจำ:</strong> ${booking.depositAmount} บาท (ชำระแล้ว)</p>
                <p><strong>หมายเลขการจอง:</strong> ${booking._id}</p>
            `);

            res.json({ success: true, message: 'Payment successful, booking confirmed!', bookingId: booking._id });
        } else {
            booking.paymentStatus = 'failed';
            await booking.save();
            res.status(400).json({ success: false, message: 'Payment failed.', stripeStatus: paymentIntent.status });
        }

    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, message: 'Internal server error during payment processing.' });
    }
});

// --- Admin Panel API (for CRUD operations on restaurants and viewing bookings) ---

// POST /api/admin/restaurants - Add a new restaurant (Admin only)
app.post('/api/admin/restaurants', async (req, res) => {
    try {
        const newRestaurant = new Restaurant(req.body);
        await newRestaurant.save();
        res.status(201).json(newRestaurant);
    } catch (error) {
        console.error('Error adding restaurant:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// GET /api/admin/bookings - Get all bookings (Admin only)
app.get('/api/admin/bookings', async (req, res) => {
    try {
        // Populate restaurantId to get restaurant details in the booking list
        const bookings = await Booking.find({}).populate('restaurantId');
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/admin/bookings/:id/status - Update booking status (Admin only)
app.put('/api/admin/bookings/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const bookingId = req.params.id;

        if (!['confirmed', 'cancelled', 'no-show'].includes(status)) {
            return res.status(400).json({ message: 'Invalid booking status.' });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { bookingStatus: status },
            { new: true } // Return the updated document
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        res.json({ message: 'Booking status updated successfully', booking: updatedBooking });

    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// This is for Vercel deployment: wrap the Express app in a serverless function
// Vercel expects a file named `api/index.js` (or similar) that exports the app.
// For local development, `app.listen` is used. For Vercel, it uses the exported `app`.
if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'development') {
    // If running on Vercel, export the app directly
    module.exports = app;
} else {
    // For local development, start the server normally
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`To run the frontend prototype, ensure it targets http://localhost:${PORT}`);
    });
}

// --- Initial Data Seeding (Optional - for quick testing) ---
// Run this once to populate some initial data in MongoDB
async function seedInitialData() {
    try {
        const existingRestaurants = await Restaurant.countDocuments();
        if (existingRestaurants === 0) {
            console.log('Seeding initial restaurant data...');
            await Restaurant.insertMany([
                {
                    name: 'The Gastronome Bistro',
                    description: 'ร้านอาหารฝรั่งเศสบรรยากาศอบอุ่น เหมาะสำหรับมื้อพิเศษ',
                    address: '123 Main St, Bangkok',
                    phone: '02-123-4567',
                    image: 'https://placehold.co/400x200/4CAF50/FFFFFF?text=Bistro',
                    depositPerPerson: 100,
                    tables: [
                        { tableId: 'T01', capacity: 2, type: 'ริมหน้าต่าง' },
                        { tableId: 'T02', capacity: 4, type: 'กลางร้าน' },
                        { tableId: 'T03', capacity: 6, type: 'ห้องส่วนตัว' },
                        { tableId: 'T04', capacity: 2, type: 'กลางร้าน' }
                    ]
                },
                {
                    name: 'Zen Sushi House',
                    description: 'ซูชิและอาหารญี่ปุ่นต้นตำรับ สดใหม่ทุกวัน',
                    address: '456 Sushi Ave, Bangkok',
                    phone: '02-987-6543',
                    image: 'https://placehold.co/400x200/FFC107/000000?text=Sushi',
                    depositPerPerson: 50,
                    tables: [
                        { tableId: 'S01', capacity: 2, type: 'บาร์ซูชิ' },
                        { tableId: 'S02', capacity: 4, type: 'โต๊ะปกติ' },
                        { tableId: 'S03', capacity: 2, type: 'บาร์ซูชิ' },
                        { tableId: 'S04', capacity: 6, type: 'ห้องรวม' } 
                    ]
                }
            ]);
            console.log('Initial restaurants seeded.');
        } else {
            console.log('Restaurants already exist, skipping seeding.');
        }
    } catch (error) {
        console.error('Error seeding data:', error);
    }
}

// Call seed function after successful MongoDB connection
/*mongoose.connection.on('connected', () => {
    seedInitialData();
});*/