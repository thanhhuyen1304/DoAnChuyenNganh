# Hướng dẫn Test Gửi Email SMTP

## 📋 Tổng quan

Script `test-email.ts` giúp bạn kiểm tra xem cấu hình SMTP có hoạt động đúng không trước khi test với user thật.

## 🚀 Cách chạy Script

### Bước 1: Đảm bảo đã cấu hình .env

Kiểm tra file `.env` trong thư mục `server/` có đầy đủ thông tin SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-16-chars
SMTP_FROM=your-email@gmail.com
```

### Bước 2: Chạy Script Test

Mở terminal và chạy một trong các lệnh sau:

#### Cách 1: Gửi email test đến chính email SMTP_USER (trong .env)

```bash
cd server
npm run test-email
```

#### Cách 2: Gửi email test đến email cụ thể

```bash
cd server
npm run test-email your-email@example.com
```

Ví dụ:
```bash
npm run test-email bughunter.tech@gmail.com
```

## 📊 Kết quả mong đợi

### ✅ Nếu thành công:

```
📧 Test gửi email SMTP

Cấu hình SMTP:
- Host: smtp.gmail.com
- Port: 587
- User: bughunter.tech@gmail.com
- Pass: ***abcd
- From: bughunter.tech@gmail.com

Đang gửi email test đến: bughunter.tech@gmail.com

1. Đang kiểm tra kết nối SMTP...
   ✅ Kết nối SMTP thành công!

2. Đang gửi email test...
   ✅ Email đã được gửi thành công!
   Message ID: <xxx@mail.gmail.com>
   Response: 250 2.0.0 OK

✅ Test thành công! Kiểm tra hộp thư đến của bạn.
```

### ❌ Nếu có lỗi:

Script sẽ hiển thị lỗi chi tiết và hướng dẫn sửa:

**Lỗi xác thực (535/EAUTH):**
```
❌ Lỗi khi gửi email:
   Message: Invalid login: 535-5.7.8 Username and Password not accepted
   Code: EAUTH
   ResponseCode: 535

⚠️  Lỗi xác thực! Có thể bạn đang dùng mật khẩu Gmail thông thường thay vì App Password.
💡 Hướng dẫn:
   1. Vào https://myaccount.google.com/apppasswords
   2. Tạo App Password mới
   3. Cập nhật SMTP_PASS trong .env
```

**Lỗi kết nối:**
```
❌ Lỗi khi gửi email:
   Message: connect ECONNREFUSED
   Code: ECONNREFUSED

⚠️  Không thể kết nối đến SMTP server!
💡 Kiểm tra:
   - SMTP_HOST và SMTP_PORT có đúng không?
   - Firewall có chặn kết nối không?
   - Internet có kết nối không?
```

## 🔍 Kiểm tra Email đã nhận

1. Mở hộp thư đến của email bạn đã chỉ định
2. Tìm email với subject: **"Test Email - BugHunter"**
3. Email sẽ chứa mã test 6 chữ số

## 🛠️ Troubleshooting

### Script không chạy được

**Lỗi: `ts-node` không tìm thấy**
```bash
cd server
npm install
```

**Lỗi: Module không tìm thấy**
```bash
cd server
npm install nodemailer dotenv
```

### Email không đến

1. **Kiểm tra Spam/Junk folder**: Email có thể bị đưa vào thư mục spam
2. **Kiểm tra log**: Xem Message ID và Response trong console
3. **Kiểm tra cấu hình**: Chạy `node check-env.js` để kiểm tra cấu hình SMTP

### Cần test lại với cấu hình mới

Sau khi sửa `.env`, không cần restart server, chỉ cần chạy lại script:
```bash
npm run test-email
```

## 📝 Lưu ý

- Script này chỉ test kết nối SMTP, không ảnh hưởng đến server đang chạy
- Có thể chạy script nhiều lần để test
- Email test sẽ có subject "Test Email - BugHunter" để dễ nhận biết
- Nếu test thành công, hệ thống sẽ gửi email xác thực cho user bình thường

## 🎯 Bước tiếp theo

Sau khi test email thành công:

1. **Test với user thật**: 
   - Mở ứng dụng web
   - Vào trang "Quên mật khẩu"
   - Nhập email của user
   - Kiểm tra console log của server để xem chi tiết

2. **Kiểm tra log server**:
   - Khi user yêu cầu reset password, server sẽ log:
     - `[Password Reset] Kiểm tra cấu hình SMTP`
     - `[Password Reset] Đang kiểm tra kết nối SMTP...`
     - `[Password Reset] ✅ Kết nối SMTP thành công!`
     - `[Password Reset] ✅ Email đã được gửi thành công!`

3. **Nếu vẫn không gửi được**:
   - Xem log chi tiết trong console
   - Kiểm tra lỗi cụ thể và làm theo hướng dẫn trong log

