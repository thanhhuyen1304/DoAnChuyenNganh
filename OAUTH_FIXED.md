# OAuth Fixed! ✅

## Vấn đề đã được sửa

**Lỗi**: `Unknown authentication strategy "google"`

**Nguyên nhân**: Dotenv config được load SAU khi import passport strategies.

**Giải pháp**: Đổi thứ tự import trong `server/src/app.ts`:
```typescript
// ✅ ĐÚNG - Load dotenv TRƯỚC
config();
import './config/passport';

// ❌ SAI - Load dotenv SAU
import './config/passport';
config();
```

## Test ngay

### 1. Restart backend
Nodemon đã tự động restart server.

### 2. Test OAuth endpoint
Mở browser:
```
http://localhost:5000/api/auth/google
```

**Kết quả mong đợi**:
- ✅ Redirect đến Google login page
- URL sẽ là: `https://accounts.google.com/...`

**Nếu vẫn lỗi**:
- Check backend terminal có error mới không
- Gửi error message cho tôi

### 3. Test từ trang Login

1. Mở: `http://localhost:3000/login`
2. Click "Đăng nhập với Google"
3. Browser redirect đến Google
4. Đăng nhập với Google account
5. Redirect về frontend với token

---

## Nếu vẫn không redirect

### Check Callback URL

Trong Google Console, Authorized redirect URIs phải có:
```
http://localhost:5000/api/auth/google/callback
```

**Chú ý**:
- Không có trailing slash `/` ở cuối
- Match chính xác 100%

### Check Backend Logs

Trong terminal backend, bạn sẽ thấy:
```
GET /api/auth/google 302
```

Nếu thấy `302` → Backend redirect OK
Nếu thấy `500` → Có lỗi (gửi cho tôi)

---

## Giờ test OAuth!

Mở: `http://localhost:5000/api/auth/google`

Nên redirect đến Google login. Báo kết quả!

