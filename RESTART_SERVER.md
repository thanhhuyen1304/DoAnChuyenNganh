# Restart Server - QUAN TRỌNG!

## ⚠️ Backend đã restart nhưng strategies có thể chưa load

Trong terminal backend (nơi đang chạy `npm run dev`), nhấn:

```
rs
```

Và nhấn **Enter**

Điều này sẽ **force restart** server.

## Sau khi restart

Sẽ thấy:
```
[dotenv@17.2.3] injecting env...
Kết nối MongoDB thành công
Server đang chạy tại http://localhost:5000
Environment: development
```

**KHÔNG còn**:
```
Error: Unknown authentication strategy "google"
```

## Sau đó test OAuth

Mở browser:
```
http://localhost:5000/api/auth/github
```

Nên redirect đến GitHub login page!

## Nếu vẫn lỗi

Check file `server/src/app.ts` - line 11 phải có:
```typescript
config();  // ← Phải TRƯỚC import './config/passport'
```

Nếu không đúng, file có thể chưa được save hoặc có conflict.

