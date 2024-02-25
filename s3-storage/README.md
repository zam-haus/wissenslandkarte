# Minio setup for WLK

## Initial setup

Initialize .env in this folder:

```
cp .env.example .env
echo Manually set S3_STORAGE_ACCESS_KEY to $(dd status=none if=/dev/random bs=1 count=100 | base64 | head -c 20)
echo Manually set S3_STORAGE_SECRET_KEY to $(dd status=none if=/dev/random bs=1 count=100 | base64 | head -c 40)
echo Manually set MINIO_ROOT_PASSWORD to $(dd status=none if=/dev/random bs=1 count=100 | base64 | head -c 26)
```

Then, update .env in ../remix-frontend

## Starting

`docker compose up`