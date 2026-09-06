const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3005;

// Middleware configuration
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Serve static files from current directory
app.use(express.static(__dirname));

const classStatusFile = path.join(__dirname, 'class_status.json');
const tempJsonFile = path.join(__dirname, 'firebase_data.json');
const zipPath = path.join(__dirname, 'DanhSachTruatXuat.zip');

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'EduManager Express Server', 
        timestamp: new Date().toISOString() 
    });
});

// GET Class Status
app.get('/api/class-status', (req, res) => {
    try {
        if (fs.existsSync(classStatusFile)) {
            const data = fs.readFileSync(classStatusFile, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.json({});
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST Class Status
app.post('/api/class-status', (req, res) => {
    try {
        fs.writeFileSync(classStatusFile, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST Export Excel ZIP
app.post('/api/export', (req, res) => {
    console.log("[EXPORT] Ghi dữ liệu tạm ra firebase_data.json...");
    try {
        fs.writeFileSync(tempJsonFile, JSON.stringify(req.body, null, 2));
    } catch (e) {
        console.error("[EXPORT] Lỗi khi ghi JSON:", e);
        return res.status(500).json({ success: false, message: 'Lỗi khi lưu dữ liệu tạm', error: e.message });
    }
    
    console.log("[EXPORT] Khởi chạy script python fill_template.py...");
    exec('python fill_template.py', { cwd: __dirname }, (error, stdout, stderr) => {
        if (stdout && stdout.includes('ERROR:')) {
            const errorLine = stdout.split('\n').find(line => line.includes('ERROR:'));
            return res.status(500).json({ success: false, message: 'Có file đang mở hoặc lỗi xử lý Excel.', error: errorLine });
        }
        
        if (error) {
            console.error(`[EXPORT] Lỗi thực thi script: ${error.message}`);
            return res.status(500).json({ success: false, message: 'Lỗi khi trích xuất file', error: error.message });
        }

        console.log(`[EXPORT] Script stdout: ${stdout}`);
        
        if (fs.existsSync(zipPath)) {
            res.download(zipPath, 'DanhSachCacLop.zip', (err) => {
                if (err) {
                    console.error('[EXPORT] Lỗi khi gửi file ZIP:', err);
                }
                // Dọn dẹp file ZIP và JSON tạm sau khi gửi xong
                try {
                    if (fs.existsSync(tempJsonFile)) fs.unlinkSync(tempJsonFile);
                    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
                } catch (cleanupErr) {
                    console.warn('[EXPORT] Cảnh báo khi dọn dẹp file tạm:', cleanupErr);
                }
            });
        } else {
            res.status(500).json({ success: false, message: 'Không tìm thấy file ZIP đã tạo.' });
        }
    });
});

app.listen(port, () => {
    console.log(`🚀 EduManager Web Server đang chạy tại http://localhost:${port}`);
});

