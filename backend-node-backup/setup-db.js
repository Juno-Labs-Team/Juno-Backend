const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database schema...');
    
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    await pool.query(schemaSQL);
    
    console.log('✅ Database schema created successfully!');
    
    console.log('📝 Adding test data...');
    
    await pool.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name) 
      VALUES 
        ('john_doe', 'john@school.edu', '$2a$10$dummy_hash', 'John', 'Doe'),
        ('jane_smith', 'jane@school.edu', '$2a$10$dummy_hash', 'Jane', 'Smith')
      ON CONFLICT (username) DO NOTHING;
    `);
    
    console.log('✅ Test data added!');
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    process.exit();
  }
}

setupDatabase();