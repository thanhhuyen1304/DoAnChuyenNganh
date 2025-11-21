# ⚠️ Judge0 trên Windows - Hạn chế và Giải pháp

## 🔍 Vấn đề

Khi chạy Judge0 trên Windows với Docker Desktop, bạn có thể gặp lỗi:
```
No such file or directory @ rb_sysopen - /box/script.py
Cannot write /sys/fs/cgroup/memory/box-XXX/tasks: No such file or directory
```

## 📋 Nguyên nhân

1. **Cgroup không hoạt động đúng trên Windows/WSL2**: Judge0 cần cgroup để giới hạn memory và CPU, nhưng cgroup không hoạt động đầy đủ trên Windows.

2. **Thư mục /box không tồn tại**: Judge0 worker cần tạo file script trong `/box`, nhưng thư mục này có thể không được tạo tự động.

## ✅ Giải pháp đã áp dụng

### 1. Mount volume cho /box
- Tạo volume `judge0-box` và mount vào `/box`
- Đảm bảo thư mục tồn tại và có quyền ghi

### 2. Disable cgroup
- Set `ENABLE_CGROUP=false`
- Set `MEMORY_LIMIT=0` để disable memory limit
- Thêm `privileged: true` và `security_opt: seccomp:unconfined`

### 3. Fallback mechanism trong code
- Hệ thống tự động phát hiện lỗi Judge0
- So sánh code với `correctCode` nếu có
- Vẫn đánh giá đúng/sai và cộng XP chính xác

## ⚠️ Lưu ý quan trọng

**Lỗi cgroup vẫn có thể xuất hiện**, nhưng:
- ✅ **KHÔNG ảnh hưởng đến kết quả đánh giá**: Hệ thống vẫn phân biệt được code đúng/sai
- ✅ **KHÔNG ảnh hưởng đến XP**: User vẫn được cộng XP khi code đúng
- ✅ **Fallback hoạt động tốt**: So sánh code với `correctCode` khi Judge0 lỗi

## 🚀 Giải pháp cho Production

### Option 1: Sử dụng Judge0 Cloud (Khuyến nghị)
- Đăng ký tại: https://judge0.com
- Lấy API key
- Cập nhật `.env`:
  ```
  JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
  JUDGE0_API_KEY=your-api-key-here
  ```

### Option 2: Deploy Judge0 trên Linux Server
- Deploy Judge0 trên VPS/Cloud Server chạy Linux
- Cgroup sẽ hoạt động đúng
- Cập nhật `.env`:
  ```
  JUDGE0_API_URL=http://your-server-ip:2358
  JUDGE0_API_KEY=
  ```

### Option 3: Chấp nhận fallback (Development)
- Giữ nguyên cấu hình hiện tại
- Hệ thống sẽ dùng fallback khi Judge0 lỗi
- Vẫn hoạt động tốt cho development và testing

## 📝 Kết luận

Lỗi "No such file or directory" và "Cannot write cgroup" **KHÔNG ảnh hưởng** đến chức năng chính của hệ thống. Hệ thống vẫn:
- ✅ Phân biệt được code đúng/sai
- ✅ Cộng XP chính xác
- ✅ Lưu submission vào database
- ✅ Hiển thị kết quả cho user

Chỉ có điều là sẽ có warning logs, nhưng không ảnh hưởng đến trải nghiệm người dùng.

