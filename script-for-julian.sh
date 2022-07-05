#!/bin/bash

cd mock-backend
ls node_modules 2> /dev/null 1>/dev/null || npm ci
npx mocks-server --no-cli &
cd ../frontend
ls node_modules 2> /dev/null 1>/dev/null || npm ci
npm start &

xdg-open http://localhost:8080/profile
