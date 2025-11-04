# 🚀 Deployment Guide cho 2-5 Users

## ✅ KẾT LUẬN: Hoàn toàn phù hợp!

Với **2-5 người dùng**, phương án Docker self-hosted + Gemini Pro hoàn toàn đủ và **MIỄN PHÍ**!

## 📊 Resource Requirements

### Với 2-5 users:
- **Submissions**: ~10-50 submissions/day
- **RAM**: 512MB - 1GB (đủ)
- **CPU**: 1 core (đủ)
- **Storage**: 5-10GB (đủ)
- **Bandwidth**: Rất thấp

### Judge0 Resources:
- **Judge0 container**: ~200-300MB RAM
- **Redis**: ~50MB RAM
- **PostgreSQL**: ~100MB RAM
- **Tổng**: ~400-500MB RAM

### Backend Resources:
- **Node.js server**: ~200-300MB RAM
- **MongoDB**: ~200-500MB RAM
- **Tổng**: ~500-800MB RAM

### **Tổng cộng**: ~1-1.5GB RAM (rất nhẹ!)

---

## 🎯 Phương án Deploy (Khuyến nghị)

### Option 1: Railway.app (Khuyến nghị nhất - FREE TIER)

**Ưu điểm**:
- ✅ **Free tier**: $5 credit/month (đủ cho 2-5 users)
- ✅ **Dễ deploy**: Chỉ cần connect GitHub
- ✅ **Auto-deploy**: Tự động deploy khi push code
- ✅ **Free PostgreSQL**: Database miễn phí
- ✅ **Free domain**: `.railway.app` domain

**Setup**:
1. Đăng ký: https://railway.app
2. Connect GitHub repo
3. Deploy với 1 click
4. Add PostgreSQL service (free)
5. Add Judge0 Docker (nếu cần)

**Chi phí**: ✅ **$0** (free tier đủ)

---

### Option 2: Render.com (FREE TIER)

**Ưu điểm**:
- ✅ **Free tier**: Web service + PostgreSQL miễn phí
- ✅ **Dễ deploy**: Tự động từ GitHub
- ✅ **Free SSL**: HTTPS tự động

**Hạn chế**:
- ❌ Free tier sleep sau 15 phút không dùng
- ❌ Judge0 cần chạy riêng (có thể dùng RapidAPI free tier)

**Chi phí**: ✅ **$0** (free tier)

---

### Option 3: VPS nhỏ (DigitalOcean/Linode)

**Ưu điểm**:
- ✅ **Không sleep**: Luôn chạy
- ✅ **Full control**: Làm gì cũng được
- ✅ **Stable**: Ổn định hơn free tier

**Setup**:
- DigitalOcean Droplet: $4/month (1GB RAM)
- Linode Nanode: $5/month (1GB RAM)

**Chi phí**: 💰 **$4-5/month**

---

### Option 4: Local Server (Nếu có máy cũ)

**Ưu điểm**:
- ✅ **Hoàn toàn miễn phí**
- ✅ **Full control**
- ✅ **Không giới hạn**

**Hạn chế**:
- ❌ Cần máy chạy 24/7
- ❌ Cần setup networking (port forwarding, DDNS)

**Chi phí**: ✅ **$0** (nếu có máy)

---

## 🏆 KHUYẾN NGHỊ: Railway.app (Option 1)

### Tại sao?
1. ✅ **Free tier đủ** cho 2-5 users
2. ✅ **Dễ deploy** nhất
3. ✅ **Auto-deploy** tự động
4. ✅ **Free database**
5. ✅ **Free domain**

### Setup Railway (15 phút):

#### Bước 1: Chuẩn bị code
```bash
# Đảm bảo có file railway.json hoặc Procfile
# Railway tự detect Node.js project
```

#### Bước 2: Deploy Backend
1. Vào https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Chọn repo của bạn
4. Chọn thư mục `server`
5. Railway tự động detect và deploy

#### Bước 3: Setup Environment Variables
Trong Railway dashboard, thêm:
```env
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-secret
JUDGE0_API_URL=http://localhost:2358
GEMINI_API_KEY=your-key
CLIENT_URL=https://your-app.railway.app
```

#### Bước 4: Deploy Frontend
1. Tạo service mới
2. Chọn thư mục `client`
3. Railway tự detect Vite/React
4. Deploy

#### Bước 5: Setup Judge0 (Optional)
- Option A: Dùng RapidAPI free tier (100 req/day đủ)
- Option B: Deploy Judge0 Docker trên Railway (cần paid plan)

**Với 2-5 users**: RapidAPI free tier **đủ dùng**!

---

## 📋 Deployment Checklist

### Backend:
- [ ] Code đã sẵn sàng
- [ ] Environment variables đã setup
- [ ] MongoDB connection string
- [ ] JWT secret đã set
- [ ] Judge0 URL (RapidAPI hoặc self-hosted)
- [ ] Gemini API key

