# 📚 Hướng Dẫn Train Chatbot Bằng Word2Vec

## 🎯 Tổng Quan

Word2Vec giúp chatbot hiểu ngữ nghĩa (semantic meaning) của câu hỏi, không chỉ dựa vào từ khóa. Ví dụ:
- "Làm sao debug lỗi?" 
- "Cách sửa bug như thế nào?"
- "Tôi gặp lỗi, giúp tôi fix"

→ Tất cả đều có ý nghĩa tương tự → Word2Vec sẽ tìm được training data phù hợp hơn!

---

## 📋 Bước 1: Chuẩn Bị

### Yêu Cầu:
- ✅ Python 3.7+ đã được cài đặt
- ✅ Gensim và NumPy đã được cài đặt (`pip install -r requirements.txt`)
- ✅ MongoDB đã được kết nối
- ✅ Tài khoản Admin để truy cập Admin Panel

### Kiểm Tra Cài Đặt:

```bash
# Kiểm tra Python
python --version  # Phải >= 3.7

# Kiểm tra Gensim
python -c "import gensim; print(gensim.__version__)"  # Phải >= 4.3.1

# Kiểm tra dependencies
cd server
pip install -r requirements.txt
```

---

## 🚀 Bước 2: Thu Thập Training Data

Có **2 cách chính** để thu thập training data:

### **Cách 1: Qua Admin Panel (Thêm Thủ Công)**

#### **Bước 2.1: Truy Cập Admin Dashboard**

1. **Đăng nhập với tài khoản Admin**:
   - Mở trình duyệt và truy cập website BugHunter
   - Đăng nhập với tài khoản có role `admin`

2. **Vào Admin Dashboard**:
   - Sau khi đăng nhập, click nút **"Truy cập Admin Panel"** 
   - Hoặc truy cập trực tiếp: `http://localhost:3000/admin/dashboard`

3. **Tìm Tab Training Data AI** 🧠:
   - Trong sidebar bên trái, tìm tab **"Training Data AI"**
   - Icon: 🧠 (Brain) - màu tím (purple)
   - Click vào tab này

#### **Bước 2.2: Thêm Training Data**

1. **Click nút "Thêm mới"** (Add New)
2. **Điền thông tin trong dialog**:
   - **Câu hỏi / Keyword**: Câu hỏi hoặc từ khóa (ví dụ: "Làm sao debug lỗi JavaScript?")
   - **Câu trả lời**: Câu trả lời chi tiết (ví dụ: "Để debug lỗi JavaScript, bạn có thể:\n1. Sử dụng console.log()\n2. Sử dụng debugger\n3. Kiểm tra DevTools")
   - **Danh mục**: Phân loại (ví dụ: "javascript", "debugging", "programming")
   - **Tags**: Từ khóa bổ sung, phân cách bằng dấu phẩy (ví dụ: "javascript, debug, error")
   - **Độ ưu tiên**: 1-10 (cao hơn = ưu tiên hơn khi tìm kiếm)
3. **Click "Lưu"** (Save)

#### **Bước 2.3: Import Hàng Loạt (Tùy Chọn)**

Nếu bạn có nhiều training data trong file JSON:

1. **Click nút "Import"**
2. **Upload file JSON** với định dạng:
   ```json
   [
     {
       "question": "Câu hỏi 1",
       "answer": "Câu trả lời 1",
       "category": "javascript",
       "tags": ["tag1", "tag2"],
       "priority": 5
     },
     {
       "question": "Câu hỏi 2",
       "answer": "Câu trả lời 2",
       "category": "react",
       "tags": ["react", "hooks"],
       "priority": 7
     }
   ]
   ```
3. **Hệ thống sẽ import tự động**

---

### **Cách 2: Extract Từ ChatHistory (Tự Động)**

#### **Bước 2.1: Đảm Bảo Có Chat History Với Rating Tốt**

Để extract được training data, bạn cần có chat history đã được user đánh giá tốt (rating = 'good'):

1. **User đã chat với chatbot**
2. **User đã rate câu trả lời là "good"** (thông qua UI chat)

> **Lưu ý**: Chỉ các câu trả lời được đánh giá "good" mới được extract làm training data.

#### **Bước 2.2: Extract Từ Admin Panel**

1. **Truy cập Admin Dashboard** → Tab **"Training Data AI"** 🧠
2. **Click nút "Extract từ Chat"** (Extract from Chat)
   - Icon: 💬 (MessageSquare)
   - Nút này sẽ tự động tìm tất cả chat history có `rating = 'good'`
