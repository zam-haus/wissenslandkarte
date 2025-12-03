#!/bin/bash

set -ex

npx prisma generate
npx prisma migrate deploy
npx prisma db seed -- --environment production