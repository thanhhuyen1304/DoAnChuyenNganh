# Hướng dẫn Cấu hình Password Reset - Email & SMS

## 📋 Tổng quan

Hệ thống BugHunter hỗ trợ đặt lại mật khẩu qua **Email** hoặc **SMS**. Người dùng có thể nhập email hoặc số điện thoại để nhận mã xác thực 6 chữ số, sau đó sử dụng mã này để đặt lại mật khẩu.

## 🔧 Cấu hình Backend

### 1. Cấu hình Email (SMTP)

#### Option 1: Sử dụng Gmail SMTP (Khuyến nghị cho development)

**⚠️ QUAN TRỌNG**: Gmail không cho phép sử dụng mật khẩu thông thường để đăng nhập qua SMTP. Bạn **PHẢI** sử dụng **App Password**.

##### Bước 1: Bật 2-Step Verification

1. Vào https://myaccount.google.com/security
2. Tìm mục "2-Step Verification" và bật nó
3. Làm theo hướng dẫn để thiết lập (thường là xác thực qua điện thoại)

##### Bước 2: Tạo App Password

1. Vào https://myaccount.google.com/apppasswords
   - Nếu không thấy link, đảm bảo đã bật 2-Step Verification
2. Chọn:
   - **App**: Mail
   - **Device**: Other (Custom name)
   - **Name**: BugHunter (hoặc tên bạn muốn)
3. Click "Generate"
4. **Copy mật khẩu 16 ký tự** được tạo (ví dụ: `abcd efgh ijkl mnop`)
   - ⚠️ **Lưu ý**: Mật khẩu này chỉ hiển thị 1 lần, hãy copy ngay!

##### Bước 3: Cấu hình trong `.env`

Thêm vào file `.env` trong thư mục `server/`:

```env
# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=no-reply@bughunter.com
```

**Lưu ý quan trọng**:
- `SMTP_USER`: Email Gmail của bạn (ví dụ: `yourname@gmail.com`)
- `SMTP_PASS`: **App Password 16 ký tự** (KHÔNG phải mật khẩu Gmail thông thường!)
  - Bỏ khoảng trắng nếu có (ví dụ: `abcdefghijklmnop` thay vì `abcd efgh ijkl mnop`)
- `SMTP_FROM`: Có thể dùng email của bạn hoặc `no-reply@bughunter.com`

##### Lỗi thường gặp: "535-5.7.8 Username and Password not accepted"

**Nguyên nhân**:
- Đang sử dụng mật khẩu Gmail thông thường thay vì App Password
- App Password không đúng hoặc đã bị xóa
- Chưa bật 2-Step Verification

**Giải pháp**:
1. Đảm bảo đã bật 2-Step Verification
2. Tạo App Password mới tại https://myaccount.google.com/apppasswords
3. Copy App Password (16 ký tự, không có khoảng trắng)
4. Cập nhật `SMTP_PASS` trong `.env`
5. Restart server

#### Option 2: Sử dụng SendGrid

1. Đăng ký tài khoản tại https://sendgrid.com
2. Tạo API Key trong SendGrid Dashboard
3. Cấu hình trong `.env`:

```env
# Email Configuration (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

#### Option 3: Sử dụng Ethereal Email (Development/Testing)

Nếu không cấu hình SMTP, hệ thống sẽ tự động sử dụng **Ethereal Email** (test SMTP) trong môi trường development. Email sẽ không được gửi thực sự, nhưng bạn sẽ nhận được một **preview URL** để xem email trong trình duyệt.

**Lưu ý**: Ethereal chỉ hoạt động trong `NODE_ENV !== 'production'`

### 2. Cấu hình SMS (Twilio)

#### Bước 1: Đăng ký Twilio

1. Đăng ký tài khoản tại https://www.twilio.com
2. Lấy thông tin từ Twilio Console:
   - **Account SID**
   - **Auth Token**
   - **Phone Number** (số điện thoại Twilio của bạn)

#### Bước 2: Cấu hình trong `.env`

Thêm vào file `.env` trong thư mục `server/`:

```env
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Lưu ý**: 
- Số điện thoại phải có định dạng quốc tế (ví dụ: `+84123456789` cho Việt Nam)
- Nếu không cấu hình Twilio, hệ thống sẽ log SMS ra console trong development mode