3. **Hệ thống sẽ tự động**:
   - Tìm tất cả chat history có rating tốt
   - Extract các cặp câu hỏi-câu trả lời
   - Tự động tạo training data từ chat history
   - Tự động detect category và tags
   - Bỏ qua các cặp đã tồn tại
4. **Xem kết quả**:
   - Thông báo hiển thị số lượng training data đã extract
   - Số lượng đã bỏ qua (nếu đã tồn tại)
   - Danh sách training data mới được thêm

#### **Bước 2.3: Extract Bằng Script (Tùy Chọn)**

Nếu muốn extract từ terminal:

```bash
# Từ thư mục server
cd server
npm run extract-training-from-chat
```

Script sẽ:
- Kết nối MongoDB
- Tìm tất cả chat history có `rating = 'good'`
- Extract các cặp câu hỏi-câu trả lời
- Tạo training data mới
- Hiển thị số lượng đã extract

---

## 📊 Bước 3: Kiểm Tra Training Data

Sau khi thu thập training data, hãy kiểm tra xem có đủ dữ liệu chưa:

### **Kiểm Tra Qua Admin Panel**:

1. Vào tab **"Training Data AI"** trong Admin Dashboard
2. Xem danh sách training data
3. Kiểm tra số lượng và chất lượng dữ liệu

### **Kiểm Tra Bằng Script**:

```bash
# Từ thư mục server
cd server
npm run check-training-data
```

Script sẽ hiển thị:
- Tổng số training data
- Số active/inactive
- Mẫu training data
- Categories và tags

> **Khuyến nghị**: Cần ít nhất **50-100 training data** để model hoạt động tốt.

---

## 🔄 Bước 4: Train Word2Vec Model

Sau khi có đủ training data, tiến hành train model:

### **Cách 1: Sử dụng npm script (Khuyến nghị)**

```bash
# Từ thư mục gốc của project
npm run train-word2vec
```

Script này sẽ:
1. ✅ Kết nối MongoDB
2. ✅ Lấy tất cả training data từ database (chỉ lấy `isActive = true`)
3. ✅ Preprocess (tách từ, loại bỏ stopwords)
4. ✅ Tạo file `training_data.json` tạm thời
5. ✅ Train Word2Vec model
6. ✅ Lưu model vào `server/models/word2vec.model`
7. ✅ Xóa file tạm sau khi xong

### **Cách 2: Chạy trực tiếp Python script (Advanced)**

Nếu bạn đã có file `training_data.json` (format database với question, answer, category, tags):

**Bước 1: Convert training data sang format Word2Vec**

File `training_data.json` có format database (objects), cần convert sang format Word2Vec (array of arrays):

```bash
# Từ thư mục server
cd server
python scripts/convert_training_data.py
```

Script này sẽ:
1. ✅ Đọc file `models/training_data.json` (format database)
2. ✅ Preprocess text (tách từ, loại bỏ stopwords, remove markdown)
3. ✅ Convert sang format Word2Vec (array of arrays)
4. ✅ Lưu vào `models/training_data_word2vec.json`

**Bước 2: Train Word2Vec model**

Sau khi convert, train model:

```bash
# Từ thư mục server
python scripts/word2vec_train.py \
  --data models/training_data_word2vec.json \
  --output models/word2vec.model
```

**Hoặc chỉ định đường dẫn tùy chỉnh:**

```bash
python scripts/convert_training_data.py \
  models/training_data.json \
  models/training_data_word2vec.json

python scripts/word2vec_train.py \
  --data models/training_data_word2vec.json \
  --output models/word2vec.model
```

### **Tham Số Tùy Chỉnh**:

```bash
# Convert với đường dẫn tùy chỉnh
python scripts/convert_training_data.py \
  input_file.json \
  output_file.json

# Train với tham số tùy chỉnh
python scripts/word2vec_train.py \
  --data models/training_data_word2vec.json \
  --output models/word2vec.model \
  --vector-size 100 \      # Kích thước vector (default: 100)
  --window 5 \              # Cửa sổ ngữ cảnh (default: 5)
  --min-count 1 \           # Số lần xuất hiện tối thiểu (default: 1)
  --workers 4 \             # Số luồng CPU (default: 4)
  --sg 1                    # 1 = Skip-gram, 0 = CBOW (default: 1)
```

---

## ✅ Bước 5: Kiểm Tra Model Đã Train

### **Kiểm Tra File Model**:

```bash
# Kiểm tra file tồn tại
ls -lh server/models/word2vec.model*

# Nếu có file, model đã được train thành công!
```

### **Test Model Bằng Python**:

