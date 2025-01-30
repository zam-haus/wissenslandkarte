# Keycloak Development Setup

This `docker-compose.yml` file configures a local Keycloak instance for development purposes. It allows testing the login flow and user registration.

This setup is intended for development and should not be used for production without modifications. It sets up an admin user, a test realm, two clients, and predefined users. 

## Setup

Copy .env.example to .env and populate the secrets (denoted by `...`). Then copy the relevant values to the .env of the remix-frontend.

The `keycloak-init` service ensures that the following configurations are applied:

- **Users:**
  - `dev-user` (John Doe, email: `johndoe@example.com`, password is taken from .env)
  - `dev-user-no-data` (doesn't have a name or email address, password is taken from .env)

## Resetting Data

If you need to reset the Keycloak data, remove the volume:

```sh
rm -rf keycloak-data
```

Then restart the service:

```sh
docker-compose up -d
```

## Keycloak Admin Console

Once started, Keycloak can be accessed at:

- Admin Console: [http://localhost:4000](http://localhost:4000)
- Admin Credentials:
  - Username: `admin`
  - Password: password is taken from .env
