# 🚀 Knowledge Graph Canvas - Quick Start

## ⚡ Bắt Đầu Nhanh (5 phút)

### 1. Cài đặt Dependencies

```bash
cd client
npm install react-force-graph-2d
```

### 2. Tạo Backend Files

```bash
# Tạo service
touch server/src/services/knowledgeGraphService.ts

# Tạo controller  
touch server/src/controllers/knowledgeGraph.controller.ts

# Tạo routes
touch server/src/routes/knowledgeGraph.routes.ts
```

Copy code từ `HUONG_DAN_KNOWLEDGE_GRAPH_CANVAS.md` vào các files trên.

### 3. Thêm Routes vào app.ts

```typescript
import knowledgeGraphRoutes from './routes/knowledgeGraph.routes';
app.use('/api/knowledge-graph', knowledgeGraphRoutes);
```

### 4. Tạo Frontend Component

```bash
touch client/src/components/admin/KnowledgeGraphCanvas.tsx
```

Copy component code từ hướng dẫn chi tiết.

### 5. Thêm vào Admin Dashboard

```typescript
// Import
import KnowledgeGraphCanvas from './KnowledgeGraphCanvas';
import { Network } from 'lucide-react';

// Thêm vào OTHER_TABS
{ 
  id: 'knowledge-graph', 
  icon: Network,
  label: { vi: 'Knowledge Graph', en: 'Knowledge Graph' }, 
  color: 'text-indigo-500' 
}

// Thêm vào render
{activeOtherTab === 'knowledge-graph' && <KnowledgeGraphCanvas />}
```

### 6. Test

```bash
# Start server
cd server && npm run dev

# Start client
cd client && npm run dev

# Mở Admin Dashboard → Knowledge Graph tab
```

## ✅ Checklist Tối Thiểu

- [ ] Cài `react-force-graph-2d`
- [ ] Tạo 3 backend files (service, controller, routes)
- [ ] Thêm routes vào app.ts
- [ ] Tạo frontend component
- [ ] Thêm vào Admin Dashboard
- [ ] Test API endpoint
- [ ] Test UI component

## 🎯 Kết Quả Mong Đợi

Sau khi hoàn thành, bạn sẽ có:
- ✅ Graph hiển thị training data như nodes
- ✅ Categories và tags như nodes riêng
- ✅ Links giữa training data và categories/tags
- ✅ Click node để xem chi tiết
- ✅ Search và filter
- ✅ Zoom controls

## 📖 Xem Hướng Dẫn Chi Tiết

Đọc file `HUONG_DAN_KNOWLEDGE_GRAPH_CANVAS.md` để biết:
- Kiến trúc chi tiết
- Customization options
- Tính năng nâng cao
- Troubleshooting

