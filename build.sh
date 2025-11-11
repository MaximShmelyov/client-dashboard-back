#!/bin/bash
set -e

rm -rf node_modules dist

npm ci
npx prisma generate
npm run build

rm -rf node_modules
npm ci --omit=dev
npx prisma generate

echo "Production build complete. To run: node dist/index.js"