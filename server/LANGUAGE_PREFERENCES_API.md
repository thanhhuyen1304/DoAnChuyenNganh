# 🌐 Language Preferences API - Lưu Language Preferences vào Database

## 📋 Tổng Quan

API này cho phép user lưu và quản lý language preferences (ngôn ngữ yêu thích) vào database. Language preferences sẽ được sử dụng để:
- Gợi ý challenges phù hợp
- Filter challenges theo ngôn ngữ yêu thích
- Personalize learning experience

## 🔌 API Endpoints

### 1. GET /api/users/me/preferences

Lấy language preferences của user hiện tại.

**Request:**
```http
GET /api/users/me/preferences
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "favoriteLanguages": ["Python", "JavaScript", "Java"]
  }
}
```

**Status Codes:**
- `200 OK`: Thành công
- `401 Unauthorized`: Chưa đăng nhập
- `404 Not Found`: Không tìm thấy user
- `500 Internal Server Error`: Lỗi server

---

### 2. PATCH /api/users/me/preferences

Cập nhật language preferences của user hiện tại.

**Request:**
```http
PATCH /api/users/me/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "favoriteLanguages": ["Python", "JavaScript", "Java"]
}
```

**Request Body:**
- `favoriteLanguages` (array, required): Mảng các ngôn ngữ yêu thích
  - Valid values: `"Python"`, `"JavaScript"`, `"Java"`, `"C++"`, `"C#"`, `"C"`
  - Có thể chọn nhiều ngôn ngữ
  - Duplicates sẽ tự động bị loại bỏ

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật language preferences thành công",
  "data": {
    "favoriteLanguages": ["Python", "JavaScript", "Java"]
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Ngôn ngữ không hợp lệ: InvalidLang. Các ngôn ngữ hợp lệ: Python, JavaScript, Java, C++, C#, C"
}
```

**Status Codes:**
- `200 OK`: Cập nhật thành công
- `400 Bad Request`: Dữ liệu không hợp lệ
- `401 Unauthorized`: Chưa đăng nhập
- `404 Not Found`: Không tìm thấy user
- `500 Internal Server Error`: Lỗi server

---

### 3. PATCH /api/users/me (Backward Compatibility)

Cập nhật profile, bao gồm cả `favoriteLanguages` (để tương thích ngược).

**Request:**
```http
PATCH /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "avatar": "https://example.com/avatar.jpg",
  "favoriteLanguages": ["Python", "JavaScript"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "avatar": "https://example.com/avatar.jpg",
    "phone": "0123456789",
    "favoriteLanguages": ["Python", "JavaScript"]
  }
}
```

## 📝 Ví Dụ Sử Dụng

### JavaScript/TypeScript (Frontend)

```typescript
// Lấy preferences
async function getLanguagePreferences() {
  const response = await fetch('/api/users/me/preferences', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data.data.favoriteLanguages;
}

// Cập nhật preferences
async function updateLanguagePreferences(languages: string[]) {
  const response = await fetch('/api/users/me/preferences', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      favoriteLanguages: languages,
    }),
  });
  const data = await response.json();
  return data;
}

// Sử dụng
const languages = await getLanguagePreferences();
console.log('Current preferences:', languages);

await updateLanguagePreferences(['Python', 'JavaScript', 'Java']);
```

### cURL

```bash
# Lấy preferences
curl -X GET http://localhost:5000/api/users/me/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"

# Cập nhật preferences
curl -X PATCH http://localhost:5000/api/users/me/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "favoriteLanguages": ["Python", "JavaScript", "Java"]
  }'
