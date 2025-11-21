# 🔧 Hướng dẫn Sửa Triệt Để Lỗi Judge0 "No such file or directory @ rb_sysopen - /box/script.py"

## 🔍 Vấn đề

Lỗi này xảy ra khi Judge0 không thể tạo file script trong container `/box/script.py`. Đây là lỗi hệ thống của Judge0, thường do:
- Container không có quyền ghi file
- Thiếu cấu hình volumes hoặc tmpfs
- Judge0 worker không chạy đúng

## ✅ Giải pháp Triệt Để

### Bước 1: Cập nhật docker-compose.yml

File `docker-compose.yml` đã được cập nhật với:
- `privileged: true` - Cho phép container có quyền cao hơn để tạo file
- `tmpfs` cho `/tmp` và `/box` - Đảm bảo có thể ghi file tạm
- Thêm các environment variables cần thiết

### Bước 2: Rebuild và Restart Judge0

1. **Dừng containers hiện tại**:
   ```powershell
   docker-compose down
   ```

2. **Xóa container cũ** (nếu cần):
   ```powershell
   docker rm -f judge0
   ```

3. **Pull image mới nhất** (nếu cần):
   ```powershell
   docker pull judge0/judge0:1.13.0
   ```

4. **Start lại containers**:
   ```powershell
   docker-compose up -d
   ```

5. **Đợi 10-15 giây** để Judge0 khởi động hoàn toàn

6. **Kiểm tra logs**:
   ```powershell
   docker logs judge0 --tail 50
   ```

### Bước 3: Kiểm tra Judge0 hoạt động

1. **Health check**:
   ```powershell
   curl http://localhost:2358/health
   ```
   Kết quả mong đợi: `{"status":"OK"}`

2. **Test submission đơn giản**:
   ```powershell
   $body = @{
       source_code = "print('Hello World')"
       language_id = 71
       stdin = ""
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:2358/submissions?base64_encoded=false&wait=true" -Method Post -Body $body -ContentType "application/json"
   ```

   **Nếu thành công**: Sẽ trả về JSON với `status.id = 3` (Accepted)

### Bước 4: Nếu vẫn lỗi - Thử các giải pháp khác

#### Giải pháp A: Cập nhật lên Judge0 version mới hơn

Thử cập nhật lên version mới nhất:

```yaml
judge0:
  image: judge0/judge0:latest  # Hoặc version cụ thể mới hơn
```

Sau đó:
```powershell
docker-compose pull
docker-compose up -d
```

#### Giải pháp B: Thêm volumes cho /box

Nếu tmpfs không hoạt động, thử mount volume:

```yaml
judge0:
  volumes:
    - judge0-box:/box
```

Và thêm vào volumes:
```yaml
volumes:
  redis-data:
  postgres-data:
  judge0-box:
```

#### Giải pháp C: Kiểm tra Docker Desktop Settings (Windows)

1. Mở **Docker Desktop**
2. Vào **Settings** → **Resources** → **Advanced**
3. Đảm bảo:
   - **Memory**: Tối thiểu 2GB (khuyến nghị 4GB)
   - **Disk image size**: Đủ lớn (tối thiểu 20GB)
4. Click **Apply & Restart**

#### Giải pháp D: Kiểm tra WSL 2 (Windows)

Nếu dùng WSL 2:

```powershell
wsl --status
wsl --update
```

Restart Docker Desktop sau khi update WSL.

### Bước 5: Kiểm tra Logs Chi Tiết

Nếu vẫn lỗi, xem logs chi tiết:

```powershell
# Xem logs real-time
docker logs judge0 -f

# Xem logs với timestamps
docker logs judge0 --timestamps --tail 100
```

Tìm các lỗi liên quan đến:
- File permissions
- Worker không start
- Redis/PostgreSQL connection issues

## 🚨 Nếu Tất Cả Đều Không Hoạt Động

Nếu sau khi thử tất cả các bước trên mà Judge0 vẫn lỗi, bạn có thể:

1. **Sử dụng Judge0 Cloud** (có phí):
   - Đăng ký tại: https://judge0.com
   - Lấy API key
   - Cập nhật `.env`:
     ```
     JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
     JUDGE0_API_KEY=your-api-key-here
     ```

2. **Sử dụng Mock Execution** (tạm thời):
   - Hệ thống sẽ tự động fallback nếu Judge0 không available
   - Code sẽ được đánh giá dựa trên so sánh với `correctCode`

## 📝 Checklist

Sau khi sửa, kiểm tra:

- [ ] `docker-compose.yml` đã được cập nhật với `privileged: true` và `tmpfs`
- [ ] Containers đã được rebuild (`docker-compose down && docker-compose up -d`)
- [ ] Judge0 health check OK (`curl http://localhost:2358/health`)
- [ ] Test submission trực tiếp thành công
- [ ] Logs không có lỗi nghiêm trọng
- [ ] Submit bài từ ứng dụng thành công

## 💡 Lưu Ý

1. **Privileged mode** cho phép container có quyền cao hơn, có thể có rủi ro bảo mật. Chỉ dùng trong development.

2. **tmpfs** sử dụng RAM để lưu file tạm, nhanh hơn nhưng sẽ mất khi container restart.

3. Nếu Judge0 vẫn lỗi sau khi thử tất cả, có thể do:
   - Docker Desktop version cũ
   - WSL 2 không tương thích
   - Hardware limitations
   - Windows permissions issues

## 🔗 Tài Liệu Tham Khảo

- [Judge0 GitHub](https://github.com/judge0/judge0)
- [Judge0 Documentation](https://judge0.com/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

