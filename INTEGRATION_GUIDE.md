# Backend-Frontend Integration Summary

## ✅ Backend Setup (Node.js + Express)

### OTP Authentication Endpoints:
1. **POST** `/api/v2/auth/api/user-registration`
   - Generates and sends OTP to email
   - Rate limited: max 3 requests/hour
   - Response: `{ success: true, message, email }`

2. **POST** `/api/v2/auth/api/verify-user`
   - Verifies OTP and creates user account
   - Creates JWT token
   - Response: `{ success: true, token, user }`

3. **POST** `/api/v2/auth/api/resend-otp`
   - Resends OTP to email
   - Rate limited: max 3 requests/hour
   - Response: `{ success: true, message, email }`

4. **POST** `/api/v2/auth/api/verify-otp`
   - Verifies OTP only (for other scenarios)
   - Response: `{ success: true, message }`

### Other Auth Endpoints (already exist):
- **POST** `/api/v2/user/login-user` - User login
- **GET** `/api/v2/user/get-user` - Get current user
- **POST** `/api/v2/user/logout` - User logout
- **PUT** `/api/v2/user/update-user-info` - Update profile
- **POST** `/api/v2/user/change-password` - Change password

---

## ✅ Frontend Setup (React Native + Expo)

### Files Modified/Created:

#### 1. `.env` Configuration
```
EXPO_PUBLIC_SERVER_URI="http://192.168.100.34:8080"
EXPO_PUBLIC_CHATTING_WEBSOCKET_URI=ws://localhost:6006
```

#### 2. `config/api.ts` - New API Service Layer
- Centralized API calls using axios
- Automatic token injection in headers
- Error handling with status codes
- Token storage using `expo-secure-store`
- Functions for: auth, products, cart, orders, payments, shops

#### 3. `app/(routes)/signup/index.tsx` - Updated
- Uses `authAPI.register()` from config/api.ts
- Sends `name`, `email`, `password` to backend
- Navigates to OTP verification screen

#### 4. `app/(routes)/signup-otp/index.tsx` - Updated
- Uses `authAPI.verifyOTP()` for verification
- Uses `authAPI.resendOTP()` for resending OTP
- Stores token and user data after successful verification
- Handles OTP expiry and attempt limits

#### 5. `app/(routes)/login/index.tsx` - Updated
- Uses `authAPI.login()` for user login
- Stores auth token and user data
- Redirects to home screen on success
- Shows loading state during request

---

## 🔄 Data Flow

### Signup with OTP Flow:
```
Frontend (Signup)
     ↓
POST /api/v2/auth/api/user-registration
     ↓
Backend sends OTP email
     ↓
Frontend (OTP Verification)
     ↓
POST /api/v2/auth/api/verify-user
     ↓
Backend creates user + generates token
     ↓
Frontend stores token (SecureStore)
     ↓
Navigate to home screen
```

### Login Flow:
```
Frontend (Login)
     ↓
POST /api/v2/user/login-user
     ↓
Backend verifies credentials + generates token
     ↓
Frontend stores token (SecureStore)
     ↓
Navigate to home screen
```

### API Requests:
```
Frontend
     ↓
config/api.ts (axios interceptor adds token)
     ↓
Authorization: Bearer {token}
     ↓
Backend routes
```

---

## 🔐 Security Features

### Frontend:
- Tokens stored in `expo-secure-store` (encrypted)
- Automatic token injection in all requests
- Error handling for 401 (token expired)

### Backend:
- OTP expires after 10 minutes
- Max 5 OTP verification attempts
- Max 3 OTP generation requests per hour
- Password hashing with bcrypt
- JWT token for session management
- CORS enabled for frontend domain

---

## 📱 Environment Variables

### Backend (.env):
```
PORT=8000
DB_URL=mongodb+srv://...
JWT_SECRET_KEY=...
SMTP_HOST=smtp.gmail.com
SMTP_MAIL=...
SMTP_PASSWORD=...
```

### Frontend (.env):
```
EXPO_PUBLIC_SERVER_URI=http://192.168.100.34:8080
```

---

## 🚀 Ready to Use

All endpoints are now properly integrated. The frontend will:
1. Send requests to `http://192.168.100.34:8080/api/v2/auth/...`
2. Handle responses and errors gracefully
3. Store tokens securely
4. Auto-inject tokens in subsequent requests
5. Handle 401 errors by clearing stored tokens

Both backend and frontend are fully connected and ready for testing!
    