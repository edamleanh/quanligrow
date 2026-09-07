const fs = require('fs');

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

async function checkTableCount(tableName) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=count`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'count=exact'
        }
    });
    const countHeader = res.headers.get('content-range');
    if (countHeader) {
        return countHeader.split('/')[1];
    }
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
}

async function verify() {
    console.log("=================================================");
    console.log("🚀 KIỂM TRA DỮ LIỆU CSDL MỚI TRÊN SUPABASE");
    console.log("=================================================");

    const tables = ['subjects', 'students', 'classes', 'enrollments'];
    for (const t of tables) {
        const count = await checkTableCount(t);
        console.log(`✅ Bảng '${t}': ${count} bản ghi.`);
    }
    console.log("=================================================");
}

verify().catch(console.error);
