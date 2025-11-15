# Baseball Card Creator

A full-stack web application for creating custom baseball trading cards with print-ready exports.

## Project Structure

```
AI_prototypes/
├── frontend/          # Next.js frontend application
├── backend/           # NestJS backend API
├── rendering-service/ # Node.js rendering service for exports
└── spec_1_baseball_card_creator.md
```

## Features

- User authentication (JWT-based)
- Template management (default vintage 1990s templates + custom templates)
- Card builder with player information and statistics
- High-resolution export (PNG, JPEG, PDF at 300 DPI)
- Image upload and management
- User dashboard with card gallery

## Tech Stack

### Frontend
- Next.js 16 (React)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Axios (API client)
- Fabric.js (for canvas editor - to be implemented)

### Backend
- NestJS
- PostgreSQL with Prisma ORM
- JWT authentication
- AWS S3 integration
- TypeScript

### Rendering Service
- Node.js with Express
- Puppeteer (headless Chromium for rendering)
- TypeScript

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database
- AWS S3 buckets (or local development setup)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (create `.env` file):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/baseball_cards"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
S3_USER_IMAGES_BUCKET="user-images"
S3_TEMPLATES_BUCKET="templates"
S3_EXPORTS_BUCKET="exports"
PORT=3001
RENDERING_SERVICE_URL="http://localhost:3002"
```

4. Run Prisma migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. Start the backend:
```bash
npm run start:dev
```

### Rendering Service Setup

1. Navigate to rendering-service directory:
```bash
cd rendering-service
```

2. Install dependencies:
```bash
npm install
```

3. Build TypeScript:
```bash
npm run build
```

4. Start the service:
```bash
npm run dev
# or for production
npm start
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (create `.env.local` file):
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Templates
- `GET /templates` - Get all templates
- `GET /templates/:id` - Get template by ID
- `POST /templates` - Create template (authenticated)
- `PUT /templates/:id` - Update template (authenticated)
- `DELETE /templates/:id` - Delete template (authenticated)

### Cards
- `GET /cards` - Get user's cards (authenticated)
- `GET /cards/:id` - Get card by ID (authenticated)
- `POST /cards` - Create card (authenticated)
- `PUT /cards/:id` - Update card (authenticated)
- `DELETE /cards/:id` - Delete card (authenticated)
- `POST /cards/:id/duplicate` - Duplicate card (authenticated)

### Assets
- `POST /assets/upload` - Upload image (authenticated)

### Export
- `POST /export/card/:id?format=png|jpeg|pdf` - Export card (authenticated)

### Users
- `GET /users/me` - Get user profile (authenticated)
- `PUT /users/me` - Update user profile (authenticated)

## Default Templates

The seeder creates 5 vintage 1990s-inspired templates:
1. Topps 1990 Style
2. Donruss 1991 Style
3. Score 1992 Style
4. Upper Deck 1990 Style
5. Fleer 1991 Style

## Development Notes

- All dependencies are installed locally (no global installs)
- Use `npx` for one-time CLI tool execution
- Prisma migrations should be run before starting the backend
- The rendering service requires Puppeteer which downloads Chromium on first install

## Next Steps

The following features are implemented but may need additional work:
- Canvas editor with Fabric.js (basic structure in place)
- Image cropping and background removal
- Template editor UI
- Mobile responsiveness
- Export quality validation

## License

ISC

