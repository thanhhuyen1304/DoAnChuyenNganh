# Lỗi "Failed to obtain access token"

## Nguyên nhân

Khi backend exchange GitHub code để lấy access token thì thất bại.

## Có thể là:

1. **Client Secret sai** - Secret trong .env không match với GitHub
2. **Client Secret expired** - Secret đã hết hạn
3. **Client ID sai** - ID không match
4. **Network issue** - Không kết nối được GitHub API

## Giải pháp

### Bước 1: Regenerate Secret

1. Vào: https://github.com/settings/developers
2. Click OAuth App của bạn
3. Delete secret cũ (click nút "Delete" màu đỏ)
4. Click "Generate a new client secret"
5. **COPY** secret mới ngay lập tức
6. Update file `server/.env`:
```env
GITHUB_CLIENT_SECRET=<SECRET_MỚI_ĐÂY>
```
7. **SAVE** file
8. Trong terminal backend, gõ `rs` và Enter
9. Test lại OAuth

### Bước 2: Verify credentials

Check file `.env` phải có:
```env
GITHUB_CLIENT_ID=Ov231i9rbunOS0wk2XJW
GITHUB_CLIENT_SECRET=<secret mới từ GitHub>
```

**Không có space, không có quotes!**

### Bước 3: Test lại

```
http://localhost:5000/api/auth/github
```

## Debug logs

Sau khi restart và test OAuth, check terminal backend có error gì. Tôi đã thêm logs chi tiết vào `passport.ts`.

Gửi cho tôi toàn bộ logs từ khi restart đến khi test OAuth!

