# Hướng dẫn Cấu hình SMS với Twilio

## ❌ Lỗi thường gặp: Invalid From Number (21212)

### Nguyên nhân:
Số điện thoại Twilio trong `.env` không đúng định dạng hoặc không phải số Twilio hợp lệ.

### Cách sửa:

#### Bước 1: Lấy số điện thoại Twilio đúng

1. Đăng nhập vào Twilio Console: https://console.twilio.com
2. Vào **Phone Numbers** > **Manage** > **Active numbers**
3. Tìm số điện thoại Twilio của bạn (sẽ có dạng `+1xxxxxxxxxx` hoặc `+84xxxxxxxxx`)
4. **Copy số đó** (bao gồm dấu `+`)

#### Bước 2: Cập nhật `.env`

Mở file `.env` trong thư mục `server/` và sửa:

```env
# ❌ SAI - Không có dấu +
TWILIO_PHONE_NUMBER=0342012204

# ✅ ĐÚNG - Có dấu + và là số Twilio
TWILIO_PHONE_NUMBER=+15551234567
```

**Lưu ý quan trọng**:
- ✅ Phải bắt đầu bằng `+`
- ✅ Phải là số điện thoại Twilio của bạn (không phải số điện thoại thường)
- ✅ Không có khoảng trắng
- ❌ Không dùng số trong nước như `0342012204`
- ❌ Không dùng số không có dấu `+`

#### Bước 3: Test lại

```bash
cd server
npm run test-sms +84123456789
```

## 📋 Cấu hình đầy đủ Twilio

### Bước 1: Đăng ký Twilio

1. Đăng ký tài khoản tại https://www.twilio.com
2. Xác thực email và số điện thoại
3. Lấy thông tin từ Twilio Console:
   - **Account SID** (bắt đầu bằng `AC...`)
   - **Auth Token** (bắt đầu bằng `...`)
   - **Phone Number** (số điện thoại Twilio của bạn, có dạng `+1xxxxxxxxxx`)

### Bước 2: Cấu hình trong `.env`

Thêm vào file `.env` trong thư mục `server/`:

```env
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token-here
TWILIO_PHONE_NUMBER=+15551234567
```

**Ví dụ thực tế**:
```env
TWILIO_ACCOUNT_SID=ACa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5
TWILIO_AUTH_TOKEN=abc123def456ghi789jkl012mno345pqr
TWILIO_PHONE_NUMBER=+15551234567
```

### Bước 3: Verify số điện thoại (Tài khoản Trial)

Nếu bạn dùng tài khoản Twilio Trial (miễn phí):
- Chỉ có thể gửi SMS đến số điện thoại đã verify
- Vào: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- Thêm số điện thoại muốn nhận SMS và verify

### Bước 4: Test

```bash
cd server
npm run test-sms +84123456789
```

**Lưu ý**: Số điện thoại nhận SMS cũng phải có định dạng quốc tế (bắt đầu bằng `+`)

## 🔍 Các lỗi khác và cách sửa

### Lỗi 21659: 'From' number is not a Twilio phone number
- **Nguyên nhân**: Số điện thoại trong `TWILIO_PHONE_NUMBER` không phải là số Twilio hợp lệ
- **Giải thích**: 
  - Số điện thoại không phải là số Twilio thực sự (có thể là số điện thoại thường)
  - Số điện thoại không thuộc tài khoản Twilio của bạn
  - Số điện thoại đã bị xóa hoặc không còn hoạt động
- **Cách sửa**:
  1. Vào Twilio Console: https://console.twilio.com
  2. Vào **Phone Numbers** > **Manage** > **Active numbers**
  3. Tìm số điện thoại Twilio của bạn (sẽ có dạng `+1xxxxxxxxxx` hoặc `+44xxxxxxxxxx`)
  4. Copy số đó (KHÔNG phải số điện thoại thường của bạn!)
  5. Cập nhật `TWILIO_PHONE_NUMBER` trong `.env`
- **Lưu ý**: 
  - Số điện thoại Twilio KHÁC với số điện thoại thường của bạn
  - Bạn phải MUA số điện thoại từ Twilio (hoặc dùng số trial)
  - Nếu chưa có số, vào: https://console.twilio.com/us1/develop/phone-numbers/manage/search

### Lỗi 21266: 'To' and 'From' number cannot be the same
- **Nguyên nhân**: Số điện thoại nhận SMS (To) giống với số điện thoại Twilio (From)
- **Giải thích**: Twilio không cho phép gửi SMS từ số A đến chính số A
- **Cách sửa**: 
  - Sử dụng số điện thoại **KHÁC** để test (không phải số Twilio của bạn)
  - Nếu dùng tài khoản Trial, số nhận SMS phải được verify trước
  - Vào: https://console.twilio.com/us1/develop/phone-numbers/manage/verified

### Lỗi 21211: Invalid 'To' Phone Number
- **Nguyên nhân**: Số điện thoại nhận SMS không hợp lệ
- **Cách sửa**: Đảm bảo số điện thoại có định dạng quốc tế (bắt đầu bằng `+`)

### Lỗi 20003: Authentication Error
- **Nguyên nhân**: Account SID hoặc Auth Token sai
- **Cách sửa**: Kiểm tra lại `TWILIO_ACCOUNT_SID` và `TWILIO_AUTH_TOKEN` trong `.env`

### Lỗi 21408: Permission Denied
- **Nguyên nhân**: Tài khoản Trial không có quyền gửi đến số này
- **Cách sửa**: Verify số điện thoại trong Twilio Console hoặc nâng cấp tài khoản

### Lỗi 21610: Unsubscribed recipient
- **Nguyên nhân**: Số điện thoại đã từ chối nhận SMS từ Twilio
- **Cách sửa**: Số điện thoại cần opt-in lại

## 📱 Định dạng số điện thoại

### Đúng ✅:
- `+84123456789` (Việt Nam)
- `+15551234567` (Mỹ)
- `+1234567890` (Mỹ, ngắn)
- `+442071234567` (Anh)

### Sai ❌:
- `0342012204` (thiếu dấu +, số trong nước)
- `84123456789` (thiếu dấu +)
- `+84 123 456 789` (có khoảng trắng)
- `1234567890` (thiếu mã quốc gia)

## 🚀 Sử dụng trong ứng dụng

Khi user nhập số điện thoại (không có @) để reset password:
- Hệ thống tự động gửi SMS chứa mã xác thực
- Nếu có email, hệ thống cũng gửi email
- Nếu không có cấu hình Twilio, SMS sẽ được log ra console (development mode)

## 💡 Tips

1. **Tài khoản Trial**: Miễn phí nhưng chỉ gửi được đến số đã verify
2. **Nâng cấp**: Nếu cần gửi SMS đến bất kỳ số nào, nâng cấp tài khoản Twilio
3. **Giá cả**: Twilio tính phí theo tin nhắn, khoảng $0.0075/tin nhắn (Mỹ)
4. **Development**: Nếu không cấu hình Twilio, hệ thống vẫn hoạt động và log SMS ra console

