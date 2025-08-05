# Enhanced Family Tree Database Structure

This database structure is designed to support multi-generational family trees with comprehensive genealogical data tracking.

## Core Tables

### 1. `users`
- **Purpose**: User authentication and account management
- **Key Fields**: email, password, first_name, last_name

### 2. `family_members`
- **Purpose**: Store individual person data with enhanced genealogical fields
- **Key Enhancements**:
  - `created_by`: Tracks which user created the family member (for audit purposes)
  - `user_id`: Reserved for future functionality (currently NULL)
  - `generation_level`: Automatic calculation of generation distance from root
  - `maiden_name`: For tracking pre-marriage surnames
  - `birth_place`, `death_place`: Geographic information
  - `is_living`: Boolean flag for living/deceased status
  - `facebook_url`, `twitter_url`, `instagram_url`: Social media profiles
  - Multiple name fields for comprehensive identification

**Note**: The family tree operates as a collaborative space where all authenticated users can view and edit all family members. The `created_by` field is used for audit trail purposes only, not for access control.

### 3. `parent_child_relationships`
- **Purpose**: Direct lineage tracking with relationship types
- **Relationship Types**: biological, adopted, step, foster, guardian
- **Benefits**: 
  - Clear parent-child lineage for generation calculations
  - Support for non-biological family structures
  - Efficient ancestor/descendant queries

### 4. `marriages`
- **Purpose**: Marriage and partnership tracking
- **Features**:
  - Multiple marriage types (marriage, civil union, domestic partnership, common law)
  - Status tracking (married, divorced, separated, widowed, annulled)
  - Date and place information for marriages and divorces
  - Notes field for additional details

### 5. `sibling_relationships`
- **Purpose**: Sibling connections with relationship types
- **Types**: full, half, step, adopted
- **Benefits**: Helps establish family groups within generations

### 6. `family_trees`
- **Purpose**: Organize multiple family lines per user
- **Features**:
  - Named trees for different family branches
  - Root person designation
  - Default tree selection

### 7. `family_tree_members`
- **Purpose**: Link family members to specific trees
- **Benefits**: Support for multiple family lines and trees

### 8. `life_events`
- **Purpose**: Track significant life events beyond birth/death
- **Event Types**: birth, death, marriage, divorce, graduation, employment, military, immigration, other

## Generation Level Calculation

The system automatically calculates generation levels relative to the oldest ancestor or a designated root person:

- **Generation 0**: Root person (oldest ancestor or designated starting point)
- **Generation 1**: Children of root person
- **Generation 2**: Grandchildren of root person
- **Generation -1**: Parents of root person (if they exist)

## Multi-Generational Features

### 1. **Unlimited Generations**
- No limit on the number of generations that can be tracked
- Automatic generation level calculation
- Support for both ascending (ancestors) and descending (descendants) lineage

### 2. **Recursive Queries**
- Built-in support for ancestor/descendant queries
- Configurable generation depth limits
- Efficient tree traversal using SQL recursive CTEs

### 3. **Statistics and Analytics**
- Generation span tracking
- Living vs. deceased member counts
- Relationship type distributions
- Timeline analysis (earliest to latest births)

## API Endpoints for Multi-Generational Support

### Family Tree Queries
- `GET /api/family/tree/generations` - Get members grouped by generation
- `GET /api/family/members/:id/ancestors` - Get all ancestors of a person
- `GET /api/family/members/:id/descendants` - Get all descendants of a person
- `GET /api/family/stats` - Get comprehensive family tree statistics

### Relationship Management
- `POST /api/family/relationships/parent-child` - Add parent-child relationship
- `POST /api/family/marriages` - Add marriage/partnership
- `POST /api/family/relationships/siblings` - Add sibling relationship

## Sample Genealogical Scenarios Supported

### 1. **Traditional Nuclear Families**
- Parents → Children → Grandchildren
- Multiple generations of siblings
- In-law relationships through marriages

### 2. **Complex Modern Families**
- Blended families with step-relationships
- Adopted children and foster relationships
- Multiple marriages and partnerships

### 3. **Historical Genealogy**
- Long ancestral lines (10+ generations)
- Immigration and geographic tracking
- Historical life events and occupations

### 4. **Multiple Family Lines**
- Separate trees for maternal/paternal lines
- In-law family integration
- Cousin relationships across family branches

## Database Indexes for Performance

- Generation level indexing for fast generation queries
- Birth date indexing for chronological sorting
- Relationship indexing for quick lineage traversal
- User-specific indexing for multi-tenant support

## Benefits of This Structure

1. **Scalability**: Supports families from small nuclear units to extensive multi-generational trees
2. **Flexibility**: Accommodates various family structures and relationship types
3. **Performance**: Optimized queries for common genealogical operations
4. **Completeness**: Comprehensive data fields for thorough genealogical research
5. **Future-Proof**: Extensible structure for additional features and data types