### Frontend:
- [ ] API URL đã config đúng
- [ ] Build thành công
- [ ] Environment variables

### Judge0:
- [ ] Option A: RapidAPI free tier (đủ cho 2-5 users)
- [ ] Option B: Docker self-hosted (nếu muốn)

### Database:
- [ ] MongoDB Atlas (free tier) hoặc Railway PostgreSQL

---

## 💰 Cost Breakdown (2-5 users)

### Scenario: 5 users, mỗi user 2 submissions/day = 10 submissions/day

| Service | Option 1 (Railway) | Option 2 (Render) | Option 3 (VPS) |
|---------|-------------------|-------------------|----------------|
| **Backend** | ✅ Free | ✅ Free | 💰 $4-5/month |
| **Frontend** | ✅ Free | ✅ Free | Included |
| **Database** | ✅ Free | ✅ Free | Included |
| **Judge0** | ✅ RapidAPI Free | ✅ RapidAPI Free | ✅ Docker (free) |
| **Gemini** | ✅ Free | ✅ Free | ✅ Free |
| **Tổng** | ✅ **$0** | ✅ **$0** | 💰 **$4-5/month** |

---

## 🚀 Quick Start với Railway

### 1. Deploy Backend:

```bash
# Từ thư mục server
railway login
railway init
railway up
```

### 2. Setup Variables:

```bash
railway variables set MONGODB_URI=your-uri
railway variables set JWT_SECRET=your-secret
railway variables set GEMINI_API_KEY=your-key
railway variables set JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
railway variables set JUDGE0_API_KEY=your-key  # Nếu dùng RapidAPI
```

### 3. Deploy Frontend:

Tạo service mới trong Railway, chọn `client` folder.

---

## ⚡ Performance cho 2-5 Users

### Expected Response Times:
- **API calls**: < 500ms
- **Judge0 execution**: 1-3 seconds (tùy code)
- **Gemini analysis**: 2-5 seconds
- **Total submission**: 3-8 seconds

### Capacity:
- **Concurrent users**: 5 users (đủ)
- **Submissions/minute**: 10-20 (đủ)
- **Database size**: < 100MB (đủ)
- **Storage**: < 1GB (đủ)

---

## 🔧 Optimization Tips

### 1. MongoDB Atlas (Free Tier):
- 512MB storage (đủ cho 1000+ submissions)
- Free forever
- Setup: https://www.mongodb.com/cloud/atlas

### 2. Judge0 RapidAPI:
- 100 requests/day free
- Với 2-5 users: **Đủ dùng**
- Nếu cần thêm: $10/month (10,000 requests)

### 3. Gemini Pro:
- 15 requests/minute free
- 1,500 requests/day free
- **Đủ dùng** cho 2-5 users

### 4. Caching:
- Cache AI responses (giảm Gemini calls)
- Cache Judge0 results (giảm execution)

---

## 🐛 Troubleshooting

### Issue: Free tier sleep
**Giải pháp**: 
- Railway: Không sleep (paid feature)
- Render: Có thể dùng paid plan ($7/month) hoặc chấp nhận sleep

### Issue: Slow response
**Giải pháp**:
- Check Judge0 timeout settings
- Optimize database queries
- Add caching

### Issue: Out of memory
**Giải pháp**:
- Upgrade plan (Railway: $5/month)
- Hoặc optimize app (ít có khả năng với 2-5 users)

---

## 📊 Monitoring

### Railway Dashboard:
- CPU usage
- Memory usage
- Network traffic
- Logs

### Free tools:
- UptimeRobot (monitor uptime)
- Sentry (error tracking - free tier)

---

## ✅ Kết luận

### Với 2-5 users:

**✅ Hoàn toàn phù hợp!**

**Khuyến nghị**:
1. **Railway.app** (free tier) - Dễ nhất
2. **MongoDB Atlas** (free tier) - Database
3. **Judge0 RapidAPI** (free tier) - Đủ dùng
4. **Gemini Pro** (free tier) - Đủ dùng

**Tổng chi phí**: ✅ **$0** (hoàn toàn miễn phí!)

**Next steps**:
1. ✅ Setup Railway account
2. ✅ Deploy backend + frontend
3. ✅ Setup MongoDB Atlas
4. ✅ Test với 2-5 users
5. ✅ Monitor performance

---

## 🎯 Production Ready Checklist

- [ ] Environment variables đã set
- [ ] Database backup strategy
- [ ] Error monitoring (Sentry)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] SSL/HTTPS (Railway tự động)
- [ ] Custom domain (optional)
- [ ] Rate limiting (nếu cần)
- [ ] Logging setup

---

Chúc bạn deploy thành công! 🚀

