#!/bin/bash

echo "Forwarding port 9001 for minio."
echo "For credentials check env variables MINIO_ROOT_USER and MINIO_ROOT_PASSWORD"
echo "(Either in .env or docker-compose for default values)"
echo ""
echo "E.g. use $> ssh wlk \"cat wlk-preview/.env wlk-preview/docker-compose.yaml | grep -E 'MINIO_ROOT_(USER|PASSWORD)='\""
echo ""
ssh -N -L 127.0.0.1:9001:localhost:9001 wlk
