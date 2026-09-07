# SUPABASE PROJECT CREDENTIALS & CONNECTION CONFIG

Tài liệu này lưu trữ thông tin kết nối và API Key của dự án Supabase EduManager.

---

## 🔑 Thống Số Kết Nối Supabase (Project Credentials)

- **Supabase URL**: `https://pvlyaubewwhgzhirmwgi.supabase.co`
- **Supabase Anon / Publishable Key**: `sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw`
- **Database Engine**: PostgreSQL 15+
- **Table chính**: `ds_tong` (Flat table cũ) $\to$ Đang nâng cấp lên Schema 3NF mới trong [database/schema.sql](file:///c:/Users/ACER/Desktop/grow/database/schema.sql)

---

## 🛠️ Hướng Dẫn Kết Nối & Thực Thi SQL

### 1. Khởi tạo Supabase Client (JavaScript SDK)
```javascript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

### 2. Thực thi DDL Schema & Migration trên Supabase Dashboard
1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com).
2. Chọn project: `pvlyaubewwhgzhirmwgi`.
3. Vào mục **SQL Editor**.
4. Dán nội dung file [database/schema.sql](file:///c:/Users/ACER/Desktop/grow/database/schema.sql) và nhấn **Run** để khởi tạo bảng 3NF, Triggers, Views & RLS Policies.
5. Dán nội dung file [database/migration.sql](file:///c:/Users/ACER/Desktop/grow/database/migration.sql) và nhấn **Run** để chuyển đổi dữ liệu từ `ds_tong`.
