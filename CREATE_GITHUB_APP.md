# Tạo GitHub OAuth App - HƯỚNG DẪN CHI TIẾT

## ⚠️ App GitHub không tồn tại (404)

Bạn cần tạo OAuth App mới trong GitHub.

## Bước 1: Truy cập GitHub Settings

1. Mở: https://github.com/settings/developers
2. Đăng nhập vào GitHub nếu cần

## Bước 2: Tạo OAuth App mới

### 2.1 Click "New OAuth App"

Trang Developer settings → Click button **"New OAuth App"** (màu xanh)

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

**Chú ý**:
- KHÔNG có dấu slash `/` ở cuối
- Phải chính xác `http://localhost:5000/api/auth/github/callback`

### 2.3 Register

Click nút **"Register application"** (màu xanh)

## Bước 3: Copy Credentials

GitHub sẽ redirect đến trang app details hiển thị:

### Client ID
- Copy toàn bộ Client ID (ví dụ: `Ov23...xxx`)

### Client secret
- Click nút **"Generate a new client secret"** (màu xanh)
- Copy secret ngay (chỉ hiện 1 lần!)

## Bước 4: Update file .env

Mở file `server/.env`:

**Tìm dòng**:
```env
GITHUB_CLIENT_ID=Ov23liNOMymEaa7BdSHw
GITHUB_CLIENT_SECRET=b37bdc02fce25d2ba06bb808c39cc5cceeeb82c7
```

**Sửa thành**:
```env
GITHUB_CLIENT_ID=<Client ID mới từ GitHub>
GITHUB_CLIENT_SECRET=<Client Secret mới từ GitHub>
```

**SAVE** (Ctrl+S)

## Bước 5: Restart Backend

Trong terminal backend:
```
rs
```

Đợi thấy:
```
✅ GitHub OAuth Strategy initialized
```

## Bước 6: Test OAuth

Mở browser:
```
http://localhost:5000/api/auth/github
```

**Nên redirect đến GitHub login!**

---

## Lưu ý

- Secret chỉ hiển thị 1 lần → Copy ngay!
- Callback URL phải chính xác 100%
- Nếu quên secret → Delete và tạo lại

## Sau khi test

Cho tôi biết:
1. Đã tạo app chưa?
2. Test OAuth có redirect đến GitHub không?
3. Logs trong terminal backend?

