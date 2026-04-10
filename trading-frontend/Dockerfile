# trading-frontend/Dockerfile
# Stage 1: Build the React App
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Build the TypeScript Vite project
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine
# Copy the built assets from the previous stage to Nginx's hosting folder
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port (Cloud Run defaults to 8080 or listens to EXPOSE variable)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]