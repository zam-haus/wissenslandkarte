## Before update

- einloggen -> DB neu seeden (npm run setup) -> noch eingeloggt -> project erstellen -> kann dieses projekt nicht bearbeiten, weil falscher nutzer. aber wieso kann ich es dann anlegen?!
- usernames wirklich case sensitive? das riecht nach schabernack

## After update

- paged search results, then replace loaders in {users+,projects+}/index

## S

- healtchecks in docker compose

## M

- image file needs to be released to prevent memory leak in step image upload
- image file (by name) can be added twice in image upload

## L

- service-konzept einfuehren
- renovate pipeline

Create Issues:

- alerting wenn festplatte voll laeuft/generelle observability
- limit amount of emails sendable per day
- include link to user profile in email
- site-admin role to remove unreferenced images
- decide on favicon, trace it as svg https://favicon.im/de/blog/favicon-formats-sizes-best-practices
- personensuche noch nicht implementiert
- look into proper transfer of complex objects ({existingLinkId: "123", "existingLinkUrl": ...}[])
- allow setting global title from subpage
- knip installieren
- health check include db connection, s3 und meili
- add a "add step" button to global button bar
- global button bar should be a split button (if applicable)
