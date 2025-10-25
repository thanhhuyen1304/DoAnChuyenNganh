# 🤖 Problem Scraper - Hướng dẫn sử dụng

## 📋 **Tổng quan**

Problem Scraper là tính năng cho phép admin tự động lấy bài tập từ các nguồn online và thêm vào hệ thống BugHunter, thay vì phải nhập thủ công từng bài tập và test case.

## 🎯 **Các nguồn hỗ trợ**

### 1. **CSES Problem Set** 📚
- **URL**: https://cses.fi/problemset/
- **Mô tả**: Bộ bài tập thuật toán chất lượng cao từ Đại học Helsinki
- **Đặc điểm**: 
  - Bài tập cơ bản đến nâng cao
  - Test cases chuẩn
  - Phù hợp cho người mới học

### 2. **AtCoder** 🏆
- **URL**: https://atcoder.jp/
- **Mô tả**: Nền tảng competitive programming hàng đầu Nhật Bản
- **Đặc điểm**:
  - Contest problems chất lượng cao
  - Độ khó từ ABC đến ARC
  - Phù hợp cho competitive programming

### 3. **LeetCode** 💼
- **URL**: https://leetcode.com/
- **Mô tả**: Nền tảng phỏng vấn và thuật toán phổ biến
- **Đặc điểm**:
  - Bài tập phỏng vấn thực tế
  - Đa dạng ngôn ngữ lập trình
  - Phù hợp cho chuẩn bị phỏng vấn

### 4. **Tất cả nguồn** 🌐
- Scrape từ tất cả các nguồn trên cùng lúc
- Tiết kiệm thời gian
- Đa dạng bài tập

## 🚀 **Cách sử dụng**

### **Bước 1: Đăng nhập Admin**
```
Email: admin@bughunter.com
Password: admin123
```

### **Bước 2: Truy cập Admin Dashboard**
- Vào: http://localhost:5173/admin/dashboard
- Click tab **"Scraper"**

### **Bước 3: Chọn nguồn scrape**
- **CSES**: Cho bài tập thuật toán cơ bản
- **AtCoder**: Cho competitive programming
- **LeetCode**: Cho bài tập phỏng vấn
- **Tất cả nguồn**: Scrape từ tất cả

### **Bước 4: Thực hiện scrape**
- Click nút **"Scrape [Tên nguồn]"**
- Đợi quá trình scrape hoàn thành
- Xem kết quả và số lượng bài tập đã thêm

## ⚙️ **Tính năng tự động**

### **Test Cases** 🧪
- Tự động tạo sample test cases
- Bao gồm cả test cases công khai và ẩn
- Phân bổ điểm số hợp lý

### **Code Generation** 💻
- **Buggy Code**: Tự động tạo code có lỗi phổ biến
- **Correct Code**: Tự động tạo code đúng
- Hỗ trợ nhiều ngôn ngữ: JavaScript, Python, C++, Java

### **Metadata** 📊
- **Difficulty**: Tự động phân loại Easy/Medium/Hard
- **Category**: Tự động gán Logic/Syntax/Performance/Security
- **Tags**: Tự động thêm tags phù hợp
- **Points**: Tự động tính điểm dựa trên độ khó

## 🔧 **API Endpoints**

### **Scrape CSES**
```http
POST /api/scraper/cses
Authorization: Bearer <admin_token>
```

### **Scrape AtCoder**
```http
POST /api/scraper/atcoder
Authorization: Bearer <admin_token>
```

### **Scrape LeetCode**
```http
POST /api/scraper/leetcode
Authorization: Bearer <admin_token>
```

### **Scrape All Sources**
```http
POST /api/scraper/all
Authorization: Bearer <admin_token>
```

## 📝 **Response Format**

```json
{
  "success": true,
  "message": "Đã scrape và lưu 15 problems từ CSES",
  "data": {
    "count": 15,
    "total": 45,
    "cses": 15,
    "atcoder": 20,
    "leetcode": 10
  }
}
```

## ⚠️ **Lưu ý quan trọng**

### **Rate Limiting** 🚦
- Một số trang web có thể chặn requests quá nhiều
- Scraping có thể mất vài phút tùy thuộc vào số lượng bài tập
- Khuyến nghị scrape từng nguồn một thay vì tất cả cùng lúc

### **Legal Considerations** ⚖️
- Chỉ scrape cho mục đích giáo dục
- Tôn trọng robots.txt của các trang web
- Không scrape quá thường xuyên

### **Data Quality** 📈
- Test cases được tạo tự động dựa trên mẫu
- Có thể cần chỉnh sửa thủ công sau khi scrape
- Kiểm tra và validate bài tập trước khi publish

## 🛠️ **Troubleshooting**

### **Lỗi "Failed to fetch"**
- Kiểm tra kết nối internet
- Đảm bảo server đang chạy
- Kiểm tra CORS configuration

### **Lỗi "Không có token xác thực"**
- Đăng nhập lại với admin account
- Kiểm tra token trong localStorage
- Refresh trang và thử lại

### **Scraping chậm**
- Đây là bình thường với số lượng lớn
- Kiểm tra console để xem tiến trình
- Không đóng tab browser trong khi scraping

## 📊 **Thống kê**

Sau khi scrape thành công, bạn có thể xem thống kê trong tab **"Thống kê"**:
- Tổng số bài tập
- Số bài tập hoạt động
- Tổng điểm số
- Phân bổ theo độ khó và danh mục

## 🎉 **Kết luận**

Problem Scraper giúp admin tiết kiệm thời gian đáng kể trong việc thêm bài tập vào hệ thống. Thay vì nhập thủ công từng bài tập và test case, admin có thể scrape hàng trăm bài tập chỉ với vài click!

---

**💡 Tip**: Bắt đầu với CSES để có bài tập chất lượng cao, sau đó thêm AtCoder cho competitive programming và LeetCode cho bài tập phỏng vấn.
