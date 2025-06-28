// Internationalization (i18n) Utilities

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: {
    name: 'English',
    flag: '🇺🇸',
    direction: 'ltr'
  },
  th: {
    name: 'ไทย',
    flag: '🇹🇭',
    direction: 'ltr'
  },
  zh: {
    name: '中文',
    flag: '🇨🇳',
    direction: 'ltr'
  },
  ja: {
    name: '日本語',
    flag: '🇯🇵',
    direction: 'ltr'
  }
};

// Default language
export const DEFAULT_LANGUAGE = 'en';

// Translation keys
export const translations = {
  en: {
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      reset: 'Reset',
      close: 'Close',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      retry: 'Try Again',
      refresh: 'Refresh',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      all: 'All',
      none: 'None',
      select: 'Select',
      choose: 'Choose',
      add: 'Add',
      remove: 'Remove',
      update: 'Update',
      create: 'Create',
      download: 'Download',
      upload: 'Upload',
      print: 'Print',
      share: 'Share',
      copy: 'Copy',
      paste: 'Paste',
      cut: 'Cut',
      undo: 'Undo',
      redo: 'Redo'
    },

    // Navigation
    nav: {
      home: 'Home',
      restaurants: 'Restaurants',
      bookings: 'Bookings',
      profile: 'Profile',
      admin: 'Admin',
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      dashboard: 'Dashboard',
      settings: 'Settings',
      help: 'Help',
      about: 'About',
      contact: 'Contact'
    },

    // Home page
    home: {
      title: 'Welcome to DineFlow',
      subtitle: 'Book your favorite restaurants with ease',
      hero: {
        title: 'Find and Book Amazing Restaurants',
        subtitle: 'Discover the best dining experiences in your area',
        cta: 'Start Booking Now'
      },
      features: {
        title: 'Why Choose DineFlow?',
        easy: {
          title: 'Easy Booking',
          description: 'Book your table in just a few clicks'
        },
        secure: {
          title: 'Secure Payments',
          description: 'Your payment information is safe with us'
        },
        instant: {
          title: 'Instant Confirmation',
          description: 'Get immediate confirmation for your bookings'
        },
        support: {
          title: '24/7 Support',
          description: 'We\'re here to help you anytime'
        }
      }
    },

    // Restaurant
    restaurant: {
      title: 'Restaurants',
      subtitle: 'Discover amazing dining experiences',
      search: 'Search restaurants...',
      filter: {
        cuisine: 'Cuisine',
        price: 'Price Range',
        rating: 'Rating',
        distance: 'Distance'
      },
      sort: {
        name: 'Name',
        rating: 'Rating',
        price: 'Price',
        distance: 'Distance'
      },
      details: {
        address: 'Address',
        phone: 'Phone',
        website: 'Website',
        hours: 'Hours',
        cuisine: 'Cuisine',
        priceRange: 'Price Range',
        rating: 'Rating',
        capacity: 'Capacity',
        tables: 'Tables'
      },
      booking: {
        title: 'Book a Table',
        date: 'Date',
        time: 'Time',
        guests: 'Number of Guests',
        specialRequests: 'Special Requests',
        dietaryRestrictions: 'Dietary Restrictions',
        confirm: 'Confirm Booking'
      }
    },

    // Booking
    booking: {
      title: 'My Bookings',
      subtitle: 'Manage and track your restaurant bookings',
      status: {
        pending: 'Pending',
        confirmed: 'Confirmed',
        cancelled: 'Cancelled',
        checkedIn: 'Checked In',
        completed: 'Completed'
      },
      actions: {
        cancel: 'Cancel Booking',
        reschedule: 'Reschedule',
        viewDetails: 'View Details',
        showQR: 'Show QR Code',
        downloadQR: 'Download QR'
      },
      history: {
        title: 'Booking History',
        noBookings: 'No bookings found',
        createFirst: 'Make your first booking'
      }
    },

    // Admin
    admin: {
      title: 'Admin Dashboard',
      subtitle: 'Manage your restaurant booking system',
      stats: {
        totalBookings: 'Total Bookings',
        confirmedBookings: 'Confirmed Today',
        activeRestaurants: 'Active Restaurants',
        registeredUsers: 'Registered Users'
      },
      actions: {
        manageRestaurants: 'Manage Restaurants',
        viewBookings: 'View All Bookings',
        qrScanner: 'QR Check-in Scanner',
        analytics: 'Analytics Dashboard'
      },
      restaurants: {
        title: 'Restaurant Management',
        subtitle: 'Manage all restaurants in the system',
        add: 'Add Restaurant',
        edit: 'Edit Restaurant',
        delete: 'Delete Restaurant',
        confirmDelete: 'Are you sure you want to delete this restaurant?'
      },
      bookings: {
        title: 'Booking Management',
        subtitle: 'Manage all bookings in the system',
        search: 'Search bookings...',
        filter: 'Filter by Status',
        sort: 'Sort By'
      }
    },

    // Profile
    profile: {
      title: 'My Profile',
      subtitle: 'Manage your account settings',
      personal: {
        title: 'Personal Information',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        address: 'Address'
      },
      preferences: {
        title: 'Preferences',
        language: 'Language',
        notifications: 'Notifications',
        privacy: 'Privacy Settings'
      },
      security: {
        title: 'Security',
        password: 'Change Password',
        twoFactor: 'Two-Factor Authentication'
      }
    },

    // Auth
    auth: {
      login: {
        title: 'Login',
        subtitle: 'Welcome back! Please sign in to your account',
        email: 'Email',
        password: 'Password',
        remember: 'Remember me',
        forgotPassword: 'Forgot password?',
        noAccount: 'Don\'t have an account?',
        signUp: 'Sign up'
      },
      register: {
        title: 'Register',
        subtitle: 'Create your account to start booking',
        name: 'Full Name',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        agree: 'I agree to the terms and conditions',
        haveAccount: 'Already have an account?',
        signIn: 'Sign in'
      }
    },

    // Messages
    messages: {
      success: {
        bookingCreated: 'Booking created successfully!',
        bookingCancelled: 'Booking cancelled successfully!',
        restaurantAdded: 'Restaurant added successfully!',
        restaurantUpdated: 'Restaurant updated successfully!',
        restaurantDeleted: 'Restaurant deleted successfully!',
        profileUpdated: 'Profile updated successfully!',
        loginSuccess: 'Login successful!',
        registerSuccess: 'Registration successful!'
      },
      error: {
        bookingFailed: 'Failed to create booking. Please try again.',
        cancellationFailed: 'Failed to cancel booking. Please try again.',
        restaurantFailed: 'Failed to save restaurant. Please try again.',
        profileFailed: 'Failed to update profile. Please try again.',
        loginFailed: 'Login failed. Please check your credentials.',
        registerFailed: 'Registration failed. Please try again.',
        networkError: 'Network error. Please check your connection.',
        serverError: 'Server error. Please try again later.'
      },
      validation: {
        required: 'This field is required',
        email: 'Please enter a valid email address',
        password: 'Password must be at least 8 characters',
        passwordMatch: 'Passwords do not match',
        phone: 'Please enter a valid phone number',
        date: 'Please enter a valid date',
        time: 'Please enter a valid time',
        guests: 'Number of guests must be at least 1'
      }
    }
  },

  th: {
    // Common
    common: {
      loading: 'กำลังโหลด...',
      error: 'ข้อผิดพลาด',
      success: 'สำเร็จ',
      cancel: 'ยกเลิก',
      save: 'บันทึก',
      delete: 'ลบ',
      edit: 'แก้ไข',
      view: 'ดู',
      back: 'กลับ',
      next: 'ถัดไป',
      previous: 'ก่อนหน้า',
      submit: 'ส่ง',
      reset: 'รีเซ็ต',
      close: 'ปิด',
      confirm: 'ยืนยัน',
      yes: 'ใช่',
      no: 'ไม่',
      ok: 'ตกลง',
      retry: 'ลองใหม่',
      refresh: 'รีเฟรช',
      search: 'ค้นหา',
      filter: 'กรอง',
      sort: 'เรียงลำดับ',
      all: 'ทั้งหมด',
      none: 'ไม่มี',
      select: 'เลือก',
      choose: 'เลือก',
      add: 'เพิ่ม',
      remove: 'ลบ',
      update: 'อัปเดต',
      create: 'สร้าง',
      download: 'ดาวน์โหลด',
      upload: 'อัปโหลด',
      print: 'พิมพ์',
      share: 'แชร์',
      copy: 'คัดลอก',
      paste: 'วาง',
      cut: 'ตัด',
      undo: 'ยกเลิก',
      redo: 'ทำซ้ำ'
    },

    // Navigation
    nav: {
      home: 'หน้าแรก',
      restaurants: 'ร้านอาหาร',
      bookings: 'การจอง',
      profile: 'โปรไฟล์',
      admin: 'ผู้ดูแล',
      login: 'เข้าสู่ระบบ',
      logout: 'ออกจากระบบ',
      register: 'สมัครสมาชิก',
      dashboard: 'แดชบอร์ด',
      settings: 'ตั้งค่า',
      help: 'ช่วยเหลือ',
      about: 'เกี่ยวกับ',
      contact: 'ติดต่อ'
    },

    // Home page
    home: {
      title: 'ยินดีต้อนรับสู่ DineFlow',
      subtitle: 'จองร้านอาหารโปรดของคุณได้อย่างง่ายดาย',
      hero: {
        title: 'ค้นหาและจองร้านอาหารที่น่าประทับใจ',
        subtitle: 'ค้นพบประสบการณ์การรับประทานอาหารที่ดีที่สุดในพื้นที่ของคุณ',
        cta: 'เริ่มจองเลย'
      },
      features: {
        title: 'ทำไมต้องเลือก DineFlow?',
        easy: {
          title: 'จองง่าย',
          description: 'จองโต๊ะของคุณได้ในไม่กี่คลิก'
        },
        secure: {
          title: 'การชำระเงินที่ปลอดภัย',
          description: 'ข้อมูลการชำระเงินของคุณปลอดภัยกับเรา'
        },
        instant: {
          title: 'ยืนยันทันที',
          description: 'ได้รับการยืนยันทันทีสำหรับการจองของคุณ'
        },
        support: {
          title: 'สนับสนุน 24/7',
          description: 'เราพร้อมช่วยเหลือคุณทุกเวลา'
        }
      }
    },

    // Restaurant
    restaurant: {
      title: 'ร้านอาหาร',
      subtitle: 'ค้นพบประสบการณ์การรับประทานอาหารที่น่าประทับใจ',
      search: 'ค้นหาร้านอาหาร...',
      filter: {
        cuisine: 'ประเภทอาหาร',
        price: 'ช่วงราคา',
        rating: 'คะแนน',
        distance: 'ระยะทาง'
      },
      sort: {
        name: 'ชื่อ',
        rating: 'คะแนน',
        price: 'ราคา',
        distance: 'ระยะทาง'
      },
      details: {
        address: 'ที่อยู่',
        phone: 'เบอร์โทร',
        website: 'เว็บไซต์',
        hours: 'เวลาทำการ',
        cuisine: 'ประเภทอาหาร',
        priceRange: 'ช่วงราคา',
        rating: 'คะแนน',
        capacity: 'ความจุ',
        tables: 'โต๊ะ'
      },
      booking: {
        title: 'จองโต๊ะ',
        date: 'วันที่',
        time: 'เวลา',
        guests: 'จำนวนแขก',
        specialRequests: 'คำขอพิเศษ',
        dietaryRestrictions: 'ข้อจำกัดด้านอาหาร',
        confirm: 'ยืนยันการจอง'
      }
    },

    // Booking
    booking: {
      title: 'การจองของฉัน',
      subtitle: 'จัดการและติดตามการจองร้านอาหารของคุณ',
      status: {
        pending: 'รอดำเนินการ',
        confirmed: 'ยืนยันแล้ว',
        cancelled: 'ยกเลิกแล้ว',
        checkedIn: 'เช็คอินแล้ว',
        completed: 'เสร็จสิ้น'
      },
      actions: {
        cancel: 'ยกเลิกการจอง',
        reschedule: 'เปลี่ยนเวลา',
        viewDetails: 'ดูรายละเอียด',
        showQR: 'แสดง QR Code',
        downloadQR: 'ดาวน์โหลด QR'
      },
      history: {
        title: 'ประวัติการจอง',
        noBookings: 'ไม่พบการจอง',
        createFirst: 'ทำการจองครั้งแรกของคุณ'
      }
    },

    // Admin
    admin: {
      title: 'แดชบอร์ดผู้ดูแล',
      subtitle: 'จัดการระบบการจองร้านอาหารของคุณ',
      stats: {
        totalBookings: 'การจองทั้งหมด',
        confirmedBookings: 'ยืนยันวันนี้',
        activeRestaurants: 'ร้านอาหารที่ใช้งาน',
        registeredUsers: 'ผู้ใช้ที่ลงทะเบียน'
      },
      actions: {
        manageRestaurants: 'จัดการร้านอาหาร',
        viewBookings: 'ดูการจองทั้งหมด',
        qrScanner: 'สแกนเนอร์ QR เช็คอิน',
        analytics: 'แดชบอร์ดวิเคราะห์'
      },
      restaurants: {
        title: 'การจัดการร้านอาหาร',
        subtitle: 'จัดการร้านอาหารทั้งหมดในระบบ',
        add: 'เพิ่มร้านอาหาร',
        edit: 'แก้ไขร้านอาหาร',
        delete: 'ลบร้านอาหาร',
        confirmDelete: 'คุณแน่ใจหรือไม่ที่จะลบร้านอาหารนี้?'
      },
      bookings: {
        title: 'การจัดการการจอง',
        subtitle: 'จัดการการจองทั้งหมดในระบบ',
        search: 'ค้นหาการจอง...',
        filter: 'กรองตามสถานะ',
        sort: 'เรียงลำดับตาม'
      }
    },

    // Profile
    profile: {
      title: 'โปรไฟล์ของฉัน',
      subtitle: 'จัดการการตั้งค่าบัญชีของคุณ',
      personal: {
        title: 'ข้อมูลส่วนตัว',
        name: 'ชื่อ',
        email: 'อีเมล',
        phone: 'เบอร์โทร',
        address: 'ที่อยู่'
      },
      preferences: {
        title: 'การตั้งค่า',
        language: 'ภาษา',
        notifications: 'การแจ้งเตือน',
        privacy: 'การตั้งค่าความเป็นส่วนตัว'
      },
      security: {
        title: 'ความปลอดภัย',
        password: 'เปลี่ยนรหัสผ่าน',
        twoFactor: 'การยืนยันตัวตนสองขั้นตอน'
      }
    },

    // Auth
    auth: {
      login: {
        title: 'เข้าสู่ระบบ',
        subtitle: 'ยินดีต้อนรับกลับ! กรุณาเข้าสู่ระบบ',
        email: 'อีเมล',
        password: 'รหัสผ่าน',
        remember: 'จดจำฉัน',
        forgotPassword: 'ลืมรหัสผ่าน?',
        noAccount: 'ไม่มีบัญชี?',
        signUp: 'สมัครสมาชิก'
      },
      register: {
        title: 'สมัครสมาชิก',
        subtitle: 'สร้างบัญชีของคุณเพื่อเริ่มจอง',
        name: 'ชื่อเต็ม',
        email: 'อีเมล',
        password: 'รหัสผ่าน',
        confirmPassword: 'ยืนยันรหัสผ่าน',
        agree: 'ฉันยอมรับข้อกำหนดและเงื่อนไข',
        haveAccount: 'มีบัญชีอยู่แล้ว?',
        signIn: 'เข้าสู่ระบบ'
      }
    },

    // Messages
    messages: {
      success: {
        bookingCreated: 'สร้างการจองสำเร็จ!',
        bookingCancelled: 'ยกเลิกการจองสำเร็จ!',
        restaurantAdded: 'เพิ่มร้านอาหารสำเร็จ!',
        restaurantUpdated: 'อัปเดตร้านอาหารสำเร็จ!',
        restaurantDeleted: 'ลบร้านอาหารสำเร็จ!',
        profileUpdated: 'อัปเดตโปรไฟล์สำเร็จ!',
        loginSuccess: 'เข้าสู่ระบบสำเร็จ!',
        registerSuccess: 'สมัครสมาชิกสำเร็จ!'
      },
      error: {
        bookingFailed: 'สร้างการจองไม่สำเร็จ กรุณาลองใหม่',
        cancellationFailed: 'ยกเลิกการจองไม่สำเร็จ กรุณาลองใหม่',
        restaurantFailed: 'บันทึกร้านอาหารไม่สำเร็จ กรุณาลองใหม่',
        profileFailed: 'อัปเดตโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่',
        loginFailed: 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลของคุณ',
        registerFailed: 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่',
        networkError: 'ข้อผิดพลาดเครือข่าย กรุณาตรวจสอบการเชื่อมต่อ',
        serverError: 'ข้อผิดพลาดเซิร์ฟเวอร์ กรุณาลองใหม่ภายหลัง'
      },
      validation: {
        required: 'ฟิลด์นี้จำเป็น',
        email: 'กรุณาใส่อีเมลที่ถูกต้อง',
        password: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
        passwordMatch: 'รหัสผ่านไม่ตรงกัน',
        phone: 'กรุณาใส่เบอร์โทรที่ถูกต้อง',
        date: 'กรุณาใส่วันที่ที่ถูกต้อง',
        time: 'กรุณาใส่เวลาที่ถูกต้อง',
        guests: 'จำนวนแขกต้องมีอย่างน้อย 1 คน'
      }
    }
  }
};

