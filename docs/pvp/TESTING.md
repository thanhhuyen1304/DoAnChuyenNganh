# Hướng dẫn Test PvP Multi-User

## 🚀 Bước 1: Khởi động hệ thống

### Server
```bash
cd server
npm run dev
```
Server sẽ chạy tại http://localhost:5000

### Client
```bash
cd client
npm run dev
```
Client sẽ chạy tại http://localhost:5174 (hoặc 5173)

## 🔐 Bước 2: Đăng nhập bằng 2 user khác nhau

### User 1 (Tab 1)
1. M trình duyệt, truy cập http://localhost:5174/login
2. Đăng nhập với:
   - Email: `admin@bughunter.com`
   - Password: `admin123`
3. Sau khi đăng nhập thành công, vào http://localhost:5174/pvp

### User 2 (Tab 2 - Incognito/Private Mode)
1. M tab ẩn danh/new incognito window
2. Truy cập http://localhost:5174/login
3. Đăng nhập với user khác (hoặc cùng user trên browser khác):
   - Email: `admin@bughunter.com` 
   - Password: `admin123`

## 🎮 Bước 3: Test Multi-User Room

### Test Case 1: User 1 tạo phòng, User 2 tham gia

**User 1:**
1. Click "Tạo phòng" button
2. Điền thông tin phòng:
   - Tên phòng: `Test Room Real-time`
   - Độ khó: `Trung bình`
   - Thời gian: `15 phút`
   - Số người chơi: `2`
3. Click "Tạo phòng"
4. Sẽ thấy Waiting Room với thông tin phòng

**User 2:**
1. Tại trang PvP chính, sẽ thấy phòng `Test Room Real-time` trong danh sách
2. Click "Tham gia" button trên phòng đó
3. Sẽ thấy thông báo thành công và tham gia vào Waiting Room

**Kiểm tra kết quả:**
- ✅ User 1 sẽ thấy User 2 tham gia (real-time update)
- ✅ User 2 sẽ thấy thông báo đã tham gia phòng
- ✅ Danh sách participants cập nhật real-time

### Test Case 2: Sử dụng Room Code

**User 1:**
1. Tạo phòng mới hoặc sử dụng phòng hiện tại
2. Copy room code (6 ký tự, ví dụ: ABC123)

**User 2:**
1. Tại trang PvP, nhập room code vào ô "Nhập mã phòng để tham gia"
2. Click "Tham gia phòng"
3. Sẽ tham gia vào phòng của User 1

### Test Case 3: Ready Status

**User 1 & 2:**
1. Trong Waiting Room, cả hai click button "Sẵn sàng"
2. Khi cả hai đều sẵn sàng, host (User 1) có thể bắt đầu trận đấu

## 🔍 Debug và Troubleshooting

### Kiểm tra Console Logs
Mở browser dev tools (F12) và tab Console để xem:

**Client logs:**
- `🔌 Socket.IO connected successfully!` - WebSocket kết nối thành công
- `📢 Room updated event received:` - Nhận được event cập nhật phòng
- `📢 User joined room event received:` - Nhận được event người tham gia

**Server logs:**
- `📢 Broadcasting room update for room:` - Server gửi event cập nhật
- `SimplePvPApi: Sending request with token:` - Client gửi API với token

### Common Issues

**1. Không thấy real-time update:**
- Kiểm tra WebSocket connection trong console
- F5 refresh lại trang để reconnect
- Đảm bảo cả hai user đều đã login

**2. Authentication error:**
- Đảm bảo đã login với token hợp lệ
- Kiểm tra localStorage có `token` không

**3. Room không hiển thị:**
- Refresh lại danh sách phòng
- Kiểm tra status phòng (`waiting` chứ không phải `in-progress`)

## 📊 Expected Behavior

1. **Real-time Updates:** Khi một người tham gia/rời phòng, tất cả người khác trong phòng sẽ thấy ngay lập tức
2. **Live Notifications:** Toast notifications khi có người tham gia/rời phòng
3. **Auto-refresh:** Danh sách phòng tự động cập nhật khi có thay đổi
4. **Participant List:** Hiển thị chính xác số người trong phòng và trạng thái sẵn sàng

## 🧪 Test Checklist

- [ ] User 1 tạo phòng thành công
- [ ] User 2 thấy phòng trong danh sách
- [ ] User 2 tham gia phòng thành công  
- [ ] User 1 thấy User 2 tham gia real-time
- [ ] Room code hoạt động chính xác
- [ ] Ready status cập nhật real-time
- [ ] WebSocket logs hiển thị trên cả client và server
- [ ] Toast notifications hoạt động

## 📝 Note

Hiện tại implementation sử dụng `window.location.reload()` để đơn giản hóa. Trong production version, có thể optimize để update state trực tiếp thay vì reload toàn bộ trang.
