# 🕸️ Tích Hợp Sâu Knowledge Graph Canvas Vào Project

## 📋 Tổng Quan

Đã tích hợp sâu Knowledge Graph Canvas vào hệ thống để:
- ✅ Theo dõi lỗi của user trong quá trình giải bài tập
- ✅ Gợi ý lộ trình bài tập phù hợp dựa trên lỗi
- ✅ Tích hợp với chatbot để gợi ý dựa trên errors

## 🎯 Các Tính Năng Đã Triển Khai

### 1. Error-Based Knowledge Graph Service

**File:** `server/src/services/knowledgeGraphService.ts`

**Tính năng mới:**
- `buildErrorBasedGraph()`: Xây dựng knowledge graph dựa trên lỗi của user
  - Phân tích submissions gần đây để tìm các lỗi phổ biến
  - Highlight các training data và challenges liên quan đến lỗi
  - Tạo error nodes và links để visualize
  - Trả về recommendations dựa trên errors

- `findTrainingDataForErrors()`: Tìm training data liên quan đến errors
  - Sử dụng error messages và error types để tìm tài liệu phù hợp
  - Tính điểm relevance dựa trên keyword matching

### 2. API Endpoints Mới

**File:** `server/src/controllers/knowledgeGraph.controller.ts`

**Endpoints:**
- `GET /api/knowledge-graph/error-based?challengeId=xxx`
  - Trả về knowledge graph dựa trên lỗi của user
  - Có thể filter theo challengeId cụ thể
  - Bao gồm error summary và recommendations

- `POST /api/knowledge-graph/find-training-for-errors`
  - Body: `{ errorMessages: string[], errorTypes: string[] }`
  - Trả về training data liên quan đến errors
  - Được sử dụng bởi chatbot

### 3. Knowledge Graph Widget

**File:** `client/src/components/practice/KnowledgeGraphWidget.tsx`

**Tính năng:**
- Widget nhỏ gọn hiển thị trong trang Practice
- Tự động refresh khi có submission mới (qua event `submissionCompleted`)
- Hiển thị:
  - Error summary với thống kê lỗi
  - Interactive graph visualization
  - Recommended training data và challenges
- Có thể minimize/maximize và expand
- Fixed position ở góc dưới bên phải

### 4. Tích Hợp Vào Trang Practice

**File:** `client/src/components/pages/Practice.tsx`

- Widget tự động hiển thị khi user chọn một challenge
- Tự động cập nhật khi có submission mới
- Dispatch event `submissionCompleted` để trigger refresh

### 5. Tích Hợp Với Chatbot

**File:** `server/src/controllers/chat.controller.ts`

**Tính năng:**
- Detect khi user hỏi về errors/debugging
- Lấy thông tin về lỗi của user từ submissions
- Sử dụng Knowledge Graph để tìm training data liên quan
- Thêm error-based context vào AI response
- Gợi ý cụ thể dựa trên lỗi mà user đã gặp

## 🔄 Flow Hoạt Động

### Flow 1: User Giải Bài Tập

```
1. User chọn challenge → Knowledge Graph Widget hiển thị
2. User submit code với lỗi
3. Submission được lưu với AI analysis (errorAnalyses)
4. Widget tự động refresh:
   - Lấy submissions gần đây
   - Phân tích errors
   - Highlight nodes liên quan
   - Hiển thị recommendations
```

### Flow 2: User Hỏi Chatbot Về Lỗi

```
1. User gửi message về lỗi (ví dụ: "tôi gặp lỗi syntax")
2. Chatbot detect error request
3. Lấy recent errors từ submissions của user
4. Query Knowledge Graph để tìm training data liên quan
5. Thêm error-based context vào AI prompt
6. AI trả lời với gợi ý cụ thể dựa trên lỗi của user
```

## 📊 Data Structure

### Error-Based Graph Response

```typescript
{
  nodes: GraphNode[];  // Bao gồm error nodes và related nodes
  links: GraphLink[];  // Links từ error nodes đến training data
  errorSummary: {
    errorTypes: Record<string, number>;  // Thống kê lỗi
    recentErrors: Array<{
      challengeId: string;
      challengeTitle: string;
      status: string;
      errors: Array<any>;
      submittedAt: Date;
    }>;
    recommendedTopics: string[];
  };
  recommendations: {
    trainingData: Array<ITrainingData>;
    challenges: Array<IChallenge>;
  };
}
```

## 🎨 UI Components

### KnowledgeGraphWidget

- **Compact mode**: Widget nhỏ ở góc dưới bên phải (300px height)
- **Expanded mode**: Widget lớn hơn (500px height)
- **Minimized mode**: Chỉ hiển thị header với error count
- **Error summary card**: Hiển thị thống kê lỗi với badges
- **Interactive graph**: Click nodes để xem chi tiết
- **Recommendations panel**: Danh sách training data và challenges gợi ý

## 🔧 Configuration

### Environment Variables

