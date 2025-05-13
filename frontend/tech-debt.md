## Before update

- aws upload stuff upgraden
- can the url rewrite in upload s3 be done by the s3 lib?
- implement real logging and remove console.logs
- check if upload is actually an image
- user uploads are handled before user is authorized
- renovate pipeline
- image file needs to be released to prevent memory leak in step image upload
- image file (by name) can be added twice in image upload
- user profile image hat einen komischen alt-text in der liste
- einloggen -> DB neu seeden (npm run setup) -> noch eingeloggt -> project erstellen -> kann dieses projekt nicht bearbeiten, weil falscher nutzer. aber wieso kann ich es dann anlegen?!
- location.pathname funktioniert nicht mit ssr
- rename "photoAttachments" to "imageAttachments" and all "photo" to "image"
- usernames wirklich case sensitive? das riecht nach schabernack
- s3 files don't get deleted

## After update

- https://pris.ly/cli/output-path
- Nodejs im Dockercontainer auf 22 upgraden
- infinite scroll
- sind dates schon rehydrated?!
- wenn meilisearch nicht laeuft kein update/anlegen moeglich!
- csrf (delete step?)
- clean up handles
