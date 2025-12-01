# 🐳 Hướng dẫn Setup Docker & Judge0

## 📋 Tổng quan

Judge0 là hệ thống execute code an toàn trong môi trường sandbox. BugHunter sử dụng Judge0 self-hosted với Docker để miễn phí và kiểm soát hoàn toàn.

## ✅ Bước 1: Cài đặt Docker

### Windows

1. **Download Docker Desktop**
   - Truy cập: https://www.docker.com/products/docker-desktop/
   - Click "Download for Windows"
   - Chạy file installer

2. **Cài đặt**
   - Chạy file `.exe` đã download
   - ✅ Tích chọn: "Use WSL 2 instead of Hyper-V"
   - ✅ Tích chọn: "Add shortcut to desktop"
   - Follow hướng dẫn (có thể cần restart)

3. **Xử lý WSL 2 (nếu cần)**
   
   Nếu thấy "WSL 2 installation is incomplete":
   ```powershell
   # Cài WSL 2
   wsl --install
   
   # Hoặc download kernel update
   # https://aka.ms/wsl2kernel
   
   # Set WSL 2 làm default
   wsl --set-default-version 2
   
   # Restart máy
   ```

4. **Kiểm tra**
   ```powershell
   docker --version
   docker-compose --version
   ```

### macOS

1. **Download Docker Desktop**
   - Truy cập: https://www.docker.com/products/docker-desktop/
   - Chọn "Download for Mac" (Intel hoặc Apple Silicon)

2. **Cài đặt**
   - Mở file `.dmg`
   - Kéo Docker icon vào Applications
   - Chạy Docker Desktop từ Applications

3. **Kiểm tra**
   ```bash
   docker --version
   docker-compose --version
   ```

### Linux (Ubuntu/Debian)

```bash
# Update packages
sudo apt update

# Cài đặt dependencies
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Setup repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài đặt Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user vào docker group (không cần sudo)
sudo usermod -aG docker $USER
# Logout và login lại để áp dụng
```

## 🚀 Bước 2: Setup Judge0

### Kiểm tra file docker-compose.yml

File `docker-compose.yml` trong thư mục gốc của project:

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

### Khởi động Judge0

1. **Mở terminal trong thư mục gốc của project**

2. **Chạy Docker Compose**
   ```bash
   docker-compose up -d
   ```
   
   Lần đầu sẽ download images (2-5 phút)

3. **Kiểm tra containers**
   ```bash
   docker-compose ps
   ```
   
   Kết quả mong đợi:
   ```
   NAME                IMAGE                  STATUS              PORTS
   judge0              judge0/judge0:1.13.0  Up 30 seconds       0.0.0.0:2358->2358/tcp
   judge0-postgres     postgres:15-alpine    Up 30 seconds       5432/tcp
   judge0-redis        redis:7-alpine        Up 30 seconds       0.0.0.0:6379->6379/tcp
   ```

4. **Xem logs (nếu cần)**
   ```bash
   # Xem logs tất cả services
   docker-compose logs
   
   # Xem logs Judge0
   docker-compose logs judge0
   
   # Xem logs real-time
   docker-compose logs -f judge0
   ```

## 🧪 Bước 3: Test Judge0

### Test Health Check

```bash
curl http://localhost:2358/health
```

Kết quả mong đợi: `{"status":"OK"}`

### Test Languages

```bash
curl http://localhost:2358/languages
```

Sẽ trả về danh sách ngôn ngữ được hỗ trợ.

### Test Submission (Python)

**PowerShell (Windows):**
```powershell
$body = @{
    source_code = "print('Hello, World!')"
    language_id = 71
    stdin = ""
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:2358/submissions?base64_encoded=false&wait=true" -Method POST -Body $body -ContentType "application/json"
```

**Bash (Linux/macOS):**
```bash
curl -X POST http://localhost:2358/submissions?base64_encoded=false \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello, World!\")",
    "language_id": 71,
    "stdin": ""
  }'
```

Kết quả mong đợi:
```json
{
  "stdout": "Hello, World!\n",
  "status": {"id": 3, "description": "Accepted"},
  "time": "0.001",
  "memory": 1024
}
```

## ⚙️ Bước 4: Cấu hình Project

Cập nhật file `.env` trong thư mục `server/`:

```env
# Judge0 Self-hosted (Docker)
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=
```

**Lưu ý**: Self-hosted không cần API key, để trống.

## 🔧 Quản lý Docker Containers

### Các lệnh thường dùng

```bash
# Xem containers đang chạy
docker-compose ps

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

# Update Judge0 image
docker-compose pull judge0
docker-compose up -d judge0

# Xem resource usage
docker stats
```

