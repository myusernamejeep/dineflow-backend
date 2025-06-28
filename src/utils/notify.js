const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

// LINE Messaging API
exports.sendLineMessage = async (userId, message) => {
  try {
    const channelAccessToken = process.env.LINE_MESSAGING_ACCESS_TOKEN;
    if (!channelAccessToken || !userId) {
      console.log('Missing LINE credentials or userId');
      return;
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: 'text', text: message }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('LINE API error:', error);
    } else {
      console.log('LINE message sent successfully');
    }
  } catch (error) {
    console.error('Send LINE message error:', error);
  }
};

// Email functionality using nodemailer
exports.sendEmail = async (to, subject, html) => {
  try {
    // Create transporter (configure based on your email service)
    const transporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Send email error:', error);
    throw error;
  }
};

// Send booking confirmation email
exports.sendBookingConfirmation = async (booking, restaurant) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">✅ การจองสำเร็จ!</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>รายละเอียดการจอง</h3>
        <p><strong>ร้านอาหาร:</strong> ${restaurant.name}</p>
        <p><strong>ที่อยู่:</strong> ${restaurant.address}</p>
        <p><strong>วันที่:</strong> ${booking.bookingDate}</p>
        <p><strong>เวลา:</strong> ${booking.bookingTime}</p>
        <p><strong>จำนวนคน:</strong> ${booking.numGuests} คน</p>
        <p><strong>ชื่อ:</strong> ${booking.customerName}</p>
        <p><strong>อีเมล:</strong> ${booking.customerEmail}</p>
        <p><strong>เบอร์โทร:</strong> ${booking.customerPhone}</p>
        ${booking.specialRequests ? `<p><strong>คำขอพิเศษ:</strong> ${booking.specialRequests}</p>` : ''}
        ${booking.dietaryRestrictions ? `<p><strong>ข้อจำกัดอาหาร:</strong> ${booking.dietaryRestrictions}</p>` : ''}
      </div>
      <p style="color: #7f8c8d;">Booking ID: ${booking._id}</p>
    </div>
  `;

  return await this.sendEmail(
    booking.customerEmail,
    'การจองสำเร็จ - DineFlow',
    html
  );
};

// Send booking cancellation email
exports.sendBookingCancellation = async (booking, restaurant) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e74c3c;">❌ การจองถูกยกเลิก</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>รายละเอียดการจองที่ถูกยกเลิก</h3>
        <p><strong>ร้านอาหาร:</strong> ${restaurant.name}</p>
        <p><strong>วันที่:</strong> ${booking.bookingDate}</p>
        <p><strong>เวลา:</strong> ${booking.bookingTime}</p>
        <p><strong>จำนวนคน:</strong> ${booking.numGuests} คน</p>
        <p><strong>ชื่อ:</strong> ${booking.customerName}</p>
      </div>
      <p style="color: #7f8c8d;">Booking ID: ${booking._id}</p>
      <p>หากมีคำถาม กรุณาติดต่อเรา</p>
    </div>
  `;

  return await this.sendEmail(
    booking.customerEmail,
    'การจองถูกยกเลิก - DineFlow',
    html
  );
};

// Send check-in confirmation email
exports.sendCheckinConfirmation = async (booking, restaurant) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #27ae60;">✅ เช็คอินสำเร็จ!</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>รายละเอียดการเช็คอิน</h3>
        <p><strong>ร้านอาหาร:</strong> ${restaurant.name}</p>
        <p><strong>วันที่:</strong> ${booking.bookingDate}</p>
        <p><strong>เวลา:</strong> ${booking.bookingTime}</p>
        <p><strong>จำนวนคน:</strong> ${booking.numGuests} คน</p>
        <p><strong>ชื่อ:</strong> ${booking.customerName}</p>
        <p><strong>เวลาเช็คอิน:</strong> ${new Date(booking.checkedInAt).toLocaleString('th-TH')}</p>
      </div>
      <p style="color: #7f8c8d;">Booking ID: ${booking._id}</p>
      <p>ขอให้เพลิดเพลินกับการรับประทานอาหาร!</p>
    </div>
  `;

  return await this.sendEmail(
    booking.customerEmail,
    'เช็คอินสำเร็จ - DineFlow',
    html
  );
};