```

## 🔒 Validation

### Valid Languages

Chỉ các ngôn ngữ sau được chấp nhận:
- `"Python"`
- `"JavaScript"`
- `"Java"`
- `"C++"`
- `"C#"`
- `"C"`

### Rules

1. **Array Required**: `favoriteLanguages` phải là một array
2. **Valid Values**: Mỗi ngôn ngữ phải nằm trong danh sách valid languages
3. **No Duplicates**: Duplicates sẽ tự động bị loại bỏ
4. **Empty Array Allowed**: Có thể set empty array `[]` để xóa tất cả preferences

## 💾 Database Schema

Language preferences được lưu trong collection `favorite` (MongoDB) với model `LanguagePreference`:

```typescript
{
  user_id: ObjectId,        // Reference to User
  type: 'language_preference', // To distinguish from favorite challenges
  languages: [{
    type: String,
    enum: ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'C'],
  }],
  updated_at: Date,
  created_at: Date,
}
```

**Collection**: `favorite` (shared với favorite challenges, phân biệt bằng field `type`)

**Index**: `{ user_id: 1, type: 1 }` (unique) - Mỗi user chỉ có một language preference record

## 🎯 Use Cases

### 1. User chọn ngôn ngữ yêu thích khi đăng ký

```typescript
// Sau khi đăng ký thành công
await updateLanguagePreferences(['Python', 'JavaScript']);
```

### 2. User cập nhật preferences trong settings

```typescript
// Trong Settings page
const handleLanguageChange = async (selectedLanguages: string[]) => {
  try {
    await updateLanguagePreferences(selectedLanguages);
    toast.success('Đã cập nhật language preferences!');
  } catch (error) {
    toast.error('Có lỗi xảy ra');
  }
};
```

### 3. Filter challenges theo preferences

```typescript
// Lấy preferences và filter challenges
const preferences = await getLanguagePreferences();
const challenges = await getChallenges({
  languages: preferences, // Filter theo ngôn ngữ yêu thích
});
```

### 4. Personalized recommendations

```typescript
// Sử dụng preferences để recommend challenges
const preferences = await getLanguagePreferences();
const recommendations = await getPersonalizedChallenges({
  preferredLanguages: preferences,
});
```

## 🔄 Integration với các Services khác

### Personalized Plan Service

Language preferences được sử dụng trong `personalizedPlanService` để:
- Recommend challenges phù hợp
- Build personalized learning path
- Filter content theo ngôn ngữ yêu thích

### Chatbot Service

Chatbot có thể sử dụng language preferences để:
- Gợi ý challenges theo ngôn ngữ yêu thích
- Tạo responses phù hợp với ngôn ngữ user đang học

## 🐛 Error Handling

### Invalid Language

```json
{
  "success": false,
  "message": "Ngôn ngữ không hợp lệ: InvalidLang. Các ngôn ngữ hợp lệ: Python, JavaScript, Java, C++, C#, C"
}
```

### Not Array

```json
{
  "success": false,
  "message": "favoriteLanguages phải là một mảng"
}
```

### Unauthorized

```json
{
  "success": false,
  "message": "Chưa xác thực"
}
```

## ✅ Testing

### Test với Postman

1. **GET Preferences**:
   - Method: GET
   - URL: `http://localhost:5000/api/users/me/preferences`
   - Headers: `Authorization: Bearer <token>`

2. **UPDATE Preferences**:
   - Method: PATCH
   - URL: `http://localhost:5000/api/users/me/preferences`
   - Headers: 
     - `Authorization: Bearer <token>`
     - `Content-Type: application/json`
   - Body:
     ```json
     {
       "favoriteLanguages": ["Python", "JavaScript"]
     }
     ```

## 📚 Related Files

- `server/src/models/user.model.ts` - User model với favoriteLanguages field
- `server/src/controllers/user.controller.ts` - Controllers cho preferences
- `server/src/routes/user.routes.ts` - Routes cho preferences API
- `server/src/services/personalizedPlanService.ts` - Sử dụng preferences để recommend

---

**Tóm lại**: API này cho phép user lưu và quản lý language preferences vào database, giúp personalize trải nghiệm học tập trên BugHunter! 🚀

