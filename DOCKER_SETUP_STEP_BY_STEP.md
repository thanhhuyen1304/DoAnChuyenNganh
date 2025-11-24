# 🐳 Hướng dẫn Setup Docker Judge0 cho Windows - Step by Step Chi Tiết

## 📋 Mục lục
1. [Kiểm tra hệ thống](#1-kiểm-tra-hệ-thống)
2. [Cài đặt Docker Desktop](#2-cài-đặt-docker-desktop)
3. [Verify Docker](#3-verify-docker)
4. [Setup Judge0](#4-setup-judge0)
5. [Test Judge0](#5-test-judge0)
6. [Tích hợp vào Project](#6-tích-hợp-vào-project)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Kiểm tra hệ thống

### Bước 1.1: Kiểm tra Windows version

1. **Nhấn `Windows + R`** để mở Run dialog

2. **Gõ `winver`** và nhấn Enter

3. **Xem thông tin**:
   - Windows 10 version 2004 trở lên (khuyến nghị)
   - Hoặc Windows 11 (tất cả versions)

4. **Kiểm tra System Type**:
   - Mở **Settings** → **System** → **About**
   - Kiểm tra **System type**: 64-bit processor (required)

**Lưu ý**: Docker Desktop yêu cầu Windows 10 64-bit hoặc Windows 11.

---

## 2. Cài đặt Docker Desktop

### Bước 2.1: Kiểm tra Windows Features

Docker Desktop cần một số Windows features. Hãy kiểm tra:

1. **Mở PowerShell với quyền Administrator**:
   - Nhấn `Windows + X`
   - Chọn **"Windows PowerShell (Admin)"** hoặc **"Terminal (Admin)"**

2. **Kiểm tra WSL 2** (Windows Subsystem for Linux):
   ```powershell
   wsl --status
   ```

3. **Nếu chưa có WSL 2**, cài đặt:
   ```powershell
   wsl --install
   ```

4. **Restart máy** sau khi cài WSL 2

5. **Kiểm tra lại**:
   ```powershell
   wsl --version
   ```

**Kết quả mong đợi**: WSL version 2.x.x

### Bước 2.2: Download Docker Desktop

1. **Mở trình duyệt** (Chrome, Edge, Firefox...)

2. **Truy cập**:
   ```
   https://www.docker.com/products/docker-desktop/
   ```

3. **Click nút "Download for Windows"**

4. **File sẽ download** tên `Docker Desktop Installer.exe`
   - Size: ~500MB
   - Thời gian download: 2-5 phút (tùy internet)

5. **Lưu file** vào thư mục Downloads (hoặc nơi bạn muốn)

### Bước 2.3: Cài đặt Docker Desktop

1. **Tìm file** `Docker Desktop Installer.exe` trong thư mục Downloads

2. **Double-click** để mở file

3. **Nếu có thông báo User Account Control**:
   - Click **"Yes"** để cho phép cài đặt

4. **Trong cửa sổ cài đặt**:
   - ✅ **Tích chọn**: "Use WSL 2 instead of Hyper-V" (nếu có)
   - ✅ **Tích chọn**: "Add shortcut to desktop" (tùy chọn, khuyến nghị)

5. **Click "Ok"** để bắt đầu cài đặt

6. **Chờ đợi** (5-10 phút tùy máy):
   - Progress bar sẽ hiển thị
   - Có thể thấy "Configuring Windows features..."

7. **Khi cài xong**, bạn sẽ thấy:
   - "Installation succeeded!"
   - Checkbox: "Start Docker Desktop" (nên tích chọn)

8. **Click "Close and restart"**:
   - Hoặc click "Close" và restart máy thủ công

### Bước 2.4: Khởi động Docker Desktop

1. **Sau khi restart máy**, tìm **Docker Desktop**:
   - Mở **Start Menu** (nhấn Windows key)
   - Gõ "Docker Desktop"
   - Click để mở

2. **Lần đầu mở**, Docker sẽ:
   - Show welcome screen
   - Có thể hỏi "Use recommended settings" → Click **"Use recommended settings"**

3. **Chờ Docker khởi động**:
   - Icon Docker ở **system tray** (góc dưới bên phải) sẽ:
     - 🔴 **Đỏ**: Đang khởi động
     - 🟡 **Vàng**: Đang setup
     - 🟢 **Xanh**: Đã sẵn sàng

4. **Thời gian khởi động**: 1-3 phút (lần đầu có thể lâu hơn)

### Bước 2.5: Xử lý lỗi WSL 2 (nếu có)

**Nếu thấy thông báo "WSL 2 installation is incomplete"**:

1. **Click link** trong thông báo để download WSL 2 update

2. **Hoặc download thủ công**:
   - Truy cập: https://aka.ms/wsl2kernel
   - Download file `wsl_update_x64.msi`

3. **Chạy file** `wsl_update_x64.msi`

4. **Restart máy**

5. **Mở lại Docker Desktop**

### Bước 2.6: Verify Docker đã cài

1. **Mở PowerShell** hoặc **Command Prompt**:
   - Nhấn `Windows + X`
   - Chọn **"Windows PowerShell"** hoặc **"Terminal"**

2. **Kiểm tra Docker version**:
   ```powershell
   docker --version
   ```

   **Kết quả mong đợi**:
   ```
   Docker version 24.0.0, build abc123
   ```

3. **Kiểm tra Docker Compose**:
   ```powershell
   docker-compose --version
   ```

   **Kết quả mong đợi**:
   ```
   Docker Compose version v2.20.0
   ```

4. **Kiểm tra Docker đang chạy**:
   ```powershell
   docker info
   ```

   **Kết quả mong đợi**: Thông tin về Docker system

✅ **Nếu thấy version và info → Docker đã cài thành công!**

---

## 3. Verify Docker

### Bước 3.1: Test Docker với Hello World

1. **Mở PowerShell**

2. **Chạy lệnh**:
   ```powershell
   docker run hello-world
   ```

3. **Lần đầu chạy**, Docker sẽ download image `hello-world`:
   ```
   Unable to find image 'hello-world:latest' locally
   latest: Pulling from library/hello-world
   ...
   ```

4. **Kết quả mong đợi**:
   ```
   Hello from Docker!
   This message shows that your installation appears to be working correctly.
   ...
   ```

✅ **Nếu thấy message "Hello from Docker!" → Docker hoạt động tốt!**

### Bước 3.2: Kiểm tra Docker Desktop UI

1. **Mở Docker Desktop** (nếu chưa mở):
   - Tìm icon Docker ở system tray
   - Right-click → **"Open Docker Desktop"**

2. **Kiểm tra Dashboard**:
   - Bên trái: Menu với **Containers**, **Images**, **Volumes**...
   - Giữa: Dashboard với thống kê
   - Status: **"Engine running"** (màu xanh)

3. **Kiểm tra Settings**:
   - Click **Settings** (icon bánh răng)
   - **General** → Kiểm tra "Use the WSL 2 based engine" đã được tích

---

## 4. Setup Judge0

### Bước 4.1: Mở thư mục project

1. **Mở File Explorer**

2. **Điều hướng đến thư mục project**:
   ```
   C:\Users\thanh\Downloads\DoAnChuyenNganh
   ```

3. **Hoặc mở PowerShell** trong thư mục project:
   - Right-click vào thư mục project
   - Chọn **"Open in Terminal"** hoặc **"Open PowerShell window here"**

### Bước 4.2: Kiểm tra file docker-compose.yml

1. **Kiểm tra xem đã có file `docker-compose.yml` chưa**:
   ```powershell
   dir docker-compose.yml
   ```

2. **Nếu có file**, kiểm tra nội dung:
   ```powershell
   type docker-compose.yml
   ```

3. **Nếu chưa có hoặc file sai**, tạo file mới:

   **Cách 1: Dùng Notepad**:
   - Right-click trong thư mục → **New** → **Text Document**
   - Đổi tên thành `docker-compose.yml` (xóa phần `.txt`)
   - Mở file và paste nội dung sau:

   **Cách 2: Dùng PowerShell**:
   ```powershell
   # Tạo file mới
   New-Item -Path "docker-compose.yml" -ItemType File
   
   # Mở file để edit
   notepad docker-compose.yml
   ```

4. **Paste nội dung sau vào file**:

```yaml
version: '3.8'

services:
  # Redis - Judge0 cần Redis để queue
  redis:
    image: redis:7-alpine
    container_name: judge0-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - judge0-network
    restart: unless-stopped

  # Judge0 API
  judge0:
    image: judge0/judge0:1.13.0
    container_name: judge0
    ports:
      - "2358:2358"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - MAX_QUEUE_SIZE=200
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_USER=judge0
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=judge0
    depends_on:
      - redis
      - postgres
    networks:
      - judge0-network
    restart: unless-stopped

  # PostgreSQL - Judge0 cần database
  postgres:
    image: postgres:15-alpine
    container_name: judge0-postgres
    environment:
      - POSTGRES_USER=judge0
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=judge0
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - judge0-network
    restart: unless-stopped

volumes:
  redis-data:
  postgres-data:

networks:
  judge0-network:
    driver: bridge
```

5. **Lưu file** (Ctrl + S)

### Bước 4.3: Chạy Docker Compose

1. **Mở PowerShell** trong thư mục có file `docker-compose.yml`

2. **Đảm bảo Docker đang chạy**:
   - Kiểm tra icon Docker ở system tray (phải màu xanh)
   - Hoặc mở Docker Desktop

3. **Chạy lệnh**:
   ```powershell
   docker-compose up -d
   ```

   **Giải thích**:
   - `docker-compose up`: Start các containers
   - `-d`: Chạy ở background (detached mode)

4. **Lần đầu chạy**, Docker sẽ download images (mất 2-5 phút):
   ```
   Pulling redis ...
   Pulling judge0 ...
   Pulling postgres ...
   Creating judge0-redis ...
   Creating judge0-postgres ...
   Creating judge0 ...
   ```

5. **Chờ đợi** đến khi thấy:
   ```
   Creating network "doanchuyennghanh_judge0-network" ... done
   Creating volume "doanchuyennghanh_redis-data" ... done
   Creating volume "doanchuyennghanh_postgres-data" ... done
   Creating judge0-redis ... done
   Creating judge0-postgres ... done
   Creating judge0 ... done
   ```

✅ **Nếu thấy "done" sau mỗi service → Containers đã được tạo thành công!**

### Bước 4.4: Kiểm tra containers đang chạy

1. **Kiểm tra containers**:
   ```powershell
   docker-compose ps
   ```

2. **Kết quả mong đợi**:
   ```
   NAME                IMAGE                  STATUS              PORTS
   judge0              judge0/judge0:1.13.0  Up 30 seconds       0.0.0.0:2358->2358/tcp
   judge0-postgres     postgres:15-alpine    Up 30 seconds       5432/tcp
   judge0-redis        redis:7-alpine        Up 30 seconds       0.0.0.0:6379->6379/tcp
   ```

   ✅ **Nếu thấy 3 containers đều "Up" → Judge0 đã start thành công!**

3. **Hoặc kiểm tra trong Docker Desktop**:
   - Mở Docker Desktop
   - Click **"Containers"** ở sidebar
   - Sẽ thấy 3 containers: `judge0`, `judge0-postgres`, `judge0-redis`

### Bước 4.5: Xem logs (nếu cần debug)

1. **Xem logs của tất cả services**:
   ```powershell
   docker-compose logs
   ```

2. **Xem logs của Judge0**:
   ```powershell
   docker-compose logs judge0
   ```

3. **Xem logs real-time**:
   ```powershell
   docker-compose logs -f judge0
   ```

   **Nhấn `Ctrl+C` để thoát** khi xem logs real-time.

---

## 5. Test Judge0

### Bước 5.1: Test Health Check

1. **Mở PowerShell**

2. **Chạy lệnh**:
   ```powershell
   curl http://localhost:2358/health
   ```

   **Lưu ý**: PowerShell có thể hiển thị kết quả dạng table. Nếu muốn xem JSON, dùng:
   ```powershell
   curl http://localhost:2358/health | ConvertFrom-Json
   ```

3. **Kết quả mong đợi**:
   ```json
   {"status":"OK"}
   ```

   ✅ **Nếu thấy `{"status":"OK"}` → Judge0 hoạt động tốt!**

### Bước 5.2: Test Languages Endpoint

1. **Chạy lệnh**:
   ```powershell
   curl http://localhost:2358/languages
   ```

2. **Kết quả mong đợi**: JSON array với danh sách languages
   ```json
   [
     {"id": 71, "name": "Python (3.8.1)"},
     {"id": 63, "name": "JavaScript (Node.js 12.14.0)"},
     ...
   ]
   ```

### Bước 5.3: Test Submission (Python Example)

1. **Chạy lệnh PowerShell**:
   ```powershell
   $body = @{
       source_code = "print('Hello, World!')"
       language_id = 71
       stdin = ""
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:2358/submissions?base64_encoded=false&wait=true" -Method POST -Body $body -ContentType "application/json"
   ```

2. **Kết quả mong đợi**:
   ```json
   {
     "stdout": "Hello, World!\n",
     "status": {"id": 3, "description": "Accepted"},
     "time": "0.001",
     "memory": 1024
   }
   ```

   ✅ **Nếu thấy `"status": {"id": 3}` → Judge0 chạy code thành công!**

---

## 6. Tích hợp vào Project

### Bước 6.1: Cập nhật .env file

1. **Mở thư mục `server`** trong project

2. **Tìm file `.env`**:
   - Nếu chưa có, tạo file mới tên `.env`

3. **Mở file `.env`** bằng Notepad hoặc editor

4. **Thêm hoặc cập nhật** các dòng sau:

```env
# Judge0 Self-hosted (Docker)
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=
```

**Lưu ý**:
- `JUDGE0_API_URL`: URL của Judge0 (localhost vì chạy local)
- `JUDGE0_API_KEY`: Để trống (self-hosted không cần API key)

5. **Lưu file** (Ctrl + S)

### Bước 6.2: Test từ Project

1. **Mở PowerShell** trong thư mục `server`

2. **Start backend server**:
   ```powershell
   npm run dev
   ```

3. **Mở browser** và truy cập frontend:
   ```
   http://localhost:3000
   ```
   (hoặc port mà frontend đang chạy)

4. **Submit một bài** qua UI:
   - Chọn một challenge
   - Viết code
   - Click "Submit"

5. **Kiểm tra logs** trong terminal:
   - Nếu thấy log về Judge0 → ✅ Đã tích hợp thành công!
   - Ví dụ: "Judge0 API available", "Running test cases with Judge0..."

### Bước 6.3: Verify trong Code

Kiểm tra trong `server/src/controllers/submission.controller.ts`:

```typescript
// Nên thấy code này:
import judge0Service from '../services/judge0Service';

// Và trong submitSolution:
const isJudge0Available = await judge0Service.checkHealth();
if (isJudge0Available && ENV.JUDGE0_API_KEY) {
  // Chạy với Judge0
}
```

---

## 7. Troubleshooting

### Vấn đề 1: "docker-compose: command not found"

**Lỗi**:
```
docker-compose: The term 'docker-compose' is not recognized
```

**Giải pháp**:

1. **Kiểm tra Docker Desktop đang chạy** (icon xanh ở system tray)

2. **Dùng lệnh mới** (Docker Compose V2):
   ```powershell
   docker compose up -d  # (không có dấu gạch ngang)
   ```

3. **Hoặc restart Docker Desktop**:
   - Right-click icon Docker → **"Restart Docker Desktop"**

### Vấn đề 2: Port 2358 đã được sử dụng

**Lỗi**:
```
Error: bind: address already in use
```

**Kiểm tra**:
```powershell
netstat -ano | findstr :2358
```

**Giải pháp**: Đổi port trong `docker-compose.yml`:

```yaml
judge0:
  ports:
    - "2359:2358"  # Thay 2358 thành 2359
```

Và cập nhật `.env`:
```env
JUDGE0_API_URL=http://localhost:2359
```

### Vấn đề 3: Containers không start

**Kiểm tra logs**:
```powershell
docker-compose logs
```

**Nguyên nhân thường gặp**:
- Port conflict
- Memory không đủ
- Docker chưa start

**Giải pháp**:
```powershell
# Stop tất cả containers
docker-compose down

# Xóa volumes cũ (nếu cần)
docker-compose down -v

# Start lại
docker-compose up -d
```

### Vấn đề 4: "Connection refused" khi test

**Lỗi**: `curl` không kết nối được đến `localhost:2358`

**Kiểm tra**:
```powershell
# Xem containers có đang chạy không
docker-compose ps

# Nếu không, start lại
docker-compose up -d

# Xem logs
docker-compose logs judge0
```

**Giải pháp**:
- Đảm bảo Docker Desktop đang chạy (icon xanh)
- Đảm bảo containers đã start (`docker-compose ps`)
- Đợi 30 giây sau khi start để Judge0 khởi động hoàn toàn

### Vấn đề 5: WSL 2 không hoạt động

**Lỗi**: Docker Desktop báo lỗi về WSL 2

**Giải pháp**:

1. **Kiểm tra WSL 2**:
   ```powershell
   wsl --status
   ```

2. **Cài WSL 2**:
   ```powershell
   wsl --install
   ```

3. **Download WSL 2 kernel update**:
   - https://aka.ms/wsl2kernel
   - Chạy installer

4. **Restart máy**

5. **Set WSL 2 làm default**:
   ```powershell
   wsl --set-default-version 2
   ```

### Vấn đề 6: Slow performance

**Tối ưu**:

1. **Tăng MAX_QUEUE_SIZE** trong `docker-compose.yml`:
   ```yaml
   environment:
     - MAX_QUEUE_SIZE=500  # Tăng từ 200
   ```

2. **Kiểm tra resources trong Docker Desktop**:
   - Settings → Resources
   - Tăng CPU và Memory nếu có thể

3. **Restart containers**:
   ```powershell
   docker-compose restart
   ```

### Vấn đề 7: Docker Desktop không start

**Giải pháp**:

1. **Restart Docker Desktop**:
   - Right-click icon → **"Restart Docker Desktop"**

2. **Nếu vẫn không được**, restart máy

3. **Kiểm tra Windows Features**:
   - Windows Features → Đảm bảo WSL đã được enable

---

## 8. Các lệnh thường dùng

### Quản lý Containers:

```powershell
# Xem containers đang chạy
docker-compose ps
# hoặc
docker compose ps

# Start containers
docker-compose start

# Stop containers
docker-compose stop

# Restart containers
docker-compose restart

# Stop và xóa containers
docker-compose down

# Stop, xóa containers và volumes (xóa data)
docker-compose down -v

# Xem logs
docker-compose logs -f judge0

# Rebuild containers
docker-compose up -d --build
```

### Update Judge0:

```powershell
# Pull image mới nhất
docker-compose pull judge0

# Restart với image mới
docker-compose up -d judge0
```

### Xem trong Docker Desktop:

1. **Mở Docker Desktop**
2. **Click "Containers"** để xem tất cả containers
3. **Click vào container** để xem logs, stats
4. **Click "Images"** để xem images đã download

---

## 9. Checklist hoàn thành

- [ ] Windows 10/11 64-bit
- [ ] WSL 2 đã cài đặt
- [ ] Docker Desktop đã cài đặt
- [ ] `docker --version` hiển thị version
- [ ] `docker-compose --version` hiển thị version
- [ ] `docker run hello-world` chạy thành công
- [ ] File `docker-compose.yml` đã tạo
- [ ] `docker-compose up -d` chạy thành công
- [ ] `docker-compose ps` hiển thị 3 containers "Up"
- [ ] `curl http://localhost:2358/health` trả về `{"status":"OK"}`
- [ ] File `.env` đã cập nhật với `JUDGE0_API_URL`
- [ ] Test submission từ project thành công

---

## 10. Next Steps

Sau khi setup xong:

1. ✅ **Test với một bài submission** thực tế
2. ✅ **Setup Gemini Pro** (nếu chưa có)
3. ✅ **Deploy lên production** (nếu cần)
4. ✅ **Setup monitoring** (optional)

---

## 🎉 Hoàn thành!

Bây giờ bạn đã có Judge0 self-hosted chạy trên Docker - **hoàn toàn miễn phí**!

**Nếu gặp vấn đề**, xem lại phần [Troubleshooting](#7-troubleshooting) hoặc check logs:
```powershell
docker-compose logs
```

**Hoặc kiểm tra trong Docker Desktop**:
- Mở Docker Desktop → Containers → Click vào container → Xem logs

Chúc bạn thành công! 🚀
