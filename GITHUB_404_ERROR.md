# Lỗi GitHub 404 - OAuth App không tồn tại

## Vấn đề

GitHub trả về 404 nghĩa là **OAuth App với Client ID này không tồn tại**.

URL trong browser:
```
github.com/login/oauth/authorize?client_id=Ov231i9rbunOS0wk2XJW...
```

GitHub không tìm thấy app với ID này.

## Nguyên nhân

1. **App đã bị xóa** 
2. **App chưa được tạo** cho account này
3. **App thuộc account/organization khác**

## Giải pháp: TẠO MỚI OAuth App

### Bước 1: Tạo OAuth App

1. Vào: https://github.com/settings/developers
2. Click **OAuth Apps** > **New OAuth App**
3. Điền form:
   - **Application name**: BugHunter
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
4. Click **Register application**

### Bước 2: Copy Credentials

GitHub sẽ hiển thị:
- **Client ID** (copy ngay!)
- Click **Generate a new client secret**
- **Client secret** (copy ngay!)

### Bước 3: Update .env

Mở file `server/.env`:

```env
GITHUB_CLIENT_ID=<Client ID vừa copy>
GITHUB_CLIENT_SECRET=<Client Secret vừa copy>
```

**SAVE** file!

### Bước 4: Restart Backend

Trong terminal backend, gõ:
```
rs
```

### Bước 5: Test

Mở: `http://localhost:5000/api/auth/github`

**Nên redirect đến GitHub và đăng nhập thành công!**

---

## LƯU Ý

Client ID cũ `Ov231i9rbunOS0wk2XJW` **đã không tồn tại** trong GitHub của bạn.

**Cần tạo app MỚI** với Client ID MỚI!

