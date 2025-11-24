// Dynamic import để tránh lỗi khi twilio chưa được cài đặt
let twilio: any = null;
let client: any = null;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

try {
    twilio = require('twilio');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    // Khởi tạo client Twilio nếu có cấu hình
    if (accountSid && authToken && twilio) {
        client = twilio(accountSid, authToken);
    }
} catch (err) {
    console.warn('[SMS Service] Twilio not available:', err instanceof Error ? err.message : 'Unknown error');
}

// Hàm normalize số điện thoại
const normalizePhoneNumber = (phone: string): string => {
    if (!phone) return phone;
    
    // Loại bỏ khoảng trắng và ký tự đặc biệt
    let normalized = phone.trim().replace(/[\s\-\(\)]/g, '');
    
    // Nếu đã có dấu +, giữ nguyên
    if (normalized.startsWith('+')) {
        return normalized;
    }
    
    // Nếu bắt đầu bằng 0 (số Việt Nam), thay bằng +84
    if (normalized.startsWith('0')) {
        normalized = '+84' + normalized.substring(1);
        return normalized;
    }
    
    // Nếu bắt đầu bằng 84 (không có 0), thêm dấu +
    if (normalized.startsWith('84')) {
        return '+' + normalized;
    }
    
    // Nếu là số ngắn (10 số), giả định là số Việt Nam
    if (normalized.length === 10 && /^\d+$/.test(normalized)) {
        return '+84' + normalized;
    }
    
    // Nếu không match pattern nào, thêm +84 (giả định Việt Nam)
    if (/^\d+$/.test(normalized)) {
        return '+84' + normalized;
    }
    
    return normalized;
};

export const sendSMS = async (to: string, message: string): Promise<{ success: boolean; message: string }> => {
    console.log('[SMS Service] ========================================');
    console.log('[SMS Service] 📱 Bắt đầu gửi SMS');
    console.log('[SMS Service] Số điện thoại gốc:', to);
    
    // Normalize số điện thoại
    const normalizedTo = normalizePhoneNumber(to);
    console.log('[SMS Service] Số điện thoại đã normalize:', normalizedTo);
    
    // Kiểm tra cấu hình Twilio
    console.log('[SMS Service] Kiểm tra cấu hình Twilio:');
    console.log('[SMS Service] - Client:', client ? '✅ Đã khởi tạo' : '❌ Chưa khởi tạo');
    console.log('[SMS Service] - From Number:', fromNumber || '❌ CHƯA CẤU HÌNH');
    console.log('[SMS Service] - Account SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Đã cấu hình' : '❌ CHƯA CẤU HÌNH');
    console.log('[SMS Service] - Auth Token:', process.env.TWILIO_AUTH_TOKEN ? '✅ Đã cấu hình' : '❌ CHƯA CẤU HÌNH');
    
    if (!client || !fromNumber) {
        console.log('[SMS Service] ⚠️ Twilio chưa được cấu hình đầy đủ');
        console.log('[SMS Service] SMS sẽ được log ra console (development mode)');
        console.log('[SMS Service] 📱 SMS would be sent:', { 
            original: to,
            normalized: normalizedTo,
            message,
            from: fromNumber || 'CHƯA CẤU HÌNH'
        });
        console.log('[SMS Service] ========================================');
        return {
            success: true,
            message: 'SMS logged to console (development mode - Twilio not configured)'
        };
    }

    // Validate số điện thoại đã normalize
    if (!normalizedTo.startsWith('+')) {
        console.error('[SMS Service] ❌ Số điện thoại không hợp lệ sau khi normalize:', normalizedTo);
        return {
            success: false,
            message: `Invalid phone number format: ${to} (normalized: ${normalizedTo})`
        };
    }

    try {
        console.log('[SMS Service] Đang gửi SMS...');
        console.log('[SMS Service] From:', fromNumber);
        console.log('[SMS Service] To (original):', to);
        console.log('[SMS Service] To (normalized):', normalizedTo);
        console.log('[SMS Service] Message:', message);
        
        const result = await client.messages.create({
            body: message,
            from: fromNumber,
            to: normalizedTo
        });
        
        console.log('[SMS Service] ✅ SMS đã được gửi thành công!');
        console.log('[SMS Service] Message SID:', result.sid);
        console.log('[SMS Service] Status:', result.status);
        
        return {
            success: true,
            message: 'SMS sent successfully'
        };
    } catch (error: any) {
        console.error('[SMS Service] ❌ Lỗi khi gửi SMS:', error?.message || error);
        console.error('[SMS Service] Chi tiết lỗi:', {
            code: error?.code,
            status: error?.status,
            message: error?.message,
            moreInfo: error?.moreInfo
        });
        
        // Hướng dẫn sửa lỗi
        if (error?.code === 21211) {
            console.error('[SMS Service] 💡 Số điện thoại không hợp lệ!');
            console.error('[SMS Service] 💡 Số gốc:', to);
            console.error('[SMS Service] 💡 Số đã normalize:', normalizedTo);
            console.error('[SMS Service] 💡 Số điện thoại phải có định dạng quốc tế (ví dụ: +84123456789)');
        } else if (error?.code === 21608 || error?.code === 21212 || error?.code === 21659) {
            console.error('[SMS Service] 💡 Số điện thoại Twilio không hợp lệ!');
            console.error('[SMS Service] 💡 Kiểm tra TWILIO_PHONE_NUMBER trong .env');
            console.error('[SMS Service] 💡 Số phải là số Twilio thực sự của bạn (không phải số thường)');
        } else if (error?.code === 20003) {
            console.error('[SMS Service] 💡 Lỗi xác thực Twilio!');
            console.error('[SMS Service] 💡 Kiểm tra TWILIO_ACCOUNT_SID và TWILIO_AUTH_TOKEN trong .env');
        } else if (error?.code === 21266) {
            console.error('[SMS Service] 💡 Số điện thoại nhận SMS không thể giống số Twilio!');
            console.error('[SMS Service] 💡 Sử dụng số điện thoại khác để nhận SMS');
        } else if (error?.code === 21408) {
            console.error('[SMS Service] 💡 Không có quyền gửi SMS đến số này!');
            console.error('[SMS Service] 💡 Nếu dùng tài khoản Trial, số phải được verify trước');
            console.error('[SMS Service] 💡 Vào: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
        }
        
        return {
            success: false,
            message: error?.message || 'Failed to send SMS'
        };
    }
};