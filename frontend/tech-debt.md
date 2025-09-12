## Before update

- einloggen -> DB neu seeden (npm run setup) -> noch eingeloggt -> project erstellen -> kann dieses projekt nicht bearbeiten, weil falscher nutzer. aber wieso kann ich es dann anlegen?!
- usernames wirklich case sensitive? das riecht nach schabernack

## After update

- paged search results, then replace loaders in {users+,projects+}/index

## S

- upload warn messages should include rejected filename and user
- healtchecks in docker compose

## M

- show toast if image upload failed

- image file needs to be released to prevent memory leak in step image upload
- image file (by name) can be added twice in image upload

## L

- renovate pipeline

Create Issues:

- alerting wenn festplatte voll laeuft/generelle observability
- limit amount of emails sendable per day
- include link to user profile in email
- site-admin role to remove unreferenced images
- decide on favicon, trace it as svg https://favicon.im/de/blog/favicon-formats-sizes-best-practices
- personensuche noch nicht implementiert
