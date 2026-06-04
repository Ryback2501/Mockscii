# Build the static bundle, then serve it with nginx.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
# Vite builds with base /Mockscii/, so serve the bundle under that path.
COPY --from=build /app/dist /usr/share/nginx/html/Mockscii
# Redirect root to the app for convenience.
RUN printf 'server {\n  listen 80;\n  location = / { return 302 /Mockscii/; }\n  location /Mockscii/ { alias /usr/share/nginx/html/Mockscii/; try_files $uri $uri/ /Mockscii/index.html; }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost/Mockscii/ >/dev/null 2>&1 || exit 1
