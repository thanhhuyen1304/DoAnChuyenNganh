# Setup GitHub OAuth - HƯỚNG DẪN CHI TIẾT

## ✅ Đã bật GitHub button trong Login và Register

Bạn sẽ thấy nút "Đăng nhập với GitHub" trong Login page.

## ⚠️ NHƯNG: Cần tạo GitHub OAuth App mới

Credentials hiện tại trong `.env` không hoạt động (404 error).

## 📝 HƯỚNG DẪN TẠO GITHUB OAUTH APP:

### Bước 1: Truy cập GitHub Settings

1. Mở: https://github.com/settings/developers
2. Click "OAuth Apps" ở menu bên trái
3. Click nút "New OAuth App" màu xanh

### Bước 2: Điền thông tin

**Application name**:  
```
BugHunter
```

**Homepage URL**:  
```
http://localhost:5173
```

**Authorization callback URL**:  
```
http://localhost:5000/api/auth/github/callback
```

### Bước 3: Register App

Click nút "Register application" màu xanh

### Bước 4: Copy Credentials

Sau khi tạo xong, bạn sẽ thấy:
- **Client ID** (màu xanh, copy ngay)
- **Client secrets** (click "Generate a new client secret", copy secret mới)

### Bước 5: Update file `.env`

Mở file: `server/.env` (hoặc `.env` ở root)

Tìm dòng:
```env
GITHUB_CLIENT_ID=Ov23liNOMymEaa7BdSHw
GITHUB_CLIENT_SECRET=36a2d4ba18a933575d2156b83786035b9e03a0d0
```

**Thay bằng credentials mới**:
```env
GITHUB_CLIENT_ID=<paste Client ID mới>
GITHUB_CLIENT_SECRET=<paste Secret mới>
```

### Bước 6: Restart Backend

Trong terminal backend:
```
rs
```

(Nếu không có rs alias, ấn Ctrl+C và chạy lại `npm run dev`)

### Bước 7: Test GitHub OAuth

1. Mở: `http://localhost:5173/login`
2. Click "Đăng nhập với GitHub"
3. Xem có redirect đến GitHub login không
4. Chọn GitHub account
5. Authorize app
6. Kiểm tra có redirect về frontend không

---

## ✅ Nếu thành công:

- GitHub OAuth hoạt động!
- User có thể đăng nhập bằng GitHub
- `loginMethod: 'github'` được lưu vào database

---

## ❌ Nếu vẫn lỗi:

### Error: "Application not found"
→ App chưa được tạo trong GitHub
→ Check https://github.com/settings/developers

### Error: "Invalid client"
→ Client ID hoặc Secret sai
→ Kiểm tra lại `.env` file

### Error: "redirect_uri_mismatch"
→ Callback URL sai
→ Kiểm tra Authorization callback URL trong GitHub App

### Vẫn 404 Not Found
→ Clear browser cache và thử lại
→ Restart backend lại

---

## 📞 Báo kết quả:

Cho tôi biết:
1. Đã tạo GitHub App chưa?
2. Đã update .env chưa?
3. Kết quả test như thế nào?

