const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Session middleware (required for passport)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', require('./routes/auth'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Juno Rideshare API is running! 🚗' });
});

// Debug route to check database
app.get('/debug/db', async (req, res) => {
  try {
    const usersResult = await pool.query('SELECT id, username, first_name, last_name, email, created_at FROM users');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    res.json({
      message: 'Database status',
      tables: tablesResult.rows.map(row => row.table_name),
      users: usersResult.rows,
      totalUsers: usersResult.rows.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Google OAuth: http://localhost:${PORT}/auth/google`);
});