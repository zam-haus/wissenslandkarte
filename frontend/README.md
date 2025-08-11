# Wissenslandkarte

# Development setup

Start dependency systems:

- minio from `../s3-storage` (see readme there)
- meilisearch from `../meilisearch` (see readme there)
- (optional): keycloak from `../dev-keycloak`

```
npm ci
cp .env.example .env
# Adapt .env
npm run db:seed-dev
npm run dev
```
