# 🔍 Hướng Dẫn Kiểm Tra Chatbot Được Train Như Thế Nào

## 📋 Tổng Quan

Chatbot sử dụng **Word2Vec** để tìm training data tương tự với câu hỏi của người dùng. Hướng dẫn này sẽ giúp bạn kiểm tra xem chatbot đã được train đúng cách chưa.

## ✅ Bước 1: Kiểm Tra Training Data

### 1.1. Kiểm tra trong Database

```bash
# Chạy script kiểm tra
npm run check-training-data
```

Hoặc kiểm tra qua Admin Panel:
1. Vào **Admin Dashboard** → Tab **"Training Data AI"**
2. Xem danh sách training data
3. Kiểm tra số lượng và chất lượng

### 1.2. Kiểm tra File JSON

```bash
# Kiểm tra file training_data.json
cat server/models/training_data.json | jq '. | length'

# Kiểm tra file training_data_word2vec.json
cat server/models/training_data_word2vec.json | jq '. | length'
```

**Yêu cầu tối thiểu:**
- Ít nhất **50-100 training data entries**
- Tất cả đều có `isActive = true`

## ✅ Bước 2: Kiểm Tra Word2Vec Model

### 2.1. Kiểm tra File Model

```bash
# Kiểm tra file model có tồn tại không
ls -lh server/models/word2vec.model*

# Nếu file tồn tại, model đã được train
# Nếu không có, cần train lại
```

### 2.2. Kiểm tra qua API

Sử dụng endpoint mới để kiểm tra trạng thái:

```bash
# GET /api/training-data/status
curl -X GET http://localhost:5000/api/training-data/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response sẽ cho biết:
- Số lượng training data trong MongoDB
- Số lượng trong file JSON
- Model Word2Vec đã được train chưa
- Trạng thái sync

## ✅ Bước 3: Kiểm Tra Logs Khi Chatbot Hoạt Động

### 3.1. Xem Logs trong Console

Khi chatbot nhận được câu hỏi, bạn sẽ thấy logs như sau:

**Nếu Word2Vec đã được train:**
```
[Training Data] Sử dụng Word2Vec để tìm training data tương tự
[Training Data] Word2Vec tìm thấy 3 kết quả tương tự
```

**Nếu Word2Vec chưa được train (fallback):**
```
[Training Data] Sử dụng keyword matching (fallback)
```

### 3.2. Test Chatbot

1. Mở Chatbot trong frontend
2. Gửi một câu hỏi, ví dụ: "Làm sao debug lỗi JavaScript?"
3. Xem logs trong server console
4. Kiểm tra xem chatbot có sử dụng Word2Vec không

## ✅ Bước 4: Kiểm Tra Chi Tiết

### 4.1. Kiểm tra Training Data được sử dụng

Trong logs, bạn sẽ thấy:
```
[Training Data] Found 3 relevant training data
```

Điều này cho biết chatbot đã tìm thấy training data tương tự.

### 4.2. Kiểm tra Similarity Score

Word2Vec sẽ tính similarity score (0-1):
- **> 0.7**: Rất tương tự
- **0.5 - 0.7**: Tương tự
- **< 0.5**: Không tương tự (sẽ fallback về keyword matching)

### 4.3. Kiểm tra Usage Count

Training data được sử dụng sẽ tăng `usageCount`:
```javascript
// Kiểm tra trong MongoDB
db.trainingdata.find().sort({ usageCount: -1 }).limit(10)
```

## 🔧 Các Lệnh Kiểm Tra Nhanh

### Kiểm tra tất cả:

```bash
# 1. Kiểm tra training data
npm run check-training-data

# 2. Kiểm tra file model
ls -lh server/models/word2vec.model*

# 3. Kiểm tra file JSON
ls -lh server/models/training_data*.json

# 4. Test chatbot và xem logs
# (Mở chatbot và gửi câu hỏi)
```

### Kiểm tra qua API:

```bash
# Kiểm tra trạng thái
curl http://localhost:5000/api/training-data/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Xem training data
curl http://localhost:5000/api/training-data?limit=5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 Troubleshooting

### Vấn đề 1: "Sử dụng keyword matching (fallback)"

**Nguyên nhân:**
- Word2Vec model chưa được train
- File `word2vec.model` không tồn tại

**Giải pháp:**
```bash
npm run train-word2vec
```

### Vấn đề 2: "Không tìm thấy training data"

**Nguyên nhân:**
- Không có training data trong database
- Tất cả training data đều `isActive = false`

**Giải pháp:**
1. Thêm training data qua Admin Panel
2. Đảm bảo `isActive = true`

### Vấn đề 3: "File JSON không đồng bộ"

**Nguyên nhân:**
- File JSON chưa được sync từ MongoDB

**Giải pháp:**
```bash
# Sync thủ công
curl -X POST http://localhost:5000/api/training-data/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Hoặc chạy script:
```bash
npx ts-node server/scripts/sync-training-data.ts
```

## 📊 Checklist Kiểm Tra

- [ ] Có ít nhất 50-100 training data trong database
- [ ] File `training_data.json` đã được sync từ MongoDB
- [ ] File `training_data_word2vec.json` đã được convert
- [ ] File `word2vec.model` đã được train và tồn tại
- [ ] Logs hiển thị "[Training Data] Sử dụng Word2Vec"
- [ ] Chatbot trả lời dựa trên training data
- [ ] Usage count của training data tăng khi được sử dụng

## 🎯 Kết Luận

Sau khi hoàn thành các bước kiểm tra trên, bạn sẽ biết:
1. ✅ Training data đã đủ chưa
2. ✅ Word2Vec model đã được train chưa
3. ✅ Chatbot có đang sử dụng Word2Vec không
4. ✅ Training data nào được sử dụng nhiều nhất

Nếu tất cả đều ✅, chatbot đã được train đúng cách! 🎉

