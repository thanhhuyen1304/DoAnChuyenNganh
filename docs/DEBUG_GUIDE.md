# Hướng dẫn Debug cho BugHunter

## Tổng quan
Hướng dẫn này giúp tìm và sửa lỗi phổ biến khi sử dụng BugHunter, bao gồm lỗi submission, Judge0, authentication, và các vấn đề khác.

## Các bước tìm lỗi chung

### 1. Kiểm tra Console Log trên Server
Khi gặp lỗi, mở terminal chạy server và xem logs:

```bash
# Trong terminal server, bạn sẽ thấy:
Judge0 response: { ... }        # Response từ Judge0
Gemini API error: ...           # Lỗi từ Gemini (nếu có)
POST /api/submissions/submit 200 ...  # Status code
Database connection: ...        # Kết nối database
WebSocket connected: ...         # WebSocket events
```

### 2. Kiểm tra Network Tab trên Browser
1. Mở **Developer Tools** (F12)
2. Vào tab **Network**
3. Thực hiện action gây lỗi
4. Tìm request tương ứng
5. Kiểm tra:
   - **Status code**: 200 (OK), 400 (Bad Request), 500 (Server Error)
   - **Response body**: Có `success: true/false`, `message`, `errors`
   - **Request headers**: Authorization token

### 3. Kiểm tra Console trên Browser
1. Mở **Developer Tools** (F12)
2. Vào tab **Console**
3. Xem các lỗi JavaScript:
   - `Error: ...` → Lỗi từ client
   - `Failed to fetch` → Không kết nối được server
   - `401 Unauthorized` → Token hết hạn

## Debug Lỗi Submission

### Lỗi 1: "No such file or directory @ rb_sysopen - /box/script.py"

**Nguyên nhân**: Judge0 không thể tạo file script trong container

**Cách xử lý**:
1. Kiểm tra Judge0 có đang chạy không:
   ```bash
   docker ps | grep judge0
   ```

2. Kiểm tra Judge0 API URL:
   ```bash
   curl http://localhost:2358/health
   ```

3. Restart Judge0:
   ```bash
   docker restart judge0
   ```

4. Nếu vẫn lỗi, rebuild containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Lỗi 2: "Gemini API error: 404 Not Found"

**Nguyên nhân**: Model Gemini không tồn tại hoặc API key sai

**Cách xử lý**:
1. Kiểm tra GEMINI_API_KEY trong `.env`
2. Đổi model từ `gemini-pro` sang `gemini-1.5-flash`
3. Kiểm tra API key có hợp lệ không:
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
   ```

### Lỗi 3: "Submission validation failed"

**Nguyên nhân**: Dữ liệu gửi lên không đúng format

**Cách xử lý**:
1. Kiểm tra Network tab → Payload
2. Đảm bảo có: `challengeId`, `code`, `language`
3. Kiểm tra `executionResults` có đầy đủ `actualOutput` không

### Lỗi 4: Code bị reset về buggyCode

**Nguyên nhân**: useEffect trong CodeEditor reset code

**Cách xử lý**:
1. Kiểm tra `lastProblemId` có được set đúng không
2. Xem CodeEditor.tsx để debug state management

## Debug Lỗi Authentication

### Lỗi 1: "401 Unauthorized"

**Nguyên nhân**: Token hết hạn hoặc không hợp lệ

**Cách xử lý**:
1. Kiểm tra localStorage có `token` không:
   ```javascript
   localStorage.getItem('token')
   ```

2. Kiểm tra token có hợp lệ không:
   ```bash
   # Decode JWT token
   node -e "console.log(JSON.parse(require('atob')('YOUR_TOKEN.split('.')[1])))"
   ```

3. Đăng nhập lại để lấy token mới

### Lỗi 2: "OAuth callback failed"

**Nguyên nhân**: OAuth configuration sai

**Cách xử lý**:
1. Kiểm tra OAuth credentials trong `.env`
2. Kiểm tra redirect URI trong OAuth console
3. Kiểm tra OAuth routes trong server

## Debug Lỗi Judge0

### Kiểm tra Judge0 Connection
```bash
# Test health check
curl http://localhost:2358/health

# Test languages
curl http://localhost:2358/languages

# Test submission
curl -X POST http://localhost:2358/submissions?base64_encoded=false \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello, World!\")",
    "language_id": 71,
    "stdin": ""
  }'
```

### Kiểm tra Docker Containers
```bash
# Xem containers đang chạy
docker-compose ps

# Xem logs
docker-compose logs judge0

# Restart containers
docker-compose restart
```

### Kiểm tra Environment Variables
```bash
# Kiểm tra các biến môi trường cần thiết
echo $JUDGE0_API_URL
echo $JUDGE0_API_KEY
```

## Debug Lỗi Database

### Kiểm tra MongoDB Connection
```bash
# Kiểm tra MongoDB service
sudo systemctl status mongod

# Test connection
mongosh --eval "db.adminCommand('ismaster')"

