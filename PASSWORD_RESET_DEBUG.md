# Hướng dẫn Debug Password Reset

## 🔍 Kiểm tra lỗi

Khi gặp lỗi "Đã xảy ra lỗi. Vui lòng thử lại!", hãy làm theo các bước sau:

### 1. Kiểm tra Console Logs

#### Frontend (Browser Console)
Mở Developer Tools (F12) và kiểm tra tab Console. Bạn sẽ thấy các log:
- `[Password Reset] Sending request to: ...`
- `[Password Reset] Input: ...`
- `[Password Reset] Response: ...` hoặc `[Password Reset] Error details: ...`

#### Backend (Server Console)
Kiểm tra terminal nơi server đang chạy. Bạn sẽ thấy các log:
- `[Password Reset] Searching for user with query: ...`
- `[Password Reset] User found: ...` hoặc `[Password Reset] User not found for identifier: ...`
- `[Password Reset] Code generated and saved for user: ...`

### 2. Các lỗi thường gặp

#### Lỗi: "Không thể kết nối đến server"
**Nguyên nhân:**
- Server chưa chạy
- URL API không đúng
- Firewall/Network blocking

**Giải pháp:**
1. Kiểm tra server đang chạy: `cd server && npm run dev`
2. Kiểm tra `VITE_API_URL` trong `.env` của client
3. Kiểm tra CORS settings trong server

#### Lỗi: "Bạn đã yêu cầu quá nhiều lần"
**Nguyên nhân:**
- Rate limiting đang hoạt động

**Giải pháp:**
- Đợi 10-15 phút rồi thử lại
- Hoặc restart server để clear rate limit cache

#### Lỗi: "Dữ liệu không hợp lệ"
**Nguyên nhân:**
- Input rỗng hoặc không hợp lệ
- Validation failed

**Giải pháp:**
- Kiểm tra input có khoảng trắng thừa không
- Đảm bảo email có định dạng hợp lệ
- Đảm bảo số điện thoại không có ký tự đặc biệt

#### Lỗi: "Lỗi server"
**Nguyên nhân:**
- Database connection issue
- Nodemailer error
- Unexpected error

**Giải pháp:**
1. Kiểm tra MongoDB đang chạy
2. Kiểm tra server logs để xem chi tiết lỗi
3. Kiểm tra nodemailer đã được cài đặt: `cd server && npm list nodemailer`

### 3. Kiểm tra Database

Đảm bảo user tồn tại trong database:

```bash
# Kết nối MongoDB
mongosh mongodb://localhost:27017/bughunter

# Tìm user theo email
db.users.findOne({ email: "user@example.com" })

# Tìm user theo số điện thoại
db.users.findOne({ phone: "0342012204" })
```

### 4. Test API trực tiếp

Sử dụng curl hoặc Postman để test API:

```bash
# Test với email
curl -X POST http://localhost:5000/api/auth/request-reset \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "user@example.com"}'

# Test với số điện thoại
curl -X POST http://localhost:5000/api/auth/request-reset \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "0342012204"}'
```

### 5. Kiểm tra Environment Variables

Đảm bảo các biến môi trường đã được cấu hình đúng trong `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/bughunter
NODE_ENV=development
```

### 6. Kiểm tra Network

1. Mở Network tab trong Developer Tools
2. Gửi request reset password
3. Kiểm tra:
   - Request có được gửi không?
   - Status code là gì? (200, 400, 429, 500?)
   - Response body là gì?

### 7. Common Issues

#### Issue: Email không được gửi nhưng không có lỗi
**Giải pháp:**
- Kiểm tra console log để xem preview URL (development mode)
- Kiểm tra spam folder
- Nếu không có preview URL, kiểm tra nodemailer logs

#### Issue: SMS không được gửi
**Giải pháp:**
- Kiểm tra Twilio credentials trong `.env`
- Kiểm tra console log để xem SMS content (development mode)
- Đảm bảo số điện thoại đúng định dạng quốc tế

#### Issue: Mã xác thực không hợp lệ
**Giải pháp:**
- Đảm bảo mã chưa hết hạn (10 phút)
- Đảm bảo mã chưa được sử dụng
- Kiểm tra email/số điện thoại có đúng không

## 📝 Log Format

Khi báo lỗi, vui lòng cung cấp:

1. **Frontend Console Logs:**
   - Tất cả logs có prefix `[Password Reset]`

2. **Backend Console Logs:**
   - Tất cả logs có prefix `[Password Reset]`
   - Error stack traces (nếu có)

3. **Network Request:**
   - Request URL
   - Request payload
   - Response status
   - Response body

4. **Environment:**
   - Node version: `node --version`
   - NPM version: `npm --version`
   - MongoDB version: `mongod --version`

## 🛠️ Quick Fixes

### Fix 1: Clear Rate Limit
```bash
# Restart server để clear rate limit cache
# Hoặc đợi 10-15 phút
```

### Fix 2: Reinstall Dependencies
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

### Fix 3: Check MongoDB Connection
```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/bughunter --eval "db.users.countDocuments()"
```

### Fix 4: Test Nodemailer
```bash
cd server
node -e "const nodemailer = require('nodemailer'); console.log('Nodemailer OK:', nodemailer.version);"
```

