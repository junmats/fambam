<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Family Tree Web Application - Copilot Instructions

This is a full-stack family tree web application with the following technology stack:

## Frontend (client/)
- React with TypeScript
- Focus on creating intuitive UI for building and visualizing family trees
- Include features for adding family members, managing relationships, and displaying genealogy data
- Use modern React patterns like hooks and functional components

## Backend (server/)
- Node.js with Express
- RESTful API endpoints for authentication and family data management
- JWT-based authentication
- MySQL database integration using mysql2

## Database Schema
- Users table for authentication
- Family members table for storing individual person data
- Relationships table for defining family connections (parent, child, spouse, sibling)

## Development Guidelines
- Follow REST API conventions
- Implement proper error handling and validation
- Use environment variables for configuration
- Maintain consistent code style across frontend and backend
- Consider scalability and performance for large family trees
- Implement proper authentication middleware for protected routes

## Key Features to Focus On
- User registration and login
- Family member management (CRUD operations)
- Relationship mapping between family members
- Visual family tree representation
- Search and filter functionality
- Photo upload capabilities for family members
