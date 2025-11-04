# 📦 Hướng dẫn Cài đặt Dependencies cho Docker (Linux)

## 🎯 Mục đích

Bước này cài đặt các **dependencies** (thành phần phụ thuộc) cần thiết để Docker có thể hoạt động trên Linux.

## 📋 Tổng quan

Các dependencies cần cài:
- **ca-certificates**: Chứng chỉ SSL để kết nối an toàn
- **curl**: Tool để download files từ internet
- **gnupg**: Tool để verify GPG keys (bảo mật)
- **lsb-release**: Tool để xác định version Linux

---

## 🚀 Hướng dẫn Chi Tiết

### Bước 1: Mở Terminal

1. **Nhấn `Ctrl + Alt + T`** để mở Terminal
   - Hoặc tìm "Terminal" trong Applications
   - Hoặc nhấn `Super` (Windows key) và gõ "terminal"

2. **Terminal sẽ mở** với dòng prompt:
   ```bash
   username@computername:~$
   ```

### Bước 2: Kiểm tra quyền sudo

1. **Kiểm tra bạn có quyền sudo không**:
   ```bash
   sudo -v
   ```

2. **Nếu được hỏi password**, nhập password của user hiện tại
   - Khi gõ password, **không thấy ký tự hiển thị** (đây là bình thường)
   - Nhấn Enter sau khi gõ xong

3. **Nếu thấy dòng prompt lại** → ✅ Bạn có quyền sudo!

### Bước 3: Update Package List

**Lệnh**:
```bash
sudo apt update
```

**Giải thích**:
- `sudo`: Chạy với quyền admin
- `apt`: Package manager của Ubuntu/Debian
- `update`: Cập nhật danh sách packages từ repository

**Kết quả mong đợi**:
```
Hit:1 http://archive.ubuntu.com/ubuntu focal InRelease
Get:2 http://archive.ubuntu.com/ubuntu focal-updates InRelease
...
Fetched XXX kB in Xs
Reading package lists... Done
```

**Thời gian**: 10-30 giây (tùy internet)

**Nếu gặp lỗi**:
- "E: Could not get lock" → Đợi 1-2 phút rồi thử lại
- "E: Unable to locate package" → Kiểm tra internet connection

### Bước 4: Cài đặt Dependencies

**Lệnh**:
```bash
sudo apt install -y ca-certificates curl gnupg lsb-release
```

**Giải thích từng phần**:
- `sudo apt install`: Cài đặt packages
- `-y`: Tự động trả lời "yes" cho mọi câu hỏi (không cần xác nhận)
- `ca-certificates`: Chứng chỉ SSL
- `curl`: Tool download files
- `gnupg`: GPG encryption tool
- `lsb-release`: Linux Standard Base release info

**Kết quả mong đợi**:
```
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following NEW packages will be installed:
  ca-certificates curl gnupg lsb-release
...
Unpacking ca-certificates (2021xxx) ...
Setting up ca-certificates (2021xxx) ...
```

**Thời gian**: 30 giây - 2 phút

**Nếu được hỏi**:
- "Do you want to continue? [Y/n]" → Nhấn `Y` hoặc Enter

### Bước 5: Verify Dependencies đã cài

**Kiểm tra từng tool**:

#### Kiểm tra curl:
```bash
curl --version
```

**Kết quả mong đợi**:
```
curl 7.68.0 (x86_64-pc-linux-gnu) libcurl/7.68.0
...
```

#### Kiểm tra gnupg:
```bash
gpg --version
```

**Kết quả mong đợi**:
```
gpg (GnuPG) 2.2.19
...
```

#### Kiểm tra lsb-release:
```bash
lsb_release -a
```

**Kết quả mong đợi**:
```
No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 20.04.3 LTS
Release:        20.04
Codename:       focal
```

✅ **Nếu tất cả commands đều hiển thị version/info → Dependencies đã cài thành công!**

---

## 🐛 Troubleshooting

