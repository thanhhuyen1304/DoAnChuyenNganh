# ⚡ Quick Test: Knowledge Graph trong Chatbot

## 🎯 Test Nhanh (5 phút)

### Bước 1: Tạo Lỗi Trong Bài Tập (1 phút)

1. Đăng nhập vào hệ thống
2. Vào trang **Practice**
3. Chọn một challenge
4. Submit code **sai** (ví dụ: thiếu `return`, sai syntax)
5. Xác nhận submission có status: **Runtime Error**, **Syntax Error**, etc.

### Bước 2: Test Widget (30 giây)

1. Trong trang Practice, xem góc **dưới bên phải**
2. ✅ Widget **Knowledge Graph** hiển thị
3. ✅ Có **Error Summary** với thống kê lỗi
4. ✅ Có **Graph visualization**
5. ✅ Có **Recommendations**

### Bước 3: Test Chatbot (2 phút)

1. Mở **Chatbot** (góc dưới bên phải)
2. Gửi message: **"Tôi gặp lỗi undefined is not defined, làm sao fix?"**
3. ✅ Chatbot phát hiện đây là error request
4. ✅ Chatbot nhắc đến lỗi bạn vừa gặp
5. ✅ Chatbot gợi ý training data liên quan
6. ✅ Response có context về lỗi của bạn

### Bước 4: Kiểm Tra Logs (1 phút)

Mở **Backend console** (terminal chạy server), bạn sẽ thấy:

```
[Chat] User is asking about errors, fetching error-based recommendations
[Knowledge Graph] Found X error-related training data
```

✅ Nếu thấy logs này → Knowledge Graph đã tích hợp thành công!

## 🔍 Test Chi Tiết Hơn

### Test với các câu hỏi khác:

1. **"Tôi thường gặp lỗi syntax trong Python"**
   - ✅ Chatbot nhắc đến lỗi syntax của bạn
   - ✅ Gợi ý tài liệu về syntax

2. **"Làm sao fix lỗi runtime error?"**
   - ✅ Chatbot phân tích runtime errors của bạn
   - ✅ Đưa ra giải pháp cụ thể

3. **"Gợi ý bài tập để cải thiện"**
   - ✅ Chatbot gợi ý challenges dựa trên lỗi của bạn
   - ✅ Recommendations phù hợp với error types

### Test API Trực Tiếp:

```bash
# Test error-based graph
curl -X GET "http://localhost:5000/api/knowledge-graph/error-based" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test find training data for errors
curl -X POST "http://localhost:5000/api/knowledge-graph/find-training-for-errors" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "errorMessages": ["undefined is not defined"],
    "errorTypes": ["runtime"]
  }'
```

## ✅ Checklist

- [ ] Widget hiển thị trong Practice page
- [ ] Widget có error summary
- [ ] Widget có recommendations
- [ ] Chatbot phát hiện error requests
- [ ] Chatbot sử dụng error context
- [ ] Chatbot gợi ý training data liên quan
- [ ] Backend logs hiển thị Knowledge Graph queries

## 🐛 Nếu Không Hoạt Động

### Widget không hiển thị:
- Kiểm tra: Đã chọn challenge chưa?
- Kiểm tra: Console có lỗi không? (F12)
- Kiểm tra: API `/knowledge-graph/error-based` trả về data?

### Chatbot không phát hiện errors:
- Kiểm tra: Backend logs có message về error detection?
- Kiểm tra: User có submissions với lỗi không?
- Kiểm tra: Message có keywords như "lỗi", "error", "bug"?

### Không có recommendations:
- Kiểm tra: Database có training data không?
- Kiểm tra: Training data có tags/categories phù hợp không?

## 📊 Xem Chi Tiết

Xem file **TEST_KNOWLEDGE_GRAPH_CHATBOT.md** để test chi tiết hơn.

## 🚀 Chạy Script Test Tự Động

```bash
cd server
npx ts-node scripts/test-knowledge-graph-chatbot.ts
```

Script này sẽ:
- ✅ Tìm user có error submissions
- ✅ Test buildErrorBasedGraph
- ✅ Test findTrainingDataForErrors
- ✅ Test analyze recent submissions
- ✅ In ra báo cáo chi tiết

---

**Tóm lại:** Nếu widget hiển thị và chatbot gợi ý dựa trên lỗi của bạn → Tích hợp thành công! 🎉

