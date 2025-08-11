#
# base node image
#
FROM node:24-bullseye-slim AS base

# set for base and all layer that inherit from it
ENV NODE_ENV=production

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl sqlite3


#
# Install all node_modules, including dev dependencies
#
FROM base AS deps

WORKDIR /app

ADD package.json package-lock.json ./
ADD patches ./patches
RUN npm ci --include=dev && npx patch-package


#
# Setup production node_modules
#
FROM base AS production-deps

WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
ADD package.json package-lock.json ./
RUN npm prune --omit=dev


#
# Build the app
#
FROM base AS build

WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

ADD prisma prisma
RUN npx prisma generate

ADD . .
RUN npm run build


#
# Finally, build the production image with minimal footprint
#
FROM base

#GITHUB_SHA
ARG COMMIT_ID_ARG=unknown
LABEL COMMIT_ID=$COMMIT_ID_ARG
ENV COMMIT_ID=$COMMIT_ID_ARG

#GITHUB_REF
ARG COMMIT_REF_ARG=unknown
LABEL COMMIT_REF=$COMMIT_REF_ARG
ENV COMMIT_REF=$COMMIT_REF_ARG

#GITHUB_WORKFLOW
ARG GITHUB_WORKFLOW_ARG=unknown
LABEL GITHUB_WORKFLOW=$GITHUB_WORKFLOW_ARG
ENV GITHUB_WORKFLOW=$GITHUB_WORKFLOW_ARG

#GITHUB_RUN_ID
ARG GITHUB_RUN_ID_ARG=unknown
LABEL GITHUB_RUN_ID=$GITHUB_RUN_ID_ARG
ENV GITHUB_RUN_ID=$GITHUB_RUN_ID_ARG

#GITHUB_RUN_ATTEMPT
ARG GITHUB_RUN_ATTEMPT_ARG=unknown
LABEL GITHUB_RUN_ATTEMPT=$GITHUB_RUN_ATTEMPT_ARG
ENV GITHUB_RUN_ATTEMPT=$GITHUB_RUN_ATTEMPT_ARG

#GITHUB_WORKFLOW_RUN_URL
ARG GITHUB_WORKFLOW_RUN_URL_ARG=unknown
LABEL GITHUB_WORKFLOW_RUN_URL=$GITHUB_WORKFLOW_RUN_URL_ARG
ENV GITHUB_WORKFLOW_RUN_URL=$GITHUB_WORKFLOW_RUN_URL_ARG

#CREATED_AT
ARG CREATED_AT_ARG=unknown
LABEL CREATED_AT=$CREATED_AT_ARG
ENV CREATED_AT=$CREATED_AT_ARG


ENV DATABASE_URL=file:/data/sqlite.db
ENV PORT="8080"
ENV NODE_ENV="production"

# add shortcut for connecting to database CLI
RUN echo "#!/bin/sh\nset -x\nsqlite3 \$DATABASE_URL" > /usr/local/bin/database-cli && chmod +x /usr/local/bin/database-cli

WORKDIR /app

COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma

COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/start.sh /app/start.sh
COPY --from=build /app/prisma /app/prisma

ENTRYPOINT [ "./start.sh" ]
