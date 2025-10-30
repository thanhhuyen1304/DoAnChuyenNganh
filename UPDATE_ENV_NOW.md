# QUAN TRỌNG: Sửa Client ID trong file .env

## ⚠️ Vấn đề ngay bây giờ

Từ logs, tôi thấy Client ID vẫn SAI:
```
GitHub Config: {
  clientID: 'Ov23li9rbu...',    ← SAI! (chữ "l")
```

Phải là:
```
clientID: 'Ov231i9rb...'        ← ĐÚNG! (số "1")
```

## 🔧 Cách sửa (2 phút)

### Bước 1: Mở file

Trong VS Code, mở file: **`server/.env`**

### Bước 2: Tìm dòng này

```
GITHUB_CLIENT_ID=Ov23li9rbunOS0wk2XJW
```

### Bước 3: Sửa

Đổi thành:
```
GITHUB_CLIENT_ID=Ov231i9rbunOS0wk2XJW
```

**Chú ý**: Đổi chữ **"l"** thành số **"1"**

### Bước 4: Sửa Client Secret

Tìm:
```
GITHUB_CLIENT_SECRET=e08d825b57...
```

Sửa thành:
```
GITHUB_CLIENT_SECRET=18de68b7a58eae929c5b58faa24b03fa7a22d92e
```

(Secret từ GitHub bạn gửi)

### Bước 5: Save

**Ctrl+S** để save

### Bước 6: Check

Backend sẽ tự restart. Trong terminal, phải thấy:

```
✅ GitHub OAuth Strategy initialized
GitHub Config: {
  clientID: 'Ov231i9rb...',    ← Phải có số 1!
```

### Bước 7: Test

Mở: `http://localhost:5000/api/auth/github`

**Phải redirect đến GitHub!**

---

## Sau khi sửa

Cho tôi biết:
1. Terminal có thấy `'Ov231i9rb...'` không? (phải có số 1)
2. Test OAuth có redirect đến GitHub không?

