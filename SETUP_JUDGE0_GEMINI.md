# 🚀 Setup Guide: Judge0 + Gemini Pro Integration

## Tổng quan

Hệ thống đã được tích hợp với:
- ✅ **Judge0 API**: Chạy code thực trong sandbox
- ✅ **Gemini Pro**: AI phân tích và gợi ý sửa code

## Bước 1: Setup Judge0 API

### Option A: Judge0 RapidAPI (Khuyến nghị cho development)

1. **Đăng ký tài khoản**:
   - Truy cập: https://rapidapi.com/judge0-official/api/judge0-ce
   - Đăng ký tài khoản (miễn phí)

2. **Lấy API Key**:
   - Vào dashboard → Subscriptions
   - Copy API Key (X-RapidAPI-Key)

3. **Thêm vào .env**:
   ```env
   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
   JUDGE0_API_KEY=your-rapidapi-key-here
   ```

### Option B: Self-hosted Judge0 (Khuyến nghị cho production)

**📖 Xem hướng dẫn chi tiết**: `DOCKER_SETUP_GUIDE.md`

**Tóm tắt nhanh**:

1. **Cài Docker** (nếu chưa có):
   - Windows/Mac: Download Docker Desktop
   - Linux: `curl -fsSL https://get.docker.com | sh`

2. **Tạo file `docker-compose.yml`** (xem trong DOCKER_SETUP_GUIDE.md)

3. **Chạy Judge0**:
   ```bash
   docker-compose up -d
   ```

4. **Thêm vào .env**:
   ```env
   JUDGE0_API_URL=http://localhost:2358
   JUDGE0_API_KEY=
   ```

**Note**: Self-hosted không cần API key, **hoàn toàn miễn phí**!

## Bước 2: Setup Gemini Pro

1. **Lấy API Key**:
   - Truy cập: https://makersuite.google.com/app/apikey
   - Tạo API key mới (bạn đã có account Gemini Pro)

2. **Cài đặt package**:
   ```bash
   cd server
   npm install @google/generative-ai
   ```

3. **Thêm vào .env**:
   ```env
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

## Bước 3: Kiểm tra Setup

### Test Judge0:
```bash
# Chạy server
npm run dev

# Test submission - nếu có Judge0 key, sẽ chạy code thực
# Nếu không có, sẽ fallback về mock
```

### Test Gemini:
```bash
# Submit một bài có lỗi
# Nếu có Gemini key, sẽ có AI analysis chi tiết
# Nếu không có, sẽ dùng rule-based analysis
```

## Workflow hoàn chỉnh

```
1. User submit code
   ↓
2. Judge0 chạy code thực (nếu có API key)
   ↓
3. Lấy kết quả thực (pass/fail, output, errors)
   ↓
4. Gemini Pro phân tích (nếu có API key)
   ↓
5. Hiển thị: Kết quả thực + AI Analysis
```

## Fallback Behavior

### Không có Judge0 API Key:
- ✅ Fallback về mock execution
- ✅ Hệ thống vẫn hoạt động
- ⚠️ Kết quả không chính xác (chỉ để test)

### Không có Gemini API Key:
- ✅ Fallback về rule-based analysis
- ✅ Hệ thống vẫn hoạt động
- ⚠️ AI analysis đơn giản hơn

### Có cả 2:
- ✅ Chạy code thực với Judge0
- ✅ AI analysis chi tiết với Gemini
- ✅ Best experience!

## Cost Estimation

### Judge0 (RapidAPI):
- **Free tier**: 100 requests/day
- **Basic**: $10/month - 10,000 requests
- **Pro**: $50/month - 100,000 requests

### Gemini Pro:
- **Free tier**: 15 requests/minute, 1,500 requests/day
- **Bạn đã có account**: ✅ Miễn phí!

### Tổng chi phí (100 users/day, 2 submissions/user = 200/day):
- Judge0: Cần paid plan (~$10/month) hoặc self-host (free)
- Gemini: Free tier đủ dùng ✅

## Troubleshooting

### Judge0 không chạy được:
1. Kiểm tra API key đúng chưa
2. Kiểm tra network connection
3. Xem console logs để debug
4. Hệ thống sẽ tự động fallback về mock

### Gemini không hoạt động:
1. Kiểm tra API key đúng chưa
2. Kiểm tra package đã cài: `npm list @google/generative-ai`
3. Xem console logs
4. Hệ thống sẽ tự động fallback về rule-based

### Cả 2 đều không hoạt động:
- Hệ thống vẫn hoạt động với mock + rule-based
- User vẫn có thể submit và nhận feedback cơ bản

## Production Recommendations

1. **Judge0**: Self-host để không phụ thuộc external API
2. **Gemini**: Free tier đủ cho small-medium scale
3. **Monitoring**: Log tất cả API calls để track usage
4. **Rate Limiting**: Thêm rate limiting để tránh abuse
5. **Caching**: Cache AI responses cho cùng code patterns

## Next Steps

1. ✅ Setup Judge0 API key
2. ✅ Setup Gemini API key
3. ✅ Test với một bài submission
4. ✅ Verify cả 2 đều hoạt động
5. ✅ Monitor usage và cost

## Notes

- Judge0 là **critical** - cần có để chấm bài đúng
- Gemini là **enhancement** - cải thiện UX nhưng không bắt buộc
- Hệ thống có fallback graceful - luôn hoạt động được

