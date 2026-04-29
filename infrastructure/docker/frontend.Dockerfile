# 1. Using Node 20 to satisfy the @supabase and glob requirements in your logs
FROM node:20-alpine as builder

WORKDIR /app

# 2. Copy package files and install dependencies
COPY Frontend/package*.json ./
RUN npm ci

# 3. Copy the source code
COPY Frontend/ .

# 4. FIX: Grant execution permissions to the binaries 
# This prevents the "sh: vite: Permission denied" error (Status 126)
RUN chmod -R +x node_modules/.bin

RUN npm run build

# 5. Production Stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY infrastructure/docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]