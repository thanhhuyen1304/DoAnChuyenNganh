# 🤖 Personalization System (ML-based) - Tích Hợp favoriteLanguages

## 📋 Tổng Quan

Hệ thống cá nhân hóa dựa trên Machine Learning để recommend challenges và training data phù hợp với từng user, tích hợp với `favoriteLanguages` preferences.

## 🎯 Tính Năng

### 1. User Profile Building

**ML-based Features**:
- ✅ `favoriteLanguages`: Từ user preferences (explicit)
- ✅ `preferredLanguages`: Từ submission behavior (implicit)
- ✅ `combinedLanguages`: Kết hợp và ưu tiên
- ✅ `languageProficiency`: Điểm thành thạo (0-1) cho mỗi ngôn ngữ
- ✅ `categoryProficiency`: Điểm thành thạo (0-1) cho mỗi category
- ✅ `difficultyProgression`: Tỷ lệ thành công theo độ khó
- ✅ `learningVelocity`: Tốc độ học (challenges/day)
- ✅ `errorPatterns`: Patterns lỗi phổ biến

### 2. Recommendation Algorithm

**Hybrid Approach**:
- **Content-based Filtering**: Dựa trên features của challenges
- **Collaborative Filtering**: Dựa trên users tương tự
- **ML-based Scoring**: Sử dụng proficiency scores và learning patterns

### 3. Language Priority

**Ưu tiên**:
1. `favoriteLanguages` (explicit preferences) - **Highest priority**
2. `preferredLanguages` (behavior-based) - Medium priority
3. Other languages - Lower priority

## 🔧 Cách Hoạt Động

### 1. Build User Profile

```typescript
const profile = await personalizedPlanService.buildPlan(userId);
```

**Process**:
1. Lấy `favoriteLanguages` từ `LanguagePreference` collection
2. Phân tích submissions để tính:
   - Language proficiency scores
   - Category proficiency scores
   - Difficulty progression
   - Learning velocity
   - Error patterns
3. Kết hợp explicit preferences với behavior data

### 2. Challenge Recommendations

**Scoring Factors**:
- **Language Match** (35% weight):
  - `favoriteLanguages`: +0.35 score
  - `preferredLanguages`: +0.20 score
  - Proficiency bonus: +0.10 if proficiency > 0.7
- **Category Focus** (35% weight):
  - Focus categories: +0.35
  - Category proficiency: +0.10 (sweet spot 0.5-0.8)
- **Difficulty** (20% weight):
  - Target difficulty match: +0.20
  - Difficulty progression: +0.08 (optimal 0.6-0.9)
- **Tags** (15% weight):
  - Focus tags match: +0.15
- **Freshness** (10% weight):
  - Recent challenges: +0.10
- **Collaborative Filtering** (15% bonus):
  - Popular among similar users: +0.15

### 3. Collaborative Filtering

Tìm challenges được users tương tự (cùng language preferences, experience level) yêu thích:

```typescript
// Find similar users based on:
// - Language preferences (favoriteLanguages)
// - Experience level
// - Focus categories
// - Completed challenges
```

## 📊 ML Features

### Language Proficiency

```typescript
languageProficiency[lang] = successes / attempts
// Example: Python: 0.85 (85% success rate)
```

### Category Proficiency

```typescript
categoryProficiency[category] = successes / attempts
// Example: Syntax: 0.70, Logic: 0.50
```

### Difficulty Progression

```typescript
difficultyProgression[difficulty] = successes / attempts
// Example: Easy: 0.90, Medium: 0.65, Hard: 0.40
```

### Learning Velocity

```typescript
learningVelocity = totalAccepted / timeSpanDays
// Example: 2.5 challenges/day
```

### Error Patterns

```typescript
errorPatterns[pattern] = count
// Example: "Python-syntax": 5, "JavaScript-runtime": 3
```

## 🎨 Scoring Algorithm

### Challenge Scoring

```typescript
score = 
  languageMatchScore * 0.35 +
  categoryFocusScore * 0.35 +
  difficultyMatchScore * 0.20 +
  tagMatchScore * 0.15 +
  freshnessScore * 0.10 +
  collaborativeFilteringBonus * 0.15
```

### Language Match Scoring

