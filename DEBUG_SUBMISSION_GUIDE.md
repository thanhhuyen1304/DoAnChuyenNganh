# 🔍 Hướng dẫn Debug Lỗi Submit Bài

## 📋 Các bước tìm lỗi khi submit bài

### 1. **Kiểm tra Console Log trên Server**

Khi submit bài, mở terminal chạy server và xem logs:

```bash
# Trong terminal server, bạn sẽ thấy:
Judge0 response: { ... }  # Response từ Judge0
Gemini API error: ...     # Lỗi từ Gemini (nếu có)
POST /api/submissions/submit 200 ...  # Status code
```

**Các lỗi thường gặp:**
- `Judge0 response: { status: { id: 13, description: 'Internal Error' } }` → Judge0 lỗi
- `Gemini API error: 404` → Gemini model không tìm thấy
- `Judge0 execution failed: ...` → Judge0 không thể chạy code

### 2. **Kiểm tra Network Tab trên Browser**

1. Mở **Developer Tools** (F12)
2. Vào tab **Network**
3. Submit bài
4. Tìm request `POST /api/submissions/submit`
5. Click vào request → xem:
   - **Headers**: Request headers, Authorization token
   - **Payload**: Code, challengeId, language được gửi
   - **Response**: Response từ server

**Kiểm tra:**
- Status code: 200 (OK), 400 (Bad Request), 500 (Server Error)
- Response body: Có `success: true/false`, `message`, `errors`

### 3. **Kiểm tra Console trên Browser**

1. Mở **Developer Tools** (F12)
2. Vào tab **Console**
3. Xem các lỗi JavaScript:
   - `Error: ...` → Lỗi từ client
   - `Failed to fetch` → Không kết nối được server
   - `401 Unauthorized` → Token hết hạn

### 4. **Kiểm tra Judge0 Connection**

Tạo file test để kiểm tra Judge0:

```bash
# Tạo file test-judge0.js trong thư mục server
node test-judge0.js
```

### 5. **Kiểm tra Database**

Kiểm tra xem submission có được lưu vào database không:

```javascript
// Trong MongoDB shell hoặc MongoDB Compass
db.submissions.find().sort({ submittedAt: -1 }).limit(1)
```

## 🛠️ Các công cụ Debug

### A. Test Judge0 Connection

Tạo endpoint test Judge0:

```typescript
// server/src/routes/debug.routes.ts
router.get('/test/judge0', async (req, res) => {
  const judge0Service = require('../services/judge0Service').default;
  const isHealthy = await judge0Service.checkHealth();
  res.json({ judge0Available: isHealthy });
});
```

### B. Test Submission với Log Chi tiết

Thêm logging chi tiết vào submission controller:

```typescript
console.log('=== SUBMISSION DEBUG ===');
console.log('Challenge ID:', challengeId);
console.log('Language:', language);
console.log('Code length:', code.length);
console.log('Test cases:', challenge.testCases.length);
console.log('Judge0 available:', isJudge0Available);
```

### C. Kiểm tra Environment Variables

```bash
# Kiểm tra các biến môi trường cần thiết
echo $JUDGE0_API_URL
echo $JUDGE0_API_KEY
echo $GEMINI_API_KEY
echo $MONGODB_URI
```

## 🔧 Các lỗi thường gặp và cách xử lý

### Lỗi 1: "No such file or directory @ rb_sysopen - /box/script.py"

**Nguyên nhân:** Judge0 không thể tạo file script

**Cách xử lý:**
1. Kiểm tra Judge0 có đang chạy không:
   ```bash
   docker ps | grep judge0
   ```
2. Kiểm tra Judge0 API URL:
   ```bash
   curl http://localhost:2358/health
   ```
3. Nếu Judge0 không chạy, khởi động lại:
   ```bash
   docker-compose up -d judge0
   ```

### Lỗi 2: "Gemini API error: 404 Not Found"

**Nguyên nhân:** Model Gemini không tồn tại hoặc API key sai

**Cách xử lý:**
1. Kiểm tra GEMINI_API_KEY trong `.env`
2. Đổi model từ `gemini-pro` sang `gemini-1.5-flash` (đã sửa)
3. Kiểm tra API key có hợp lệ không:
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
   ```

### Lỗi 3: "Submission validation failed"

**Nguyên nhân:** Dữ liệu gửi lên không đúng format

**Cách xử lý:**
1. Kiểm tra Network tab → Payload
2. Đảm bảo có: `challengeId`, `code`, `language`
3. Kiểm tra `executionResults` có đầy đủ `actualOutput` không

### Lỗi 4: Code bị reset về buggyCode

**Nguyên nhân:** useEffect trong CodeEditor reset code

**Cách xử lý:**
1. Đã sửa trong CodeEditor.tsx
2. Kiểm tra `lastProblemId` có được set đúng không

## 📝 Checklist Debug

Khi gặp lỗi, kiểm tra theo thứ tự:

1. **Kiểm tra cơ bản:**
   - [ ] Server có đang chạy không? (`npm run dev` trong thư mục server)
   - [ ] Client có đang chạy không? (`npm run dev` trong thư mục client)
   - [ ] Database MongoDB có kết nối được không?

2. **Kiểm tra Judge0:**
   - [ ] Chạy debug script: `node server/debug-submission.js`
   - [ ] Hoặc test API: `curl http://localhost:5000/api/debug/test/judge0`
   - [ ] Judge0 có đang chạy không? (nếu dùng self-hosted: `docker ps | grep judge0`)

3. **Kiểm tra Environment:**
   - [ ] Chạy: `curl http://localhost:5000/api/debug/test/env`
   - [ ] Kiểm tra file `.env` có đầy đủ biến không

4. **Kiểm tra khi Submit:**
   - [ ] Xem console logs trên server (sẽ có logs chi tiết với emoji)
   - [ ] Xem Network tab trên browser (F12 → Network)
   - [ ] Xem Console tab trên browser (F12 → Console)
   - [ ] Token authentication có hợp lệ không?

5. **Kiểm tra Response:**
   - [ ] Response từ API có đúng format không?
   - [ ] Có `success: true/false` không?
   - [ ] Có `message` hoặc `errors` không?

## 🚀 Quick Debug Tools

### 1. Debug Script (Node.js)

Đã có sẵn file `server/debug-submission.js`:

```bash
# Chạy script test
node server/debug-submission.js
```

Script này sẽ:
- ✅ Kiểm tra environment variables
- ✅ Test Judge0 health
- ✅ Test simple code submission
- ✅ Test multiple test cases

### 2. Debug API Endpoints

Đã có sẵn debug endpoints (không cần authentication):

#### Test Judge0:
```bash
curl http://localhost:5000/api/debug/test/judge0
```

Hoặc mở browser: `http://localhost:5000/api/debug/test/judge0`

#### Check Environment Variables:
```bash
curl http://localhost:5000/api/debug/test/env
```

Hoặc mở browser: `http://localhost:5000/api/debug/test/env`

## 📞 Liên hệ hỗ trợ

Nếu vẫn không tìm được lỗi, cung cấp:
1. Console logs từ server (copy toàn bộ)
2. Network request/response từ browser
3. Error message chính xác
4. Steps to reproduce (các bước để tái hiện lỗi)

