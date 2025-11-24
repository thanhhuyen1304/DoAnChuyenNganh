// Script để test gửi SMS qua Twilio
import { config } from 'dotenv';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const twilio = require('twilio');

// Load .env
const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });

console.log('📱 Test gửi SMS qua Twilio\n');
console.log('Cấu hình Twilio:');
console.log(`- Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '***' + process.env.TWILIO_ACCOUNT_SID.slice(-4) : 'CHƯA CẤU HÌNH'}`);
console.log(`- Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '***' + process.env.TWILIO_AUTH_TOKEN.slice(-4) : 'CHƯA CẤU HÌNH'}`);
console.log(`- Phone Number: ${process.env.TWILIO_PHONE_NUMBER || 'CHƯA CẤU HÌNH'}\n`);

// Validate Twilio phone number format
if (process.env.TWILIO_PHONE_NUMBER && !process.env.TWILIO_PHONE_NUMBER.startsWith('+')) {
    console.error('❌ LỖI: TWILIO_PHONE_NUMBER phải có định dạng quốc tế (bắt đầu bằng +)');
    console.error(`   Hiện tại: ${process.env.TWILIO_PHONE_NUMBER}`);
    console.error(`   Ví dụ đúng: +1234567890 hoặc +84123456789`);
    console.error('\n💡 Cách sửa:');
    console.error('   1. Vào Twilio Console: https://console.twilio.com');
    console.error('   2. Vào Phone Numbers > Manage > Active numbers');
    console.error('   3. Copy số điện thoại Twilio của bạn (có dạng +1xxxxxxxxxx)');
    console.error('   4. Cập nhật TWILIO_PHONE_NUMBER trong .env với số đó\n');
    process.exit(1);
}

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.error('❌ Thiếu cấu hình Twilio! Vui lòng kiểm tra file .env');
    console.error('\n💡 Hướng dẫn cấu hình:');
    console.error('1. Đăng ký tài khoản tại https://www.twilio.com');
    console.error('2. Lấy Account SID và Auth Token từ Twilio Console');
    console.error('3. Lấy số điện thoại Twilio của bạn');
    console.error('4. Thêm vào .env:');
    console.error('   TWILIO_ACCOUNT_SID=your-account-sid');
    console.error('   TWILIO_AUTH_TOKEN=your-auth-token');
    console.error('   TWILIO_PHONE_NUMBER=+1234567890');
    console.error('\n⚠️  Nếu không cấu hình Twilio, SMS sẽ chỉ được log ra console (development mode)\n');
    process.exit(1);
}

const recipientPhone = process.argv[2];

if (!recipientPhone) {
    console.error('❌ Vui lòng cung cấp số điện thoại nhận SMS!');
    console.error('\nCách sử dụng:');
    console.error('  npm run test-sms +84123456789');
    console.error('\nLưu ý: Số điện thoại phải có định dạng quốc tế (bắt đầu bằng +)');
    process.exit(1);
}

// Validate phone number format
if (!recipientPhone.startsWith('+')) {
    console.error('❌ Số điện thoại phải có định dạng quốc tế (bắt đầu bằng +)');
    console.error('Ví dụ: +84123456789 (cho Việt Nam)');
    process.exit(1);
}

// Check if recipient phone is the same as Twilio phone
if (recipientPhone === process.env.TWILIO_PHONE_NUMBER) {
    console.error('❌ LỖI: Số điện thoại nhận SMS không thể giống số điện thoại Twilio!');
    console.error(`   Số Twilio (From): ${process.env.TWILIO_PHONE_NUMBER}`);
    console.error(`   Số nhận SMS (To): ${recipientPhone}`);
    console.error('\n💡 Giải thích:');
    console.error('   Bạn không thể gửi SMS cho chính số điện thoại Twilio của mình.');
    console.error('   Twilio không cho phép gửi SMS từ số A đến chính số A.');
    console.error('\n💡 Cách sửa:');
    console.error('   Sử dụng số điện thoại KHÁC để test (không phải số Twilio của bạn)');
    console.error('   Ví dụ:');
    console.error(`     npm run test-sms +84123456789  (số điện thoại khác)`);
    console.error(`     npm run test-sms +84987654321  (số điện thoại khác)`);
    console.error('\n⚠️  Lưu ý: Nếu dùng tài khoản Twilio Trial, số nhận SMS phải được verify trước.');
    console.error('   Vào: https://console.twilio.com/us1/develop/phone-numbers/manage/verified\n');
    process.exit(1);
}

console.log(`Đang gửi SMS test đến: ${recipientPhone}\n`);

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const testCode = Math.floor(100000 + Math.random() * 900000).toString();

