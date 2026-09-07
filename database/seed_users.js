const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

async function seedDefaultUsers() {
    try {
        console.log("=================================================");
        console.log("🚀 BẮT ĐẦU KHỞI TẠO TÀI KHOẢN ĐĂNG NHẬP (USERS) TRÊN SUPABASE");
        console.log("=================================================");

        const defaultUsers = [
            {
                username: 'admin',
                password_hash: 'admin123',
                full_name: 'Đặng Lê Anh (Chủ trung tâm)',
                role: 'ADMIN'
            },
            {
                username: 'cashier',
                password_hash: 'cashier123',
                full_name: 'Nguyễn Thị Thu Ngân',
                role: 'CASHIER'
            },
            {
                username: 'teacher',
                password_hash: 'teacher123',
                full_name: 'Thầy Trần Văn Anh',
                role: 'TEACHER'
            }
        ];

        for (const u of defaultUsers) {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify([u])
            });

            if (res.ok) {
                console.log(`✅ Khởi tạo tài khoản '${u.username}' (${u.role}) thành công.`);
            } else {
                console.log(`ℹ️ Tài khoản '${u.username}' đã tồn tại hoặc giữ nguyên.`);
            }
        }

        console.log("=================================================");
    } catch (err) {
        console.error("Lỗi khởi tạo users:", err);
    }
}

seedDefaultUsers();
