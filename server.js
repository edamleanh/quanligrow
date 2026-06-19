const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 3005;

// Increase limit for large JSON payload
app.use(express.json({ limit: '50mb' }));
app.use(cors());
// Serve static files from current directory
app.use(express.static(__dirname));

const classStatusFile = path.join(__dirname, 'class_status.json');

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

app.post('/api/class-status', (req, res) => {
    try {
        fs.writeFileSync(classStatusFile, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/export', (req, res) => {
    console.log("Saving data from frontend to temporary file...");
    try {
        fs.writeFileSync('firebase_data.json', JSON.stringify(req.body, null, 2));
    } catch (e) {
        console.error("Failed to write JSON:", e);
        return res.status(500).json({ success: false, message: 'Lỗi khi lưu dữ liệu tạm', error: e.message });
    }
    
    console.log("Starting Python extraction script...");
    exec('python fill_template.py', (error, stdout, stderr) => {
        if (stdout && stdout.includes('ERROR:')) {
            const errorLine = stdout.split('\n').find(line => line.includes('ERROR:'));
            return res.status(500).json({ success: false, message: 'Có file đang được mở, vui lòng đóng Excel và thử lại.', error: errorLine });
        }
        
        if (error) {
            console.error(`Error executing script: ${error.message}`);
            return res.status(500).json({ success: false, message: 'Lỗi khi trích xuất file', error: error.message });
        }

        console.log(`Script stdout: ${stdout}`);
        
        // Gửi file ZIP về cho trình duyệt
        const zipPath = path.join(__dirname, 'DanhSachTruatXuat.zip');
        if (fs.existsSync(zipPath)) {
            res.download(zipPath, 'DanhSachCacLop.zip', (err) => {
                if (err) {
                    console.error('Lỗi khi gửi file:', err);
                }
            });
        } else {
            res.status(500).json({ success: false, message: 'Không tìm thấy file ZIP đã tạo.' });
        }
    });
});

app.listen(port, () => {
    console.log(`Web server đang chạy tại http://localhost:${port}`);
});