### Vấn đề 1: "E: Could not get lock"

**Lỗi**:
```
E: Could not get lock /var/lib/dpkg/lock-frontend
```

**Nguyên nhân**: Có process khác đang dùng apt (như Software Updater)

**Giải pháp**:
```bash
# Kiểm tra process nào đang dùng apt
sudo lsof /var/lib/dpkg/lock-frontend

# Nếu có process, đợi nó finish hoặc kill:
sudo killall apt apt-get

# Xóa lock files
sudo rm /var/lib/dpkg/lock-frontend
sudo rm /var/lib/apt/lists/lock

# Thử lại
sudo apt update
```

### Vấn đề 2: "E: Unable to locate package"

**Lỗi**:
```
E: Unable to locate package ca-certificates
```

**Nguyên nhân**: Repository chưa được update hoặc internet issue

**Giải pháp**:
```bash
# Update lại
sudo apt update

# Nếu vẫn lỗi, kiểm tra internet
ping google.com

# Nếu mất internet, fix network connection
```

### Vấn đề 3: "sudo: command not found"

**Lỗi**: Terminal không nhận diện `sudo`

**Nguyên nhân**: 
- Bạn đang dùng user không có quyền sudo
- Hoặc đang dùng root user (không cần sudo)

**Giải pháp**:
```bash
# Kiểm tra bạn có phải root không
whoami

# Nếu là root, bỏ "sudo" khỏi các lệnh:
apt update
apt install -y ca-certificates curl gnupg lsb-release

# Nếu không phải root và không có sudo, thêm user vào sudo group:
su -  # Chuyển sang root
usermod -aG sudo username  # Thay "username" bằng tên user của bạn
```

### Vấn đề 4: "Permission denied"

**Lỗi**: Không có quyền chạy lệnh

**Giải pháp**:
```bash
# Đảm bảo dùng sudo
sudo apt update

# Hoặc chuyển sang root (không khuyến nghị)
su -
```

### Vấn đề 5: "Package has unmet dependencies"

**Lỗi**: Package có dependencies chưa được resolve

**Giải pháp**:
```bash
# Fix dependencies
sudo apt --fix-broken install

# Update lại
sudo apt update

# Cài lại
sudo apt install -y ca-certificates curl gnupg lsb-release
```

---

## ✅ Checklist

Sau khi hoàn thành, kiểm tra:

- [ ] `sudo apt update` chạy thành công
- [ ] `sudo apt install -y ca-certificates curl gnupg lsb-release` chạy thành công
- [ ] `curl --version` hiển thị version
- [ ] `gpg --version` hiển thị version
- [ ] `lsb_release -a` hiển thị thông tin Linux

---

## 🎯 Next Steps

Sau khi cài xong dependencies, tiếp tục với:

**Bước tiếp theo**: Add Docker's GPG key
```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

---

## 💡 Tips

1. **Copy-paste lệnh**: Bạn có thể copy-paste từng lệnh vào terminal
2. **Nhấn Tab để autocomplete**: Khi gõ tên file/command, nhấn Tab để tự động hoàn thành
3. **History**: Nhấn mũi tên lên để xem lại lệnh đã chạy
4. **Clear screen**: Nhấn `Ctrl + L` để clear terminal

---

## 📚 Giải thích thêm về các Dependencies

### ca-certificates
- **Mục đích**: Chứng chỉ SSL/TLS để verify kết nối an toàn
- **Cần cho**: Download từ HTTPS URLs (như Docker repository)

### curl
- **Mục đích**: Tool command-line để download files từ internet
- **Cần cho**: Download Docker GPG key và files khác

### gnupg (GNU Privacy Guard)
- **Mục đích**: Tool để verify GPG signatures (bảo mật)
- **Cần cho**: Verify Docker repository là legitimate

### lsb-release
- **Mục đích**: Tool để xác định Linux distribution và version
- **Cần cho**: Docker cần biết version Linux để download đúng packages

---

Chúc bạn thành công! 🚀

