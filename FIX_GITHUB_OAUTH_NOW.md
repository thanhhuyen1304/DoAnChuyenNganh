# Lỗi GitHub 404 - App bị xóa hoặc không tồn tại!

## ⚠️ VẤN ĐỀ

GitHub trả về 404 nghĩa là:
- OAuth App với Client ID `Ov231i9rbunOS0wk2XJW` **KHÔNG TỒN TẠI**
- Có thể bị xóa hoặc thuộc account khác

## ✅ GIẢI PHÁP: Tạo OAuth App mới

### Bước 1: Vào GitHub Settings

Truy cập: https://github.com/settings/developers

### Bước 2: Tạo OAuth App Mới

1. Click **OAuth Apps** (bên trái)
2. Click **New OAuth App** (màu xanh bên phải)
3. Điền form:

**Application name**:
```
BugHunter
```

**Homepage URL**:
```
http://localhost:5173
```

**Authorization callback URL**: ⚠️ QUAN TRỌNG
```
http://localhost:5000/api/auth/github/callback
```

### Bước 3: Register

Click **Register application**

### Bước 4: Copy Credentials

GitHub sẽ hiển thị:
- **Client ID** - Copy ngay!
- Click **"Generate a new client secret"** (màu xanh)
- **Client secret** - Copy ngay! (Chỉ hiện 1 lần!)

### Bước 5: Update File .env

Mở file `server/.env`:

Tìm:
```
GITHUB_CLIENT_ID=Ov231i9rbunOS0wk2XJW
GITHUB_CLIENT_SECRET=43226fefba83ab7bed207923758f911c8d085bfd
```

**Thay bằng**:
```
GITHUB_CLIENT_ID=<Client ID mới từ GitHub>
GITHUB_CLIENT_SECRET=<Client Secret mới từ GitHub>
```

**SAVE** (Ctrl+S)

### Bước 6: Restart Backend

Trong terminal backend, gõ:
```
rs
```

### Bước 7: Test

Mở: `http://localhost:5000/api/auth/github`

**Phải redirect đến GitHub và đăng nhập thành công!**

---

## Chú ý

Client Secret chỉ hiển thị 1 lần. Nếu quên, phải:
1. Delete secret cũ
2. Generate secret mới

---

## Sau khi test

Cho tôi biết:
1. Đã tạo OAuth App mới chưa?
2. Đã update .env chưa?
3. Kết quả test OAuth?

