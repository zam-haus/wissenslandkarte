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
- s3 uploads should be referenced in separate table 
    - track upload status (uploading, uploaded, orphaned)
    - easier delete (no need to extract key from url)
    - allows oprhaning main image, not just attachments (aka isStale)

## L

- renovate pipeline
