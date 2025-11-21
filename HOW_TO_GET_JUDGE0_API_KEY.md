# 🔑 Hướng dẫn lấy JUDGE0_API_KEY (Chỉ cần nếu dùng RapidAPI)

## ⚠️ LƯU Ý QUAN TRỌNG

**Với Docker Self-hosted (bạn đang dùng)**: 
- ✅ **KHÔNG CẦN** API key
- ✅ Để trống: `JUDGE0_API_KEY=`
- ✅ Hoàn toàn miễn phí

**Chỉ cần API key nếu**:
- Bạn muốn dùng RapidAPI (third-party service)
- Hoặc muốn có backup option

---

## 🚀 Hướng dẫn lấy API Key từ RapidAPI

### Bước 1: Đăng ký tài khoản RapidAPI

1. **Mở trình duyệt** và truy cập:
   ```
   https://rapidapi.com/
   ```

2. **Click "Sign Up"** (hoặc "Login" nếu đã có tài khoản)

3. **Đăng ký** bằng:
   - Email
   - Google
   - GitHub
   - Facebook

4. **Xác nhận email** (nếu cần)

### Bước 2: Subscribe Judge0 API

1. **Sau khi đăng nhập**, truy cập:
   ```
   https://rapidapi.com/judge0-official/api/judge0-ce
   ```

2. **Scroll xuống** phần "Pricing"

3. **Chọn plan**:
   - **Free**: 100 requests/day (đủ cho test)
   - **Basic**: $10/month - 10,000 requests
   - **Pro**: $50/month - 100,000 requests

4. **Click "Subscribe"** cho plan bạn muốn

5. **Xác nhận subscription**

### Bước 3: Lấy API Key

1. **Sau khi subscribe**, bạn sẽ thấy phần **"API Key"**

2. **Click "Show Key"** hoặc **"Copy"**

3. **Copy API key** (dạng: `abc123def456...`)

4. **Lưu API key** vào file `.env`:
   ```env
   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
   JUDGE0_API_KEY=your-copied-api-key-here
   ```

### Bước 4: Cập nhật .env file

1. **Mở file `.env`** trong thư mục `server/`

2. **Cập nhật**:
   ```env
   # Nếu dùng RapidAPI
   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
   JUDGE0_API_KEY=your-rapidapi-key-here
   
   # Nếu dùng Docker Self-hosted (khuyến nghị)
   JUDGE0_API_URL=http://localhost:2358
   JUDGE0_API_KEY=
   ```

3. **Lưu file**

---

## 📊 So sánh: RapidAPI vs Self-hosted

| Tiêu chí | RapidAPI | Docker Self-hosted |
|----------|----------|-------------------|
| **API Key** | ✅ Cần | ❌ Không cần |
| **Chi phí** | Free: 100 req/day<br>Paid: $10-50/month | ✅ **Miễn phí** |
| **Setup** | ⭐⭐⭐⭐⭐ Dễ | ⭐⭐⭐ Trung bình |
| **Giới hạn** | Có (free tier) | ❌ Không giới hạn |
| **Control** | ⭐⭐ Ít | ⭐⭐⭐⭐⭐ Hoàn toàn |

---

## 🎯 Khuyến nghị

### Hiện tại (Docker đã setup):
✅ **Dùng Docker Self-hosted** - Không cần API key

### Nếu Docker không hoạt động:
💰 **Dùng RapidAPI** - Cần API key (free tier đủ test)

### Production:
✅ **Docker Self-hosted** - Tiết kiệm và ổn định hơn

---

## 🔄 Cách chuyển đổi

### Từ Self-hosted sang RapidAPI:

1. **Lấy API key** từ RapidAPI (theo hướng dẫn trên)

2. **Cập nhật `.env`**:
   ```env
   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
   JUDGE0_API_KEY=your-rapidapi-key
   ```

3. **Restart server**

### Từ RapidAPI về Self-hosted:

1. **Cập nhật `.env`**:
   ```env
   JUDGE0_API_URL=http://localhost:2358
   JUDGE0_API_KEY=
   ```

2. **Đảm bảo Docker đang chạy**:
   ```powershell
   docker-compose ps
   ```

3. **Restart server**

---

## ✅ Tóm tắt

### Docker Self-hosted (Bạn đang dùng):
- ❌ **KHÔNG CẦN** lấy API key
- ✅ Để trống: `JUDGE0_API_KEY=`
- ✅ Đã setup xong, sẵn sàng dùng!

### RapidAPI (Nếu cần sau này):
- ✅ Cần đăng ký RapidAPI
- ✅ Subscribe Judge0 API
- ✅ Copy API key
- ✅ Thêm vào `.env`

---

## 🎉 Kết luận

**Với setup hiện tại của bạn (Docker self-hosted)**:
- ✅ **KHÔNG CẦN** lấy API key
- ✅ **KHÔNG CẦN** làm gì thêm
- ✅ Chỉ cần đảm bảo Docker đang chạy

**Chỉ lấy API key nếu**:
- Bạn muốn dùng RapidAPI thay thế
- Hoặc muốn có backup option

---

Chúc bạn thành công! 🚀

