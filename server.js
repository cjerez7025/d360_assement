const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback — all routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`D360° Assessment running on port ${PORT}`);
});
