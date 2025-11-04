# 🐳 Hướng dẫn Setup Docker cho Judge0

## 📋 Tổng quan

Hướng dẫn này sẽ giúp bạn setup Judge0 self-hosted với Docker - **hoàn toàn miễn phí**!

## ✅ Bước 1: Cài đặt Docker

### Windows:

1. **Download Docker Desktop**:
   - Truy cập: https://www.docker.com/products/docker-desktop/
   - Click "Download for Windows"
   - Chạy file installer

2. **Cài đặt**:
   - Chạy file `.exe` đã download
   - Follow hướng dẫn (có thể cần restart)
   - Khởi động Docker Desktop

3. **Kiểm tra**:
   ```bash
   docker --version
   docker-compose --version
   ```
   Nếu thấy version number → ✅ Đã cài thành công!

### Mac:

1. **Download Docker Desktop**:
   - Truy cập: https://www.docker.com/products/docker-desktop/
   - Chọn "Download for Mac" (Intel hoặc Apple Silicon)

2. **Cài đặt**:
   - Mở file `.dmg` đã download
   - Kéo Docker icon vào Applications
   - Chạy Docker Desktop từ Applications

3. **Kiểm tra**:
   ```bash
   docker --version
   docker-compose --version
   ```

### Linux (Ubuntu/Debian):

1. **Cài đặt Docker**:
   ```bash
   # Update packages
   sudo apt update
   
   # Cài đặt dependencies
   sudo apt install -y ca-certificates curl gnupg lsb-release
   
   # Add Docker's official GPG key
   sudo mkdir -p /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   
   # Set up repository
   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   
   # Cài đặt Docker
   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
   ```

2. **Start Docker**:
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **Kiểm tra**:
   ```bash
   docker --version
   ```

4. **Thêm user vào docker group** (để không cần sudo):
   ```bash
   sudo usermod -aG docker $USER
   # Logout và login lại để áp dụng
   ```

---

## 🚀 Bước 2: Setup Judge0 với Docker

### Option A: Docker Compose (Khuyến nghị - Dễ nhất)

1. **Tạo file `docker-compose.yml`** trong thư mục project:

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

2. **Chạy Judge0**:
   ```bash
   # Từ thư mục có file docker-compose.yml
   docker-compose up -d
   ```

3. **Kiểm tra**:
   ```bash
   # Xem logs
   docker-compose logs -f judge0
   
   # Kiểm tra containers đang chạy
   docker-compose ps
   
   # Test API
   curl http://localhost:2358/health
   ```

### Option B: Docker Commands (Nếu không dùng Docker Compose)

1. **Chạy Redis**:
   ```bash
   docker run -d \
     --name judge0-redis \
     -p 6379:6379 \
     redis:7-alpine
   ```

2. **Chạy PostgreSQL**:
   ```bash
   docker run -d \
     --name judge0-postgres \
     -e POSTGRES_USER=judge0 \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=judge0 \
     postgres:15-alpine
   ```

3. **Chạy Judge0**:
   ```bash
   docker run -d \
     --name judge0 \
     -p 2358:2358 \
     --link judge0-redis:redis \
     --link judge0-postgres:postgres \
     -e REDIS_HOST=redis \
     -e REDIS_PORT=6379 \
     -e POSTGRES_HOST=postgres \
     -e POSTGRES_PORT=5432 \
     -e POSTGRES_USER=judge0 \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=judge0 \
     -e MAX_QUEUE_SIZE=200 \
     judge0/judge0:1.13.0
   ```

4. **Kiểm tra**:
   ```bash
   # Xem containers
   docker ps
   
   # Test API
   curl http://localhost:2358/health
   ```

---

## ⚙️ Bước 3: Cập nhật Project

### 1. Cập nhật `.env` file:

```env
# Judge0 Self-hosted (Docker)
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=
```

**Lưu ý**: Self-hosted không cần API key, để trống.

### 2. Nếu Judge0 chạy trên server khác:

```env
# Thay localhost bằng IP server
JUDGE0_API_URL=http://192.168.1.100:2358
# hoặc
JUDGE0_API_URL=http://your-server.com:2358
```

---

## 🧪 Bước 4: Test Judge0

### Test từ Terminal:

