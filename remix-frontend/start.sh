#!/bin/bash

# This file is how Fly starts the server (configured in fly.toml). Before starting
# the server though, we need to run any prisma migrations that haven't yet been
# run, which is why this file exists in the first place.
# Learn more: https://community.fly.io/t/sqlite-not-getting-setup-properly/4386

set -ex

if  [[ "$DATABASE_URL" != /* ]]; then
 echo "Database url must be an absolute path"
 exit 1
fi


npx prisma migrate deploy
npm run start
