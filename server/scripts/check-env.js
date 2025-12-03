// Script để kiểm tra cấu hình .env
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
    console.log('❌ File .env không tồn tại!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

console.log('📋 Kiểm tra cấu hình SMTP trong .env:\n');

let smtpHost = null;
let smtpPort = null;
let smtpSecure = null;
let smtpUser = null;
let smtpPass = null;
let smtpFrom = null;

lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('SMTP_')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        
        switch(key) {
            case 'SMTP_HOST':
                smtpHost = value;
                console.log(`✅ SMTP_HOST: ${value}`);
                break;
            case 'SMTP_PORT':
                smtpPort = value;
                console.log(`✅ SMTP_PORT: ${value}`);
                break;
            case 'SMTP_SECURE':
                smtpSecure = value;
                console.log(`✅ SMTP_SECURE: ${value}`);
                break;
            case 'SMTP_USER':
                smtpUser = value;
                console.log(`✅ SMTP_USER: ${value}`);
                break;
            case 'SMTP_PASS':
                smtpPass = value;
                // Kiểm tra xem có phải App Password không
                const isAppPassword = /^[a-z0-9]{16}$/i.test(value.replace(/\s/g, ''));
                if (isAppPassword) {
                    console.log(`✅ SMTP_PASS: ${'*'.repeat(16)} (App Password - OK)`);
                } else {
                    console.log(`⚠️  SMTP_PASS: ${'*'.repeat(value.length)} (CÓ VẤN ĐỀ!)`);
                    console.log(`   ❌ Đây KHÔNG phải App Password!`);
                    console.log(`   💡 App Password phải có 16 ký tự (chỉ chữ và số, không có ký tự đặc biệt)`);
                    console.log(`   📝 Hướng dẫn: https://myaccount.google.com/apppasswords`);
                }
                break;
            case 'SMTP_FROM':
                smtpFrom = value;
                // Kiểm tra format
                if (value.includes('<') && value.includes('>')) {
                    console.log(`⚠️  SMTP_FROM: ${value} (Format có thể gây lỗi)`);
                    console.log(`   💡 Nên dùng: ${value.match(/<([^>]+)>/)?.[1] || 'no-reply@bughunter.com'}`);
                } else {
                    console.log(`✅ SMTP_FROM: ${value}`);
                }
                break;
        }
    }
});

console.log('\n📊 Tóm tắt:');
console.log('─'.repeat(50));

if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.log('❌ Thiếu cấu hình SMTP cơ bản');
} else {
    console.log('✅ Đã có đủ cấu hình SMTP cơ bản');
}

if (smtpPass && !/^[a-z0-9]{16}$/i.test(smtpPass.replace(/\s/g, ''))) {
    console.log('❌ SMTP_PASS không phải App Password (16 ký tự)');
    console.log('\n🔧 Cách sửa:');
    console.log('1. Vào https://myaccount.google.com/apppasswords');
    console.log('2. Tạo App Password mới (Mail, Other device)');
    console.log('3. Copy App Password 16 ký tự (bỏ khoảng trắng)');
    console.log('4. Cập nhật SMTP_PASS trong .env');
} else if (smtpPass) {
    console.log('✅ SMTP_PASS có vẻ là App Password');
}

if (smtpFrom && smtpFrom.includes('<')) {
    console.log('⚠️  SMTP_FROM có format phức tạp, nên đơn giản hóa');
}

console.log('\n');

