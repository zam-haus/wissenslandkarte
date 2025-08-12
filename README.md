# Wissenslandkarte

A knowledge mapping application that helps users discover, organize, and share knowledge through projects and collaborative workspaces.

## Project Overview

Wissenslandkarte is a full-stack web application built with:
- **Frontend**: Remix (React-based framework)
- **Database**: SQLite with Prisma ORM
- **Search**: Meilisearch for fast full-text search
- **Storage**: MinIO (S3-compatible object storage)
- **Authentication**: Keycloak for SSO and user management

## Project Structure

```
wissenslandkarte/
├── frontend/                    # Main Remix application
├── s3-storage/                  # Development MinIO object storage setup
├── meilisearch/                 # Development search engine setup
├── dev-keycloak/                # Development authentication server
├── documents/                   # Project documentation
├── deploy/                      # Deployment configurations
│   └── preview/                 # Preview environment setup
├── .github/                     # GitHub workflows and configurations
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- asdf (tool version manager)
- npm

## Service Dependencies

The application requires these services to be running to be fully functional:

- **MinIO** (s3-storage): File uploads and storage (optional if uploads are not used in development)
- **Meilisearch** (meilisearch): Full-text search functionality (optional if search is not used in development)
- **Keycloak** (dev-keycloak): User authentication (optional for normal development)

You will usually have to synchronize access keys or secrets from one the services with the remix application's environment

## Documentation

- **Frontend**: See `frontend/README.md` for detailed setup and scripts
- **Storage**: See `s3-storage/README.md` for MinIO configuration
- **Authentication**: See `dev-keycloak/README.md` for Keycloak setup
- **Requirements**: See `documents/requirements.md` for functional specifications

## License

See [LICENSE](LICENSE) file for details.