### 3. Cài đặt Dependencies

Các package cần thiết đã được cài đặt sẵn:

```bash
cd server
npm install nodemailer twilio
```

Nếu chưa có, chạy lệnh trên để cài đặt.

## 📝 File `.env` mẫu đầy đủ

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/bughunter

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Client Configuration
CLIENT_URL=http://localhost:3000

# Admin Configuration
ADMIN_EMAIL=admin@bughunter.com

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=no-reply@bughunter.com

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🚀 Cách sử dụng

### 1. Yêu cầu đặt lại mật khẩu

**Frontend**: Người dùng truy cập `/forgot-password` và nhập email hoặc số điện thoại.

**API Endpoint**: `POST /api/auth/request-reset`

**Request Body**:
```json
{
  "emailOrPhone": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Nếu tài khoản tồn tại, mã xác thực đã được gửi",
  "previewUrl": "https://ethereal.email/message/..." // Chỉ có trong development mode
}
```

### 2. Xác thực mã và đặt lại mật khẩu

**Frontend**: Người dùng truy cập `/verify-reset` và nhập mã xác thực + mật khẩu mới.

**API Endpoint**: `POST /api/auth/verify-reset`

**Request Body**:
```json
{
  "emailOrPhone": "user@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công"
}
```

## 🔒 Bảo mật

1. **Rate Limiting**: Hệ thống đã có rate limiting để chống spam:
   - Tối đa 5 requests mỗi 15 phút từ cùng một IP
   - Tối đa 3 requests mỗi 15 phút cho cùng một email/số điện thoại

2. **Mã xác thực**:
   - Mã 6 chữ số ngẫu nhiên
   - Hết hạn sau 10 phút
   - Tự động xóa sau khi sử dụng

3. **Privacy**: Hệ thống không tiết lộ liệu email/số điện thoại có tồn tại trong database hay không.

## 🧪 Testing

### Test với Email (Development)

1. Không cấu hình SMTP → Hệ thống sẽ dùng Ethereal
2. Gửi request reset password
3. Kiểm tra console log để lấy preview URL
4. Mở preview URL trong trình duyệt để xem email

### Test với SMS (Development)

1. Không cấu hình Twilio → SMS sẽ được log ra console
2. Kiểm tra console log để xem nội dung SMS

### Test Production

1. Cấu hình đầy đủ SMTP và Twilio trong `.env`
2. Đảm bảo `NODE_ENV=production`
3. Test với email/số điện thoại thật

## 📱 Các nhà cung cấp Email/SMS khác

### Email Providers

- **Mailgun**: https://www.mailgun.com
- **Amazon SES**: https://aws.amazon.com/ses/
- **Postmark**: https://postmarkapp.com
- **Mailjet**: https://www.mailjet.com

### SMS Providers

- **Vonage (Nexmo)**: https://www.vonage.com
- **AWS SNS**: https://aws.amazon.com/sns/
- **MessageBird**: https://www.messagebird.com

Để sử dụng các provider khác, bạn cần chỉnh sửa code trong:
- `server/src/services/smsService.ts` (cho SMS)
- `server/src/controllers/auth.controller.ts` (cho Email - phần `requestPasswordReset`)

## ❓ Troubleshooting

### Email không được gửi

1. Kiểm tra cấu hình SMTP trong `.env`
2. Kiểm tra firewall/network có chặn port 587/465 không
3. Với Gmail: Đảm bảo đã bật "Less secure app access" hoặc sử dụng App Password
4. Kiểm tra console log để xem lỗi chi tiết

### SMS không được gửi

1. Kiểm tra cấu hình Twilio trong `.env`
2. Kiểm tra số điện thoại có đúng định dạng quốc tế không
3. Kiểm tra tài khoản Twilio có đủ credit không
4. Kiểm tra console log để xem lỗi chi tiết

### Mã xác thực không hợp lệ

1. Đảm bảo mã chưa hết hạn (10 phút)
2. Đảm bảo mã chưa được sử dụng
3. Kiểm tra email/số điện thoại có đúng không

## 📚 Tài liệu tham khảo

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Twilio Documentation](https://www.twilio.com/docs)
- [Ethereal Email](https://ethereal.email/)

