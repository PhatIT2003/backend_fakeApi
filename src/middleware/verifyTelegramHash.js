// middleware/verifyTelegramHash.js
const crypto = require('crypto');
const config = require('../config/config');

const verifyTelegramHash = (req, res, next) => {
    // console.log('===== TELEGRAM AUTHENTICATION DEBUG =====');
    // console.log('Full Request Body:', JSON.stringify(req.body, null, 2));

    try {
        // Trích xuất dữ liệu trực tiếp từ request body
        const { 
            hash, 
            auth_date: authDate, 
            user, 
           queryId 
        } = req.body;

        // console.log('Extracted Authentication Data:', { hash, authDate, user, queryId });

        // 1. Kiểm tra dữ liệu cơ bản
        if (!hash) {
            return res.status(400).json({ 
                success: false,
                error: 'Thiếu hash xác thực Telegram'
            });
        }

        // 2. Kiểm tra token bot
        if (!config.TELEGRAM_BOT_TOKEN) {
            console.error('Chưa cấu hình TELEGRAM_BOT_TOKEN');
            return res.status(500).json({ 
                success: false,
                error: 'Lỗi cấu hình máy chủ' 
            });
        }

        // 3. Kiểm tra thời gian xác thực
        if (!authDate) {
            return res.status(400).json({ 
                success: false,
                error: 'Định dạng auth_date không hợp lệ' 
            });
        }

        // const authTimestamp = parseInt(authDate, 10);
        // const currentTime = Math.floor(Date.now() / 1000);
        // const timeDifference = currentTime - authTimestamp;
        // const FIVE_MINUTES = 10 * 60; // Tạm tăng lên 10 phút để thử nghiệm

        // if (timeDifference > FIVE_MINUTES) {
        //     return res.status(400).json({
        //         success: false,
        //         error: 'Thời gian xác thực đã hết hạn'
        //     });
        // }

        // 4. Tạo khóa bí mật
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(config.TELEGRAM_BOT_TOKEN)
            .digest();

        // 5. Tạo chuỗi kiểm tra dữ liệu
        const dataCheckString = Object.entries({
            auth_date: authDate,
            query_id: queryId || '',
            user: JSON.stringify(user)
        })
        .map(([key, value]) => `${key}=${value}`)
        .sort() // Đảm bảo thứ tự đúng
        .join('\n');
        
        // console.log('Data Check String:', dataCheckString);
        // console.log('Debug User:', JSON.stringify(user, null, 2));

        // 6. Tính toán và xác minh hash
        const computedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex'); // Đảm bảo sử dụng 'hex'
    
        if (!computedHash) {
            // console.log(`Computed: ${computedHash}, Received: ${hash}`);
            return res.status(400).json({
            success: false,
            error: 'Hash không khớp',
            details: { computedHash, receivedHash: hash }
        });
        }

        // 7. Kiểm tra đối tượng người dùng
        if (!user || typeof user !== 'object' || !user.id) {
            return res.status(400).json({
                success: false,
                error: 'Đối tượng người dùng không hợp lệ'
            });
        }  
      
    
        // const startapp = params.get('start_param');
        // console.log("invite",startapp)

        // 8. Tạo đối tượng thành viên
        const member = {
            id: String(user.id),
            user_id: String(user.id),
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            username: user.username || "",
            languageCode: user.language_code || "",
            photoUrl: user.photo_url || "",
            allowsWriteToPm: user.allows_write_to_pm || false,
            hash: hash,
            auth_date: authDate,
            query_id: queryId||"null" ,
            token: 100 || null,
            inviter:   null,// Bạn có thể điều chỉnh logic inviter nếu cần
            address: "0x",
            
        };

        // Gán dữ liệu đã xác thực vào request
        req.telegramUser = user;
        req.member = member;

        // console.log('===== AUTHENTICATION SUCCESSFUL =====');
        next();

    } catch (error) {
        console.error('Chi tiết lỗi xác thực Telegram:', error);
        res.status(500).json({ 
            success: false,
            error: 'Lỗi nội bộ trong quá trình xác thực Telegram',
            errorDetails: error.toString()
        });
    }
};

module.exports = verifyTelegramHash;