const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 EDUMANAGER V2 SERVER RUNNING AT: http://localhost:${PORT}`);
    console.log(`   Trung Tâm Ngoại Ngữ Grow Web Application`);
    console.log(`=================================================`);
});