### Trong Docker Desktop UI

1. Mở Docker Desktop
2. Click **"Containers"** ở sidebar
3. Sẽ thấy 3 containers: `judge0`, `judge0-postgres`, `judge0-redis`
4. Click vào container để xem logs, stats

## 🐛 Troubleshooting

### Lỗi 1: "docker-compose: command not found"

**Windows:**
```powershell
# Kiểm tra Docker Desktop đang chạy
# Dùng lệnh mới (Docker Compose V2)
docker compose up -d  # Không có dấu gạch ngang
```

**Linux:**
```bash
# Cài Docker Compose plugin
sudo apt install docker-compose-plugin
```

### Lỗi 2: Port 2358 đã được sử dụng

**Kiểm tra port:**
```bash
# Windows
netstat -ano | findstr :2358

# Linux/macOS
lsof -i :2358
```

**Giải pháp**: Đổi port trong `docker-compose.yml`
```yaml
judge0:
  ports:
    - "2359:2358"  # Thay 2358 thành 2359
```

Và cập nhật `.env`:
```env
JUDGE0_API_URL=http://localhost:2359
```

### Lỗi 3: Containers không start

**Kiểm tra logs:**
```bash
docker-compose logs
```

**Nguyên nhân thường gặp:**
- Port conflict
- Memory không đủ (cần tối thiểu 2GB)
- Docker chưa start

**Giải pháp:**
```bash
# Stop tất cả
docker-compose down

# Xóa volumes cũ
docker-compose down -v

# Start lại
docker-compose up -d
```

### Lỗi 4: "Connection refused"

**Kiểm tra:**
```bash
# Xem containers
docker-compose ps

# Test API
curl http://localhost:2358/health
```

**Giải pháp:**
- Đảm bảo Docker Desktop đang chạy (icon xanh)
- Đảm bảo containers đã start
- Đợi 30 giây sau khi start để Judge0 khởi động

### Lỗi 5: "No such file or directory @ rb_sysopen - /box/script.py"

**Nguyên nhân**: Judge0 container có vấn đề với file system

**Giải pháp:**
```bash
# Restart Judge0
docker restart judge0

# Nếu vẫn lỗi, rebuild
docker-compose down
docker-compose up -d
```

### Lỗi 6: Performance chậm

**Tối ưu:**

1. Tăng `MAX_QUEUE_SIZE` trong `docker-compose.yml`:
   ```yaml
   environment:
     - MAX_QUEUE_SIZE=500  # Tăng từ 200
   ```

2. Kiểm tra Docker Desktop settings:
   - Settings → Resources
   - Tăng CPU và Memory nếu có thể

3. Restart containers:
   ```bash
   docker-compose restart
   ```

## 📊 Monitoring

### Xem resource usage

```bash
# CPU, Memory usage
docker stats

# Logs real-time
docker-compose logs -f
```

### Health check script

Tạo file `check-judge0.sh`:
```bash
#!/bin/bash
if curl -s http://localhost:2358/health > /dev/null; then
    echo "✅ Judge0 is running"
else
    echo "❌ Judge0 is not responding"
    docker-compose restart judge0
fi
```

Chạy:
```bash
chmod +x check-judge0.sh
./check-judge0.sh
```

## 🚀 Production Setup

### Trên VPS/Cloud Server

1. **SSH vào server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Cài Docker** (theo hướng dẫn trên)

3. **Clone/copy docker-compose.yml** lên server

4. **Chạy Judge0**
   ```bash
   docker-compose up -d
   ```

5. **Cập nhật .env** trong project
   ```env
   JUDGE0_API_URL=http://your-server-ip:2358
   ```

6. **Mở firewall** (nếu cần)
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 2358/tcp
   
   # CentOS/RHEL
   sudo firewall-cmd --add-port=2358/tcp --permanent
   sudo firewall-cmd --reload
   ```

## ✅ Checklist

- [ ] Docker đã cài đặt và chạy (`docker --version`)
- [ ] File `docker-compose.yml` đã có
- [ ] Containers đã start (`docker-compose ps`)
- [ ] Health check pass (`curl http://localhost:2358/health`)
- [ ] `.env` đã cập nhật với `JUDGE0_API_URL`
- [ ] Test submission từ project thành công

## 📚 Tài liệu tham khảo

- **Judge0 GitHub**: https://github.com/judge0/judge0
- **Docker Docs**: https://docs.docker.com/
- **Docker Compose Docs**: https://docs.docker.com/compose/

---

**Hoàn thành!** Judge0 đã sẵn sàng sử dụng. Quay lại [INSTALLATION.md](INSTALLATION.md) để tiếp tục setup project.