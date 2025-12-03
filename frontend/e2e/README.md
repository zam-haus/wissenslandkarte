# E2E Tests with Playwright

This directory contains end-to-end tests for the Wissenslandkarte application using Playwright.

## Setup

### Prerequisites

1. Node.js 20+ installed
2. Docker and Docker Compose (for external services)
3. Application dependencies installed (`npm ci`)

### Initial Setup

1. Install Playwright browsers:

   ```bash
   npx playwright install
   ```

2. (Optional) Start external services for full testing:

   ```bash
   npm run test:e2e:services
   ```

3. Run tests:
   ```bash
   npm run test:e2e
   ```

## Test Structure

### Page Objects (`pages/`)

- `BasePage.ts` - Common functionality across all pages
- `LoginPage.ts` - Authentication and login functionality
- `ProjectsPage.ts` - Project listing and creation
- `ProjectDetailsPage.ts` - Individual project management
- `SearchPage.ts` - Search functionality
- `UserProfilePage.ts` - User profile management

### Utilities (`utils/`)

- `db-setup.ts` - Database initialization and cleanup
- `db-cleanup.ts` - Test data cleanup utilities
- `test-data.ts` - Predefined test data
- `auth.ts` - Authentication helpers

### Test Files

- `auth.spec.ts` - Authentication flow tests
- `projects.spec.ts` - Project CRUD operations
- `search.spec.ts` - Search functionality
- `users.spec.ts` - User profile management

## Running Tests

### Basic Commands

```bash
# Run all e2e tests
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run tests in headed mode (see browser)
npm run test:e2e:headed
```

### External Services

```bash
# Start external services (Minio, Meilisearch, Keycloak)
npm run test:e2e:services

# Stop external services
npm run test:e2e:services:down
```

## Configuration

### Environment Variables

Tests use `.env.test` for configuration. Key variables:

- `DATABASE_URL=file:./prisma/test.db` - Test database
- `DANGER_ENABLE_FAKE_LOGIN_ON_DEV=true` - Enable fake login
- `DANGER_FAKE_LOGIN_PASSWORD=test-password` - Fake login password

### Playwright Configuration

See `playwright.config.ts` for:

- Browser configuration
- Test directory setup
- Screenshot/video recording
- Web server configuration

## Test Data

Tests use predefined test data from `utils/test-data.ts`:

- Test users with different roles
- Sample projects and tags
- Project steps for testing

## CI/CD Integration

For GitHub Actions or similar CI systems:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e
  env:
    NODE_ENV: development
    DATABASE_URL: file:./prisma/test.db
    DANGER_ENABLE_FAKE_LOGIN_ON_DEV: true
    DANGER_FAKE_LOGIN_PASSWORD: test-password
```

## Troubleshooting

### Common Issues

1. **Browser dependencies missing**: Run `npx playwright install --with-deps`
2. **Database connection issues**: Ensure test database is properly initialized
3. **Authentication failures**: Check fake login configuration
4. **External service issues**: Verify Docker services are running

### Debug Mode

Use `npm run test:e2e:debug` to:

- Step through tests interactively
- Inspect page state
- Debug selectors and interactions

### Screenshots and Videos

Failed tests automatically capture:

- Screenshots on failure
- Video recordings
- Trace files for debugging

These are saved in `test-results/` directory.