```python
from gensim.models import Word2Vec

# Load model
model = Word2Vec.load('server/models/word2vec.model')

# Kiểm tra vocabulary
print(f"Vocabulary size: {len(model.wv)}")
print(f"Sample words: {list(model.wv.key_to_index.keys())[:10]}")

# Test similarity
if 'debug' in model.wv and 'lỗi' in model.wv:
    similarity = model.wv.similarity('debug', 'lỗi')
    print(f"Similarity between 'debug' and 'lỗi': {similarity}")
```

---

## 🔧 Bước 6: Sử Dụng Word2Vec Trong Chatbot

### **Tự Động Sử Dụng**:

Sau khi train model, chatbot sẽ **tự động** sử dụng Word2Vec khi:
1. ✅ Model đã được train (file `server/models/word2vec.model` tồn tại)
2. ✅ User gửi câu hỏi
3. ✅ Hệ thống tìm training data tương tự bằng Word2Vec
4. ✅ Nếu không tìm thấy, fallback về keyword matching

### **Cách Hoạt Động**:

```
User hỏi: "Làm sao debug lỗi JavaScript?"

1. Preprocess: ["làm", "sao", "debug", "lỗi", "javascript"]
2. Tính vector cho câu hỏi
3. So sánh với vectors của tất cả training data
4. Tìm top 3 training data có similarity cao nhất
5. Sử dụng làm context cho AI response
```

### **Kiểm Tra Logs**:

Khi chatbot hoạt động, bạn sẽ thấy logs trong console:

```
[Training Data] Sử dụng Word2Vec để tìm training data tương tự
[Training Data] Word2Vec tìm thấy 3 kết quả tương tự
```

Nếu model chưa train:

```
[Training Data] Sử dụng keyword matching (fallback)
```

---

## 🔄 Bước 7: Tái Train Model

Khi có training data mới, bạn cần train lại:

```bash
npm run train-word2vec
```

Model cũ sẽ được ghi đè.

### **Khi Nào Cần Train Lại**:

- ✅ Thêm training data mới qua Admin Panel
- ✅ Extract training data mới từ ChatHistory
- ✅ Cập nhật training data cũ
- ✅ Muốn điều chỉnh parameters (vector-size, window, etc.)

> **Khuyến nghị**: Train lại định kỳ mỗi tuần/tháng hoặc khi có thêm 50-100 training data mới.

---

## 📝 Tóm Tắt Quy Trình

### **Cách 1: Qua Admin Panel**

```
1. Đăng nhập Admin Dashboard
2. Vào tab "Training Data AI" 🧠
3. Click "Thêm mới" để thêm training data thủ công
   HOẶC
   Click "Extract từ Chat" để extract từ ChatHistory
4. Kiểm tra training data đã đủ chưa
5. Chạy: npm run train-word2vec
6. Model được train và lưu tự động
```

### **Cách 2: Extract Từ ChatHistory**

```
1. User chat với chatbot và rate câu trả lời là "good"
2. Vào Admin Dashboard → tab "Training Data AI" 🧠
3. Click "Extract từ Chat"
4. Hệ thống tự động extract training data
5. Chạy: npm run train-word2vec
6. Model được train và lưu tự động
```

### **Cách 3: Train Với File JSON (Manual)**

```
1. Có file training_data.json với format database (question, answer, category, tags)
2. Convert sang format Word2Vec:
   cd server
   python scripts/convert_training_data.py
   → Tạo file: models/training_data_word2vec.json
3. Train Word2Vec model:
   python scripts/word2vec_train.py \
     --data models/training_data_word2vec.json \
     --output models/word2vec.model
4. Model được train và lưu
```

**Lưu ý**: 
- Format database: `[{question, answer, category, tags, priority}, ...]`
- Format Word2Vec: `[["word1", "word2", ...], ["word3", "word4", ...], ...]`
- Script `convert_training_data.py` tự động convert giữa 2 format

---

## 🎓 Ví Dụ Thực Tế

### **Ví Dụ 1: Train Với Training Data Thủ Công (Qua npm script)**

```bash
# 1. Thêm training data qua Admin Panel
# - Câu hỏi: "Làm sao debug lỗi JavaScript?"
# - Câu trả lời: "Để debug lỗi JavaScript, bạn có thể..."
# - Category: "javascript"
# - Tags: "javascript, debug, error"

# 2. Train model (tự động convert và train)
npm run train-word2vec

# 3. Test chatbot
# User hỏi: "Làm sao fix bug?"
# → Word2Vec sẽ tìm training data về "debug", "sửa lỗi", "fix bug"
```

### **Ví Dụ 2: Train Với Training Data Từ ChatHistory**