async function sendTestSMS() {
    try {
        console.log('1. Đang kiểm tra kết nối Twilio...');
        // Test connection bằng cách lấy thông tin account
        const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        console.log(`   ✅ Kết nối Twilio thành công!`);
        console.log(`   Account: ${account.friendlyName}\n`);

        console.log('2. Đang kiểm tra số điện thoại Twilio...');
        // Lấy danh sách số điện thoại Twilio của tài khoản
        const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 20 });
        
        if (phoneNumbers.length === 0) {
            console.error('   ⚠️  Không tìm thấy số điện thoại Twilio nào trong tài khoản!');
            console.error('   💡 Bạn cần mua số điện thoại Twilio trước.');
            console.error('   💡 Vào: https://console.twilio.com/us1/develop/phone-numbers/manage/search\n');
        } else {
            console.log(`   ✅ Tìm thấy ${phoneNumbers.length} số điện thoại Twilio:`);
            phoneNumbers.forEach((phone: any, index: number) => {
                const isCurrent = phone.phoneNumber === process.env.TWILIO_PHONE_NUMBER;
                console.log(`   ${index + 1}. ${phone.phoneNumber} ${isCurrent ? '← (Đang dùng)' : ''}`);
            });
            
            // Kiểm tra xem số trong .env có trong danh sách không
            const found = phoneNumbers.find((phone: any) => phone.phoneNumber === process.env.TWILIO_PHONE_NUMBER);
            if (!found) {
                console.error(`\n   ❌ Số điện thoại ${process.env.TWILIO_PHONE_NUMBER} KHÔNG có trong tài khoản Twilio của bạn!`);
                console.error('   💡 Sử dụng một trong các số điện thoại ở trên.');
                console.error('   💡 Cập nhật TWILIO_PHONE_NUMBER trong .env với số đúng.\n');
                process.exit(1);
            } else {
                console.log(`   ✅ Số điện thoại ${process.env.TWILIO_PHONE_NUMBER} hợp lệ!\n`);
            }
        }

        console.log('3. Đang gửi SMS test...');
        const message = await client.messages.create({
            body: `Test SMS - BugHunter. Ma xac thuc: ${testCode}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: recipientPhone
        });

        console.log('   ✅ SMS đã được gửi thành công!');
        console.log(`   Message SID: ${message.sid}`);
        console.log(`   Status: ${message.status}`);
        console.log(`   From: ${message.from}`);
        console.log(`   To: ${message.to}`);
        console.log(`   Body: ${message.body}\n`);
        console.log('✅ Test thành công! Kiểm tra điện thoại của bạn.\n');
    } catch (error: any) {
        console.error('❌ Lỗi khi gửi SMS:');
        console.error(`   Message: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        console.error(`   Status: ${error.status}`);
        console.error(`   More Info: ${error.moreInfo}\n`);

        if (error.code === 21211) {
            console.error('⚠️  Số điện thoại không hợp lệ!');
            console.error('💡 Số điện thoại phải có định dạng quốc tế (ví dụ: +84123456789)');
            console.error('💡 Kiểm tra số điện thoại có đúng không\n');
        } else if (error.code === 21608 || error.code === 21212 || error.code === 21659) {
            console.error('⚠️  Số điện thoại Twilio không hợp lệ!');
            if (error.code === 21659) {
                console.error('💡 Lỗi: Số điện thoại không phải là số Twilio hoặc không thuộc tài khoản của bạn');
            } else {
                console.error('💡 Lỗi: Invalid From Number (caller ID)');
            }
            console.error('💡 Kiểm tra TWILIO_PHONE_NUMBER trong .env');
            console.error('💡 Số điện thoại phải:');
            console.error('   - Có định dạng quốc tế (bắt đầu bằng +)');
            console.error('   - Là số điện thoại Twilio THỰC SỰ của bạn (không phải số điện thoại thường)');
            console.error('   - Thuộc tài khoản Twilio hiện tại');
            console.error('   - Ví dụ: +15551234567 (số Twilio Mỹ) hoặc +442071234567 (số Twilio Anh)');
            console.error('\n💡 Cách lấy số điện thoại Twilio ĐÚNG:');
            console.error('   1. Vào Twilio Console: https://console.twilio.com');
            console.error('   2. Vào Phone Numbers > Manage > Active numbers');
            console.error('   3. Tìm số điện thoại Twilio của bạn (sẽ có dạng +1xxxxxxxxxx hoặc +44xxxxxxxxxx)');
            console.error('   4. Copy số đó (KHÔNG phải số điện thoại thường của bạn!)');
            console.error('   5. Cập nhật TWILIO_PHONE_NUMBER trong .env');
            console.error('\n⚠️  QUAN TRỌNG:');
            console.error('   - Số điện thoại Twilio KHÁC với số điện thoại thường của bạn');
            console.error('   - Bạn phải MUA số điện thoại từ Twilio (hoặc dùng số trial)');
            console.error('   - Nếu chưa có số, vào: https://console.twilio.com/us1/develop/phone-numbers/manage/search\n');
        } else if (error.code === 20003) {
            console.error('⚠️  Lỗi xác thực Twilio!');
            console.error('💡 Kiểm tra TWILIO_ACCOUNT_SID và TWILIO_AUTH_TOKEN trong .env');
            console.error('💡 Đảm bảo thông tin đăng nhập đúng\n');
        } else if (error.code === 21266) {
            console.error('⚠️  Lỗi: Số điện thoại nhận SMS không thể giống số điện thoại Twilio!');
            console.error('💡 Bạn không thể gửi SMS cho chính số điện thoại Twilio của mình.');
            console.error('💡 Sử dụng số điện thoại KHÁC để test.');
            console.error('\n💡 Nếu dùng tài khoản Twilio Trial:');
            console.error('   - Số nhận SMS phải được verify trước');
            console.error('   - Vào: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
            console.error('   - Thêm và verify số điện thoại muốn nhận SMS\n');
        } else if (error.code === 21408) {
            console.error('⚠️  Không có quyền gửi SMS đến số này!');
            console.error('💡 Tài khoản Twilio trial chỉ có thể gửi đến số đã verify');
            console.error('💡 Vào Twilio Console để verify số điện thoại: https://console.twilio.com/us1/develop/phone-numbers/manage/verified\n');
        } else if (error.code === 21610) {
            console.error('⚠️  Số điện thoại không được phép nhận SMS!');
            console.error('💡 Tài khoản Twilio trial có giới hạn');
            console.error('💡 Nâng cấp tài khoản hoặc verify số điện thoại\n');
        }

        process.exit(1);
    }
}

sendTestSMS();

