# Test GitHub OAuth

## ✅ Credentials đã có

GitHub credentials đã được cấu hình:
- GITHUB_CLIENT_ID: ✓ Configured
- GITHUB_CLIENT_SECRET: ✓ Configured

## Test GitHub OAuth

### Bước 1: Test Backend Endpoint

Mở browser và gõ:
```
http://localhost:5000/api/auth/github
```

**Kết quả mong đợi**:
- Redirect đến GitHub login page
- URL sẽ là: `https://github.com/login/oauth/authorize?...`

### Nếu KHÔNG redirect (lỗi 500 hoặc blank):
Có thể là credentials sai hoặc app chưa tồn tại trong GitHub.

### Nếu redirect nhưng báo "redirect_uri_mismatch":
Callback URL trong GitHub App Settings chưa đúng.

## Sửa Callback URL trong GitHub

### Bước 1: Vào GitHub Settings
1. Truy cập: https://github.com/settings/developers
2. Click vào **OAuth Apps** → **New OAuth App**

**HOẶC** nếu đã có app:
1. Vào: https://github.com/settings/developers
2. Click vào OAuth App của bạn
3. Click **Edit**

### Bước 2: Cấu hình

**Application name**: BugHunter

**Homepage URL**: 
```
http://localhost:3000
```

**Authorization callback URL**: ⚠️ QUAN TRỌNG
```
http://localhost:5000/api/auth/github/callback
```

**Chú ý**: 
- Không có trailing slash `/` ở cuối
- Match chính xác với backend config

### Bước 3: Lưu và Test

1. Click **Register application**
2. Copy **Client ID** và **Client secret**
3. Update file `server/.env`:
```env
GITHUB_CLIENT_ID=<Client ID>
GITHUB_CLIENT_SECRET=<Client secret>
```
4. Restart backend
5. Test lại: `http://localhost:5000/api/auth/github`

## Debug nhanh

### Kiểm tra credentials hiện tại:

```bash
cd server
type .env | findstr GITHUB
```

Hoặc:
```bash
cd server
node -e "require('dotenv').config(); console.log('Client ID:', process.env.GITHUB_CLIENT_ID); console.log('Client Secret:', process.env.GITHUB_CLIENT_SECRET);"
```

### Test endpoint trực tiếp:

Mở browser:
```
http://localhost:5000/api/auth/github
```

**Nếu success**:
- Redirect đến GitHub
- URL sẽ có dạng: `https://github.com/login/oauth/authorize?client_id=...`

**Nếu error**:
- Check terminal backend có error gì
- Error message sẽ cho biết vấn đề

## Common Errors

### Error: "redirect_uri_mismatch"
- **Nguyên nhân**: Callback URL không khớp
- **Giải pháp**: Đảm bảo callback URL trong GitHub App là:
  ```
  http://localhost:5000/api/auth/github/callback
  ```

### Error: "invalid_client"
- **Nguyên nhân**: Client ID hoặc Secret sai
- **Giải pháp**: Copy lại từ GitHub App settings và update .env

### Error: "Cannot find module"
- **Nguyên nhân**: Passport strategies chưa được load
- **Giải pháp**: Đã fix trong app.ts - restart backend

## Test ngay

1. Mở: `http://localhost:5000/api/auth/github`
2. Kiểm tra có redirect đến GitHub không
3. Báo kết quả

Nếu vẫn lỗi, gửi error message!

