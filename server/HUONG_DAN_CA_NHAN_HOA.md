# 🧠 Hướng Dẫn Kiểm Tra Tính Năng Cá Nhân Hoá (Knowledge Graph)

## 1. Chuẩn Bị
- Backend: `npm run dev` (tại thư mục `server`)
- Frontend: `npm run dev` (tại thư mục `client`)
- Đăng nhập bằng tài khoản có submissions (ví dụ `admin@bughunter.com / admin123`)

## 2. API

### 2.1. Personalized Graph
```bash
curl -X GET http://localhost:5000/api/knowledge-graph/personalized \
  -H "Authorization: Bearer <TOKEN>"
```

Response:
```json
{
  "success": true,
  "data": {
    "profile": { ... },
    "recommendations": {
      "challenges": [...],
      "trainingData": [...]
    },
    "learningPath": [...],
    "graph": { "nodes": [...], "links": [...] }
  }
}
```

### 2.2. Thống kê graph
```bash
curl -X GET http://localhost:5000/api/knowledge-graph/stats \
  -H "Authorization: Bearer <TOKEN>"
```

## 3. Frontend Flow
1. Mở `http://localhost:5173`
2. Đăng nhập → vào Admin Dashboard
3. run dev
4. Chọn chế độ **Cá nhân hoá**
5. Kiểm tra:
   - Nodes highlight (cam: recommended training, tím: category cần luyện)
   - Profile summary card
   - Challenge/Training recommendations list
   - Learning path steps

## 4. Logic Tóm Tắt
- Thu thập submissions của user → build profile:
  - focusCategories = nhóm ít luyện
  - focusTags = tags đã quan tâm
  - preferredLanguages = ngôn ngữ thường dùng
- Scoring challenge/training data theo:
  - Category alignment
  - Tag matches
  - Difficulty phù hợp cấp độ
  - Language preference
- Knowledge graph được highlight dựa trên profile & recommendations.

## 5. Troubleshooting
| Vấn đề | Nguyên nhân | Cách xử lý |
| --- | --- | --- |
| Graph không highlight | User chưa có submissions | Tạo sample submissions hoặc seed training |
| 401 Unauthorized | Token hết hạn | Đăng nhập lại |
| Không có gợi ý | Chưa đủ dữ liệu | Hoàn thành vài challenge trước |

## 6. Ghi chú phát triển
- Service: `server/src/services/personalizedPlanService.ts`
- Controller: `knowledgeGraph.controller.ts` → `getPersonalizedGraph`
- Route: `GET /api/knowledge-graph/personalized`
- Frontend: `KnowledgeGraphCanvas.tsx`

Chúc bạn test thành công! 🎯