```typescript
if (favoriteLanguages.includes(language)) {
  score += 0.35; // Highest priority
  if (languageProficiency[language] > 0.7) {
    score += 0.10; // Proficiency bonus
  }
} else if (preferredLanguages.includes(language)) {
  score += 0.20; // Medium priority
} else {
  score += 0.05; // Lower priority
}
```

## 📝 API Usage

### Get Personalized Plan

```typescript
GET /api/knowledge-graph/personalized
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "profile": {
      "userId": "...",
      "favoriteLanguages": ["Python", "JavaScript"],
      "preferredLanguages": ["Python", "JavaScript", "Java"],
      "combinedLanguages": ["Python", "JavaScript", "Java"],
      "languageProficiency": {
        "Python": 0.85,
        "JavaScript": 0.70
      },
      "categoryProficiency": {
        "Syntax": 0.80,
        "Logic": 0.60
      },
      "learningVelocity": 2.5,
      ...
    },
    "recommendations": {
      "challenges": [...],
      "trainingData": [...]
    },
    "learningPath": [...],
    "graph": {...}
  }
}
```

## 🔄 Integration với favoriteLanguages

### 1. Lấy favoriteLanguages

```typescript
// Priority: LanguagePreference collection > User model
const languagePreference = await LanguagePreference.findOne({
  user_id: userId,
  type: 'language_preference'
});

const favoriteLanguages = languagePreference?.languages || user.favoriteLanguages || [];
```

### 2. Kết hợp với Behavior Data

```typescript
const combinedLanguages = [
  ...favoriteLanguages, // Explicit preferences first
  ...preferredLanguages.filter(lang => !favoriteLanguages.includes(lang))
].slice(0, 5);
```

### 3. Ưu tiên trong Recommendations

- Challenges với `favoriteLanguages` được ưu tiên cao nhất
- Bonus score nếu user có proficiency cao trong favorite language
- Collaborative filtering tìm users với cùng favorite languages

## 🚀 ML Improvements

### 1. Proficiency-based Recommendations

- Recommend challenges phù hợp với proficiency level
- Avoid too easy (proficiency > 0.9) hoặc too hard (proficiency < 0.3)
- Target sweet spot (0.5-0.8) để maximize learning

### 2. Learning Velocity Consideration

- Active learners (velocity > 0.5): Recommend newer challenges
- Slow learners (velocity < 0.2): Recommend easier challenges

### 3. Error Pattern Analysis

- Identify common error patterns
- Recommend training data để fix patterns
- Suggest challenges để practice avoiding patterns

### 4. Collaborative Filtering

- Find similar users based on:
  - Language preferences
  - Experience level
  - Focus categories
- Boost challenges popular among similar users

## 📈 Performance Metrics

### Recommendation Quality

- **Precision**: % recommended challenges user actually likes
- **Recall**: % relevant challenges found
- **Diversity**: Variety in recommendations
- **Novelty**: New challenges not seen before

### User Engagement

- **Click-through Rate**: % recommendations clicked
- **Completion Rate**: % recommended challenges completed
- **Time to Complete**: Average time to complete recommended challenges

## 🔧 Configuration

### Scoring Weights

Có thể điều chỉnh weights trong `recommendChallenges()`:

```typescript
// Current weights
languageMatch: 0.35
categoryFocus: 0.35
difficultyMatch: 0.20
tagMatch: 0.15
freshness: 0.10
collaborativeFiltering: 0.15 (bonus)
```

### Proficiency Thresholds

```typescript
// Sweet spot for recommendations
categoryProficiency: 0.5 - 0.8
difficultyProgression: 0.6 - 0.9
languageProficiency: > 0.7 (for bonus)
```

## 📚 Related Files

- `server/src/services/personalizedPlanService.ts` - Main service
- `server/src/models/languagePreference.model.ts` - Language preferences model
- `server/src/controllers/knowledgeGraph.controller.ts` - API controller
- `server/LANGUAGE_PREFERENCES_API.md` - Language preferences API

---

**Tóm lại**: Hệ thống cá nhân hóa ML-based đã được tích hợp với favoriteLanguages, sử dụng hybrid approach (content-based + collaborative filtering) để recommend challenges và training data phù hợp nhất! 🚀

