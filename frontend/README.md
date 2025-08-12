# Wissenslandkarte

## Development Setup

Start dependency systems:

- minio from `../s3-storage` (see readme there)
- meilisearch from `../meilisearch` (see readme there)
- (optional): keycloak from `../dev-keycloak`

```bash
npm ci
cp .env.example .env
# Adapt .env
npm run db:seed-dev
npm run dev
```

## Project Structure

Here is a subset of the project structure with the most relevant folders:

```
app/                        # Main application code
  ├── database/
  │   └── repositories/     # Data access layer
  ├── components/           # Reusable UI components (also in route folders)
  ├── lib/                  # Utility libraries for server code (also in route folders)
  ├── routes/
  │   ├── _auth+/           # Authentication routes
  │   ├── admin+/           # Admin panel routes
  │   ├── projects+/        # Project management routes
  │   ├── search+/          # Search functionality routes
  │   └── users+/           # User profile routes
  └── styles/               # Global styles and CSS variables

prisma/                     # Database schema and migrations
  └── initialization/       # Database seeding scripts

public/
  └── locales/              # Translation files
types/                      # TypeScript type definitions
```

## NPM Scripts

### Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality

**Formatting:**

- `npm run format` - Format all code with Prettier
- `npm run format-check` - Check if code is properly formatted (CI)

**Linting:**

- `npm run lint` - Run ESLint to check code quality
- `npm run lint-fix` - Automatically fix ESLint issues

**Type Checking:**

- `npm run typecheck` - Run TypeScript compiler to check types

### Database Management

1. **`npm run db:remove`** - Remove the existing database file
2. **`npm run db:setup`** - Set up fresh database:
   - Generate Prisma client
   - Deploy migrations
   - Push schema changes
   - Seed with production data
3. **`npm run db:clean`** - Reinitialize a fresh prod-database by running remove + setup in sequence
4. **`npm run db:seed-dev`** - Like db:clean, but initializes a dev-database
5. **`npm run db:generate-migration`** - Create new migration from schema changes
