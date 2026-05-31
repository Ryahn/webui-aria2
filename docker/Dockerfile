FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM alpine:3.21
RUN apk add --no-cache aria2 nginx supervisor

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && mkdir -p /downloads /var/lib/aria2

VOLUME /downloads
VOLUME /var/lib/aria2
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
