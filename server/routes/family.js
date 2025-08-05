const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const router = express.Router();

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fambam_db',
  port: process.env.DB_PORT || 3306
};

// Helper function to calculate generation level
async function calculateGenerationLevel(personId, rootPersonId = null) {
  try {
    const db = await mysql.createConnection(dbConfig);
    
    if (!rootPersonId) {
      // If no root person specified, find the oldest ancestor
      rootPersonId = await findOldestAncestor(personId, db);
    }
    
    if (personId === rootPersonId) {
      await db.end();
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
        await db.end();
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
    
    await db.end();
    return 0; // Default to root level if no path found
  } catch (error) {
    console.error('Error calculating generation level:', error);
    return 0;
  }
}

async function findOldestAncestor(personId, db) {
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

async function updateGenerationLevels(userId = null, rootPersonId = null) {
  try {
    const db = await mysql.createConnection(dbConfig);
    
    // Get all family members (not filtered by user)
    const [members] = await db.execute(
      'SELECT id FROM family_members'
    );
    
    // Update generation level for each member
    for (const member of members) {
      const level = await calculateGenerationLevel(member.id, rootPersonId);
      await db.execute(
        'UPDATE family_members SET generation_level = ? WHERE id = ?',
        [level, member.id]
      );
    }
    
    await db.end();
    console.log(`Updated generation levels for all family members`);
  } catch (error) {
    console.error('Error updating generation levels:', error);
  }
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get all family members for a user
router.get('/members', authenticateToken, async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);

    // Return all family members (same as guest endpoint)
    const [members] = await db.execute(
      'SELECT * FROM family_members ORDER BY first_name'
    );

    await db.end();

    res.json(members);
  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new family member
router.post('/members', authenticateToken, async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      maidenName,
      birthDate,
      birthPlace,
      deathDate,
      deathPlace,
      gender,
      bio,
      photoUrl,
      isLiving,
      occupation,
      education,
      notes,
      facebookUrl,
      twitterUrl,
      instagramUrl
    } = req.body;

    if (!firstName) {
      return res.status(400).json({ error: 'First name is required' });
    }

    const db = await mysql.createConnection(dbConfig);

    const [result] = await db.execute(
      `INSERT INTO family_members 
       (created_by, first_name, middle_name, last_name, maiden_name, birth_date, birth_place, 
        death_date, death_place, gender, bio, photo_url, is_living, occupation, education, notes, 
        facebook_url, twitter_url, instagram_url, generation_level) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userId, 
        firstName, 
        middleName || null, 
        lastName || null, 
        maidenName || null, 
        birthDate || null, 
        birthPlace || null,
        deathDate || null, 
        deathPlace || null, 
        gender || null, 
        bio || null, 
        photoUrl || null, 
        isLiving !== false, 
        occupation || null, 
        education || null, 
        notes || null,
        facebookUrl || null,
        twitterUrl || null,
        instagramUrl || null,
        0 // Default generation level, will be updated when relationships are added
      ]
    );

    await db.end();

    res.status(201).json({
      message: 'Family member added successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error adding family member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a family member
router.put('/members/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      middleName,
      lastName,
      maidenName,
      birthDate,
      birthPlace,
      deathDate,
      deathPlace,
      gender,
      bio,
      photoUrl,
      isLiving,
      occupation,
      education,
      notes,
      facebookUrl,
      twitterUrl,
      instagramUrl
    } = req.body;

    const db = await mysql.createConnection(dbConfig);

    // Check if user is admin
    const [users] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [req.user.userId]
    );

    const isAdmin = users.length > 0 && users[0].is_admin;

    // Check if the member exists
    const [members] = await db.execute(
      'SELECT id, created_by, user_id FROM family_members WHERE id = ?',
      [id]
    );

    if (members.length === 0) {
      await db.end();
      return res.status(404).json({ error: 'Family member not found' });
    }

    const isCreatedByUser = members[0].created_by === req.user.userId;
    const isLinkedToUser = members[0].user_id === req.user.userId;

    // Allow if user is admin OR if they created this member OR if they are linked to this member
    if (!isAdmin && !isCreatedByUser && !isLinkedToUser) {
      await db.end();
      return res.status(403).json({ error: 'You can only edit members you created or are linked to' });
    }

    await db.execute(
      `UPDATE family_members 
       SET first_name = ?, middle_name = ?, last_name = ?, maiden_name = ?, birth_date = ?, birth_place = ?, 
           death_date = ?, death_place = ?, gender = ?, bio = ?, photo_url = ?, is_living = ?, 
           occupation = ?, education = ?, notes = ?, facebook_url = ?, twitter_url = ?, instagram_url = ?
       WHERE id = ?`,
      [
        firstName, 
        middleName || null, 
        lastName || null, 
        maidenName || null, 
        birthDate || null, 
        birthPlace || null,
        deathDate || null, 
        deathPlace || null, 
        gender || null, 
        bio || null, 
        photoUrl || null, 
        isLiving !== false, 
        occupation || null, 
        education || null, 
        notes || null,
        facebookUrl || null,
        twitterUrl || null,
        instagramUrl || null,
        id
      ]
    );

    await db.end();

    res.json({ message: 'Family member updated successfully' });
  } catch (error) {
    console.error('Error updating family member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a family member
router.delete('/members/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const db = await mysql.createConnection(dbConfig);

    // Check if user is admin
    const [users] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [req.user.userId]
    );

    const isAdmin = users.length > 0 && users[0].is_admin;

    // Check if the member exists
    const [members] = await db.execute(
      'SELECT id, created_by, user_id FROM family_members WHERE id = ?',
      [id]
    );

    if (members.length === 0) {
      await db.end();
      return res.status(404).json({ error: 'Family member not found' });
    }

    const isCreatedByUser = members[0].created_by === req.user.userId;
    const isLinkedToUser = members[0].user_id === req.user.userId;

    // Allow if user is admin OR if they created this member OR if they are linked to this member
    if (!isAdmin && !isCreatedByUser && !isLinkedToUser) {
      await db.end();
      return res.status(403).json({ error: 'You can only delete members you created or are linked to' });
    }

    await db.execute(
      'DELETE FROM family_members WHERE id = ?',
      [id]
    );

    await db.end();

    res.json({ message: 'Family member deleted successfully' });
  } catch (error) {
    console.error('Error deleting family member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get parent-child relationships with detailed information
router.get('/relationships/parent-child', authenticateToken, async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);

    const [parentChildRels] = await db.execute(
      `SELECT 
        pcr.id,
        pcr.parent_id as person1_id,
        pcr.child_id as person2_id,
        pcr.relationship_type,
        pcr.created_at,
        CONCAT(p1.first_name, ' ', COALESCE(p1.last_name, '')) as person1_name,
        CONCAT(p2.first_name, ' ', COALESCE(p2.last_name, '')) as person2_name,
        'parent-child' as type
       FROM parent_child_relationships pcr
       JOIN family_members p1 ON pcr.parent_id = p1.id
       JOIN family_members p2 ON pcr.child_id = p2.id
       ORDER BY pcr.created_at DESC`
    );

    await db.end();

    res.json(parentChildRels);
  } catch (error) {
    console.error('Error fetching parent-child relationships:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Legacy: This endpoint was replaced by specific endpoints for marriages, parent-child, and sibling relationships
// router.post('/relationships', ...) - removed as it references non-existent 'relationships' table

// Add parent-child relationship
router.post('/relationships/parent-child', authenticateToken, async (req, res) => {
  try {
    const { parentId, childId, relationshipType } = req.body;

    if (!parentId || !childId) {
      return res.status(400).json({ error: 'Parent ID and Child ID are required' });
    }

    const db = await mysql.createConnection(dbConfig);

    // Verify both family members exist
    const [members] = await db.execute(
      'SELECT id FROM family_members WHERE id IN (?, ?)',
      [parentId, childId]
    );

    if (members.length !== 2) {
      await db.end();
      return res.status(400).json({ error: 'Invalid family member IDs' });
    }

    const [result] = await db.execute(
      'INSERT INTO parent_child_relationships (parent_id, child_id, relationship_type) VALUES (?, ?, ?)',
      [parentId, childId, relationshipType || 'biological']
    );

    await db.end();

    // Recalculate generation levels after adding parent-child relationship
    console.log(`Recalculating generations after adding parent-child relationship`);
    await updateGenerationLevels();

    res.status(201).json({
      message: 'Parent-child relationship added successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error adding parent-child relationship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add marriage/partnership
router.post('/marriages', authenticateToken, async (req, res) => {
  try {
    console.log('POST /marriages - Request body:', req.body);
    console.log('POST /marriages - User:', req.user);
    
    const {
      spouse1Id,
      spouse2Id,
      marriageDate,
      marriagePlace,
      marriageType,
      status,
      notes
    } = req.body;

    console.log('POST /marriages - Extracted data:', { spouse1Id, spouse2Id, marriageDate, marriagePlace, marriageType, status, notes });

    if (!spouse1Id || !spouse2Id) {
      console.log('POST /marriages - Missing spouse IDs');
      return res.status(400).json({ error: 'Both spouse IDs are required' });
    }

    const db = await mysql.createConnection(dbConfig);

    // Verify both family members exist
    const [members] = await db.execute(
      'SELECT id FROM family_members WHERE id IN (?, ?)',
      [spouse1Id, spouse2Id]
    );

    console.log('POST /marriages - Found members:', members);

    if (members.length !== 2) {
      await db.end();
      console.log('POST /marriages - Invalid family member IDs, found:', members.length, 'expected: 2');
      return res.status(400).json({ error: 'Invalid family member IDs' });
    }

    // Get current generation levels of both spouses
    const [spouseData] = await db.execute(
      'SELECT id, generation_level FROM family_members WHERE id IN (?, ?)',
      [spouse1Id, spouse2Id]
    );

    // Ensure spouses have the same generation level (use the higher/later generation)
    const spouse1Data = spouseData.find(s => s.id == spouse1Id);
    const spouse2Data = spouseData.find(s => s.id == spouse2Id);
    const targetGeneration = Math.max(spouse1Data.generation_level, spouse2Data.generation_level);

    // Update both spouses to have the same generation level
    await db.execute(
      'UPDATE family_members SET generation_level = ? WHERE id IN (?, ?)',
      [targetGeneration, spouse1Id, spouse2Id]
    );

    console.log('POST /marriages - Synchronized generation levels to:', targetGeneration);

    console.log('POST /marriages - Inserting marriage...');
    const [result] = await db.execute(
      `INSERT INTO marriages 
       (spouse1_id, spouse2_id, marriage_date, marriage_place, marriage_type, status, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        spouse1Id, 
        spouse2Id, 
        marriageDate || null, 
        marriagePlace || null, 
        marriageType || 'marriage', 
        status || 'married', 
        notes || null
      ]
    );

    await db.end();

    console.log('POST /marriages - Success, marriage ID:', result.insertId);
    res.status(201).json({
      message: 'Marriage added successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error adding marriage:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all marriages for a user
router.get('/marriages', authenticateToken, async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);

    const [marriages] = await db.execute(`
      SELECT 
        m.id,
        m.marriage_date,
        m.marriage_place,
        m.marriage_type,
        m.status,
        m.notes,
        m.created_at,
        m.updated_at,
        spouse1.id as spouse1_id,
        spouse1.first_name as spouse1_first_name,
        spouse1.middle_name as spouse1_middle_name,
        spouse1.last_name as spouse1_last_name,
        spouse1.maiden_name as spouse1_maiden_name,
        spouse1.birth_date as spouse1_birth_date,
        spouse1.gender as spouse1_gender,
        spouse2.id as spouse2_id,
        spouse2.first_name as spouse2_first_name,
        spouse2.middle_name as spouse2_middle_name,
        spouse2.last_name as spouse2_last_name,
        spouse2.maiden_name as spouse2_maiden_name,
        spouse2.birth_date as spouse2_birth_date,
        spouse2.gender as spouse2_gender
      FROM marriages m
      JOIN family_members spouse1 ON m.spouse1_id = spouse1.id
      JOIN family_members spouse2 ON m.spouse2_id = spouse2.id
      ORDER BY m.marriage_date DESC, m.created_at DESC
    `);

    await db.end();

    res.json(marriages);
  } catch (error) {
    console.error('Error fetching marriages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add sibling relationship
router.post('/relationships/siblings', authenticateToken, async (req, res) => {
  try {
    const { sibling1Id, sibling2Id, relationshipType } = req.body;

    if (!sibling1Id || !sibling2Id) {
      return res.status(400).json({ error: 'Both sibling IDs are required' });
    }

    const db = await mysql.createConnection(dbConfig);

    // Verify both family members exist
    const [members] = await db.execute(
      'SELECT id FROM family_members WHERE id IN (?, ?)',
      [sibling1Id, sibling2Id]
    );

    if (members.length !== 2) {
      await db.end();
      return res.status(400).json({ error: 'Invalid family member IDs' });
    }

    const [result] = await db.execute(
      'INSERT INTO sibling_relationships (sibling1_id, sibling2_id, relationship_type) VALUES (?, ?, ?)',
      [sibling1Id, sibling2Id, relationshipType || 'full']
    );

    await db.end();

    res.status(201).json({
      message: 'Sibling relationship added successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error adding sibling relationship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get family tree by generations
router.get('/tree/generations', authenticateToken, async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);

    const [generations] = await db.execute(
      `SELECT 
        generation_level,
        COUNT(*) as member_count,
        GROUP_CONCAT(CONCAT(first_name, ' ', COALESCE(last_name, '')) ORDER BY birth_date) as members
       FROM family_members 
       GROUP BY generation_level 
       ORDER BY generation_level`
    );

    await db.end();

    res.json(generations);
  } catch (error) {
    console.error('Error fetching generations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get ancestors of a person
router.get('/members/:id/ancestors', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { generations } = req.query; // Optional limit

    const db = await mysql.createConnection(dbConfig);

    let query = `
      WITH RECURSIVE ancestors AS (
        SELECT fm.*, 0 as ancestor_level
        FROM family_members fm 
        WHERE fm.id = ?
        
        UNION ALL
        
        SELECT fm.*, a.ancestor_level + 1
        FROM family_members fm
        JOIN parent_child_relationships pcr ON fm.id = pcr.parent_id
        JOIN ancestors a ON pcr.child_id = a.id
        WHERE a.ancestor_level < ${generations ? parseInt(generations) : 10}
      )
      SELECT * FROM ancestors WHERE ancestor_level > 0 ORDER BY ancestor_level, birth_date
    `;

    const [ancestors] = await db.execute(query, [id]);

    await db.end();

    res.json(ancestors);
  } catch (error) {
    console.error('Error fetching ancestors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get descendants of a person
router.get('/members/:id/descendants', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { generations } = req.query; // Optional limit

    const db = await mysql.createConnection(dbConfig);

    let query = `
      WITH RECURSIVE descendants AS (
        SELECT fm.*, 0 as descendant_level
        FROM family_members fm 
        WHERE fm.id = ?
        
        UNION ALL
        
        SELECT fm.*, d.descendant_level + 1
        FROM family_members fm
        JOIN parent_child_relationships pcr ON fm.id = pcr.child_id
        JOIN descendants d ON pcr.parent_id = d.id
        WHERE d.descendant_level < ${generations ? parseInt(generations) : 10}
      )
      SELECT * FROM descendants WHERE descendant_level > 0 ORDER BY descendant_level, birth_date
    `;

    const [descendants] = await db.execute(query, [id]);

    await db.end();

    res.json(descendants);
  } catch (error) {
    console.error('Error fetching descendants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get family tree statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);

    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN is_living = TRUE THEN 1 END) as living_members,
        COUNT(CASE WHEN is_living = FALSE THEN 1 END) as deceased_members,
        MIN(generation_level) as oldest_generation,
        MAX(generation_level) as youngest_generation,
        COUNT(DISTINCT generation_level) as total_generations,
        MIN(birth_date) as earliest_birth,
        MAX(birth_date) as latest_birth
      FROM family_members
    `);

    const [relationshipStats] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM parent_child_relationships) as parent_child_relationships,
        (SELECT COUNT(*) FROM marriages) as marriages,
        (SELECT COUNT(*) FROM sibling_relationships) as sibling_relationships
    `);

    await db.end();

    res.json({
      ...stats[0],
      ...relationshipStats[0]
    });
  } catch (error) {
    console.error('Error fetching family tree stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get families organized by nuclear families (marriages + children)
router.get('/families', authenticateToken, async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);

    // Get all marriages for the user
    const [marriages] = await db.execute(`
      SELECT 
        m.id as marriage_id,
        m.marriage_date,
        m.marriage_place,
        m.status,
        s1.id as spouse1_id,
        s1.first_name as spouse1_first_name,
        s1.middle_name as spouse1_middle_name,
        s1.last_name as spouse1_last_name,
        s1.maiden_name as spouse1_maiden_name,
        s1.birth_date as spouse1_birth_date,
        s1.birth_place as spouse1_birth_place,
        s1.death_date as spouse1_death_date,
        s1.gender as spouse1_gender,
        s1.generation_level as spouse1_generation,
        s1.is_living as spouse1_living,
        s1.occupation as spouse1_occupation,
        s1.education as spouse1_education,
        s2.id as spouse2_id,
        s2.first_name as spouse2_first_name,
        s2.middle_name as spouse2_middle_name,
        s2.last_name as spouse2_last_name,
        s2.maiden_name as spouse2_maiden_name,
        s2.birth_date as spouse2_birth_date,
        s2.birth_place as spouse2_birth_place,
        s2.death_date as spouse2_death_date,
        s2.gender as spouse2_gender,
        s2.generation_level as spouse2_generation,
        s2.is_living as spouse2_living,
        s2.occupation as spouse2_occupation,
        s2.education as spouse2_education
      FROM marriages m
      JOIN family_members s1 ON m.spouse1_id = s1.id
      JOIN family_members s2 ON m.spouse2_id = s2.id
      ORDER BY s1.generation_level, m.marriage_date
    `);

    // For each marriage, get their children
    const families = [];
    
    for (const marriage of marriages) {
      // Get children of this couple
      const [children] = await db.execute(`
        SELECT DISTINCT c.*
        FROM family_members c
        JOIN parent_child_relationships pc1 ON c.id = pc1.child_id
        JOIN parent_child_relationships pc2 ON c.id = pc2.child_id
        WHERE pc1.parent_id = ? AND pc2.parent_id = ?
        ORDER BY c.birth_date
      `, [marriage.spouse1_id, marriage.spouse2_id]);

      families.push({
        marriage_id: marriage.marriage_id,
        marriage_date: marriage.marriage_date,
        marriage_place: marriage.marriage_place,
        status: marriage.status,
        generation_level: marriage.spouse1_generation,
        spouse1: {
          id: marriage.spouse1_id,
          first_name: marriage.spouse1_first_name,
          middle_name: marriage.spouse1_middle_name,
          last_name: marriage.spouse1_last_name,
          maiden_name: marriage.spouse1_maiden_name,
          birth_date: marriage.spouse1_birth_date,
          birth_place: marriage.spouse1_birth_place,
          death_date: marriage.spouse1_death_date,
          gender: marriage.spouse1_gender,
          generation_level: marriage.spouse1_generation,
          is_living: marriage.spouse1_living,
          occupation: marriage.spouse1_occupation,
          education: marriage.spouse1_education
        },
        spouse2: {
          id: marriage.spouse2_id,
          first_name: marriage.spouse2_first_name,
          middle_name: marriage.spouse2_middle_name,
          last_name: marriage.spouse2_last_name,
          maiden_name: marriage.spouse2_maiden_name,
          birth_date: marriage.spouse2_birth_date,
          birth_place: marriage.spouse2_birth_place,
          death_date: marriage.spouse2_death_date,
          gender: marriage.spouse2_gender,
          generation_level: marriage.spouse2_generation,
          is_living: marriage.spouse2_living,
          occupation: marriage.spouse2_occupation,
          education: marriage.spouse2_education
        },
        children: children
      });
    }

    // Also get single parents (people with children but no marriage record)
    const [singleParents] = await db.execute(`
      SELECT DISTINCT p.*
      FROM family_members p
      JOIN parent_child_relationships pc ON p.id = pc.parent_id
      WHERE p.id NOT IN (
        SELECT spouse1_id FROM marriages WHERE spouse1_id = p.id
        UNION
        SELECT spouse2_id FROM marriages WHERE spouse2_id = p.id
      )
      ORDER BY p.generation_level, p.birth_date
    `);

    for (const parent of singleParents) {
      const [children] = await db.execute(`
        SELECT c.*
        FROM family_members c
        JOIN parent_child_relationships pc ON c.id = pc.child_id
        WHERE pc.parent_id = ?
        ORDER BY c.birth_date
      `, [parent.id]);

      families.push({
        marriage_id: null,
        marriage_date: null,
        marriage_place: null,
        status: 'single_parent',
        generation_level: parent.generation_level,
        spouse1: parent,
        spouse2: null,
        children: children
      });
    }

    await db.end();

    // Sort families by generation level
    families.sort((a, b) => a.generation_level - b.generation_level);

    res.json(families);
  } catch (error) {
    console.error('Error fetching families:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get family tree in hierarchical organization chart format
router.get('/tree/hierarchy', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 UPDATED HIERARCHY ENDPOINT - NEW LOGIC');
    const db = await mysql.createConnection(dbConfig);

    // Find the root couple - start with the oldest generation married couple
    const [rootCouples] = await db.execute(`
      SELECT 
        m.id as marriage_id,
        m.marriage_date,
        m.marriage_place,
        m.status,
        s1.id as spouse1_id,
        s1.first_name as spouse1_first_name,
        s1.middle_name as spouse1_middle_name,
        s1.last_name as spouse1_last_name,
        s1.maiden_name as spouse1_maiden_name,
        s1.birth_date as spouse1_birth_date,
        s1.birth_place as spouse1_birth_place,
        s1.death_date as spouse1_death_date,
        s1.gender as spouse1_gender,
        s1.generation_level as spouse1_generation,
        s1.is_living as spouse1_living,
        s1.occupation as spouse1_occupation,
        s1.education as spouse1_education,
        s2.id as spouse2_id,
        s2.first_name as spouse2_first_name,
        s2.middle_name as spouse2_middle_name,
        s2.last_name as spouse2_last_name,
        s2.maiden_name as spouse2_maiden_name,
        s2.birth_date as spouse2_birth_date,
        s2.birth_place as spouse2_birth_place,
        s2.death_date as spouse2_death_date,
        s2.gender as spouse2_gender,
        s2.generation_level as spouse2_generation,
        s2.is_living as spouse2_living,
        s2.occupation as spouse2_occupation,
        s2.education as spouse2_education
      FROM marriages m
      JOIN family_members s1 ON m.spouse1_id = s1.id
      JOIN family_members s2 ON m.spouse2_id = s2.id
      ORDER BY 
        LEAST(s1.generation_level, s2.generation_level) ASC,
        CASE WHEN m.marriage_date IS NULL THEN 1 ELSE 0 END,
        m.marriage_date ASC, 
        s1.birth_date ASC
      LIMIT 1
    `);

    if (rootCouples.length === 0) {
      await db.end();
      return res.json({
        rootCouple: null,
        childrenRow: [],
        totalMembers: 0,
        message: 'No root couple found'
      });
    }

    const rootCouple = rootCouples[0];
    console.log('✅ Found root couple:', rootCouple.spouse1_first_name, '&', rootCouple.spouse2_first_name);

    // Get ONLY the actual biological children (people in parent_child_relationships with root couple)
    const [actualChildren] = await db.execute(`
      SELECT DISTINCT c.*
      FROM family_members c
      JOIN parent_child_relationships pcr ON c.id = pcr.child_id
      WHERE (pcr.parent_id = ? OR pcr.parent_id = ?)
      ORDER BY c.birth_date
    `, [rootCouple.spouse1_id, rootCouple.spouse2_id]);

    console.log('👶 Found', actualChildren.length, 'actual biological children of root couple:');
    actualChildren.forEach(child => {
      console.log('  -', child.first_name, child.last_name, '(ID:', child.id + ')');
    });

    // Build children row: ONLY biological children + their spouses (if any)
    const childrenRow = [];
    const processedChildIds = new Set();
    
    for (const child of actualChildren) {
      if (processedChildIds.has(child.id)) continue;

      console.log(`🔍 Processing biological child: ${child.first_name} ${child.last_name}`);

      // Check if this biological child has a spouse
      const [spouseMarriage] = await db.execute(`
        SELECT 
          m.id as marriage_id,
          m.marriage_date,
          m.marriage_place,
          m.status,
          m.spouse1_id,
          m.spouse2_id,
          CASE 
            WHEN m.spouse1_id = ? THEN s2.id
            ELSE s1.id 
          END as spouse_id,
          CASE 
            WHEN m.spouse1_id = ? THEN s2.first_name
            ELSE s1.first_name 
          END as spouse_first_name,
          CASE 
            WHEN m.spouse1_id = ? THEN s2.last_name
            ELSE s1.last_name 
          END as spouse_last_name
        FROM marriages m
        JOIN family_members s1 ON m.spouse1_id = s1.id
        JOIN family_members s2 ON m.spouse2_id = s2.id
        WHERE (m.spouse1_id = ? OR m.spouse2_id = ?)
      `, [child.id, child.id, child.id, child.id, child.id]);

      if (spouseMarriage.length > 0) {
        const marriage = spouseMarriage[0];
        console.log(`💑 Found spouse for biological child ${child.first_name}: ${marriage.spouse_first_name}`);
        
        // Get full spouse details
        const [spouseDetails] = await db.execute(`
          SELECT * FROM family_members WHERE id = ?
        `, [marriage.spouse_id]);

        if (spouseDetails.length > 0) {
          // Add as a couple unit: biological child + their spouse
          childrenRow.push({
            type: 'couple',
            spouse1: child, // The biological child (connects to parents)
            spouse2: spouseDetails[0], // The spouse (married into family)
            marriageInfo: {
              id: marriage.marriage_id,
              marriage_date: marriage.marriage_date,
              marriage_place: marriage.marriage_place,
              status: marriage.status
            }
          });
          processedChildIds.add(child.id);
          processedChildIds.add(marriage.spouse_id);
          console.log(`✅ Added couple: ${child.first_name} (biological) + ${spouseDetails[0].first_name} (married in)`);
        } else {
          // Spouse not found in our user's family, add biological child alone
          childrenRow.push({
            type: 'individual',
            member: child,
            isOriginalChild: true
          });
          processedChildIds.add(child.id);
          console.log(`✅ Added individual: ${child.first_name} (biological child, no spouse in system)`);
        }
      } else {
        // No spouse found, add biological child alone
        childrenRow.push({
          type: 'individual',
          member: child,
          isOriginalChild: true
        });
        processedChildIds.add(child.id);
        console.log(`✅ Added individual: ${child.first_name} (biological child, no spouse)`);
      }
    }

    console.log('📊 Final children row has', childrenRow.length, 'items');

    // ENHANCED: Now also get grandchildren (Generation 2+) grouped by parents
    // Find maximum generation level
    const [maxGenResult] = await db.execute(`
      SELECT MAX(generation_level) as max_gen 
      FROM family_members
    `);
    
    const maxGeneration = maxGenResult[0].max_gen || 1;
    console.log(`📊 Found ${maxGeneration + 1} generations (0 to ${maxGeneration})`);

    // Get additional generations (2+) and group them by parents
    const additionalGenerations = [];
    for (let gen = 2; gen <= maxGeneration; gen++) {
      const [generationMembers] = await db.execute(`
        SELECT * FROM family_members 
        WHERE generation_level = ?
        ORDER BY birth_date
      `, [gen]);

      if (generationMembers.length > 0) {
        console.log(`👶 Found ${generationMembers.length} members in generation ${gen}:`, 
          generationMembers.map(m => m.first_name).join(', '));
        
        // Group members by their parents AND handle marriages (similar to childrenRow logic)
        const membersWithParents = [];
        const processedMemberIds = new Set();
        
        for (const member of generationMembers) {
          if (processedMemberIds.has(member.id)) {
            continue; // Skip if already processed as part of a couple
          }
          
          // Get this member's parents
          const [parents] = await db.execute(`
            SELECT p.id, p.first_name, p.last_name
            FROM parent_child_relationships pcr
            JOIN family_members p ON pcr.parent_id = p.id
            WHERE pcr.child_id = ?
            ORDER BY p.gender = 'male' DESC
          `, [member.id]);
          
          // Check if this member has a spouse
          const [marriages] = await db.execute(`
            SELECT 
              CASE 
                WHEN m.spouse1_id = ? THEN m.spouse2_id 
                ELSE m.spouse1_id 
              END as spouse_id,
              m.id as marriage_id,
              m.marriage_date,
              m.marriage_place,
              m.status
            FROM marriages m 
            WHERE (m.spouse1_id = ? OR m.spouse2_id = ?) 
            AND m.status = 'married'
          `, [member.id, member.id, member.id]);

          if (marriages.length > 0) {
            const marriage = marriages[0];
            // Get spouse details
            const [spouseDetails] = await db.execute(`
              SELECT * FROM family_members WHERE id = ?
            `, [marriage.spouse_id]);

            if (spouseDetails.length > 0) {
              const spouse = spouseDetails[0];
              
              // Determine who has parents (biological child) vs who married in
              const memberHasParents = parents.length > 0;
              
              // Get spouse's parents to see if they're also biological children
              const [spouseParents] = await db.execute(`
                SELECT p.id, p.first_name, p.last_name
                FROM parent_child_relationships pcr
                JOIN family_members p ON pcr.parent_id = p.id
                WHERE pcr.child_id = ?
              `, [spouse.id]);
              
              const spouseHasParents = spouseParents.length > 0;
              
              // Create couple entry - prioritize the one with parents as the "main" person
              if (memberHasParents && !spouseHasParents) {
                // Member is biological child, spouse married in
                membersWithParents.push({
                  type: 'couple',
                  spouse1: { ...member }, // Biological child
                  spouse2: { ...spouse }, // Married in
                  parents: parents,
                  marriageInfo: {
                    id: marriage.marriage_id,
                    marriage_date: marriage.marriage_date,
                    marriage_place: marriage.marriage_place,
                    status: marriage.status
                  }
                });
                console.log(`💑 Added couple in gen ${gen}: ${member.first_name} (biological) + ${spouse.first_name} (married in)`);
              } else if (!memberHasParents && spouseHasParents) {
                // Spouse is biological child, member married in
                membersWithParents.push({
                  type: 'couple',
                  spouse1: { ...spouse }, // Biological child
                  spouse2: { ...member }, // Married in
                  parents: spouseParents,
                  marriageInfo: {
                    id: marriage.marriage_id,
                    marriage_date: marriage.marriage_date,
                    marriage_place: marriage.marriage_place,
                    status: marriage.status
                  }
                });
                console.log(`💑 Added couple in gen ${gen}: ${spouse.first_name} (biological) + ${member.first_name} (married in)`);
              } else {
                // Both have parents or both don't - just use member as primary
                membersWithParents.push({
                  type: 'couple',
                  spouse1: { ...member },
                  spouse2: { ...spouse },
                  parents: parents,
                  marriageInfo: {
                    id: marriage.marriage_id,
                    marriage_date: marriage.marriage_date,
                    marriage_place: marriage.marriage_place,
                    status: marriage.status
                  }
                });
                console.log(`💑 Added couple in gen ${gen}: ${member.first_name} + ${spouse.first_name}`);
              }
              
              processedMemberIds.add(member.id);
              processedMemberIds.add(spouse.id);
            } else {
              // Spouse not in our system, add member alone
              membersWithParents.push({
                type: 'individual',
                ...member,
                parents: parents
              });
              processedMemberIds.add(member.id);
              console.log(`👤 Added individual in gen ${gen}: ${member.first_name} (spouse not in system)`);
            }
          } else {
            // No spouse, add as individual
            membersWithParents.push({
              type: 'individual',
              ...member,
              parents: parents
            });
            processedMemberIds.add(member.id);
            console.log(`👤 Added individual in gen ${gen}: ${member.first_name} (no spouse)`);
          }
        }
        
        additionalGenerations.push({
          level: gen,
          members: membersWithParents
        });
      }
    }

    await db.end();

    res.json({
      rootCouple: {
        spouse1: {
          id: rootCouple.spouse1_id,
          first_name: rootCouple.spouse1_first_name,
          middle_name: rootCouple.spouse1_middle_name,
          last_name: rootCouple.spouse1_last_name,
          maiden_name: rootCouple.spouse1_maiden_name,
          birth_date: rootCouple.spouse1_birth_date,
          birth_place: rootCouple.spouse1_birth_place,
          death_date: rootCouple.spouse1_death_date,
          gender: rootCouple.spouse1_gender,
          generation_level: rootCouple.spouse1_generation,
          is_living: rootCouple.spouse1_living,
          occupation: rootCouple.spouse1_occupation,
          education: rootCouple.spouse1_education
        },
        spouse2: {
          id: rootCouple.spouse2_id,
          first_name: rootCouple.spouse2_first_name,
          middle_name: rootCouple.spouse2_middle_name,
          last_name: rootCouple.spouse2_last_name,
          maiden_name: rootCouple.spouse2_maiden_name,
          birth_date: rootCouple.spouse2_birth_date,
          birth_place: rootCouple.spouse2_birth_place,
          death_date: rootCouple.spouse2_death_date,
          gender: rootCouple.spouse2_gender,
          generation_level: rootCouple.spouse2_generation,
          is_living: rootCouple.spouse2_living,
          occupation: rootCouple.spouse2_occupation,
          education: rootCouple.spouse2_education
        },
        marriageInfo: {
          id: rootCouple.marriage_id,
          marriage_date: rootCouple.marriage_date,
          marriage_place: rootCouple.marriage_place,
          status: rootCouple.status
        }
      },
      childrenRow: childrenRow,
      additionalGenerations: additionalGenerations,
      totalGenerations: maxGeneration + 1,
      totalMembers: childrenRow.length + 2 + additionalGenerations.reduce((sum, gen) => sum + gen.members.length, 0),
      rootGeneration: rootCouple.spouse1_generation
    });
  } catch (error) {
    console.error('Error fetching family tree hierarchy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Recalculate generation levels for all family members
router.post('/recalculate-generations', authenticateToken, async (req, res) => {
  try {
    console.log(`Manually recalculating generation levels for all members`);
    await updateGenerationLevels();
    
    res.json({
      message: 'Generation levels recalculated successfully'
    });
  } catch (error) {
    console.error('Error recalculating generation levels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fix generations endpoint
router.post('/fix-generations', async (req, res) => {
  const db = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔧 Starting generation fix process...');
    
    // Step 1: Reset all generation levels to null
    await db.execute('UPDATE family_members SET generation_level = NULL');
    console.log('✅ Reset all generation levels');
    
    // Step 2: SPECIFICALLY set Ilang and Isko to generation 0 (root couple)
    const [ilangResult] = await db.execute(
      `UPDATE family_members SET generation_level = 0 WHERE first_name = 'Ilang'`
    );
    const [iskoResult] = await db.execute(
      `UPDATE family_members SET generation_level = 0 WHERE first_name = 'Isko'`
    );
    
    console.log(`📍 Set Ilang and Isko to generation 0 (root couple)`);
    
    // Step 3: Process generations iteratively - ONLY children get incremented
    let currentGeneration = 0;
    let processedAny = true;
    
    while (processedAny && currentGeneration < 10) {
      processedAny = false;
      
      // Get all members at current generation
      const [currentMembers] = await db.execute(
        'SELECT id, first_name, last_name FROM family_members WHERE generation_level = ?',
        [currentGeneration]
      );
      
      if (currentMembers.length === 0) {
        currentGeneration++;
        continue;
      }
      
      console.log(`🔄 Processing generation ${currentGeneration}:`, currentMembers.map(m => `${m.first_name} ${m.last_name}`));
      
      // Find their children and set to next generation
      for (const member of currentMembers) {
        const [children] = await db.execute(`
          SELECT pcr.child_id, fm.first_name, fm.last_name
          FROM parent_child_relationships pcr
          JOIN family_members fm ON pcr.child_id = fm.id
          WHERE pcr.parent_id = ? AND fm.generation_level IS NULL
        `, [member.id]);
        
        for (const child of children) {
          console.log(`  👶 Setting child ${child.first_name} ${child.last_name} to generation ${currentGeneration + 1}`);
          await db.execute(
            'UPDATE family_members SET generation_level = ? WHERE id = ?',
            [currentGeneration + 1, child.child_id]
          );
          processedAny = true;
        }
      }
      
      currentGeneration++;
    }
    
    // Step 4: Set spouses to match their partner's generation
    console.log('💑 Setting spouses to match their partners...');
    
    const [marriages] = await db.execute(`
      SELECT m.spouse1_id, m.spouse2_id, 
             fm1.generation_level as gen1, fm2.generation_level as gen2,
             fm1.first_name as name1, fm2.first_name as name2
      FROM marriages m
      JOIN family_members fm1 ON m.spouse1_id = fm1.id
      JOIN family_members fm2 ON m.spouse2_id = fm2.id
    `);
    
    for (const marriage of marriages) {
      const { spouse1_id, spouse2_id, gen1, gen2, name1, name2 } = marriage;
      
      if (gen1 !== null && gen2 === null) {
        // Person1 has generation set, person2 follows
        console.log(`� Setting ${name2} to match ${name1}'s generation: ${gen1}`);
        await db.execute('UPDATE family_members SET generation_level = ? WHERE id = ?', [gen1, spouse2_id]);
      } else if (gen2 !== null && gen1 === null) {
        // Person2 has generation set, person1 follows
        console.log(`👫 Setting ${name1} to match ${name2}'s generation: ${gen2}`);
        await db.execute('UPDATE family_members SET generation_level = ? WHERE id = ?', [gen2, spouse1_id]);
      } else if (gen1 !== null && gen2 !== null && gen1 !== gen2) {
        // Both have different generations - this shouldn't happen in a proper tree
        console.log(`⚠️  ${name1} (gen ${gen1}) and ${name2} (gen ${gen2}) have different generations - using minimum`);
        const minGen = Math.min(gen1, gen2);
        await db.execute('UPDATE family_members SET generation_level = ? WHERE id IN (?, ?)', [minGen, spouse1_id, spouse2_id]);
      }
    }
    
    // Step 5: Handle any remaining unassigned members
    const [unassigned] = await db.execute(`
      SELECT id, first_name, last_name FROM family_members WHERE generation_level IS NULL
    `);
    
    if (unassigned.length > 0) {
      console.log('🔧 Handling unassigned members:', unassigned.map(m => `${m.first_name} ${m.last_name}`));
      
      for (const member of unassigned) {
        // Check if they have children with assigned generations
        const [childrenWithGen] = await db.execute(`
          SELECT fm.generation_level
          FROM parent_child_relationships pcr
          JOIN family_members fm ON pcr.child_id = fm.id
          WHERE pcr.parent_id = ? AND fm.generation_level IS NOT NULL
          ORDER BY fm.generation_level ASC
          LIMIT 1
        `, [member.id]);
        
        if (childrenWithGen.length > 0) {
          // Set parent to be one generation before their children
          const parentGen = childrenWithGen[0].generation_level - 1;
          console.log(`  👨‍👩‍👧‍👦 Setting ${member.first_name} ${member.last_name} to generation ${parentGen} (parent logic)`);
          await db.execute('UPDATE family_members SET generation_level = ? WHERE id = ?', [parentGen, member.id]);
        } else {
          // Check if they have parents with assigned generations
          const [parentsWithGen] = await db.execute(`
            SELECT fm.generation_level
            FROM parent_child_relationships pcr
            JOIN family_members fm ON pcr.parent_id = fm.id
            WHERE pcr.child_id = ? AND fm.generation_level IS NOT NULL
            ORDER BY fm.generation_level ASC
            LIMIT 1
          `, [member.id]);
          
          if (parentsWithGen.length > 0) {
            // Set child to be one generation after their parents
            const childGen = parentsWithGen[0].generation_level + 1;
            console.log(`  👶 Setting ${member.first_name} ${member.last_name} to generation ${childGen} (child logic)`);
            await db.execute('UPDATE family_members SET generation_level = ? WHERE id = ?', [childGen, member.id]);
          } else {
            // No relationships found - this is an isolated member
            console.log(`  🤷 Setting ${member.first_name} ${member.last_name} to generation 0 (isolated)`);
            await db.execute('UPDATE family_members SET generation_level = 0 WHERE id = ?', [member.id]);
          }
        }
      }
    }
    
    // Step 6: Get final results
    const [finalResults] = await db.execute(`
      SELECT generation_level, COUNT(*) as count 
      FROM family_members 
      GROUP BY generation_level 
      ORDER BY generation_level
    `);
    
    const [membersByGen] = await db.execute(`
      SELECT generation_level, GROUP_CONCAT(CONCAT(first_name, ' ', COALESCE(last_name, '')) SEPARATOR ', ') as members
      FROM family_members 
      GROUP BY generation_level 
      ORDER BY generation_level
    `);
    
    console.log('📊 Final generation distribution:');
    membersByGen.forEach(result => {
      console.log(`  Generation ${result.generation_level}: ${result.members}`);
    });
    
    res.json({
      success: true,
      message: 'Generations fixed successfully!',
      generationDistribution: finalResults,
      membersByGeneration: membersByGen
    });
    
  } catch (error) {
    console.error('❌ Error fixing generations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix generations: ' + error.message
    });
  } finally {
    await db.end();
  }
});

// Get a single family member by ID
router.get('/members/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await mysql.createConnection(dbConfig);
    
    const [members] = await db.execute(
      'SELECT * FROM family_members WHERE id = ?',
      [id]
    );
    
    await db.end();
    
    if (members.length === 0) {
      return res.status(404).json({ error: 'Family member not found' });
    }
    
    res.json(members[0]);
  } catch (error) {
    console.error('Error fetching family member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all relationships
router.get('/all-relationships', authenticateToken, async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);
    
    const [parentChild] = await db.execute(
      'SELECT parent_id, child_id, "parent-child" as type FROM parent_child_relationships'
    );
    
    const [marriages] = await db.execute(
      'SELECT spouse1_id as person1_id, spouse2_id as person2_id, "marriage" as type FROM marriages'
    );
    
    const [siblings] = await db.execute(
      'SELECT sibling1_id as person1_id, sibling2_id as person2_id, "sibling" as type FROM sibling_relationships'
    );
    
    await db.end();
    
    const allRelationships = [
      ...parentChild.map(r => ({ person1_id: r.parent_id, person2_id: r.child_id, type: r.type })),
      ...marriages,
      ...siblings
    ];
    
    res.json(allRelationships);
  } catch (error) {
    console.error('Error fetching all relationships:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Link a member to a user
router.put('/members/:id/link', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const db = await mysql.createConnection(dbConfig);
    
    await db.execute(
      'UPDATE family_members SET user_id = ? WHERE id = ?',
      [userId, id]
    );
    
    await db.end();
    res.json({ message: 'Member linked successfully' });
  } catch (error) {
    console.error('Error linking member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Guest routes
router.get('/guest/members', async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);
    const [members] = await db.execute('SELECT * FROM family_members ORDER BY first_name');
    await db.end();
    res.json(members);
  } catch (error) {
    console.error('Error fetching guest members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/guest/all-relationships', async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);
    
    const [parentChild] = await db.execute(
      'SELECT parent_id, child_id, "parent-child" as type FROM parent_child_relationships'
    );
    
    const [marriages] = await db.execute(
      'SELECT spouse1_id as person1_id, spouse2_id as person2_id, "marriage" as type FROM marriages'
    );
    
    const [siblings] = await db.execute(
      'SELECT sibling1_id as person1_id, sibling2_id as person2_id, "sibling" as type FROM sibling_relationships'
    );
    
    await db.end();
    
    const allRelationships = [
      ...parentChild.map(r => ({ person1_id: r.parent_id, person2_id: r.child_id, type: r.type })),
      ...marriages,
      ...siblings
    ];
    
    res.json(allRelationships);
  } catch (error) {
    console.error('Error fetching guest relationships:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Guest route for tree/generations
router.get('/guest/tree/generations', async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);
    const [generations] = await db.execute(
      `SELECT 
        generation_level,
        COUNT(*) as member_count,
        GROUP_CONCAT(CONCAT(first_name, ' ', COALESCE(last_name, '')) ORDER BY birth_date) as members
       FROM family_members 
       GROUP BY generation_level 
       ORDER BY generation_level`
    );
    await db.end();
    res.json(generations);
  } catch (error) {
    console.error('Error fetching guest generations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Guest route for stats
router.get('/guest/stats', async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN is_living = TRUE THEN 1 END) as living_members,
        COUNT(CASE WHEN is_living = FALSE THEN 1 END) as deceased_members,
        MIN(generation_level) as oldest_generation,
        MAX(generation_level) as youngest_generation,
        COUNT(DISTINCT generation_level) as total_generations,
        MIN(birth_date) as earliest_birth,
        MAX(birth_date) as latest_birth
      FROM family_members`
    );
    await db.end();
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching guest stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Guest route for families
router.get('/guest/families', async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);

    // Get all marriages 
    const [marriages] = await db.execute(`
      SELECT 
        m.id as marriage_id,
        m.marriage_date,
        m.marriage_place,
        m.status,
        s1.id as spouse1_id,
        s1.first_name as spouse1_first_name,
        s1.middle_name as spouse1_middle_name,
        s1.last_name as spouse1_last_name,
        s1.maiden_name as spouse1_maiden_name,
        s1.birth_date as spouse1_birth_date,
        s1.birth_place as spouse1_birth_place,
        s1.death_date as spouse1_death_date,
        s1.gender as spouse1_gender,
        s1.generation_level as spouse1_generation,
        s1.is_living as spouse1_living,
        s1.occupation as spouse1_occupation,
        s1.education as spouse1_education,
        s2.id as spouse2_id,
        s2.first_name as spouse2_first_name,
        s2.middle_name as spouse2_middle_name,
        s2.last_name as spouse2_last_name,
        s2.maiden_name as spouse2_maiden_name,
        s2.birth_date as spouse2_birth_date,
        s2.birth_place as spouse2_birth_place,
        s2.death_date as spouse2_death_date,
        s2.gender as spouse2_gender,
        s2.generation_level as spouse2_generation,
        s2.is_living as spouse2_living,
        s2.occupation as spouse2_occupation,
        s2.education as spouse2_education
      FROM marriages m
      JOIN family_members s1 ON m.spouse1_id = s1.id
      JOIN family_members s2 ON m.spouse2_id = s2.id
      ORDER BY s1.generation_level, m.marriage_date
    `);

    // For each marriage, get their children
    const families = [];
    
    for (const marriage of marriages) {
      // Get children of this couple
      const [children] = await db.execute(`
        SELECT DISTINCT c.*
        FROM family_members c
        JOIN parent_child_relationships pc1 ON c.id = pc1.child_id
        JOIN parent_child_relationships pc2 ON c.id = pc2.child_id
        WHERE pc1.parent_id = ? AND pc2.parent_id = ?
        ORDER BY c.birth_date
      `, [marriage.spouse1_id, marriage.spouse2_id]);

      families.push({
        marriage_id: marriage.marriage_id,
        marriage_date: marriage.marriage_date,
        marriage_place: marriage.marriage_place,
        status: marriage.status,
        generation_level: marriage.spouse1_generation,
        spouse1: {
          id: marriage.spouse1_id,
          first_name: marriage.spouse1_first_name,
          middle_name: marriage.spouse1_middle_name,
          last_name: marriage.spouse1_last_name,
          maiden_name: marriage.spouse1_maiden_name,
          birth_date: marriage.spouse1_birth_date,
          birth_place: marriage.spouse1_birth_place,
          death_date: marriage.spouse1_death_date,
          gender: marriage.spouse1_gender,
          generation_level: marriage.spouse1_generation,
          is_living: marriage.spouse1_living,
          occupation: marriage.spouse1_occupation,
          education: marriage.spouse1_education
        },
        spouse2: {
          id: marriage.spouse2_id,
          first_name: marriage.spouse2_first_name,
          middle_name: marriage.spouse2_middle_name,
          last_name: marriage.spouse2_last_name,
          maiden_name: marriage.spouse2_maiden_name,
          birth_date: marriage.spouse2_birth_date,
          birth_place: marriage.spouse2_birth_place,
          death_date: marriage.spouse2_death_date,
          gender: marriage.spouse2_gender,
          generation_level: marriage.spouse2_generation,
          is_living: marriage.spouse2_living,
          occupation: marriage.spouse2_occupation,
          education: marriage.spouse2_education
        },
        children: children
      });
    }

    // Also get single parents (people with children but no marriage record)
    const [singleParents] = await db.execute(`
      SELECT DISTINCT p.*
      FROM family_members p
      JOIN parent_child_relationships pc ON p.id = pc.parent_id
      WHERE p.id NOT IN (
        SELECT spouse1_id FROM marriages WHERE spouse1_id = p.id
        UNION
        SELECT spouse2_id FROM marriages WHERE spouse2_id = p.id
      )
      ORDER BY p.generation_level, p.birth_date
    `);

    for (const parent of singleParents) {
      const [children] = await db.execute(`
        SELECT c.*
        FROM family_members c
        JOIN parent_child_relationships pc ON c.id = pc.child_id
        WHERE pc.parent_id = ?
        ORDER BY c.birth_date
      `, [parent.id]);

      families.push({
        marriage_id: null,
        marriage_date: null,
        marriage_place: null,
        status: 'single_parent',
        generation_level: parent.generation_level,
        spouse1: parent,
        spouse2: null,
        children: children
      });
    }

    await db.end();

    // Sort families by generation level
    families.sort((a, b) => a.generation_level - b.generation_level);

    res.json(families);
  } catch (error) {
    console.error('Error fetching guest families:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Guest route for tree/hierarchy
router.get('/guest/tree/hierarchy', async (req, res) => {
  try {
    console.log('🔍 GUEST HIERARCHY ENDPOINT - MATCHING AUTHENTICATED FORMAT');
    const db = await mysql.createConnection(dbConfig);

    // Find the root couple - start with the oldest generation married couple
    const [rootCouples] = await db.execute(`
      SELECT 
        m.id as marriage_id,
        m.marriage_date,
        m.marriage_place,
        m.status,
        s1.id as spouse1_id,
        s1.first_name as spouse1_first_name,
        s1.middle_name as spouse1_middle_name,
        s1.last_name as spouse1_last_name,
        s1.maiden_name as spouse1_maiden_name,
        s1.birth_date as spouse1_birth_date,
        s1.birth_place as spouse1_birth_place,
        s1.death_date as spouse1_death_date,
        s1.gender as spouse1_gender,
        s1.generation_level as spouse1_generation,
        s1.is_living as spouse1_living,
        s1.occupation as spouse1_occupation,
        s1.education as spouse1_education,
        s2.id as spouse2_id,
        s2.first_name as spouse2_first_name,
        s2.middle_name as spouse2_middle_name,
        s2.last_name as spouse2_last_name,
        s2.maiden_name as spouse2_maiden_name,
        s2.birth_date as spouse2_birth_date,
        s2.birth_place as spouse2_birth_place,
        s2.death_date as spouse2_death_date,
        s2.gender as spouse2_gender,
        s2.generation_level as spouse2_generation,
        s2.is_living as spouse2_living,
        s2.occupation as spouse2_occupation,
        s2.education as spouse2_education
      FROM marriages m
      JOIN family_members s1 ON m.spouse1_id = s1.id
      JOIN family_members s2 ON m.spouse2_id = s2.id
      ORDER BY 
        LEAST(s1.generation_level, s2.generation_level) ASC,
        CASE WHEN m.marriage_date IS NULL THEN 1 ELSE 0 END,
        m.marriage_date ASC, 
        s1.birth_date ASC
      LIMIT 1
    `);

    if (rootCouples.length === 0) {
      await db.end();
      return res.json({
        rootCouple: null,
        childrenRow: [],
        totalMembers: 0,
        message: 'No root couple found'
      });
    }

    const rootCouple = rootCouples[0];
    console.log('✅ Found guest root couple:', rootCouple.spouse1_first_name, '&', rootCouple.spouse2_first_name);

    // Get ONLY the actual biological children (people in parent_child_relationships with root couple)
    const [actualChildren] = await db.execute(`
      SELECT DISTINCT c.*
      FROM family_members c
      JOIN parent_child_relationships pcr ON c.id = pcr.child_id
      WHERE (pcr.parent_id = ? OR pcr.parent_id = ?)
      ORDER BY c.birth_date
    `, [rootCouple.spouse1_id, rootCouple.spouse2_id]);

    console.log('👶 Found', actualChildren.length, 'actual biological children of guest root couple');

    // Build children row: ONLY biological children + their spouses (if any)
    const childrenRow = [];
    const processedChildIds = new Set();
    
    for (const child of actualChildren) {
      if (processedChildIds.has(child.id)) continue;

      console.log(`🔍 Processing guest biological child: ${child.first_name} ${child.last_name}`);

      // Check if this biological child has a spouse
      const [spouseMarriage] = await db.execute(`
        SELECT 
          m.id as marriage_id,
          m.marriage_date,
          m.marriage_place,
          m.status,
          m.spouse1_id,
          m.spouse2_id,
          CASE 
            WHEN m.spouse1_id = ? THEN s2.id
            ELSE s1.id 
          END as spouse_id,
          CASE 
            WHEN m.spouse1_id = ? THEN s2.first_name
            ELSE s1.first_name 
          END as spouse_first_name,
          CASE 
            WHEN m.spouse1_id = ? THEN s2.last_name
            ELSE s1.last_name 
          END as spouse_last_name
        FROM marriages m
        JOIN family_members s1 ON m.spouse1_id = s1.id
        JOIN family_members s2 ON m.spouse2_id = s2.id
        WHERE (m.spouse1_id = ? OR m.spouse2_id = ?)
      `, [child.id, child.id, child.id, child.id, child.id]);

      if (spouseMarriage.length > 0) {
        const marriage = spouseMarriage[0];
        console.log(`💑 Found spouse for guest biological child ${child.first_name}: ${marriage.spouse_first_name}`);
        
        // Get full spouse details
        const [spouseDetails] = await db.execute(`
          SELECT * FROM family_members WHERE id = ?
        `, [marriage.spouse_id]);

        if (spouseDetails.length > 0) {
          // Add as a couple unit: biological child + their spouse
          childrenRow.push({
            type: 'couple',
            spouse1: child, // The biological child (connects to parents)
            spouse2: spouseDetails[0], // The spouse (married into family)
            marriageInfo: {
              id: marriage.marriage_id,
              marriage_date: marriage.marriage_date,
              marriage_place: marriage.marriage_place,
              status: marriage.status
            }
          });
          processedChildIds.add(child.id);
          processedChildIds.add(marriage.spouse_id);
          console.log(`✅ Added guest couple: ${child.first_name} (biological) + ${spouseDetails[0].first_name} (married in)`);
        } else {
          // Spouse not found, add biological child alone
          childrenRow.push({
            type: 'individual',
            member: child,
            isOriginalChild: true
          });
          processedChildIds.add(child.id);
          console.log(`✅ Added guest individual: ${child.first_name} (biological child, no spouse in system)`);
        }
      } else {
        // No spouse found, add biological child alone
        childrenRow.push({
          type: 'individual',
          member: child,
          isOriginalChild: true
        });
        processedChildIds.add(child.id);
        console.log(`✅ Added guest individual: ${child.first_name} (biological child, no spouse)`);
      }
    }

    console.log('📊 Guest final children row has', childrenRow.length, 'items');

    await db.end();

    res.json({
      rootCouple: {
        spouse1: {
          id: rootCouple.spouse1_id,
          first_name: rootCouple.spouse1_first_name,
          middle_name: rootCouple.spouse1_middle_name,
          last_name: rootCouple.spouse1_last_name,
          maiden_name: rootCouple.spouse1_maiden_name,
          birth_date: rootCouple.spouse1_birth_date,
          birth_place: rootCouple.spouse1_birth_place,
          death_date: rootCouple.spouse1_death_date,
          gender: rootCouple.spouse1_gender,
          generation_level: rootCouple.spouse1_generation,
          is_living: rootCouple.spouse1_living,
          occupation: rootCouple.spouse1_occupation,
          education: rootCouple.spouse1_education
        },
        spouse2: {
          id: rootCouple.spouse2_id,
          first_name: rootCouple.spouse2_first_name,
          middle_name: rootCouple.spouse2_middle_name,
          last_name: rootCouple.spouse2_last_name,
          maiden_name: rootCouple.spouse2_maiden_name,
          birth_date: rootCouple.spouse2_birth_date,
          birth_place: rootCouple.spouse2_birth_place,
          death_date: rootCouple.spouse2_death_date,
          gender: rootCouple.spouse2_gender,
          generation_level: rootCouple.spouse2_generation,
          is_living: rootCouple.spouse2_living,
          occupation: rootCouple.spouse2_occupation,
          education: rootCouple.spouse2_education
        },
        marriageInfo: {
          id: rootCouple.marriage_id,
          marriage_date: rootCouple.marriage_date,
          marriage_place: rootCouple.marriage_place,
          status: rootCouple.status
        }
      },
      childrenRow: childrenRow,
      totalMembers: childrenRow.length + 2,
      rootGeneration: rootCouple.spouse1_generation
    });
  } catch (error) {
    console.error('Error fetching guest hierarchy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a parent-child relationship
router.delete('/relationships/parent-child/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await mysql.createConnection(dbConfig);

    // Check if user is admin
    const [users] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [req.user.userId]
    );

    const isAdmin = users.length > 0 && users[0].is_admin;

    if (!isAdmin) {
      await db.end();
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Check if the relationship exists
    const [relationships] = await db.execute(
      'SELECT id FROM parent_child_relationships WHERE id = ?',
      [id]
    );

    if (relationships.length === 0) {
      await db.end();
      return res.status(404).json({ error: 'Parent-child relationship not found' });
    }

    await db.execute(
      'DELETE FROM parent_child_relationships WHERE id = ?',
      [id]
    );

    await db.end();

    // Recalculate generation levels after removing relationship
    await updateGenerationLevels();

    res.json({ message: 'Parent-child relationship deleted successfully' });
  } catch (error) {
    console.error('Error deleting parent-child relationship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a parent-child relationship
router.put('/relationships/parent-child/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { relationship_type } = req.body;
    const db = await mysql.createConnection(dbConfig);

    // Check if user is admin
    const [users] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [req.user.userId]
    );

    const isAdmin = users.length > 0 && users[0].is_admin;

    if (!isAdmin) {
      await db.end();
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Check if the relationship exists
    const [relationships] = await db.execute(
      'SELECT id FROM parent_child_relationships WHERE id = ?',
      [id]
    );

    if (relationships.length === 0) {
      await db.end();
      return res.status(404).json({ error: 'Parent-child relationship not found' });
    }

    await db.execute(
      'UPDATE parent_child_relationships SET relationship_type = ? WHERE id = ?',
      [relationship_type || 'biological', id]
    );

    await db.end();

    res.json({ message: 'Parent-child relationship updated successfully' });
  } catch (error) {
    console.error('Error updating parent-child relationship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a marriage
router.delete('/marriages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await mysql.createConnection(dbConfig);

    // Check if user is admin
    const [users] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [req.user.userId]
    );

    const isAdmin = users.length > 0 && users[0].is_admin;

    if (!isAdmin) {
      await db.end();
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Check if the marriage exists
    const [marriages] = await db.execute(
      'SELECT id FROM marriages WHERE id = ?',
      [id]
    );

    if (marriages.length === 0) {
      await db.end();
      return res.status(404).json({ error: 'Marriage not found' });
    }

    await db.execute(
      'DELETE FROM marriages WHERE id = ?',
      [id]
    );

    await db.end();

    res.json({ message: 'Marriage deleted successfully' });
  } catch (error) {
    console.error('Error deleting marriage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a marriage
router.put('/marriages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      marriage_date,
      marriage_place,
      marriage_type,
      status,
      notes
    } = req.body;
    const db = await mysql.createConnection(dbConfig);

    // Check if user is admin
    const [users] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [req.user.userId]
    );

    const isAdmin = users.length > 0 && users[0].is_admin;

    if (!isAdmin) {
      await db.end();
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Check if the marriage exists
    const [marriages] = await db.execute(
      'SELECT id FROM marriages WHERE id = ?',
      [id]
    );

    if (marriages.length === 0) {
      await db.end();
      return res.status(404).json({ error: 'Marriage not found' });
    }

    await db.execute(
      `UPDATE marriages 
       SET marriage_date = ?, marriage_place = ?, marriage_type = ?, status = ?, notes = ?
       WHERE id = ?`,
      [
        marriage_date || null,
        marriage_place || null,
        marriage_type || 'marriage',
        status || 'married',
        notes || null,
        id
      ]
    );

    await db.end();

    res.json({ message: 'Marriage updated successfully' });
  } catch (error) {
    console.error('Error updating marriage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
