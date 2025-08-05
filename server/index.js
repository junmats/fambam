const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware - Enhanced CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://localhost:3003'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fambam_db',
  port: process.env.DB_PORT || 3306
};

let db;

// Initialize database connection
async function initDatabase() {
  try {
    console.log('Attempting to connect to MySQL with config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    // First connect without database to create it
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    console.log('Creating temporary connection...');
    const tempDb = await mysql.createConnection(tempConfig);
    
    // Create database if it doesn't exist
    console.log('Creating database if not exists...');
    await tempDb.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await tempDb.end();
    
    // Now connect to the specific database
    console.log('Connecting to specific database...');
    db = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database successfully');
    
    // Create tables
    await createTables();
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database connection error:', error);
    console.error('Full error details:', error.message);
    console.log('Server will continue running without database...');
  }
}

// Create database tables
async function createTables() {
  try {
    // Users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        reset_token VARCHAR(255) NULL,
        reset_token_expiry TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add reset token columns if they don't exist (for existing databases)
    try {
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN reset_token VARCHAR(255) NULL,
        ADD COLUMN reset_token_expiry TIMESTAMP NULL
      `);
    } catch (error) {
      // Columns might already exist, ignore error
      if (!error.message.includes('Duplicate column name')) {
        console.log('Note: Reset token columns may already exist');
      }
    }

    // Family members table - Enhanced for multi-generational support
    await db.execute(`
      CREATE TABLE IF NOT EXISTS family_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        last_name VARCHAR(100),
        maiden_name VARCHAR(100),
        birth_date DATE,
        birth_place VARCHAR(255),
        death_date DATE,
        death_place VARCHAR(255),
        gender ENUM('male', 'female', 'other', 'unknown') DEFAULT 'unknown',
        bio TEXT,
        photo_url VARCHAR(500),
        generation_level INT DEFAULT 0,
        is_living BOOLEAN DEFAULT TRUE,
        occupation VARCHAR(200),
        education VARCHAR(200),
        notes TEXT,
        facebook_url VARCHAR(500),
        twitter_url VARCHAR(500),
        instagram_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_generation (user_id, generation_level),
        INDEX idx_birth_date (birth_date),
        INDEX idx_last_name (last_name)
      )
    `);

    // Add social media columns if they don't exist (for existing databases)
    try {
      await db.execute(`
        ALTER TABLE family_members 
        ADD COLUMN facebook_url VARCHAR(500),
        ADD COLUMN twitter_url VARCHAR(500),
        ADD COLUMN instagram_url VARCHAR(500)
      `);
    } catch (error) {
      // Columns might already exist, which is fine
      if (!error.message.includes('Duplicate column name')) {
        console.log('Note: Social media columns may already exist in family_members table');
      }
    }

    // Parent-Child relationships table for direct lineage tracking
    await db.execute(`
      CREATE TABLE IF NOT EXISTS parent_child_relationships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT NOT NULL,
        child_id INT NOT NULL,
        relationship_type ENUM('biological', 'adopted', 'step', 'foster', 'guardian') DEFAULT 'biological',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES family_members(id) ON DELETE CASCADE,
        FOREIGN KEY (child_id) REFERENCES family_members(id) ON DELETE CASCADE,
        UNIQUE KEY unique_parent_child (parent_id, child_id),
        INDEX idx_parent (parent_id),
        INDEX idx_child (child_id)
      )
    `);

    // Marriages/Partnerships table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS marriages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        spouse1_id INT NOT NULL,
        spouse2_id INT NOT NULL,
        marriage_date DATE,
        marriage_place VARCHAR(255),
        divorce_date DATE,
        divorce_place VARCHAR(255),
        marriage_type ENUM('marriage', 'civil_union', 'domestic_partnership', 'common_law') DEFAULT 'marriage',
        status ENUM('married', 'divorced', 'separated', 'widowed', 'annulled') DEFAULT 'married',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (spouse1_id) REFERENCES family_members(id) ON DELETE CASCADE,
        FOREIGN KEY (spouse2_id) REFERENCES family_members(id) ON DELETE CASCADE,
        UNIQUE KEY unique_marriage (spouse1_id, spouse2_id),
        INDEX idx_spouse1 (spouse1_id),
        INDEX idx_spouse2 (spouse2_id),
        INDEX idx_marriage_date (marriage_date)
      )
    `);

    // Sibling relationships table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sibling_relationships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sibling1_id INT NOT NULL,
        sibling2_id INT NOT NULL,
        relationship_type ENUM('full', 'half', 'step', 'adopted') DEFAULT 'full',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sibling1_id) REFERENCES family_members(id) ON DELETE CASCADE,
        FOREIGN KEY (sibling2_id) REFERENCES family_members(id) ON DELETE CASCADE,
        UNIQUE KEY unique_siblings (sibling1_id, sibling2_id),
        INDEX idx_sibling1 (sibling1_id),
        INDEX idx_sibling2 (sibling2_id)
      )
    `);

    // Family trees table - for organizing multiple family lines
    await db.execute(`
      CREATE TABLE IF NOT EXISTS family_trees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        tree_name VARCHAR(200) NOT NULL,
        description TEXT,
        root_person_id INT,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (root_person_id) REFERENCES family_members(id) ON DELETE SET NULL,
        INDEX idx_user_tree (user_id, is_default)
      )
    `);

    // Family tree members - linking people to specific trees
    await db.execute(`
      CREATE TABLE IF NOT EXISTS family_tree_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tree_id INT NOT NULL,
        member_id INT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tree_id) REFERENCES family_trees(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE,
        UNIQUE KEY unique_tree_member (tree_id, member_id)
      )
    `);

    // Events table - for tracking life events
    await db.execute(`
      CREATE TABLE IF NOT EXISTS life_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        person_id INT NOT NULL,
        event_type ENUM('birth', 'death', 'marriage', 'divorce', 'graduation', 'employment', 'military', 'immigration', 'other') NOT NULL,
        event_date DATE,
        event_place VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (person_id) REFERENCES family_members(id) ON DELETE CASCADE,
        INDEX idx_person_event (person_id, event_type),
        INDEX idx_event_date (event_date)
      )
    `);

    console.log('Enhanced database tables created successfully for multi-generational family trees');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// Utility functions for genealogical calculations
async function calculateGenerationLevel(personId, rootPersonId = null) {
  try {
    if (!rootPersonId) {
      // If no root person specified, find the oldest ancestor
      rootPersonId = await findOldestAncestor(personId);
    }
    
    if (personId === rootPersonId) {
      return 0; // Root generation
    }
    
    // Use breadth-first search to find shortest path (generation distance)
    const visited = new Set();
    const queue = [{ id: rootPersonId, level: 0 }];
    
    while (queue.length > 0) {
      const { id, level } = queue.shift();
      
      if (visited.has(id)) continue;
      visited.add(id);
      
      if (id === personId) {
        return level;
      }
      
      // Get children
      const [children] = await db.execute(
        'SELECT child_id FROM parent_child_relationships WHERE parent_id = ?',
        [id]
      );
      
      for (const child of children) {
        if (!visited.has(child.child_id)) {
          queue.push({ id: child.child_id, level: level + 1 });
        }
      }
    }
    
    return 0; // Default to root level if no path found
  } catch (error) {
    console.error('Error calculating generation level:', error);
    return 0;
  }
}

async function findOldestAncestor(personId) {
  try {
    // Find the oldest birth date among all ancestors
    const [result] = await db.execute(`
      WITH RECURSIVE ancestors AS (
        SELECT id, birth_date FROM family_members WHERE id = ?
        UNION ALL
        SELECT fm.id, fm.birth_date 
        FROM family_members fm
        JOIN parent_child_relationships pcr ON fm.id = pcr.parent_id
        JOIN ancestors a ON pcr.child_id = a.id
      )
      SELECT id FROM ancestors 
      WHERE birth_date IS NOT NULL 
      ORDER BY birth_date ASC 
      LIMIT 1
    `, [personId]);
    
    return result.length > 0 ? result[0].id : personId;
  } catch (error) {
    console.error('Error finding oldest ancestor:', error);
    return personId;
  }
}

async function updateGenerationLevels(userId, rootPersonId = null) {
  try {
    // Get all family members for this user
    const [members] = await db.execute(
      'SELECT id FROM family_members WHERE user_id = ?',
      [userId]
    );
    
    // Update generation level for each member
    for (const member of members) {
      const level = await calculateGenerationLevel(member.id, rootPersonId);
      await db.execute(
        'UPDATE family_members SET generation_level = ? WHERE id = ?',
        [level, member.id]
      );
    }
    
    console.log(`Updated generation levels for user ${userId}`);
  } catch (error) {
    console.error('Error updating generation levels:', error);
  }
}

// Function to get family tree statistics
async function getFamilyTreeStats(userId) {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN is_living = TRUE THEN 1 END) as living_members,
        COUNT(CASE WHEN is_living = FALSE THEN 1 END) as deceased_members,
        MIN(generation_level) as oldest_generation,
        MAX(generation_level) as youngest_generation,
        COUNT(DISTINCT generation_level) as total_generations
      FROM family_members 
      WHERE user_id = ?
    `, [userId]);
    
    return stats[0];
  } catch (error) {
    console.error('Error getting family tree stats:', error);
    return null;
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Family Tree API Server', status: 'OK', timestamp: new Date().toISOString() });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// Simple test route for CORS testing
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'CORS test successful!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString() 
  });
});

// Import route handlers
const authRoutes = require('./routes/auth');
const familyRoutes = require('./routes/family');
const photosRoutes = require('./routes/photos');
const themeRoutes = require('./routes/theme');

app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/theme', themeRoutes);

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDatabase();
});

module.exports = app;
