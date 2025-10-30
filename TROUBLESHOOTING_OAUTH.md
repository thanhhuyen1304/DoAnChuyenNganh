# OAuth Troubleshooting - Vẫn chưa đăng nhập được

## Kiểm tra nhanh

### 1. Backend có đang chạy không?

Mở browser và gõ:
```
http://localhost:5000
```

Nếu thấy response (không phải "can't reach") → Backend đang chạy.

### 2. Frontend có đang chạy không?

Mở browser:
```
http://localhost:3000
```

### 3. Test OAuth endpoint trực tiếp

Mở browser và gõ:
```
http://localhost:5000/api/auth/google
```

**Kết quả mong đợi**:
- Redirect đến Google OAuth login page
- URL sẽ là: `https://accounts.google.com/...`

**Nếu không redirect**:
- Backend chưa được start hoặc có lỗi
- Check terminal chạy backend

**Nếu redirect nhưng báo lỗi "redirect_uri_mismatch"**:
- Callback URL trong Google Console sai
- Cần sửa lại

### 4. Kiểm tra .env file

```bash
cd server
type .env  # Windows
# hoặc
cat .env   # Linux/Mac
```

Kiểm tra các giá trị:
- `GOOGLE_CLIENT_ID` - Phải là giá trị thật từ Google Console
- `GOOGLE_CLIENT_SECRET` - Phải là giá trị thật
- `SERVER_URL` - Nên là `http://localhost:5000`

**QUAN TRỌNG**: Không được để "your_googl..." hoặc placeholder.

### 5. Kiểm tra Google Console Settings

#### Authorized redirect URIs phải có:

```
http://localhost:5000/api/auth/google/callback
```

**Chú ý**:
- Không có trailing slash `/` ở cuối
- Không có space
- Phải match chính xác với backend config

### 6. Test từ trang Login

1. Mở: `http://localhost:3000/login`
2. Click "Đăng nhập với Google"
3. Mở Developer Tools (F12)
4. Go to Network tab
5. Xem request đầu tiên

**Nếu không thấy request nào**:
- Frontend chưa redirect
- Check browser console có error không

**Nếu thấy redirect đến Google nhưng sau đó error**:
- Check Google Console logs
- Error message sẽ cho biết vấn đề

### 7. Check Backend Logs

Trong terminal chạy backend, bạn sẽ thấy:

```
GET /api/auth/google 200
```

Nếu không thấy dòng này, nghĩa là request không đến được backend.

Nếu thấy error message, đó là nguyên nhân.

## Solutions cho các lỗi thường gặp

### Lỗi 1: "redirect_uri_mismatch"

**Error message**: "Error 400: redirect_uri_mismatch"

**Nguyên nhân**: Callback URL không khớp

**Giải pháp**:
1. Vào Google Console: https://console.cloud.google.com/apis/credentials
2. Click vào OAuth Client
3. Trong "Authorized redirect URIs", thêm:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
4. Click "Save"
5. **Quan trọng**: Đợi 5-10 phút để Google cập nhật
6. Thử lại

### Lỗi 2: "invalid_client"

**Error message**: "Error 401: invalid_client"

**Nguyên nhân**: Client ID hoặc Secret sai

**Giải pháp**:
1. Copy chính xác Client ID và Secret từ Google Console
2. Paste vào file `server/.env`
3. Không có space, không có quote
4. Restart backend:
   ```bash
   # Ctrl+C để stop
   cd server
   npm run dev  # Start lại
   ```

### Lỗi 3: Backend không start

**Error**: "Cannot connect to backend"

**Giải pháp**:
1. Check MongoDB đang chạy không:
   ```bash
   # Windows
   Get-Service | Where-Object {$_.Name -like "*mongo*"}
   
   # Hoặc
   mongod --version
   ```

2. Start MongoDB nếu cần:
   ```bash
   # Windows
   net start MongoDB
   ```

3. Check port 5000 có bị chiếm không:
   ```bash
   netstat -ano | findstr :5000
   ```

### Lỗi 4: Frontend không redirect

**Triệu chứng**: Click button nhưng không có gì xảy ra

**Giải pháp**:
1. Mở browser console (F12)
2. Check có error không
3. Thử click nút và xem Network tab
4. Check URL có đúng không

**Test manual**:
Mở browser và gõ:
```
http://localhost:5000/api/auth/google
```

Nếu redirect đến Google → Backend OK, vấn đề ở frontend
Nếu không redirect → Backend có vấn đề

## Quick Fix - Sửa Google Console

Nếu vẫn không được, thử cách này:

### Bước 1: Verify Current Settings

1. Vào: https://console.cloud.google.com/apis/credentials
2. Click vào OAuth Client của bạn
3. Copy "Authorized redirect URIs" hiện tại

### Bước 2: Clear và Add lại

1. Delete tất cả redirect URIs cũ
2. Add mới:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
3. Click "Save"

### Bước 3: Wait

Đợi 5-10 phút để Google cập nhật settings.

### Bước 4: Test

```bash
# Restart backend
cd server
npm run dev

# Test trong browser
# http://localhost:5000/api/auth/google
```

## Alternative: Test với ngrok (Nếu localhost có vấn đề)

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 5000

# Lấy HTTPS URL từ ngrok
# Ví dụ: https://abc123.ngrok.io

# Update Google Console redirect URI:
https://abc123.ngrok.io/api/auth/google/callback
```

## Still Not Working?

Gửi cho tôi:

1. **Backend logs** khi click OAuth button
2. **Browser console errors** (F12 → Console)
3. **Network tab** screenshot
4. **Google Console** screenshot (Authorized redirect URIs)
5. **Nội dung .env** (ẩn secret, chỉ show structure)

## Contact Info

Nếu vẫn không được, check:
- Browser: Chrome có extension block không?
- Firewall: Port 5000 và 3000 có bị block không?
- Antivirus: Có block localhost không?

