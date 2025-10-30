# Kiểm tra và Tạo GitHub OAuth App

## ⚠️ Client ID không tồn tại

GitHub không tìm thấy OAuth App với Client ID: `Ov231i9rbunOS0wk2XJW`

## Bước 1: Check GitHub Settings

### 1.1 Truy cập GitHub Developer Settings

Mở: https://github.com/settings/developers

### 1.2 Kiểm tra OAuth Apps

Click **OAuth Apps** (bên trái menu)

**Bạn sẽ thấy**:
- Danh sách OAuth Apps (nếu có)
- Hoặc "No OAuth apps found"

### 1.3 Các trường hợp:

#### Trường hợp A: Không có OAuth App nào

→ Cần **tạo mới**

#### Trường hợp B: Có OAuth App khác

→ Dùng Client ID của app đó

#### Trường hợp C: Có app nhưng Client ID khác

→ Copy Client ID đúng

---

## Bước 2: Tạo OAuth App Mới (Nếu cần)

### 2.1 Click "New OAuth App"

Button màu xanh bên trên hoặc bên phải

### 2.2 Điền Form

**Application name**:
```
BugHunter
```

**Homepage URL**:
```
http://localhost:5173
```

**Authorization callback URL**: ⚠️ QUAN TRỌNG!
```
http://localhost:5000/api/auth/github/callback
```

**Chú ý**: KHÔNG có trailing slash `/` ở cuối!

### 2.3 Register

Click **Register application**

### 2.4 Copy Credentials

GitHub hiển thị:
- **Client ID** → Copy ngay!
- Click **Generate a new client secret**
- **Client secret** → Copy ngay!

**LƯU Ý**: Secret chỉ hiện 1 lần!

---

## Bước 3: Update .env File

Mở file `server/.env`:

**Sửa**:
```env
GITHUB_CLIENT_ID=<Client ID vừa copy>
GITHUB_CLIENT_SECRET=<Client Secret vừa copy>
```

**SAVE** (Ctrl+S)

---

## Bước 4: Restart Backend

Trong terminal backend:
```
rs
```

---

## Bước 5: Test

```
http://localhost:5000/api/auth/github
```

**Nên redirect đến GitHub login!**

---

## Nếu vẫn lỗi

Gửi cho tôi:
1. Screenshot của GitHub Developer Settings (danh sách OAuth Apps)
2. Logs từ terminal backend khi test OAuth

