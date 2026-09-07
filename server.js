const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Serve static files from root directory
app.use(express.static(__dirname));

// Express v5 catch-all handler
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('.')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`EduManager V2 Web Application running at http://localhost:${PORT}`);
});
