// Script để sửa format SMTP_FROM trong .env
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
    console.log('❌ File .env không tồn tại!');
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔧 Sửa cấu hình SMTP trong .env\n');

let envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
let modified = false;

// Sửa SMTP_FROM format
const newLines = lines.map(line => {
    if (line.trim().startsWith('SMTP_FROM=')) {
        const currentValue = line.split('=')[1]?.trim() || '';
        // Nếu có format "Name <email>", chỉ lấy email
        const emailMatch = currentValue.match(/<([^>]+)>/);
        if (emailMatch) {
            const newValue = emailMatch[1];
            console.log(`✅ Sửa SMTP_FROM: "${currentValue}" → "${newValue}"`);
            modified = true;
            return `SMTP_FROM=${newValue}`;
        }
    }
    return line;
});

if (modified) {
    fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
    console.log('\n✅ Đã sửa SMTP_FROM trong .env');
} else {
    console.log('ℹ️  SMTP_FROM đã đúng format');
}

console.log('\n⚠️  QUAN TRỌNG: Bạn vẫn cần sửa SMTP_PASS!');
console.log('📝 SMTP_PASS hiện tại KHÔNG phải App Password');
console.log('\n🔧 Cách sửa SMTP_PASS:');
console.log('1. Vào https://myaccount.google.com/apppasswords');
console.log('2. Đảm bảo đã bật 2-Step Verification');
console.log('3. Tạo App Password mới:');
console.log('   - App: Mail');
console.log('   - Device: Other (Custom name)');
console.log('   - Name: BugHunter');
console.log('4. Copy App Password 16 ký tự (ví dụ: abcd efgh ijkl mnop)');
console.log('5. Mở file server/.env và thay thế:');
console.log('   SMTP_PASS=Buithanhhao3105@');
console.log('   → SMTP_PASS=abcdefghijklmnop (bỏ khoảng trắng)');
console.log('\n✅ Sau khi sửa, restart server để áp dụng thay đổi.');

process.exit(0);

