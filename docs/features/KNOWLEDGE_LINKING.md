# Mô-đun Liên Kết Kiến Thức (Google CSE + YouTube)

## Tổng quan
- Mục tiêu: tự động đề xuất bài viết, tài liệu, video chất lượng liên quan nội dung người dùng đang học/sửa lỗi.
- API sử dụng: Google Custom Search API, YouTube Data API v3.
- Lớp xử lý: `externalKnowledgeService` (backend) + `SmartResourcePanel` (frontend).
- Bảo mật: API keys nằm trong server (env), không lộ ra client.

## Biến môi trường
Thêm vào `.env` (server):
```
GOOGLE_CSE_ID=your_cse_id
GOOGLE_API_KEY=your_google_key
YOUTUBE_API_KEY=your_youtube_key
EXTERNAL_RESOURCE_CACHE_TTL=900          # TTL cache (giây, mặc định 900)
EXTERNAL_RESOURCE_LIMIT=8                # Số kết quả tối đa mặc định
```

## Luồng xử lý
1. Frontend gửi `context` (tiêu đề + mô tả challenge) + bộ lọc (type, language, duration, difficulty) tới `/api/external-resources/suggest`.
2. Backend trích xuất keyword (`keywordExtractionService`), xây câu truy vấn và gọi song song:
   - Google CSE: bài viết/tài liệu.
   - YouTube Search + Videos: video + thống kê/độ dài.
3. Bộ lọc + xếp hạng:
   - Ưu tiên khớp ngôn ngữ, loại nội dung, thời lượng.
   - Điểm chất lượng dựa trên view/like (YouTube), cache hit, độ mới.
4. Cache TTL trong RAM để giảm chi phí, rate-limit 30 req/5 phút.
5. Người dùng gửi phản hồi POST `/api/external-resources/feedback` (thumb up/down) → lưu `ResourceFeedback`.

## Endpoints
- `GET /api/external-resources/suggest`
  - Query: `context`, `q`, `language`, `difficulty`, `types` (csv), `duration` (short|medium|long), `limit`.
  - Auth: bắt buộc JWT.
  - Trả về: danh sách `ExternalResource` + `warnings` nếu thiếu key.
- `POST /api/external-resources/feedback`
  - Body: `{ url, title?, rating: 'up'|'down', comment?, source?, language? }`
  - Auth: bắt buộc JWT.

## Frontend
- Component: `SmartResourcePanel`
  - Vị trí: trang Practice (dưới Knowledge Graph).
  - Bộ lọc: loại nội dung, thời lượng, ngôn ngữ.
  - Hiển thị: thumbnail, mô tả, thời lượng, điểm chất lượng, nguồn.
  - Phản hồi: nút upvote/downvote gọi `/feedback`.

## Kiểm thử nhanh
1. Cài key vào `.env` server, `npm install` (server) để thêm `express-rate-limit`.
2. Chạy backend: `npm run dev` trong `server/`.
3. Chạy frontend: `npm run dev` trong `client/`.
4. Đăng nhập → mở một challenge → xem "Liên kết kiến thức thông minh".
5. Thử lọc type/video, đổi ngôn ngữ, gửi feedback.

## Lưu ý/giới hạn
- Phản hồi giới hạn 2 giây nhờ cache + giới hạn kết quả (<=10).
- Nếu thiếu key, API vẫn trả về rỗng và warning, không lỗi 500.
- Cache nằm trong RAM (reset khi restart); cân nhắc Redis nếu cần nhân rộng.
```

