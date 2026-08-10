FROM node:20-bookworm-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS builder
RUN npm ci
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_CRM_URL
ARG VITE_CRM_PROXY_HOSTNAME
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_CRM_URL=$VITE_CRM_URL \
    VITE_CRM_PROXY_HOSTNAME=$VITE_CRM_PROXY_HOSTNAME
RUN npm run build

FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 9511
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "9511"]

FROM nginx:alpine AS production
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
ENV CRM_URL="" \
    CRM_PROXY_HOSTNAME=""
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
