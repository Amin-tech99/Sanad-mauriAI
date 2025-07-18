# Project Sanad - Data Annotation Platform

## Overview

Project Sanad is a professional, role-based web application designed to manage a high-throughput data creation workflow for Arabic language translation and annotation. The platform facilitates the creation of a large, high-quality dataset through a structured workflow involving multiple user roles with distinct responsibilities. The system includes advanced smart features: consistency preservation system for Hassaniya writing with auto-suggestions of approved terms, contextual word alternatives based on translation styles, collaborative word suggestion system, and AI-optimized export capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system variables
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Neon serverless with WebSocket support

## Key Components

### User Roles & Access Control
The system implements three distinct user roles with hierarchical permissions:

1. **Admin**: Full system access including user management, source content management, template creation, and work packet assignment
2. **Translator**: Limited access to assigned work items and workspace functionality
3. **QA Lead**: Access to quality assurance queue and review functionality

### Data Workflow Management
- **Sources**: Text content repository with tagging and status tracking
- **Instruction Templates**: Configurable task definitions with custom output formats
- **Work Packets**: Grouped assignments linking sources to templates
- **Work Items**: Individual translation tasks with status progression
- **Work Item Assignments**: User-specific task assignments with tracking
- **Approved Terms**: Hassaniya consistency system with auto-suggestions for approved terminology
- **Platform Features**: Database-driven feature toggle system with dependency tracking

### Status-Driven Workflow
Work items progress through defined states:
- Pending Assignment → In Progress → In QA → Approved/Rejected

## Data Flow

1. **Content Ingestion**: Admins upload source content through the Sources interface
2. **Template Creation**: Admins define instruction templates for different task types
3. **Work Packet Generation**: Admins create work packets by combining sources and templates
4. **Task Assignment**: Work items are automatically or manually assigned to translators
5. **Translation Work**: Translators complete assigned tasks in the workspace with consistency suggestions
6. **Quality Assurance**: QA leads review submitted work and approve or reject with feedback
7. **Data Export**: Approved work items can be exported in multiple formats (JSONL, CSV)

## Key Features

### Platform Control System
- **Comprehensive Feature Management**: Admins can enable/disable any feature on the platform
- **Dependency Management**: Automatically handles feature dependencies to prevent conflicts
- **Category Organization**: Features grouped by category (core, translation, quality, data, user)
- **Real-time Updates**: Changes take effect immediately across the platform
- **Feature Statistics**: Dashboard showing enabled/disabled features and dependencies
- **Safe Guards**: Critical features protected from accidental disabling
- **Smart Features Enabled**: All translator assistance features are now active

### Hassaniya Consistency System
- **Auto-Suggestions**: As translators type Arabic words, approved Hassaniya terms appear as suggestions
- **Smart Detection**: System detects when translators are typing Arabic text and shows relevant approved terms
- **Click to Insert**: Translators can click on suggestions to insert approved terms automatically
- **Frequency Tracking**: Terms are tracked by usage frequency to show most relevant suggestions first
- **Admin Management**: Admins can add and manage approved terms through dedicated interface
- **Context Support**: Terms can include context and categories for disambiguation
- **Feature Gating**: All assistance features can be controlled through platform settings
- **Test Data**: 9 approved terms loaded (السلام عليكم، مرحبا، شكراً، كيف حالك، ما اسمك، نظام، ترجمة، كلمات، استخدام)

### Contextual Word Alternatives System
- **Style-Based Suggestions**: Different word alternatives based on translation style (formal/informal/technical)
- **Real-time Detection**: Automatically detects Arabic words at cursor position
- **Style-Aware**: Shows only alternatives relevant to the current work item's style
- **Visual Indicators**: Clear UI showing alternative words with style tags
- **Test Data**: Word alternatives configured for قال، مرحبا، شكرا with formal/informal variants

### Collaborative Word Suggestion System
- **Post-Submission Dialog**: After completing a translation, translators can suggest new word alternatives
- **Style Association**: Each suggestion can be linked to specific translation styles
- **Context Support**: Translators can provide context for their suggestions
- **Batch Suggestions**: Multiple word pairs can be suggested at once
- **Admin Review**: Suggestions are queued for admin approval before becoming active

### Advanced Analytics Dashboard
- **Comprehensive Performance Metrics**: Multi-dimensional analytics including production trends, quality metrics, and user performance
- **Visual Data Representation**: Interactive charts using Recharts library for trend analysis, pie charts, bar charts, and area charts
- **Time Period Filtering**: Configurable analytics periods (week, month, quarter) for flexible time-based analysis
- **Production Trends**: Daily aggregation of approved vs rejected work items with visual trend analysis
- **Translator Performance Ranking**: Individual translator metrics including completion rates, approval rates, and average time per item
- **Quality Analytics**: Overall approval rates, average daily production, peak productivity hours, and common rejection reason analysis
- **Workflow Bottleneck Analysis**: Identification of workflow stages with highest wait times and completion time analysis
- **Content Analytics**: Performance analysis by source types, template effectiveness metrics, and style tag usage statistics
- **Data Export Capability**: JSON export functionality for external analysis and reporting
- **Real-time Dashboard**: Live updating metrics with responsive design for mobile and desktop access

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database with WebSocket connections
- **Connection Pooling**: Managed through Neon's connection pooling

### UI Components
- **Radix UI**: Comprehensive set of accessible React components
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library with customizable styling
- **Recharts**: Advanced charting library for data visualization and analytics dashboards

### Development Tools
- **Replit Integration**: Development environment support with error overlay and cartographer
- **Hot Module Replacement**: Vite-powered development server with HMR

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds the React application to `dist/public`
- **Backend**: esbuild bundles the Express server to `dist/index.js`
- **Database**: Drizzle migrations are applied via `db:push` command

### Environment Configuration
- **Development**: Uses tsx for TypeScript execution with hot reloading
- **Production**: Compiled JavaScript execution with optimized builds
- **Environment Variables**: Database URL and session secrets required for operation

### File Structure
- **Shared Schema**: Common TypeScript definitions in `/shared` directory
- **Client Code**: React application in `/client` directory
- **Server Code**: Express backend in `/server` directory
- **Migrations**: Database migrations in `/migrations` directory

The application follows a monorepo structure with clear separation between client, server, and shared code, enabling efficient development and deployment while maintaining type safety across the entire stack.