```bash
# 1. User chat với chatbot và rate câu trả lời là "good"

# 2. Extract từ Admin Panel
# - Click "Extract từ Chat" trong tab "Training Data AI"
# - Hệ thống extract tự động

# 3. Train model (tự động convert và train)
npm run train-word2vec

# 4. Model được train với dữ liệu mới
```

### **Ví Dụ 3: Train Với File JSON (Manual)**

Nếu bạn có file `training_data.json` với format database:

```bash
# 1. Convert training data sang format Word2Vec
cd server
python scripts/convert_training_data.py
# Output: models/training_data_word2vec.json

# 2. Train Word2Vec model
python scripts/word2vec_train.py \
  --data models/training_data_word2vec.json \
  --output models/word2vec.model

# 3. Model đã được train và lưu
```

---

## 🐛 Troubleshooting

### **Lỗi: "File dữ liệu không tồn tại"**

**Nguyên nhân**: Bạn đang chạy Python script trực tiếp mà không có file `training_data.json` hoặc `training_data_word2vec.json`.

**Giải pháp**:
```bash
# Cách 1: Sử dụng npm script (khuyến nghị)
npm run train-word2vec
# Script này sẽ tự động tạo file training_data.json từ MongoDB và train

# Cách 2: Convert và train thủ công
cd server
python scripts/convert_training_data.py
python scripts/word2vec_train.py --data models/training_data_word2vec.json --output models/word2vec.model
```

### **Lỗi: "TypeError: 'dict' object is not iterable" hoặc format không đúng**

**Nguyên nhân**: File `training_data.json` có format database (objects) nhưng script Word2Vec cần format array of arrays.

**Giải pháp**:
```bash
# Convert file sang format đúng trước khi train
cd server
python scripts/convert_training_data.py

# Sau đó train với file đã convert
python scripts/word2vec_train.py \
  --data models/training_data_word2vec.json \
  --output models/word2vec.model
```

### **Lỗi: "Không có training data"**

**Nguyên nhân**: Database chưa có training data hoặc tất cả đều `isActive = false`.

**Giải pháp**:
1. Kiểm tra training data: `npm run check-training-data`
2. Thêm training data qua Admin Panel
3. Hoặc extract từ ChatHistory

### **Lỗi: "ModuleNotFoundError: No module named 'gensim'"**

**Giải pháp**:
```bash
pip install gensim numpy
# Hoặc
pip install -r requirements.txt
```

### **Model Không Hoạt Động Tốt**

**Nguyên nhân có thể**:
1. Quá ít training data (< 50 entries)
2. Training data không đa dạng
3. Parameters không phù hợp

**Giải pháp**:
1. Thêm nhiều training data hơn (ít nhất 100-200 entries)
2. Đảm bảo training data đa dạng về chủ đề
3. Thử điều chỉnh parameters:
   - Tăng `vector_size` lên 150-200
   - Tăng `epochs` lên 15-20
   - Giảm `min_count` xuống 1

---

## 💡 Best Practices

### **1. Training Data Quality**:
- ✅ Có ít nhất 100-200 training data entries
- ✅ Đa dạng về chủ đề và cách diễn đạt
- ✅ Câu hỏi và câu trả lời rõ ràng, chính xác
- ✅ Có category và tags phù hợp

### **2. Regular Retraining**:
- ✅ Train lại khi có thêm 50-100 training data mới
- ✅ Train lại định kỳ (mỗi tuần/tháng)
- ✅ Train lại sau khi extract từ ChatHistory

### **3. Monitoring**:
- ✅ Theo dõi logs để biết Word2Vec có được sử dụng không
- ✅ Thu thập feedback từ users
- ✅ So sánh với keyword matching

---

## ✅ Checklist

Trước khi sử dụng Word2Vec:

- [ ] Python 3.7+ đã được cài đặt
- [ ] Gensim và NumPy đã được cài đặt (`pip install -r requirements.txt`)
- [ ] Đã thu thập training data (qua Admin Panel hoặc Extract từ ChatHistory)
- [ ] Có ít nhất 50-100 training data trong database
- [ ] Đã chạy `npm run train-word2vec` thành công
- [ ] File `server/models/word2vec.model` đã được tạo
- [ ] Đã test chatbot và thấy logs "[Training Data] Sử dụng Word2Vec"

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong console
2. Chạy `npm run check-training-data` để kiểm tra training data
3. Kiểm tra Python và dependencies đã cài đặt đúng chưa
4. Xem file `server/WORD2VEC_SETUP.md` để biết thêm chi tiết kỹ thuật

---

**Chúc bạn thành công! 🚀**

