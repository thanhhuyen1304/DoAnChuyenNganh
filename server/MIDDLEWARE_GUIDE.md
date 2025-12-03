# 🛡️ Middleware Guide - File Upload & Rate Limiting

## 📋 Tổng Quan

Hướng dẫn sử dụng File Upload Middleware và Rate Limiting Middleware trong BugHunter project.

## 📤 File Upload Middleware

### Cài Đặt

Đã cài đặt `multer` và `@types/multer`:
```bash
npm install multer @types/multer
```

### Cấu Hình

**File**: `server/src/middleware/upload.ts`

**Tính năng**:
- ✅ Disk storage và Memory storage
- ✅ File type validation
- ✅ File size limits
- ✅ Automatic directory creation
- ✅ Unique filename generation
- ✅ Error handling

### Sử Dụng

#### 1. Upload Single File (Disk Storage)

```typescript
import { uploadSingle } from '../middleware/upload';
import { getFileUrl } from '../middleware/upload';

router.post('/upload', 
  authenticateToken,
  ...uploadSingle('file'), // field name: 'file'
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const fileUrl = getFileUrl(req.file);
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
      }
    });
  }
);
```

#### 2. Upload Multiple Files

```typescript
import { uploadMultiple } from '../middleware/upload';

router.post('/upload-multiple',
  authenticateToken,
  ...uploadMultiple('files', 5), // field name: 'files', max 5 files
  async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    
    const files = (req.files as Express.Multer.File[]).map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      url: getFileUrl(file),
    }));
    
    res.json({ success: true, data: { files } });
  }
);
```

#### 3. Upload Image Only

```typescript
import { uploadImage } from '../middleware/upload';

router.post('/upload-avatar',
  authenticateToken,
  ...uploadImage('avatar'),
  async (req, res) => {
    // req.file contains the uploaded image
    // Allowed types: jpeg, jpg, png, gif, webp
  }
);
```

#### 4. Upload Document Only

```typescript
import { uploadDocument } from '../middleware/upload';

router.post('/upload-document',
  authenticateToken,
  ...uploadDocument('document'),
  async (req, res) => {
    // req.file contains the uploaded document
    // Allowed types: json, txt, pdf
  }
);
```

#### 5. Upload Avatar (Special)

```typescript
import { uploadAvatar } from '../middleware/upload';

router.post('/users/me/avatar',
  authenticateToken,
  ...uploadAvatar(),
  async (req, res) => {
    // File saved to: uploads/avatars/avatar-{userId}-{timestamp}.{ext}
    // Max size: 5MB
  }
);
```

#### 6. Memory Upload (Process in Memory)

```typescript
import { uploadMemory } from '../middleware/upload';

router.post('/upload-process',
  authenticateToken,
  ...uploadMemory('file'),
  async (req, res) => {
    if (req.file) {
      // req.file.buffer contains file data in memory
      const buffer = req.file.buffer;
      // Process buffer without saving to disk
    }
  }
);
```

### File Types Allowed

**Images**: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
**Documents**: `application/json`, `text/plain`, `application/pdf`

### File Size Limits

- **General**: 10MB
- **Avatars**: 5MB

### Directory Structure

```
server/
  uploads/
    images/        # Image files
    documents/     # Document files
    avatars/       # User avatars
    general/       # Other files
```

### Helper Functions

```typescript
import { getFileUrl, deleteFile, cleanupOldFiles } from '../middleware/upload';

// Get file URL for response
const fileUrl = getFileUrl(req.file);

// Delete file
deleteFile('/path/to/file');

// Cleanup old files (older than 7 days by default)
cleanupOldFiles(7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
```

### Error Handling

Middleware tự động xử lý các lỗi:
- `LIMIT_FILE_SIZE`: File quá lớn
- `LIMIT_FILE_COUNT`: Quá nhiều files
- `LIMIT_UNEXPECTED_FILE`: File field không hợp lệ
- Invalid file type

---

## 🚦 Rate Limiting Middleware

### Cấu Hình

**File**: `server/src/middleware/rateLimit.ts`

**Tính năng**:
- ✅ In-memory rate limiting (có thể nâng cấp lên Redis)
- ✅ Per IP và per User
- ✅ Configurable windows và limits
- ✅ Automatic cleanup

### Sử Dụng

#### 1. General Rate Limiter (Per IP)

```typescript
import { generalRateLimit } from '../middleware/rateLimit';

router.get('/api/data',
  generalRateLimit, // 100 requests per 15 minutes per IP
  (req, res) => {
    // Your handler
  }
);
```

#### 2. Strict Rate Limiter (Per IP)

```typescript
import { strictRateLimit } from '../middleware/rateLimit';

router.post('/api/sensitive',
  strictRateLimit, // 20 requests per 15 minutes per IP
  (req, res) => {
    // Your handler
  }
);
```

#### 3. Auth Rate Limiter (Login/Register)

```typescript
import { authRateLimit, authRateLimitUser } from '../middleware/rateLimit';

router.post('/api/auth/login',
  authRateLimit,      // 10 attempts per 15 min per IP
  authRateLimitUser,  // 5 attempts per 15 min per user
  (req, res) => {
    // Login handler
  }
);
```

#### 4. Submission Rate Limiter

```typescript
import { submissionRateLimit } from '../middleware/rateLimit';

router.post('/api/submissions',
  authenticateToken,
  submissionRateLimit, // 10 submissions per minute per user
  (req, res) => {
    // Submission handler
  }
);
```

#### 5. Chat Rate Limiter

