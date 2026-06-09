# Build the static bundle, then serve it with nginx.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build at the site root (base=/) so the container serves Mockscii at "/".
# GitHub Pages instead uses the default base /Mockscii/ via plain `npm run build`.
RUN npm run build -- --base=/

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
# Serve the SPA at the root, listening on IPv4 and IPv6 (so `localhost`, which
# may resolve to ::1 first, reaches nginx).
RUN printf 'server {\n  listen 80;\n  listen [::]:80;\n  root /usr/share/nginx/html;\n  location / { try_files $uri $uri/ /index.html; }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