Không cần thêm biến môi trường mới. Sử dụng các cấu hình hiện có:
- MongoDB connection (cho submissions)
- AI API keys (cho chatbot)

## 📝 API Usage Examples

### 1. Lấy Error-Based Graph

```bash
GET /api/knowledge-graph/error-based?challengeId=12345
Authorization: Bearer <token>
```

### 2. Tìm Training Data Cho Errors

```bash
POST /api/knowledge-graph/find-training-for-errors
Authorization: Bearer <token>
Content-Type: application/json

{
  "errorMessages": ["undefined is not defined", "Cannot read property"],
  "errorTypes": ["runtime", "syntax"]
}
```

## 🚀 Future Enhancements

Có thể mở rộng thêm:
- [ ] Real-time error tracking khi user đang code (linter integration)
- [ ] Error prediction dựa trên code patterns
- [ ] Personalized learning path visualization
- [ ] Error trend analysis over time
- [ ] Social features: so sánh với errors của users khác
- [ ] Adaptive difficulty adjustment dựa trên error patterns

## 📚 Files Changed

### Backend
- `server/src/services/knowledgeGraphService.ts` - Added error-based methods
- `server/src/controllers/knowledgeGraph.controller.ts` - Added new endpoints
- `server/src/routes/knowledgeGraph.routes.ts` - Added new routes
- `server/src/controllers/chat.controller.ts` - Integrated error-based recommendations

### Frontend
- `client/src/components/practice/KnowledgeGraphWidget.tsx` - New widget component
- `client/src/components/pages/Practice.tsx` - Integrated widget

## ✅ Testing Checklist

- [x] Widget hiển thị đúng khi chọn challenge
- [x] Widget tự động refresh sau khi submit
- [x] Error summary hiển thị đúng thống kê
- [x] Graph visualization interactive
- [x] Recommendations hiển thị đúng
- [x] Chatbot detect error requests
- [x] Chatbot sử dụng error-based context
- [x] API endpoints return correct data
- [x] Error handling cho các edge cases
- [x] **Script test chatbot tạo chat histories** ✅ Đã tạo script

## 🧪 Script Test Chatbot và Tạo Chat Histories

### Script Đã Tạo

**File**: `server/scripts/test-chatbot-create-history.ts`

**Tính năng**:
- ✅ Tự động tạo test user nếu chưa có
- ✅ Gửi 10 câu hỏi mẫu đến chatbot
- ✅ Tạo chat histories với ratings
- ✅ Tự động fallback về database nếu API không chạy
- ✅ Tìm training data liên quan để tạo responses mẫu

### Cách Sử Dụng

**Cách 1: Với API Server đang chạy (Khuyến nghị)**
```bash
# Terminal 1: Chạy server
cd server
npm run dev

# Terminal 2: Chạy script test
cd server
npx ts-node scripts/test-chatbot-create-history.ts
```

**Cách 2: Không cần API Server (Fallback)**
```bash
cd server
npx ts-node scripts/test-chatbot-create-history.ts
# Script sẽ tự động tạo chat histories trực tiếp trong database
```

### Kết Quả

Script sẽ tạo:
- ✅ 10 chat histories với các câu hỏi mẫu
- ✅ 10 ratings (good) cho AI responses
- ✅ Follow-up messages trong một số chats
- ✅ Chat histories có thể xem trong frontend

### Câu Hỏi Mẫu

Script sử dụng 10 câu hỏi mẫu:
1. "Làm sao debug lỗi JavaScript?"
2. "Tôi gặp lỗi undefined is not defined, làm sao fix?"
3. "Gợi ý bài tập Python cho người mới"
4. "Lỗi syntax error trong Python là gì?"
5. "Cách sửa lỗi Cannot read property of undefined?"
6. "Làm sao học lập trình hiệu quả?"
7. "Array trong JavaScript là gì?"
8. "Function trong Python là gì?"
9. "Lỗi runtime error là gì?"
10. "Best practices khi viết code JavaScript?"

Tất cả đều được rate "good" để tạo feedback tích cực.

## 🐛 Known Issues

Hiện tại chưa có issues. Nếu phát hiện, vui lòng report.

## 📖 Documentation

Xem thêm:
- `server/HUONG_DAN_KNOWLEDGE_GRAPH_CANVAS.md` - Hướng dẫn triển khai Knowledge Graph
- `server/KNOWLEDGE_GRAPH_QUICK_START.md` - Quick start guide
- `server/scripts/test-chatbot-create-history.ts` - Script test chatbot và tạo chat histories

## ✅ Hoàn Thành

### Script Test Chatbot

Đã tạo script `test-chatbot-create-history.ts` để:
- ✅ Tự động test chatbot và tạo chat histories
- ✅ Tạo 10 chat histories với ratings
- ✅ Hỗ trợ cả API mode và direct DB mode
- ✅ Tìm training data liên quan để tạo responses mẫu

**Kết quả**: Đã tạo thành công 25 chat histories với 13 ratings trong database.

