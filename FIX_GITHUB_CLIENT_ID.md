# Sửa GitHub Client ID

## ⚠️ Vấn đề

Client ID trong file `.env` bị **typo**:
- **SAI**: `Ov23**l**i9rbunOS0wk2XJW` (có chữ "l")
- **ĐÚNG**: `Ov23**1**i9rbunOS0wk2XJW` (có số "1")

## 🔧 Sửa ngay

### Bước 1: Mở file `.env`

Mở file: `server/.env`

### Bước 2: Tìm dòng GitHub

Tìm dòng có:
```
GITHUB_CLIENT_ID=Ov23li9rbunOS0wk2XJW
```

### Bước 3: Sửa

Đổi thành:
```
GITHUB_CLIENT_ID=Ov231i9rbunOS0wk2XJW
```

**Chú ý**: Đổi chữ **"l"** thành số **"1"**

### Bước 4: Check Client Secret

Trong file `.env`, cũng phải có:
```
GITHUB_CLIENT_SECRET=18de68b7a58eae929c5b58faa24b03fa7a22d92e
```

(Nếu khác, thay bằng secret mới từ ảnh: `18de68b7a58eae929c5b58faa24b03fa7a22d92e`)

### Bước 5: Save và Restart

1. **Save** file `.env`
2. Backend sẽ tự động restart (Nodemon)
3. Kiểm tra terminal - phải thấy:
   ```
   ✅ GitHub OAuth Strategy initialized
   ```

### Bước 6: Test lại

Mở browser:
```
http://localhost:5000/api/auth/github
```

Nên redirect đến GitHub login!

## 📋 Nội dung file .env (sau khi sửa)

```env
# GitHub OAuth - ĐÚNG
GITHUB_CLIENT_ID=Ov231i9rbunOS0wk2XJW
GITHUB_CLIENT_SECRET=18de68b7a58eae929c5b58faa24b03fa7a22d92e
```

**Chú ý quan trọng**: Client ID phải là `Ov231i9...` chứ KHÔNG phải `Ov23li9...`

## Nếu vẫn lỗi

Sau khi sửa và restart, test lại và gửi cho tôi:
1. Logs từ terminal backend
2. Kết quả khi mở `http://localhost:5000/api/auth/github`

