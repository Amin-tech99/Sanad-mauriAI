# Sanad MauriAI - Professional Translation Platform

A comprehensive translation management platform built with React, Express, and PostgreSQL.

## 🚀 Features

- **User Management**: Role-based access control (Admin, Translator, QA)
- **Source Management**: Upload and manage translation sources
- **Template System**: Create instruction templates for translators
- **Work Packet Creation**: Distribute work efficiently among translators
- **Quality Assurance**: Built-in QA workflow and review system
- **Platform Control**: Feature toggle system for administrators
- **Analytics Dashboard**: Comprehensive statistics and performance metrics

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session management
- **UI Components**: Radix UI, Lucide React
- **State Management**: TanStack Query, Zustand

## 📦 Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ParagraphTranslator-1
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your database credentials and other configuration.

4. Set up the database:
```bash
npm run db:push
```

5. Initialize platform features:
```bash
npx tsx scripts/init-platform-features.ts
```

6. Set up test data (optional):
```bash
npx tsx scripts/setup-complete-test-data.ts
```

## 🚀 Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🌐 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A secure session secret
   - `NODE_ENV`: production

4. Deploy!

### Database Setup for Production

We recommend using [Neon](https://neon.tech/) for PostgreSQL hosting (free tier available):

1. Create a Neon account
2. Create a new database
3. Copy the connection string to your `DATABASE_URL` environment variable
4. Run database migrations after deployment

## 📝 Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session management
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)

## 🔧 Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run db:push`: Push database schema
- `npm run db:generate`: Generate database migrations

## 📚 Documentation

For detailed feature documentation, see:
- [Translator Features Guide](./TRANSLATOR_FEATURES_GUIDE.md)
- [Deployment Summary](./DEPLOYMENT_SUMMARY.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.
