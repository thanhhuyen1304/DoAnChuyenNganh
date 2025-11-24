# Hướng Dẫn Tích Hợp Word2Vec cho Chatbot

## Tổng Quan

Word2Vec được tích hợp vào chatbot BugHunter để cải thiện việc tìm kiếm training data. Thay vì chỉ tìm kiếm theo keyword matching, hệ thống giờ có thể hiểu ngữ nghĩa (semantic similarity) giữa các câu hỏi.

## Kiến Trúc

- **Training**: Sử dụng Python + Gensim để train Word2Vec model
- **Inference**: Node.js gọi Python script để tính vector và similarity
- **Fallback**: Nếu Word2Vec không khả dụng, tự động fallback về keyword matching

## Cài Đặt

### 1. Cài Đặt Python Dependencies

```bash
cd server
pip install -r requirements.txt
```

Hoặc:

```bash
pip install gensim>=4.3.1 numpy>=1.24.0
```

### 2. Train Word2Vec Model

```bash
npm run train-word2vec
```

Script sẽ:
1. Kết nối MongoDB
2. Lấy tất cả training data từ database
3. Preprocess và train Word2Vec model
4. Lưu model vào `server/models/word2vec.model`

### 3. Kiểm Tra Model Đã Train

Model sẽ được lưu tại: `server/models/word2vec.model`

## Cách Hoạt Động

### Training Process

1. **Thu thập dữ liệu**: Lấy tất cả training data từ database (question, answer, tags)
2. **Preprocess**: 
   - Chuyển lowercase
   - Tách từ
   - Loại bỏ stopwords (tiếng Việt và tiếng Anh)
   - Loại bỏ dấu câu không cần thiết
3. **Train**: Sử dụng Gensim Word2Vec với Skip-gram algorithm
4. **Lưu model**: Model được lưu để sử dụng sau này

### Inference Process

Khi người dùng hỏi:
1. **Preprocess user message**: Tách từ và xử lý tương tự training
2. **Tính vector**: Gọi Python script để tính vector cho câu hỏi
3. **Tìm similarity**: So sánh với vectors của tất cả training data
4. **Ranking**: Sắp xếp theo cosine similarity
5. **Trả về top results**: Lấy top N kết quả có similarity cao nhất

### Fallback

Nếu:
- Model chưa được train
- Python script không khả dụng
- Không tìm thấy kết quả tương tự (similarity < 0.3)

→ Hệ thống tự động fallback về keyword matching

## Tham Số Training

Default parameters:
- **Vector size**: 100 dimensions
- **Window**: 5 (cửa sổ ngữ cảnh)
- **Min count**: 1 (từ xuất hiện ít nhất 1 lần)
- **Workers**: 4 (số luồng CPU)
- **Algorithm**: Skip-gram (sg=1)
- **Epochs**: 10

Có thể điều chỉnh trong `server/scripts/word2vec_train.py`

## Tái Train Model

Khi có training data mới, chạy lại:

```bash
npm run train-word2vec
```

Model cũ sẽ được ghi đè.

## Troubleshooting

### Lỗi: "Cannot run Python script"

**Nguyên nhân**: Python chưa được cài đặt hoặc không có trong PATH

**Giải pháp**:
- Cài đặt Python 3.7+
- Đảm bảo `python` command khả dụng trong terminal

### Lỗi: "ModuleNotFoundError: No module named 'gensim'"

**Nguyên nhân**: Gensim chưa được cài đặt

**Giải pháp**:
```bash
pip install -r requirements.txt
```

### Lỗi: "Model chưa được train"

**Nguyên nhân**: Chưa chạy training script

**Giải pháp**:
```bash
npm run train-word2vec
```

### Model không hoạt động tốt

**Giải pháp**:
1. Kiểm tra số lượng training data (cần ít nhất 50-100 entries)
2. Thử điều chỉnh parameters (vector_size, window, epochs)
3. Xem logs để debug

## Monitoring

Logs sẽ hiển thị:
- `[Word2Vec]` - Logs từ Word2Vec service
- `[Training Data]` - Logs về việc tìm kiếm training data
- `[Word2Vec Python]` - Logs từ Python scripts

## Performance

- **Training time**: ~1-5 phút (tùy số lượng training data)
- **Inference time**: ~100-500ms mỗi query (tùy số lượng training data)
- **Model size**: ~10-50MB (tùy vocabulary size)

## Tương Lai

Có thể cải thiện:
1. Cache vectors để tăng tốc độ
2. Lưu vectors vào database để tránh tính toán lại
3. Sử dụng pretrained Vietnamese Word2Vec models
4. Fine-tuning với domain-specific data
5. Sử dụng sentence transformers thay vì Word2Vec

