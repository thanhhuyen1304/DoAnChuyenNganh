# Test OAuth NGAY BÂY GIỜ

## Server đã được cập nhật

File `app.ts` đã đúng thứ tự, Nodemon đã restart server.

## Bước 1: Kiểm tra backend logs

Trong terminal backend, phải thấy:
```
Server đang chạy tại http://localhost:5000
Environment: development
```

**KHÔNG được có**:
```
Error: Unknown authentication strategy
```

## Bước 2: Test GitHub OAuth Endpoint

Mở browser và gõ:
```
http://localhost:5000/api/auth/github
```

**Kết quả mong đợi**:
- ✅ Redirect đến GitHub login page
- URL sẽ là: `https://github.com/login/oauth/authorize?client_id=...`

**Nếu KHÔNG redirect** (error 500):
- Check terminal backend có log error gì
- Copy error message đầy đủ cho tôi

## Bước 3: Kiểm tra GitHub App Settings

Từ ảnh bạn gửi, tôi thấy:
- ✅ Application name: BugHunter
- ✅ Homepage URL: `http://localhost:5173/`
- ✅ Callback URL: `http://localhost:5000/api/auth/github/callback`

**Chú ý**: Frontend đang chạy ở port 5173 (Vite default) không phải 3000!

## Bước 4: Test từ Frontend

1. Mở: `http://localhost:5173/login`
   (Hoặc `http://localhost:3000/login` nếu bạn config khác)
2. Click "Đăng nhập với GitHub"
3. Browser redirect đến `http://localhost:5000/api/auth/github`
4. Backend redirect đến GitHub

## Nếu vẫn KHÔNG được

Trong terminal backend, khi bạn test OAuth, kiểm tra có log:

```
GET /api/auth/github 302
```

Nếu thấy `302` → Backend redirect OK ✓
Nếu thấy `500` → Có lỗi - copy error cho tôi

## Quick Debug

Nếu vẫn lỗi, chạy lệnh này và báo kết quả:

```bash
cd server
node scripts/check-oauth-config.js
```

Gửi output đầy đủ cho tôi!
