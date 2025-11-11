# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci # Install all dependencies, including dev

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# Stage 2: production
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy prod-deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build and Prisma client from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/openapi ./openapi

COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 4000

# Set the entrypoint script to run on container start
#ENTRYPOINT ["./docker-entrypoint.sh"]

# Set the default command to be executed by the entrypoint
CMD ["node", "dist/index.js"]
