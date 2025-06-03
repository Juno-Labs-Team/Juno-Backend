const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./db'); // Test database connection

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Juno Rideshare API is running! 🚗' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});