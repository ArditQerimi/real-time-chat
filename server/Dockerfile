FROM node:20-alpine

RUN apk add --no-cache tini postgresql-client

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate

EXPOSE 4000

ENTRYPOINT ["/sbin/tini", "--"]
CMD sh -c "wait-for-it.sh db:5432 --timeout=30 && \
            npx prisma migrate deploy && \
            npx prisma db seed && \
            npm run dev"