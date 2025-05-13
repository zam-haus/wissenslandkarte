#!/bin/bash

# Before starting the server, we need to run any prisma migrations that haven't yet been
# run and possibly seed the production data

set -ex

if  [[ "$DATABASE_URL" != file:/* ]]; then
 echo "Database url must be an absolute path (i.e. begin with file:/)"
 exit 1
fi


npx prisma migrate deploy
npx prisma db seed -- --environment production
npm run start
