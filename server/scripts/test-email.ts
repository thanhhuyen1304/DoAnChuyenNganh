// Script để test gửi email SMTP
import { config } from 'dotenv';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemailer = require('nodemailer');

// Load .env
const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });

console.log('📧 Test gửi email SMTP\n');
console.log('Cấu hình SMTP:');
console.log(`- Host: ${process.env.SMTP_HOST || 'CHƯA CẤU HÌNH'}`);
console.log(`- Port: ${process.env.SMTP_PORT || 'CHƯA CẤU HÌNH'}`);
console.log(`- User: ${process.env.SMTP_USER || 'CHƯA CẤU HÌNH'}`);
console.log(`- Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'CHƯA CẤU HÌNH'}`);
console.log(`- From: ${process.env.SMTP_FROM || 'CHƯA CẤU HÌNH'}\n`);

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Thiếu cấu hình SMTP! Vui lòng kiểm tra file .env');
    process.exit(1);
}

const recipientEmail = process.argv[2] || process.env.SMTP_USER;

console.log(`Đang gửi email test đến: ${recipientEmail}\n`);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function sendTestEmail() {
    try {
        console.log('1. Đang kiểm tra kết nối SMTP...');
        await transporter.verify();
        console.log('   ✅ Kết nối SMTP thành công!\n');

        console.log('2. Đang gửi email test...');
        const testCode = Math.floor(100000 + Math.random() * 900000).toString();
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: recipientEmail,
            subject: 'Test Email - BugHunter',
            text: `Đây là email test. Mã xác thực: ${testCode}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Test Email - BugHunter</h2>
                    <p>Đây là email test để kiểm tra cấu hình SMTP.</p>
                    <p style="font-size: 24px; font-weight: bold; color: #007bff; text-align: center; padding: 20px; background: #f0f0f0; border-radius: 5px; margin: 20px 0;">
                        Mã test: ${testCode}
                    </p>
                    <p>Nếu bạn nhận được email này, cấu hình SMTP đã hoạt động đúng!</p>
                </div>
            `
        });

        console.log('   ✅ Email đã được gửi thành công!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}\n`);
        console.log('✅ Test thành công! Kiểm tra hộp thư đến của bạn.\n');
    } catch (error: any) {
        console.error('❌ Lỗi khi gửi email:');
        console.error(`   Message: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        console.error(`   Response: ${error.response}`);
        console.error(`   ResponseCode: ${error.responseCode}\n`);

        if (error.code === 'EAUTH' || error.responseCode === 535) {
            console.error('⚠️  Lỗi xác thực! Có thể bạn đang dùng mật khẩu Gmail thông thường thay vì App Password.');
            console.error('💡 Hướng dẫn:');
            console.error('   1. Vào https://myaccount.google.com/apppasswords');
            console.error('   2. Tạo App Password mới');
            console.error('   3. Cập nhật SMTP_PASS trong .env\n');
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            console.error('⚠️  Không thể kết nối đến SMTP server!');
            console.error('💡 Kiểm tra:');
            console.error('   - SMTP_HOST và SMTP_PORT có đúng không?');
            console.error('   - Firewall có chặn kết nối không?');
            console.error('   - Internet có kết nối không?\n');
        }

        process.exit(1);
    }
}

sendTestEmail();

