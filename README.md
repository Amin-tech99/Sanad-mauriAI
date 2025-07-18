# Sanad MauriAI - Professional Translation Platform

A sophisticated translation management platform specifically designed for Arabic-to-Hassaniya translation workflows. Sanad MauriAI provides a complete suite of tools for managing translation projects, quality assurance, and team collaboration.

## 🌟 Features

### Core Translation Management
- **Work Packet System**: Organize translations into manageable units (sentences/paragraphs)
- **Template-based Instructions**: Standardized translation guidelines with customizable templates
- **Quality Assurance Pipeline**: Multi-stage review process with scoring and feedback
- **Real-time Collaboration**: Team-based translation workflows with role-based access

### Translation Excellence Tools
- **Approved Terms Database**: Consistency management for Arabic-Hassaniya terminology
- **Contextual Lexicon**: Word alternatives with context-aware suggestions
- **Style Tags**: Dynamic style management for different translation contexts
- **Contextual Hints**: Real-time assistance for translators during work

### Advanced Features
- **Analytics Dashboard**: Performance metrics and workflow insights
- **Export Management**: Multiple format support for completed translations
- **User Management**: Role-based access control (Admin, Translator, QA)
- **Platform Control**: Feature toggles and system configuration

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with custom styling
- **Radix UI** components library
- **Wouter** for routing
- **React Query** for state management
- **Zustand** for global state
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **PostgreSQL** (Neon Database)
- **Passport.js** for authentication
- **Express Sessions** for session management

### Database
- **PostgreSQL** with comprehensive schema
- **Neon Database** for serverless PostgreSQL
- **Drizzle Kit** for migrations
- **Connection pooling** for performance

## 📦 Installation

### Prerequisites
- Node.js 20 or higher
- PostgreSQL database (or Neon account)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Amin-tech99/Sanad-mauriAI.git
   cd Sanad-mauriAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/sanad_db
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## 🚀 Deployment

### Railway Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to [Railway.app](https://railway.app)
   - Create new project → "Deploy from GitHub"
   - Select your repository
   - Add PostgreSQL service
   - Railway will automatically:
     - Use `npm run build` for building
     - Use `npm start` for starting
     - Inject `DATABASE_URL` from PostgreSQL service

3. **Initialize Database**
   From Railway dashboard → Shell:
   ```bash
   npm run db:push
   ```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🗄️ Database Schema

### Core Tables
- **users**: User management with roles (admin, translator, qa)
- **sources**: Original content to be translated
- **instruction_templates**: Translation guidelines and templates
- **work_packets**: Translation project containers
- **work_items**: Individual translation units
- **work_item_assignments**: Task assignments to translators

### Translation Enhancement Tables
- **approved_terms**: Arabic-Hassaniya terminology consistency
- **style_tags**: Dynamic style management
- **contextual_lexicon**: Word alternatives with context
- **word_alternatives**: Alternative word suggestions
- **word_alternative_style_tags**: Style-aware word alternatives

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (auto-configured on Railway)

### Feature Flags
The platform includes feature toggle system for:
- Advanced analytics
- Export capabilities
- Word suggestions
- Platform control access

## 📚 Usage

### For Administrators
1. **User Management**: Create and manage translator/QA accounts
2. **Source Management**: Upload and organize content for translation
3. **Template Creation**: Define translation guidelines and instructions
4. **Quality Control**: Monitor translation quality and team performance

### For Translators
1. **Work Assignment**: Access assigned translation tasks
2. **Translation Workspace**: Real-time translation interface with assistance
3. **Quality Submission**: Submit completed translations for review
4. **Performance Tracking**: Monitor personal translation metrics

### For QA Reviewers
1. **Review Queue**: Access submitted translations for review
2. **Quality Scoring**: Rate translations with detailed feedback
3. **Approval Process**: Approve or reject translations with comments
4. **Quality Analytics**: Track quality trends and improvement areas

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact:
- Email: [your-email@example.com]
- GitHub Issues: [Repository Issues](https://github.com/Amin-tech99/Sanad-mauriAI/issues)

## 🙏 Acknowledgments

- Built with modern web technologies for scalability and performance
- Designed specifically for Arabic-Hassaniya translation workflows
- Optimized for professional translation team collaboration

---

**Sanad MauriAI** - Bridging Languages, Preserving Culture
