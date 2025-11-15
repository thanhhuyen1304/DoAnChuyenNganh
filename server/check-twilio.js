// Script để kiểm tra cấu hình Twilio trong .env
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');

// Load .env
const envPath = path.join(__dirname, '.env');
config({ path: envPath });

console.log('📱 Kiểm tra cấu hình Twilio trong .env:\n');

let twilioAccountSid = null;
let twilioAuthToken = null;
let twilioPhoneNumber = null;

// Đọc file .env
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('TWILIO_')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').trim();
            
            switch(key) {
                case 'TWILIO_ACCOUNT_SID':
                    twilioAccountSid = value;
                    if (value) {
                        if (value.startsWith('AC') && value.length >= 32) {
                            console.log(`✅ TWILIO_ACCOUNT_SID: ${value.substring(0, 4)}...${value.slice(-4)} (OK)`);
                        } else {
                            console.log(`⚠️  TWILIO_ACCOUNT_SID: ${value.substring(0, 4)}...${value.slice(-4)} (CÓ VẤN ĐỀ!)`);
                            console.log(`   ❌ Account SID thường bắt đầu bằng "AC" và có ít nhất 32 ký tự`);
                        }
                    }
                    break;
                case 'TWILIO_AUTH_TOKEN':
                    twilioAuthToken = value;
                    if (value) {
                        if (value.length >= 32) {
                            console.log(`✅ TWILIO_AUTH_TOKEN: ${'*'.repeat(8)}...${value.slice(-4)} (OK)`);
                        } else {
                            console.log(`⚠️  TWILIO_AUTH_TOKEN: ${'*'.repeat(value.length)} (CÓ VẤN ĐỀ!)`);
                            console.log(`   ❌ Auth Token thường có ít nhất 32 ký tự`);
                        }
                    }
                    break;
                case 'TWILIO_PHONE_NUMBER':
                    twilioPhoneNumber = value;
                    if (value) {
                        // Kiểm tra format
                        if (!value.startsWith('+')) {
                            console.log(`❌ TWILIO_PHONE_NUMBER: ${value} (THIẾU DẤU +)`);
                            console.log(`   💡 Phải bắt đầu bằng dấu + (ví dụ: +15551234567)`);
                        } else if (value.startsWith('+84')) {
                            console.log(`⚠️  TWILIO_PHONE_NUMBER: ${value} (CÓ VẤN ĐỀ!)`);
                            console.log(`   ❌ Số này có vẻ là số điện thoại Việt Nam thường, KHÔNG phải số Twilio!`);
                            console.log(`   💡 Số điện thoại Twilio thường bắt đầu bằng:`);
                            console.log(`      - +1 (Mỹ) - ví dụ: +15551234567`);
                            console.log(`      - +44 (Anh) - ví dụ: +442071234567`);
                            console.log(`      - +33 (Pháp) - ví dụ: +33123456789`);
                            console.log(`   💡 Bạn phải MUA số điện thoại từ Twilio (không phải số thường)`);
                            console.log(`   💡 Vào: https://console.twilio.com/us1/develop/phone-numbers/manage/search`);
                        } else if (value.startsWith('+1') || value.startsWith('+44') || value.startsWith('+33') || value.startsWith('+49')) {
                            console.log(`✅ TWILIO_PHONE_NUMBER: ${value} (Format OK)`);
                            console.log(`   ⚠️  Đảm bảo đây là số Twilio thực sự của bạn, không phải số thường!`);
                        } else {
                            console.log(`⚠️  TWILIO_PHONE_NUMBER: ${value} (Kiểm tra lại)`);
                            console.log(`   💡 Đảm bảo đây là số Twilio của bạn từ Twilio Console`);
                        }
                    }
                    break;
            }
        }
    });
} else {
    console.log('❌ File .env không tồn tại!');
    process.exit(1);
}

console.log('\n📊 Tóm tắt:');
console.log('─'.repeat(50));

if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.log('❌ Thiếu cấu hình Twilio cơ bản');
    console.log('\n💡 Cấu hình cần có:');
    console.log('   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    console.log('   TWILIO_AUTH_TOKEN=your-auth-token-here');
    console.log('   TWILIO_PHONE_NUMBER=+15551234567');
} else {
    console.log('✅ Đã có đủ cấu hình Twilio cơ bản');
    
    // Kiểm tra số điện thoại có phải số Twilio không
    if (twilioPhoneNumber.startsWith('+84')) {
        console.log('\n⚠️  CẢNH BÁO: Số điện thoại có vẻ không phải số Twilio!');
        console.log('   Số Twilio thường không phải số Việt Nam (+84)');
        console.log('   Bạn cần mua số điện thoại từ Twilio Console');
    } else {
        console.log('\n✅ Số điện thoại có format hợp lệ');
        console.log('   ⚠️  Đảm bảo số này là số Twilio thực sự của bạn!');
    }
}

console.log('\n🔍 Cách kiểm tra số Twilio:');
console.log('   1. Vào Twilio Console: https://console.twilio.com');
console.log('   2. Vào Phone Numbers > Manage > Active numbers');
console.log('   3. Kiểm tra xem số trong .env có trong danh sách không');
console.log('   4. Nếu không có, bạn cần mua số mới hoặc cập nhật số đúng\n');

// Test kết nối nếu có đủ thông tin
if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
    console.log('💡 Để test kết nối Twilio, chạy:');
    console.log('   npm run test-sms +84123456789\n');
}