```typescript
import { chatRateLimit } from '../middleware/rateLimit';

router.post('/api/chat/message',
  authenticateToken,
  chatRateLimit, // 20 messages per minute per user
  (req, res) => {
    // Chat handler
  }
);
```

#### 6. Upload Rate Limiter

```typescript
import { uploadRateLimit } from '../middleware/rateLimit';
import { uploadSingle } from '../middleware/upload';

router.post('/api/upload',
  authenticateToken,
  uploadRateLimit, // 20 uploads per 15 minutes per user
  ...uploadSingle('file'),
  (req, res) => {
    // Upload handler
  }
);
```

#### 7. Admin Rate Limiter

```typescript
import { adminRateLimit } from '../middleware/rateLimit';
import { isAdmin } from '../middleware/auth';

router.post('/api/admin/action',
  authenticateToken,
  isAdmin,
  adminRateLimit, // 30 requests per minute per admin
  (req, res) => {
    // Admin handler
  }
);
```

#### 8. Search Rate Limiter

```typescript
import { searchRateLimit } from '../middleware/rateLimit';

router.get('/api/search',
  searchRateLimit, // 30 searches per minute per IP
  (req, res) => {
    // Search handler
  }
);
```

### Rate Limiters Available

| Middleware | Window | Max Requests | Key |
|------------|--------|--------------|-----|
| `generalRateLimit` | 15 min | 100 | Per IP |
| `strictRateLimit` | 15 min | 20 | Per IP |
| `authRateLimit` | 15 min | 10 | Per IP |
| `authRateLimitUser` | 15 min | 5 | Per User |
| `submissionRateLimit` | 1 min | 10 | Per User |
| `chatRateLimit` | 1 min | 20 | Per User |
| `uploadRateLimit` | 15 min | 20 | Per User |
| `adminRateLimit` | 1 min | 30 | Per Admin |
| `searchRateLimit` | 1 min | 30 | Per IP |

### OTP Rate Limiters (Existing)

| Middleware | Window | Max Requests | Key |
|------------|--------|--------------|-----|
| `otpRequestRateLimitIP` | 10 min | 20 | Per IP |
| `otpRequestRateLimitIdentifier` | 10 min | 5 | Per Identifier |
| `otpVerifyRateLimitIP` | 10 min | 50 | Per IP |
| `otpVerifyRateLimitIdentifier` | 10 min | 10 | Per Identifier |

### Error Response

Khi rate limit bị vượt quá:

```json
{
  "success": false,
  "message": "Bạn đã gửi quá nhiều requests. Vui lòng thử lại sau 15 phút."
}
```

**HTTP Status**: `429 Too Many Requests`
**Header**: `Retry-After: <seconds>`

---

## 🔧 Integration Examples

### Example 1: Upload Avatar với Rate Limiting

```typescript
import { uploadAvatar } from '../middleware/upload';
import { uploadRateLimit } from '../middleware/rateLimit';
import { authenticateToken } from '../middleware/auth';

router.post('/api/users/me/avatar',
  authenticateToken,
  uploadRateLimit,
  ...uploadAvatar(),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Update user avatar URL
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: getFileUrl(req.file) },
      { new: true }
    );
    
    res.json({ success: true, data: { avatar: user.avatar } });
  }
);
```

### Example 2: Import Challenges với Rate Limiting

```typescript
import { uploadDocument } from '../middleware/upload';
import { adminRateLimit } from '../middleware/rateLimit';
import { authenticateToken, isAdmin } from '../middleware/auth';

router.post('/api/admin/challenges/import',
  authenticateToken,
  isAdmin,
  adminRateLimit,
  ...uploadDocument('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Read and parse JSON file
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const challenges = JSON.parse(fileContent);
    
    // Import challenges...
    
    res.json({ success: true, data: { imported: challenges.length } });
  }
);
```

### Example 3: Submission với Rate Limiting

```typescript
import { submissionRateLimit } from '../middleware/rateLimit';
import { authenticateToken } from '../middleware/auth';

router.post('/api/submissions',
  authenticateToken,
  submissionRateLimit, // Prevent spam submissions
  async (req, res) => {
    // Submit code...
  }
);
```

---

## 📝 Best Practices

### File Upload

1. **Always validate file type** - Sử dụng các middleware có sẵn
2. **Set appropriate size limits** - Tùy theo use case
3. **Clean up old files** - Chạy cleanupOldFiles() định kỳ
4. **Use unique filenames** - Middleware tự động tạo
5. **Store file metadata** - Lưu URL, size, type vào database

### Rate Limiting

1. **Use appropriate limiters** - Chọn limiter phù hợp với endpoint
2. **Combine multiple limiters** - Có thể dùng nhiều limiters cùng lúc
3. **Monitor rate limit hits** - Log khi rate limit bị trigger
4. **Consider Redis for production** - In-memory chỉ phù hợp cho single server

---

## 🚀 Production Considerations

### File Upload

- **Cloud Storage**: Consider AWS S3, Google Cloud Storage
- **CDN**: Serve files through CDN
- **Virus Scanning**: Scan uploaded files
- **Image Processing**: Resize/optimize images

### Rate Limiting

- **Redis**: Use Redis for distributed rate limiting
- **IP Whitelisting**: Whitelist trusted IPs
- **User-based limits**: Different limits for different user roles
- **Monitoring**: Track rate limit violations

---

## 📚 Related Files

- `server/src/middleware/upload.ts` - File upload middleware
- `server/src/middleware/rateLimit.ts` - Rate limiting middleware
- `server/src/app.ts` - Express app configuration
- `server/uploads/` - Upload directory

---

**Tóm lại**: Middleware này cung cấp đầy đủ tính năng file upload và rate limiting cho BugHunter project! 🚀

