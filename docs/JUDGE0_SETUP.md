# Hướng dẫn Cài đặt Judge0 cho BugHunter

## Tổng quan
Judge0 là hệ thống execute code an toàn được sử dụng để chạy và đánh giá code submissions. BugHunter sử dụng Judge0 self-hosted với Docker để miễn phí và kiểm soát hoàn toàn.

## Yêu cầu
- Docker Desktop đã được cài đặt
- Docker Compose
- Tối thiểu 2GB RAM cho Judge0

## Bước 1: Kiểm tra Docker

### Windows
1. Mở Docker Desktop (icon phải màu xanh)
2. Mở PowerShell và kiểm tra:
```powershell
docker --version
docker-compose --version
```

### macOS/Linux
```bash
docker --version
docker-compose --version
```

## Bước 2: Cấu hình Docker Compose

File `docker-compose.yml` đã có trong thư mục gốc với nội dung:

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
      - MEMORY_LIMIT=0
      - ENABLE_CGROUP=false
    privileged: true
    security_opt:
      - seccomp:unconfined
    tmpfs:
      - /tmp
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

## Bước 3: Khởi động Judge0

1. Mở terminal trong thư mục gốc của project
2. Chạy lệnh:
```bash
docker-compose up -d
```

3. Đợi Docker pull images và khởi động containers (2-5 phút cho lần đầu)

4. Kiểm tra containers đang chạy:
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

## Bước 4: Cấu hình Environment Variables

Thêm vào file `.env` trong thư mục `server/`:

```env
# Judge0 Self-hosted (Docker)
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=
```

**Lưu ý**: Self-hosted không cần API key, để trống.

## Bước 5: Test Judge0

### Test Health Check
```bash
curl http://localhost:2358/health
```

Kết quả mong đợi: `{"status":"OK"}`

### Test Languages
```bash
curl http://localhost:2358/languages
```

### Test Submission (Python)
```bash
curl -X POST http://localhost:2358/submissions?base64_encoded=false \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello, World!\")",
    "language_id": 71,
    "stdin": ""
  }'
```

## Bước 6: Tích hợp với BugHunter

1. Khởi động backend server:
```bash
cd server
npm run dev
```

2. Kiểm tra logs để xác nhận Judge0 đã được tích hợp:
```
Judge0 API available, running test cases...
```

3. Test submission từ frontend:
   - Mở http://localhost:3000
   - Chọn một challenge
   - Viết code và submit
   - Kiểm tra kết quả

## Troubleshooting

### Lỗi "No such file or directory @ rb_sysopen - /box/script.py"

**Nguyên nhân**: Judge0 không thể tạo file script trong container

**Giải pháp**:
1. Restart Judge0 container:
```bash
docker restart judge0
```

2. Nếu vẫn lỗi, rebuild containers:
```bash
docker-compose down
docker-compose up -d
```

### Lỗi "Connection refused"

**Nguyên nhân**: Judge0 không chạy hoặc port sai

**Giải pháp**:
1. Kiểm tra containers:
```bash
docker-compose ps
```

2. Kiểm tra port:
```bash
netstat -ano | findstr :2358
```

3. Restart Docker Desktop

### Lỗi Port 2358 đã được sử dụng

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

### Performance chậm

**Tối ưu**:
1. Tăng `MAX_QUEUE_SIZE` trong docker-compose.yml
2. Đảm bảo có đủ RAM (tối thiểu 2GB)
3. Kiểm tra Docker Desktop settings

## Các lệnh Docker thường dùng

```bash
# Xem containers đang chạy
docker-compose ps

# Xem logs
docker-compose logs -f judge0

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

## Next Steps

Sau khi Judge0 hoạt động:
1. Test với nhiều bài submission khác nhau
2. Setup Gemini Pro (nếu có API key)
3. Monitor performance của Judge0
4. Deploy lên production (nếu cần)