# OAuth Debug Guide

## Vấn đề hiện tại
Bạn đã có client_id và client_secret nhưng vẫn chưa đăng nhập được bằng Google.

## Bước 1: Truy cập Debug Page

Mở browser và đi đến:
```
http://localhost:3000/auth/debug
```

## Bước 2: Test Backend Connection

1. Click nút **"Test Connection"**
2. Nếu thấy "Backend is running!" → Backend OK
3. Nếu thấy error → Backend chưa chạy hoặc URL sai

**Giải pháp**: Chạy backend:
```bash
cd server
npm run dev
```

## Bước 3: Test OAuth Flow

1. Click nút **"Test google"**
2. Browser sẽ redirect đến Google login
3. Kiểm tra URL redirect → Nó có đúng không?

### Nếu redirect đến Google:
✅ Frontend OK → Vấn đề ở Google OAuth settings

### Nếu không redirect (error 404 hoặc blank page):
❌ Backend routes có vấn đề → Check backend logs

### Nếu redirect nhưng báo lỗi "redirect_uri_mismatch":
❌ Callback URL trong Google Console không khớp với backend config

## Bước 4: Kiểm tra Google OAuth Settings

### 4.1 Check Callback URL trong Google Console

1. Truy cập: https://console.cloud.google.com/apis/credentials
2. Vào OAuth Client của bạn
3. Check **Authorized redirect URIs**
4. Phải có: `http://localhost:5000/api/auth/google/callback`

**QUAN TRỌNG**: URL phải **khớp chính xác**, không có trailing slash!

### 4.2 Check Backend Config

Trong `server/src/config/passport.ts`, callback URL phải là:
```javascript
callbackURL: `${SERVER_URL}/api/auth/google/callback`
```

Default SERVER_URL: `http://localhost:5000`

### 4.3 Check .env file

Trong `server/.env`:
```env
GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-client-secret
SERVER_URL=http://localhost:5000  # Optional, default là localhost:5000
```

**Không được dùng placeholder** như "your_googl..."

## Bước 5: Restart Backend

Sau khi sửa .env hoặc config:

```bash
# Stop backend (Ctrl+C)
cd server
npm run dev  # Start lại
```

## Bước 6: Test lại

1. Đi đến: `http://localhost:3000/login`
2. Click "Đăng nhập với Google"
3. Kiểm tra browser console (F12)
4. Kiểm tra network tab để xem request/response

## Common Errors & Solutions

### Error 1: "redirect_uri_mismatch"
- **Nguyên nhân**: Callback URL không khớp
- **Giải pháp**: 
  1. Check Google Console → Redirect URIs
  2. Check backend passport.ts → callbackURL
  3. Phải khớp 100% (không có space, trailing slash)

### Error 2: "invalid_client" 
- **Nguyên nhân**: Client ID/Secret sai
- **Giải pháp**: 
  1. Check .env file
  2. Verify credentials trong Google Console
  3. Restart backend sau khi sửa .env

### Error 3: "Cannot connect to backend"
- **Nguyên nhân**: Backend chưa chạy hoặc URL sai
- **Giải pháp**:
  1. Start backend: `cd server && npm run dev`
  2. Check port 5000 có bị chiếm không
  3. Verify API_BASE_URL trong frontend

### Error 4: Redirect nhưng callback không chạy
- **Nguyên nhân**: Browser chưa redirect về frontend
- **Giải pháp**:
  1. Check CLIENT_URL trong backend .env
  2. Nên là: `CLIENT_URL=http://localhost:3000`
  3. Verify OAuthCallback.tsx có handle đúng không

## Checklist

Trước khi test OAuth, đảm bảo:

- [ ] Backend đang chạy ở `http://localhost:5000`
- [ ] Frontend đang chạy ở `http://localhost:3000`
- [ ] Google OAuth app đã tạo và có Client ID/Secret thật
- [ ] Callback URL đã được add vào Google Console: `http://localhost:5000/api/auth/google/callback`
- [ ] .env file có credentials thật (không phải placeholder)
- [ ] Đã restart backend sau khi sửa .env
- [ ] Test backend connection tại `http://localhost:3000/auth/debug`

## Debug Commands

```bash
# Check OAuth config
cd server
node scripts/check-oauth-config.js

# Check backend đang chạy
curl http://localhost:5000/api/me

# Check backend routes
# Mở browser: http://localhost:5000/api/auth/google
# Nên redirect đến Google
```

## Still Not Working?

1. Check browser console (F12) → Console tab
2. Check browser console → Network tab → Xem failed requests
3. Check backend terminal → Xem logs
4. Tạo issue với screenshots của errors

## Quick Test

Chạy lệnh này để test nhanh:

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend  
cd client
npm run dev

# Browser: Go to
# http://localhost:3000/auth/debug
# Click "Test google"
```

Nếu vẫn lỗi, gửi screenshot của browser console error cho tôi!

