# SỬA FILE .ENV - Bước cuối cùng!

## 📍 Vấn đề

Client ID trong `.env` bị typo:
- **SAI**: `Ov23**l**i9rbunOS0wk2XJW` (chữ "l")  
- **ĐÚNG**: `Ov23**1**i9rbunOS0wk2XJW` (số "1")

## 🔧 Cách sửa

### Bước 1: Mở file

Mở file: `server/.env`

**Cách mở**:
- Double-click vào file trong VS Code/Editor
- HOẶC dùng Notepad: Right-click → Open with Notepad

### Bước 2: Tìm và sửa

Tìm dòng:
```
GITHUB_CLIENT_ID=Ov23li9rbunOS0wk2XJW
```

Sửa thành:
```
GITHUB_CLIENT_ID=Ov231i9rbunOS0wk2XJW
```

**Chú ý**: Đổi chữ **"l"** thành số **"1"** ở vị trí thứ 4

### Bước 3: Sửa Client Secret

Tìm dòng:
```
GITHUB_CLIENT_SECRET=e08d825b57...
```

HOẶC bất kỳ secret nào đang có.

Sửa thành:
```
GITHUB_CLIENT_SECRET=18de68b7a58eae929c5b58faa24b03fa7a22d92e
```

(Secret mới từ GitHub bạn vừa generate)

### Bước 4: Save

**SAVE** file (Ctrl+S)

### Bước 5: Restart

Nodemon sẽ tự động restart. Kiểm tra terminal backend phải thấy:

```
✅ GitHub OAuth Strategy initialized
GitHub Config: {
  clientID: 'Ov231i9rb...',    ← Phải có số 1!
  callbackURL: 'http://localhost:5000/api/auth/github/callback'
}
```

**Nếu vẫn thấy** `'Ov23li9rbu...'` → File chưa được save hoặc sai file

### Bước 6: Test

Mở browser:
```
http://localhost:5000/api/auth/github
```

**Nên redirect đến GitHub login!**

## 📋 File đúng

Sau khi sửa, file `.env` phải có:

```env
# GitHub OAuth
GITHUB_CLIENT_ID=Ov231i9rbunOS0wk2XJW
GITHUB_CLIENT_SECRET=18de68b7a58eae929c5b58faa24b03fa7a22d92e
```

**QUAN TRỌNG**: 
- Chữ "**1**" KHÔNG phải chữ "**l**"
- Secret phải là secret mới từ GitHub

## Nếu vẫn lỗi

Sau khi sửa và restart, test lại và cho tôi biết:
1. Terminal backend logs (từ line "GitHub Config:")
2. Kết quả khi mở `http://localhost:5000/api/auth/github`