# Kiểm tra database
mongosh
use bughunter
db.users.find().limit(1)
```

### Kiểm tra Mongoose Connection
```javascript
// Trong server code
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});
```

## Debug Lỗi WebSocket

### Kiểm tra WebSocket Connection
```javascript
// Trong browser console
console.log('WebSocket state:', socket.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
```

### Kiểm tra WebSocket Events
```javascript
// Client-side debugging
socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from WebSocket:', reason);
});

socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
});
```

### Server-side WebSocket Logs
```javascript
// Trong server code
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, reason);
  });
});
```

## Công cụ Debug

### 1. Debug Script (Node.js)
Sử dụng file `server/debug-submission.js`:
```bash
node server/debug-submission.js
```

Script này sẽ:
- Kiểm tra environment variables
- Test Judge0 health
- Test simple code submission
- Test multiple test cases

### 2. Debug API Endpoints
Sử dụng debug endpoints (không cần authentication):

#### Test Judge0:
```bash
curl http://localhost:5000/api/debug/test/judge0
```

#### Check Environment Variables:
```bash
curl http://localhost:5000/api/debug/test/env
```

### 3. MongoDB Debug
```javascript
// Kiểm tra submissions
db.submissions.find().sort({ submittedAt: -1 }).limit(5).pretty()

// Kiểm tra users
db.users.find().pretty()

// Kiểm tra challenges
db.challenges.find().pretty()
```

## Checklist Debug

Khi gặp lỗi, kiểm tra theo thứ tự:

### 1. Kiểm tra cơ bản
- [ ] Server có đang chạy không? (`npm run dev` trong thư mục server)
- [ ] Client có đang chạy không? (`npm run dev` trong thư mục client)
- [ ] Database MongoDB có kết nối được không?
- [ ] Docker có đang chạy không? (nếu dùng Judge0)

### 2. Kiểm tra Judge0
- [ ] Judge0 có đang chạy không? (`docker ps | grep judge0`)
- [ ] Judge0 health check OK? (`curl http://localhost:2358/health`)
- [ ] File `.env` có đúng `JUDGE0_API_URL` không?

### 3. Kiểm tra Environment
- [ ] Chạy: `curl http://localhost:5000/api/debug/test/env`
- [ ] File `.env` có đầy đủ biến không?
- [ ] API keys có hợp lệ không?

### 4. Kiểm tra khi Submit
- [ ] Xem console logs trên server
- [ ] Xem Network tab trên browser
- [ ] Xem Console tab trên browser
- [ ] Token authentication có hợp lệ không?

### 5. Kiểm tra Response
- [ ] Response từ API có đúng format không?
- [ ] Có `success: true/false` không?
- [ ] Có `message` hoặc `errors` không?

## Common Error Messages

### Server Errors
- `ECONNREFUSED`: Server không chạy hoặc port sai
- `ENOTFOUND`: DNS resolution failed
- `ETIMEDOUT`: Request timeout
- `ECONNRESET`: Connection bị reset

### Database Errors
- `MongoNetworkError`: Không kết nối được MongoDB
- `MongoTimeoutError`: Database operation timeout
- `ValidationError`: Schema validation failed

### Judge0 Errors
- `No such file or directory`: Judge0 không thể tạo file
- `Memory limit exceeded`: Code dùng quá nhiều RAM
- `Time limit exceeded`: Code chạy quá lâu
- `Runtime Error`: Code có lỗi runtime

## Performance Debugging

### Slow API Response
1. Kiểm tra database queries:
   ```javascript
   // Thêm explain() để debug query
   db.users.find({ rating: { $gt: 1000 } }).explain()
   ```

2. Kiểm tra indexes:
   ```javascript
   // Xem indexes
   db.users.getIndexes()
   
   // Tạo index nếu cần
   db.users.createIndex({ rating: -1 })
   ```

3. Kiểm tra memory usage:
   ```bash
   # Node.js process
   ps aux | grep node
   
   # MongoDB
   mongostat
   ```

### Memory Leaks
1. Sử dụng Node.js profiler:
   ```bash
   node --inspect server/src/app.ts
   ```

2. Sử dụng Chrome DevTools Memory tab

3. Kiểm tra event listeners:
   ```javascript
   // Đảm bảo remove event listeners
   socket.off('event', handler);
   ```

## Logging Best Practices

### Structured Logging
```javascript
// Thay vì:
console.log('User logged in:', user);

// Dùng:
console.log({
  event: 'user_login',
  userId: user._id,
  timestamp: new Date().toISOString(),
  ip: req.ip
});
```

### Error Logging
```javascript
// Log error với stack trace
console.error({
  error: error.message,
  stack: error.stack,
  userId: req.user?.id,
  timestamp: new Date().toISOString()
});
```

## Khi nào cần hỗ trợ

Nếu đã thử tất cả các bước trên mà vẫn không giải quyết được, hãy cung cấp:

1. **Console logs từ server** (copy toàn bộ)
2. **Network request/response từ browser** (screenshot hoặc copy)
3. **Error message chính xác**
4. **Steps to reproduce** (các bước để tái hiện lỗi)
5. **Environment information**:
   - OS: Windows/macOS/Linux
   - Node.js version: `node --version`
   - Docker version: `docker --version`
   - MongoDB version: `mongosh --version`

## Resources

- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Judge0 Documentation](https://judge0.com/docs)