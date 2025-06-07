## Before update

- einloggen -> DB neu seeden (npm run setup) -> noch eingeloggt -> project erstellen -> kann dieses projekt nicht bearbeiten, weil falscher nutzer. aber wieso kann ich es dann anlegen?!
- usernames wirklich case sensitive? das riecht nach schabernack

## After update

- csrf (delete step?)
- paged search results, then replace loaders in {users+,projects+}/index

## S

## M

- image file needs to be released to prevent memory leak in step image upload
- image file (by name) can be added twice in image upload
- site-admin role to rebuild search index

## L

- s3 files don't get deleted when no longer referenced (e.g. image deleted)
- user uploads are handled before user is authorized
- renovate pipeline