```bash
# Test health check
curl http://localhost:2358/health

# Test languages
curl http://localhost:2358/languages

# Test submission (Python example)
curl -X POST http://localhost:2358/submissions?base64_encoded=false \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello, World!\")",
    "language_id": 71,
    "stdin": ""
  }'
```

### Test từ Project:

1. **Start server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Submit một bài** qua UI
3. **Kiểm tra logs** để xem Judge0 có chạy không

---

## 🔧 Bước 5: Quản lý Docker Containers

### Các lệnh thường dùng:

```bash
# Xem containers đang chạy
docker ps

# Xem tất cả containers (kể cả stopped)
docker ps -a

# Xem logs
docker-compose logs -f judge0
# hoặc
docker logs judge0

# Stop containers
docker-compose stop

# Start containers
docker-compose start

# Restart containers
docker-compose restart

# Stop và xóa containers
docker-compose down

# Stop, xóa containers và volumes (xóa data)
docker-compose down -v

# Update Judge0 image
docker-compose pull judge0
docker-compose up -d judge0
```

---

## 🐛 Troubleshooting

### Vấn đề 1: Port 2358 đã được sử dụng

**Giải pháp**: Đổi port trong `docker-compose.yml`

```yaml
judge0:
  ports:
    - "2359:2358"  # Thay 2358 thành 2359 (hoặc port khác)
```

Và cập nhật `.env`:
```env
JUDGE0_API_URL=http://localhost:2359
```

### Vấn đề 2: Judge0 không start được

**Kiểm tra**:
```bash
# Xem logs
docker-compose logs judge0

# Kiểm tra Redis và PostgreSQL đã chạy chưa
docker-compose ps
```

**Nguyên nhân thường gặp**:
- Redis hoặc PostgreSQL chưa start
- Port conflict
- Memory không đủ

### Vấn đề 3: Connection refused

**Kiểm tra**:
```bash
# Test từ terminal
curl http://localhost:2358/health

# Nếu không được, kiểm tra firewall
# Windows: Kiểm tra Windows Defender Firewall
# Linux: sudo ufw allow 2358
```

### Vấn đề 4: Slow performance

**Tối ưu**:
- Tăng `MAX_QUEUE_SIZE` trong docker-compose.yml
- Đảm bảo có đủ RAM (recommend 2GB+)
- Chạy trên SSD thay vì HDD

---

## 📊 Monitoring

### Xem resource usage:

```bash
# Xem CPU, Memory usage
docker stats

# Xem logs real-time
docker-compose logs -f
```

### Health check script:

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

---

## 🚀 Production Setup

### Trên VPS/Cloud Server:

1. **SSH vào server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Cài Docker** (theo hướng dẫn trên)

3. **Clone/copy docker-compose.yml** lên server

4. **Chạy Judge0**:
   ```bash
   docker-compose up -d
   ```

5. **Cập nhật .env** trong project:
   ```env
   JUDGE0_API_URL=http://your-server-ip:2358
   ```

6. **Firewall** (nếu cần):
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 2358/tcp
   
   # CentOS/RHEL
   sudo firewall-cmd --add-port=2358/tcp --permanent
   sudo firewall-cmd --reload
   ```

### Với Docker Swarm hoặc Kubernetes:

Có thể scale Judge0 lên nhiều instances. Xem thêm trong [Judge0 documentation](https://github.com/judge0/judge0).

---

## ✅ Checklist

- [ ] Docker đã cài đặt và chạy được
- [ ] File `docker-compose.yml` đã tạo
- [ ] Containers đã start (`docker-compose ps`)
- [ ] Health check pass (`curl http://localhost:2358/health`)
- [ ] `.env` đã cập nhật với `JUDGE0_API_URL`
- [ ] Test submission từ project thành công

---

## 📚 Tài liệu tham khảo

- **Judge0 GitHub**: https://github.com/judge0/judge0
- **Docker Docs**: https://docs.docker.com/
- **Docker Compose Docs**: https://docs.docker.com/compose/

---

## 🎉 Hoàn thành!

Bây giờ bạn đã có Judge0 self-hosted chạy trên Docker - **hoàn toàn miễn phí**!

**Next steps**:
1. ✅ Test với một bài submission
2. ✅ Setup Gemini Pro (nếu chưa có)
3. ✅ Deploy lên production (nếu cần)

Chúc bạn thành công! 🚀

