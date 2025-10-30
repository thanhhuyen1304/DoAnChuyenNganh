# Test OAuth NGAY - Sau khi force restart

## Đã thêm logs debug

Tôi đã thêm logs chi tiết vào `passport.ts` để debug lỗi "Failed to obtain access token".

## Force restart backend

### Trong terminal backend:

Gõ:
```
rs
```

Nhấn Enter

## Kiểm tra logs

Sau khi restart, trong terminal phải thấy:

```
✅ GitHub OAuth Strategy initialized
GitHub Config: {
  clientID: 'Ov231i9rb...',    ← Phải có số 1!
  callbackURL: 'http://localhost:5000/api/auth/github/callback'
}
Kết nối MongoDB thành công
Server đang chạy tại http://localhost:5000
```

## Test OAuth

Mở browser:
```
http://localhost:5000/api/auth/github
```

## Logs sẽ hiển thị

Khi redirect về callback, terminal sẽ show:
```
GitHub OAuth callback - Profile: {
  id: '...',
  username: '...',
  hasEmails: true/false,
  hasPhotos: true/false
}
```

**Nếu có error**, terminal sẽ show chi tiết!

## Gửi logs cho tôi

Sau khi test OAuth, copy **TOÀN BỘ** logs từ terminal backend:
- Từ khi restart (`rs`)
- Đến khi test OAuth
- Tất cả error messages

Gửi cho tôi để tôi debug!

