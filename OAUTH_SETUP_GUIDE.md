# Hướng dẫn Setup OAuth (Google, GitHub, Facebook)

## Tổng quan
Hệ thống BugHunter hỗ trợ đăng nhập/đăng ký bằng OAuth với 3 nhà cung cấp:
- ✅ Google
- ✅ GitHub
- ✅ Facebook

## Cấu hình Backend

## ⚠️ QUAN TRỌNG: Kiểm tra credentials hiện tại

Chạy script này để check:
```bash
cd server
node scripts/check-oauth-config.js
```

Nếu thấy "your_googl..." nghĩa là bạn đang dùng **PLACEHOLDER** - cần thay bằng credentials thật!

### 1. Tạo OAuth Apps

#### Google OAuth
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Web application**
6. Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
7. Lưu **Client ID** và **Client Secret**

#### GitHub OAuth
1. Truy cập [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill thông tin:
   - Application name: BugHunter
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Lưu **Client ID** và **Client Secret**

#### Facebook OAuth
1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Tạo app mới (chọn loại "Consumer")
3. Vào **Settings** > **Basic**
4. Thêm platform: Website
5. Site URL: `http://localhost:3000`
6. Trong **Products**, enable **Facebook Login**
7. Settings > Facebook Login > Settings
   - Valid OAuth Redirect URIs: `http://localhost:5000/api/auth/facebook/callback`
8. Lưu **App ID** và **App Secret**

### 2. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `server/`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/bughunter

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
ADMIN_EMAIL=admin@bughunter.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### 3. Start Server

```bash
cd server
npm install
npm run dev
```

## Cấu hình Frontend

Frontend đã được cấu hình sẵn với các OAuth buttons. Không cần thêm config gì.

### Routes đã được thiết lập:
- `/auth/callback` - Xử lý OAuth callback success
- `/auth/error` - Xử lý OAuth error

## Cách hoạt động

### Flow OAuth:

1. **User clicks OAuth button** → Redirect to backend auth endpoint
2. **Backend redirects** → OAuth provider (Google/GitHub/Facebook)
3. **User authorizes** → OAuth provider callback với code
4. **Backend exchanges code** → Lấy thông tin user
5. **Backend creates/updates user** → Lưu vào database với loginMethod
6. **Backend generates JWT** → Redirect về frontend với token
7. **Frontend stores token** → Lưu vào localStorage
8. **Frontend redirects** → Dashboard hoặc Homepage

### Database Schema:

User model có thêm các fields:
- `loginMethod`: String enum ['local', 'google', 'github', 'facebook']
- `oauth.google`: String (ID từ Google)
- `oauth.github`: String (ID từ GitHub)  
- `oauth.facebook`: String (ID từ Facebook)

## Testing

### 1. Start Backend:
```bash
cd server
npm run dev
```

### 2. Start Frontend:
```bash
cd client
npm install
npm run dev
```

### 3. Test OAuth:
1. Mở `http://localhost:3000/login`
2. Click vào bất kỳ OAuth button (Google/GitHub/Facebook)
3. Hoàn thành authorization flow
4. Kiểm tra localStorage có token và user data
5. Kiểm tra database có loginMethod được lưu đúng

## Lưu ý quan trọng

### Development:
- Sử dụng `http://localhost:5000` cho backend
- Sử dụng `http://localhost:3000` cho frontend

### Production:
- Cần cập nhật callback URLs trong OAuth apps
- Sử dụng HTTPS
- Cập nhật CLIENT_URL trong .env
- Cập nhật JWT_SECRET cho production

## Troubleshooting

### Lỗi "redirect_uri_mismatch":
- Kiểm tra callback URL trong OAuth app settings
- Đảm bảo URL khớp chính xác với backend routes

### Lỗi "OAuth callback failed":
- Kiểm tra environment variables đã được set đúng
- Kiểm tra credentials (Client ID/Secret)
- Kiểm tra console logs trên backend

### User không được lưu vào database:
- Kiểm tra MongoDB connection
- Kiểm tra User model validation
- Xem logs trên backend

## Security Notes

1. **JWT_SECRET**: Phải là một string ngẫu nhiên, mạnh (ít nhất 32 ký tự)
2. **HTTPS**: Bắt buộc sử dụng HTTPS trong production
3. **Session**: Backend không sử dụng session, chỉ dùng JWT token
4. **CORS**: Đã được config để allow frontend origin

## Thêm OAuth Provider mới

Nếu muốn thêm OAuth provider mới:

1. Install passport strategy cho provider đó
2. Add vào `server/src/config/passport.ts`
3. Add routes vào `server/src/routes/auth.routes.ts`
4. Add controller method vào `server/src/controllers/auth.controller.ts`
5. Add vào `server/src/models/user.model.ts` (oauth object và loginMethod enum)
6. Add button vào frontend components

## Contact
Nếu gặp vấn đề, vui lòng check logs hoặc tạo issue trên GitHub.

