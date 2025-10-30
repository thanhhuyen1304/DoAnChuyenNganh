# Kiểm tra Error GitHub OAuth

## Lỗi hiện tại

Từ logs, tôi thấy:
- Line 114-115: Strategies đã được initialized ✅
- Line 122: Redirect đến GitHub thành công (302) ✅  
- Line 123, 126, 151: Callback báo 401 Unauthorized ❌
- Line 129: **Error: Failed to obtain access token** ❌

## Nguyên nhân

"Failed to obtain access token" nghĩa là khi backend exchange OAuth code để lấy token thì thất bại.

**Có thể là**:
1. GitHub Client Secret sai
2. GitHub Client ID sai
3. Có vấn đề với network khi gọi GitHub API

## Giải pháp

### Bước 1: Verify GitHub Credentials

Kiểm tra `.env` file:
```bash
cd server
type .env | findstr GITHUB
```

Hoặc chạy:
```bash
cd server
node -e "require('dotenv').config(); console.log('Client ID:', process.env.GITHUB_CLIENT_ID?.substring(0, 20)); console.log('Has Secret:', !!process.env.GITHUB_CLIENT_SECRET)"
```

### Bước 2: Check GitHub App Settings

1. Vào: https://github.com/settings/developers
2. Click vào OAuth App
3. Check:
   - **Client ID** - phải match với `.env`
   - **Client Secret** - copy lại, xóa và regenerate nếu cần
   - **Callback URL** - phải là: `http://localhost:5000/api/auth/github/callback`

### Bước 3: Regenerate GitHub Secret (Nếu cần)

1. Vào GitHub OAuth App
2. Click "Generate a new client secret"
3. Copy secret mới
4. Update `server/.env`:
```env
GITHUB_CLIENT_SECRET=<new-secret-here>
```
4. Restart backend

### Bước 4: Test lại

Mở browser:
```
http://localhost:5000/api/auth/github
```

## Debug thêm

Khi test lại, check terminal backend logs:
- Có thấy "GitHub Config:" log không?
- Có thấy "GitHub OAuth Strategy Error:" không?
- Error message cụ thể là gì?

Gửi toàn bộ logs khi test lại cho tôi!

