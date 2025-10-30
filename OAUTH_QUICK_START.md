# OAuth Quick Start Guide

## Vấn đề hiện tại
OAuth chưa hoạt động vì bạn đang sử dụng **placeholder credentials** trong file `.env`.

## Giải pháp nhanh

### 1. Kiểm tra cấu hình hiện tại
```bash
cd server
node scripts/check-oauth-config.js
```

Nếu thấy "your_googl..." nghĩa là đang dùng placeholder.

### 2. Lựa chọn: Setup thật HOẶC tắt OAuth buttons

#### Option A: Tắt OAuth buttons (nhanh nhất cho development)

Chỉnh sửa `client/src/components/auth/Login.tsx` và `Register.tsx`:

Comment out OAuth section hoặc xóa các buttons.

#### Option B: Setup OAuth credentials (cần 15-20 phút)

##### Google OAuth (Dễ nhất)
1. Truy cập: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Add redirect URI: `http://localhost:5000/api/auth/google/callback`
4. Copy Client ID và Client Secret

##### GitHub OAuth
1. Truy cập: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill form:
   - Application name: BugHunter
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:5000/api/auth/github/callback`
4. Copy Client ID và Client Secret

##### Facebook OAuth (Tùy chọn)
1. Truy cập: https://developers.facebook.com/
2. Tạo app mới
3. Enable Facebook Login
4. Add callback URL: `http://localhost:5000/api/auth/facebook/callback`

### 3. Cập nhật .env file

Tạo/sửa file `server/.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/bughunter

# JWT
JWT_SECRET=your-random-secret-key-here
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
ADMIN_EMAIL=admin@bughunter.com

# Google OAuth - THAY BẰNG VALUES THẬT
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret-here

# GitHub OAuth - THAY BẰNG VALUES THẬT  
GITHUB_CLIENT_ID=your-actual-github-client-id-here
GITHUB_CLIENT_SECRET=your-actual-github-client-secret-here

# Facebook OAuth - THAY BẰNG VALUES THẬT
FACEBOOK_APP_ID=your-actual-facebook-app-id-here
FACEBOOK_APP_SECRET=your-actual-facebook-app-secret-here
```

### 4. Restart server

```bash
# Stop server nếu đang chạy (Ctrl+C)
cd server
npm run dev
```

### 5. Test OAuth

1. Mở browser: `http://localhost:3000/login`
2. Click button "Đăng nhập với Google"
3. Nếu credentials đúng → sẽ redirect đến Google login
4. Sau khi login → redirect về frontend với token

## Troubleshooting

### Error: "redirect_uri_mismatch"
- **Nguyên nhân**: Callback URL trong OAuth app không khớp
- **Giải pháp**: Kiểm tra lại callback URLs:
  - Google: `http://localhost:5000/api/auth/google/callback`
  - GitHub: `http://localhost:5000/api/auth/github/callback`
  - Facebook: `http://localhost:5000/api/auth/facebook/callback`

### Error: "invalid_client" or "invalid_grant"
- **Nguyên nhân**: Client ID/Secret sai
- **Giải pháp**: Check lại credentials trong `.env` file

### Backend không start được
- **Nguyên nhân**: Thiếu environment variables
- **Giải pháp**: Tạo file `.env` trong thư mục `server/`

## Lưu ý

### Development:
- Chỉ cần setup 1 provider (Google là dễ nhất) để test
- Không cần setup cả 3 providers

### Production:
- Phải đổi callback URLs thành production URLs
- Sử dụng HTTPS
- Đặt JWT_SECRET mạnh hơn

## Next Steps

Sau khi setup xong credentials:

1. **Test backend**: 
   ```bash
   cd server
   node scripts/check-oauth-config.js
   ```
   Should show actual credentials (không phải "your_googl...")

2. **Start backend**:
   ```bash
   npm run dev
   ```

3. **Start frontend**:
   ```bash
   cd ../client
   npm run dev
   ```

4. **Test OAuth login** tại `http://localhost:3000/login`

## Need Help?

Nếu vẫn gặp vấn đề:
1. Check console logs trên backend (terminal chạy server)
2. Check browser console (F12) để xem redirect URL
3. Verify credentials bằng: `node scripts/check-oauth-config.js`

