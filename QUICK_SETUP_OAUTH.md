# Setup OAuth - QUICK GUIDE

## Tình hình hiện tại

Từ logs:
- ✅ Google OAuth: CÓ credentials
- ❓ GitHub OAuth: undefined (không có credentials)
- ❓ Facebook OAuth: placeholder

## Giải pháp nhanh: CHỈ CẦN GOOGLE

Vì bạn đã có Google credentials, hãy test Google OAuth trước:

### Test Google OAuth NGAY:

Mở browser và gõ:
```
http://localhost:5000/api/auth/google
```

**Nếu redirect đến Google login** → OAuth backend HOẠT ĐỘNG! ✅

**Nếu vẫn lỗi** → Cho tôi biết error message

## Nếu muốn setup GitHub OAuth:

### Bước 1: Tạo App

1. Vào: https://github.com/settings/developers
2. Click "New OAuth App"
3. Điền:
   - Name: BugHunter
   - Homepage: http://localhost:5173
   - Callback: http://localhost:5000/api/auth/github/callback
4. Register

### Bước 2: Copy Credentials

- Copy Client ID
- Generate và copy Client Secret

### Bước 3: Update .env

File: `server/.env`

```env
GITHUB_CLIENT_ID=<paste ID here>
GITHUB_CLIENT_SECRET=<paste secret here>
```

### Bước 4: Restart

Trong terminal backend:
```
rs
```

### Bước 5: Test

```
http://localhost:5000/api/auth/github
```

## Tạm thời: Chỉ dùng Google OAuth

Nếu không muốn setup thêm, có thể:
- Chỉ giữ Google OAuth
- Remove/comment GitHub và Facebook buttons
- Hoặc để placeholder, thêm sau

---

## Test NGAY

1. Test Google: `http://localhost:5000/api/auth/google`
   - Có redirect đến Google không?

2. Báo kết quả cho tôi!

