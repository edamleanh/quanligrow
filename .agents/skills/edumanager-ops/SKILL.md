---
name: edumanager-ops
description: Operations, workflow, data management, server execution, and Excel export procedures for EduManager (quanligrow).
---

# EduManager Operations & Workflow Skill

This skill documents standard operations for managing the EduManager platform.

## Key Operations

### 1. Local Server Execution
Run the Express local backend on port 3005:
```bash
npm start
# or
node server.js
```
Access in browser: `http://localhost:3005`

### 2. Excel Generation Pipeline
1. Frontend sends student list JSON payload to `POST /api/export`.
2. Backend writes temporary `firebase_data.json`.
3. Backend invokes Python script: `python fill_template.py`.
4. `fill_template.py` processes template `file chuẩn.xlsx`, populates student blocks (max 25 students/block), and creates `DanhSachTruatXuat.zip`.
5. Backend serves `DanhSachTruatXuat.zip` to user and cleans up temporary JSON/ZIP files.

### 3. Database Maintenance Tools
All data fix / sync scripts are stored under `tools/`:
- `tools/check_data.py`: Run data verification check (`python tools/check_data.py`).
- `tools/upload_supabase.mjs`: Bulk upload data to Supabase.
- `tools/fix_stt.mjs`: Re-index student `STT` field sequentially.
- `tools/merge_duplicates.mjs`: Merge duplicate student entries by name/phone.

### 4. Supabase Integration
- Table: `ds_tong`
- Class Status Storage: Row where `STT = 99999` with JSON string in `Ghi chú`.
- Realtime Channel: `public:ds_tong` for live cross-device updates.
