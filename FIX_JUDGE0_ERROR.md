# 🔧 Hướng dẫn Sửa Lỗi Judge0 "No such file or directory"

## 🔍 Vấn đề

Judge0 đang chạy (docker ps cho thấy container đang up) nhưng vẫn bị lỗi:
```
No such file or directory @ rb_sysopen - /box/script.py
```

## ✅ Các bước kiểm tra và sửa

### Bước 1: Kiểm tra Judge0 Health

Mở PowerShell và chạy:

```powershell
curl http://localhost:2358/health
```

**Kết quả mong đợi**: `{"status":"OK"}`

Nếu không được, kiểm tra:
- Judge0 có đang chạy: `docker ps | Select-String "judge0"`
- Port 2358 có bị chiếm: `netstat -ano | findstr :2358`

### Bước 2: Kiểm tra Environment Variables

Kiểm tra file `.env` trong thư mục `server/`:

```powershell
cd C:\Users\thanh\Downloads\New folder\DoAnChuyenNganh\server
Get-Content .env | Select-String "JUDGE0"
```

**Phải có**:
```
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=
```

**LƯU Ý**: 
- URL phải là `http://localhost:2358` (không phải `https://`)
- `JUDGE0_API_KEY` phải để **trống** (self-hosted không cần API key)

### Bước 3: Test Judge0 trực tiếp

Test bằng cách gửi một submission đơn giản:

```powershell
$body = @{
    source_code = "print('Hello World')"
    language_id = 71
    stdin = ""
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:2358/submissions?base64_encoded=false&wait=true" -Method Post -Body $body -ContentType "application/json"
```

**Nếu thành công**: Sẽ trả về JSON với `status.id = 3` (Accepted)

**Nếu lỗi**: Sẽ thấy error message chi tiết

### Bước 4: Kiểm tra Judge0 Logs

Xem logs của Judge0 container:

```powershell
docker logs judge0 --tail 50
```

Tìm các lỗi liên quan đến:
- File permissions
- Volume mounts
- Script creation

### Bước 5: Restart Judge0 (nếu cần)

Nếu Judge0 có vấn đề, restart:

```powershell
docker restart judge0
```

Sau đó đợi vài giây và test lại health:

```powershell
curl http://localhost:2358/health
```

## 🛠️ Giải pháp thay thế: Sử dụng Mock Execution

Nếu Judge0 vẫn không hoạt động, hệ thống sẽ tự động fallback về **mock execution**:
- Code sẽ được đánh giá là **đúng** (mock)
- Vẫn có thể test và submit bài
- Không cần Judge0

**Để bật mock mode tạm thời**, bạn có thể:
1. Tắt Judge0: `docker stop judge0`
2. Hoặc set `JUDGE0_API_URL` thành URL không tồn tại

## 📝 Checklist Debug

- [ ] Judge0 container đang chạy (`docker ps`)
- [ ] Judge0 health check OK (`curl http://localhost:2358/health`)
- [ ] `.env` file có `JUDGE0_API_URL=http://localhost:2358`
- [ ] `.env` file có `JUDGE0_API_KEY=` (trống)
- [ ] Server đã restart sau khi sửa `.env`
- [ ] Test submission trực tiếp đến Judge0 thành công
- [ ] Xem logs Judge0 không có lỗi nghiêm trọng

## 🚨 Lỗi thường gặp

### Lỗi 1: "Connection refused"
**Nguyên nhân**: Judge0 không chạy hoặc port sai
**Giải pháp**: 
- Kiểm tra `docker ps`
- Kiểm tra port: `netstat -ano | findstr :2358`

### Lỗi 2: "No such file or directory"
**Nguyên nhân**: Judge0 không thể tạo file script trong container
**Giải pháp**:
- Restart Judge0: `docker restart judge0`
- Kiểm tra logs: `docker logs judge0`
- Có thể cần rebuild container: `docker-compose down && docker-compose up -d`

### Lỗi 3: "401 Unauthorized"
**Nguyên nhân**: Đang gửi RapidAPI headers cho self-hosted
**Giải pháp**: 
- Đảm bảo `JUDGE0_API_KEY=` (trống)
- Đã sửa trong code để tự động detect self-hosted

## 📞 Test qua Debug Endpoint

Sau khi restart server, test qua:

```
http://localhost:5000/api/debug/test/judge0
```

Endpoint này sẽ:
- ✅ Kiểm tra Judge0 health
- ✅ Test submission đơn giản
- ✅ Hiển thị kết quả chi tiết

## 💡 Lưu ý

1. **Sau khi sửa `.env`**, phải **restart server** để áp dụng thay đổi
2. **Judge0 self-hosted** không cần API key
3. Nếu Judge0 vẫn lỗi, có thể dùng **mock execution** tạm thời

