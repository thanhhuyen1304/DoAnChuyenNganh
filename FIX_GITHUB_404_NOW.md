# Fix GitHub 404 Error - HƯỚNG DẪN TỪNG BƯỚC

## ❌ Vấn đề

GitHub trả về 404 error nghĩa là **Client ID không tồn tại trong GitHub**.

```
GITHUB_CLIENT_ID=Ov23liNOMymEaa7BdSHw ❌
```

## ✅ Giải pháp: Tạo OAuth App MỚI

### Bước 1: Tạo GitHub OAuth App

1. Mở browser, đăng nhập GitHub account của bạn
2. Vào: https://github.com/settings/developers
3. Click **"OAuth Apps"** ở menu bên trái
4. Click nút **"New OAuth App"** (màu xanh)

### Bước 2: Điền thông tin App

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

⚠️ **QUAN TRỌNG**: Callback URL phải CHÍNH XÁC như trên!

### Bước 3: Register Application

Click nút **"Register application"** màu xanh

### Bước 4: Copy Client ID

Sau khi tạo xong, bạn sẽ thấy **Client ID** (màu xanh, dạng `Ov23liXXXXXXXXXXXXX`)

**COPY Client ID này!**

### Bước 5: Generate Client Secret

1. Scroll xuống dưới, tìm **"Client secrets"**
2. Click **"Generate a new client secret"**
3. GitHub sẽ hiển thị secret mới (chỉ hiện 1 lần!)
4. **COPY secret ngay!** Nếu đóng tab sẽ mất.

### Bước 6: Update file `.env`

Mở file: `.env` ở thư mục root (không phải `server/.env`)

Tìm dòng:
```env
GITHUB_CLIENT_ID=Ov23liNOMymEaa7BdSHw
GITHUB_CLIENT_SECRET=36a2d4ba18a933575d2156b83786035b9e03a0d0
```

**Thay bằng credentials MỚI**:
```env
GITHUB_CLIENT_ID=<paste Client ID mới vừa copy>
GITHUB_CLIENT_SECRET=<paste Secret mới vừa copy>
```

**Lưu file!**

### Bước 7: Restart Backend

Trong terminal backend (đang chạy `npm run dev`):

1. Ấn **Ctrl+C** để dừng server
2. Chạy lại: `npm run dev`

Hoặc nếu dùng nodemon alias:
```
rs
```

### Bước 8: Kiểm tra Logs

Backend khởi động, tìm trong terminal:
```
✅ GitHub OAuth Strategy initialized
GitHub Config: { clientID: 'Ov23li...', callbackURL: '...' }
```

### Bước 9: Test GitHub OAuth

1. Mở: `http://localhost:5173/login`
2. Click **"Đăng nhập với GitHub"**
3. Nếu redirect đến GitHub login → ✅ **THÀNH CÔNG!**
4. Đăng nhập GitHub account
5. Authorize app
6. Sẽ redirect về frontend và đăng nhập thành công

---

## ✅ Kết quả mong đợi

- ✅ Redirect đến GitHub login page (không còn 404)
- ✅ Có thể authorize app
- ✅ Redirect về frontend với JWT token
- ✅ User đã đăng nhập!

---

## ❌ Nếu vẫn lỗi

### Vẫn 404:
→ Client ID trong `.env` chưa được update đúng
→ Kiểm tra lại `.env` file
→ Restart backend lại

### Error: "redirect_uri_mismatch":
→ Callback URL sai trong GitHub App settings
→ Vào https://github.com/settings/developers
→ Click vào App vừa tạo
→ Sửa "Authorization callback URL" thành: `http://localhost:5000/api/auth/github/callback`
→ Save changes

### Vẫn không redirect:
→ Kiểm tra backend có load credentials không
→ Xem terminal backend có log "GitHub OAuth Strategy initialized" không

---

## 📝 Lưu ý

1. **Client Secret chỉ hiện 1 lần**, nếu quên phải generate lại
2. **Callback URL phải CHÍNH XÁC**: `http://localhost:5000/api/auth/github/callback`
3. **Restart backend** sau khi update `.env`
4. **Chỉ dùng HTTPS** trong production (không localhost)

---

## 🚀 BẮT ĐẦU NGAY

**Tạo GitHub OAuth App mới và update `.env`!**

Khi đã update xong, báo cho tôi để restart backend!