// i18n Class
export class I18n {
  constructor() {
    this.currentLanguage = this.getStoredLanguage() || DEFAULT_LANGUAGE;
    this.translations = translations;
  }

  // Get stored language from localStorage
  getStoredLanguage() {
    return localStorage.getItem('language') || DEFAULT_LANGUAGE;
  }

  // Set language
  setLanguage(language) {
    if (SUPPORTED_LANGUAGES[language]) {
      this.currentLanguage = language;
      localStorage.setItem('language', language);
      document.documentElement.lang = language;
      document.documentElement.dir = SUPPORTED_LANGUAGES[language].direction;
      this.updatePageTitle();
    }
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Get supported languages
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  // Translate text
  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        // Fallback to English
        value = this.translations[DEFAULT_LANGUAGE];
        for (const fallbackKey of keys) {
          if (value && value[fallbackKey]) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
      }
    }

    // Replace parameters
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] || match;
      });
    }

    return value || key;
  }

  // Update page title
  updatePageTitle() {
    const title = this.t('common.appName') || 'DineFlow';
    document.title = title;
  }

  // Format date
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return new Intl.DateTimeFormat(this.currentLanguage, {
      ...defaultOptions,
      ...options
    }).format(date);
  }

  // Format time
  formatTime(time, options = {}) {
    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Intl.DateTimeFormat(this.currentLanguage, {
      ...defaultOptions,
      ...options
    }).format(time);
  }

  // Format number
  formatNumber(number, options = {}) {
    return new Intl.NumberFormat(this.currentLanguage, options).format(number);
  }

  // Format currency
  formatCurrency(amount, currency = 'USD', options = {}) {
    return new Intl.NumberFormat(this.currentLanguage, {
      style: 'currency',
      currency,
      ...options
    }).format(amount);
  }
}

// Create global i18n instance
export const i18n = new I18n();

// Export translation function
export const t = (key, params) => i18n.t(key, params);

// Export language utilities
export const languageUtils = {
  getCurrentLanguage: () => i18n.getCurrentLanguage(),
  setLanguage: (lang) => i18n.setLanguage(lang),
  getSupportedLanguages: () => i18n.getSupportedLanguages(),
  formatDate: (date, options) => i18n.formatDate(date, options),
  formatTime: (time, options) => i18n.formatTime(time, options),
  formatNumber: (number, options) => i18n.formatNumber(number, options),
  formatCurrency: (amount, currency, options) => i18n.formatCurrency(amount, currency, options)
}; 