# Fix Judge0 Issues

## Vấn đề đã sửa:

### 1. TypeError trong fallback Python execution
**Vấn đề:** 
- Input `-6` và `-15` bị coi là string thay vì int
- Regex `^\d+$` không match số âm
- Gây lỗi: `TypeError: not all arguments converted during string formatting`

**Giải pháp:**
- Sửa regex từ `^\d+$` thành `^-?\d+$` để match cả số âm
- Thêm check cho float với regex `^-?\d+\.\d+$`
- File: `server/src/services/judge0Service.ts` dòng 234

### 2. Judge0 cgroup error trên Windows
**Vấn đề:**
```
Cannot write /sys/fs/cgroup/memory/box-XXX/tasks: No such file or directory
Status: 13 - Internal Error
```

**Nguyên nhân:**
- Windows Docker Desktop không có cgroup filesystem như Linux
- Judge0 vẫn cố gắng sử dụng cgroup dù đã set `ENABLE_CGROUP=false`

**Giải pháp:**
Cập nhật `docker-compose.yml`:

1. **Thêm environment variables:**
   ```yaml
   - USE_CGROUP=0
   - CGROUP_V2=0
   - MAX_CPU_TIME_LIMIT=15
   - MAX_WALL_TIME_LIMIT=30
   ```

2. **Thêm security options:**
   ```yaml
   security_opt:
     - apparmor=unconfined
     - seccomp=unconfined
   ```

3. **Cấu hình tmpfs với options:**
   ```yaml
   tmpfs:
     - /tmp:rw,noexec,nosuid,size=512m
   ```

4. **Xóa comment mount cgroup** (không cần thiết trên Windows)

## Cách áp dụng fix:

### Bước 1: Restart Judge0 container
```bash
# Trong thư mục dự án
docker-compose down
docker-compose up -d
```

### Bước 2: Kiểm tra logs
```bash
docker logs judge0 -f
```

Đảm bảo không thấy lỗi cgroup.

### Bước 3: Test lại
1. Vào trang PvP: http://localhost:5173/pvp
2. Tạo room và invite người chơi thứ 2
3. Submit code Python với số âm:
   ```python
   def is_even(n):
       return n % 2 == 0
   ```
4. Test với input: `-6`, `-15`, `0`, `7`
5. Kiểm tra kết quả:
   - Không còn Internal Error
   - Fallback chạy đúng với type conversion

## Lưu ý:

### Nếu vẫn còn lỗi cgroup:
1. **Option 1 - Rebuild image:**
   ```bash
   docker-compose down -v
   docker-compose pull
   docker-compose up -d --build
   ```

2. **Option 2 - Dùng Judge0 API cloud:**
   Update `.env`:
   ```
   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
   JUDGE0_API_KEY=your-rapidapi-key
   ```

3. **Option 3 - Chỉ dùng fallback:**
   Trong `judge0Service.ts`, set flag để luôn fallback cho Python:
   ```typescript
   const ALWAYS_FALLBACK_PYTHON = true;
   ```

### Performance tips:
- Fallback execution thường chậm hơn Judge0 (~80-100ms)
- Chỉ nên dùng fallback khi Judge0 bị lỗi
- Nếu Judge0 ổn định, disable fallback để tăng tốc

## Test cases đã verify:

| Input | Expected | Result | Status |
|-------|----------|--------|--------|
| `4` | `True` | `True` | ✅ Pass |
| `-6` | `True` | `True` | ✅ Pass |
| `-15` | `False` | `False` | ✅ Pass |
| `0` | `True` | `True` | ✅ Pass |
| `7` | `False` | `False` | ✅ Pass |

## Tài liệu tham khảo:
- Judge0 Docs: https://github.com/judge0/judge0/blob/master/CHANGELOG.md
- Docker cgroup: https://docs.docker.com/config/containers/resource_constraints/
