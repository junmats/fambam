# FamBam - Family Tree Web Application

A full-stack family tree web application built with React, Node.js, and MySQL.

## Features

### 🌳 **Multi-Generational Family Trees**
- **Unlimited generations** - Track family lineage across centuries
- **Automatic generation calculation** - Smart generation level assignment
- **Enhanced person profiles** - Comprehensive genealogical data including:
  - Multiple name fields (first, middle, last, maiden)
  - Birth/death dates and places
  - Living status tracking
  - Occupation and education history
  - Personal notes and biography

### 👥 **Advanced Relationship Management**
- **Parent-Child relationships** with types (biological, adopted, step, foster, guardian)
- **Marriage/Partnership tracking** with dates, places, and status
- **Sibling relationships** (full, half, step, adopted)
- **Life events** - Track important milestones beyond birth/death

### 📊 **Family Tree Analytics**
- **Generation-based visualization** - View family by generation levels
- **Comprehensive statistics** - Member counts, generation spans, relationship stats
- **Timeline analysis** - Track family history chronologically
- **Multi-tree support** - Organize different family branches

### 🔐 **User Management**
- User authentication (register/login)
- JWT-based security
- Multi-tenant support (each user has their own family trees)

### 💻 **Modern Interface**
- Responsive design for desktop and mobile
- Interactive family tree visualization
- Enhanced forms with conditional fields
- Real-time statistics and insights

## Technology Stack

### Frontend
- React with TypeScript
- React Router for navigation
- Axios for API calls
- CSS3 for styling

### Backend
- Node.js with Express
- JWT authentication
- MySQL database
- bcryptjs for password hashing

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MySQL (v8 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fambam
   ```

2. Install dependencies for all packages:
   ```bash
   npm run install:all
   ```

3. Set up the database:
   - Create a MySQL database
   - Copy `server/.env.example` to `server/.env`
   - Update the database configuration in `server/.env`

4. Start the development servers:
   ```bash
   npm run dev
   ```

This will start both the client (port 3000) and server (port 5000) concurrently.

### Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fambam_db
DB_PORT=3306
JWT_SECRET=your_super_secure_jwt_secret_key_here
```

## Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run client:dev` - Start only the React client
- `npm run server:dev` - Start only the Node.js server
- `npm run build` - Build the React app for production
- `npm start` - Start the production server

## Database Schema (Enhanced)

### Core Tables for Multi-Generational Support

#### `family_members` (Enhanced)
- **Basic Info**: first_name, middle_name, last_name, maiden_name
- **Dates/Places**: birth_date, birth_place, death_date, death_place
- **Status**: is_living, gender, generation_level
- **Details**: occupation, education, bio, notes, photo_url

#### `parent_child_relationships`
- **Lineage Tracking**: parent_id, child_id, relationship_type
- **Types**: biological, adopted, step, foster, guardian
- **Benefits**: Direct ancestry queries, generation calculations

#### `marriages`
- **Partnership Data**: spouse1_id, spouse2_id, marriage_date, marriage_place
- **Types**: marriage, civil_union, domestic_partnership, common_law
- **Status**: married, divorced, separated, widowed, annulled

#### `sibling_relationships`
- **Sibling Connections**: sibling1_id, sibling2_id, relationship_type
- **Types**: full, half, step, adopted

#### `family_trees`
- **Multi-Tree Support**: tree_name, description, root_person_id
- **Organization**: Separate maternal/paternal lines

#### `life_events`
- **Event Tracking**: birth, death, marriage, divorce, graduation, employment, military, immigration
- **Timeline**: event_date, event_place, description

### Key Improvements from Original Schema

1. **Specialized Relationship Tables** - Replace generic relationships with specific parent-child, marriage, and sibling tables
2. **Enhanced Person Data** - Added places, maiden names, living status, profession details
3. **Generation Tracking** - Automatic calculation of generation levels
4. **Multi-Tree Support** - Organize different family branches
5. **Life Events** - Track important milestones beyond basic data
6. **Performance Optimization** - Indexes for generation queries and lineage traversal

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Family Management
- `GET /api/family/members` - Get all family members
- `POST /api/family/members` - Add a new family member
- `PUT /api/family/members/:id` - Update a family member
- `DELETE /api/family/members/:id` - Delete a family member
- `GET /api/family/relationships` - Get all relationships
- `POST /api/family/relationships` - Add a new relationship

# Enhanced Multi-Generational Features

## Sample Data Setup

The project includes a comprehensive 5-generation sample family tree for testing:

```bash
# Load sample data (requires MySQL to be running)
./load_sample_data.sh
```

**Sample Data Includes:**
- 🏴‍☠️ **5 generations** of the Smith family (1850-2005)
- 🌍 **Immigration tracking** from Ireland/England to America
- 💑 **Multiple marriage types** and relationship statuses
- 👨‍👩‍👧‍👦 **Various family structures** including step-relationships
- 🎓 **Education and occupation** history
- 📍 **Geographic data** with birth/death places

## Testing the Enhanced Features

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Register a new account** or use the demo data

3. **Test Multi-Generational Features:**
   - Add family members with enhanced fields
   - Create parent-child relationships
   - View generation-based family tree
   - Check family statistics

4. **Test Relationship Management:**
   - Add marriages with dates and places
   - Create sibling relationships
   - Track different relationship types

## New API Endpoints

The enhanced backend includes specialized endpoints for genealogical research:

```
# Multi-generational queries
GET /api/family/tree/generations     # Group members by generation
GET /api/family/members/:id/ancestors   # Get ancestor lineage
GET /api/family/members/:id/descendants # Get descendant lineage

# Relationship management
POST /api/family/relationships/parent-child  # Add parent-child relationships
POST /api/family/marriages                   # Add marriages/partnerships
POST /api/family/relationships/siblings     # Add sibling relationships

# Analytics
GET /api/family/stats                        # Comprehensive family statistics
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

This project is licensed under the ISC License.
