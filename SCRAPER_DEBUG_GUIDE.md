# 🔍 Debug Guide - Scraper Tab Trắng

## 📋 **Các bước debug:**

### **Bước 1: Kiểm tra Browser Console**
1. Mở **Developer Tools** (F12)
2. Vào tab **Console**
3. Refresh trang và xem có lỗi JavaScript nào không
4. Vào tab **Scraper** và xem console có lỗi gì

### **Bước 2: Kiểm tra Network Tab**
1. Vào tab **Network** trong Developer Tools
2. Refresh trang
3. Xem có request nào bị lỗi không
4. Kiểm tra response của các API calls

### **Bước 3: Kiểm tra Component Rendering**
1. Vào tab **Elements** trong Developer Tools
2. Tìm element có class `space-y-6` (container của scraper)
3. Xem có content bên trong không

### **Bước 4: Test với SimpleScraper**
- Hiện tại đã thay thế bằng SimpleScraper đơn giản
- Nếu vẫn trắng, có thể là lỗi CSS hoặc component không render

## 🛠️ **Các lỗi có thể gặp:**

### **1. JavaScript Errors**
```
Uncaught TypeError: Cannot read property 'xxx' of undefined
```
**Giải pháp**: Kiểm tra imports và dependencies

### **2. CSS Issues**
```
Component render nhưng không hiển thị
```
**Giải pháp**: Kiểm tra CSS classes và styling

### **3. Import Errors**
```
Module not found: Can't resolve 'xxx'
```
**Giải pháp**: Kiểm tra đường dẫn import

### **4. React Errors**
```
React Hook useEffect has a missing dependency
```
**Giải pháp**: Kiểm tra React hooks

## 🔧 **Quick Fixes:**

### **Fix 1: Clear Browser Cache**
1. Ctrl + Shift + R (hard refresh)
2. Hoặc Ctrl + F5

### **Fix 2: Check Local Storage**
1. F12 → Application → Local Storage
2. Xem có token và user data không
3. Nếu không có, đăng nhập lại

### **Fix 3: Check Network Connection**
1. Kiểm tra server có chạy không: http://localhost:5000
2. Kiểm tra client có chạy không: http://localhost:5173

## 📱 **Test Steps:**

1. **Truy cập**: http://localhost:5173
2. **Đăng nhập**: admin@bughunter.com / admin123
3. **Vào Admin Dashboard**
4. **Click tab "Scraper"**
5. **Nếu vẫn trắng**:
   - Mở F12 → Console
   - Xem có lỗi gì
   - Thử tab "Debug Token" xem có hoạt động không

## 🚨 **Emergency Fallback:**

Nếu vẫn không hoạt động, có thể:
1. Restart client: `Ctrl+C` rồi `npm run dev`
2. Restart server: `Ctrl+C` rồi `npm run dev`
3. Clear node_modules và reinstall

---

**💡 Tip**: Hãy cho tôi biết lỗi cụ thể trong console để tôi có thể sửa chính xác!
