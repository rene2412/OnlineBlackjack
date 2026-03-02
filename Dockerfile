# ─────────────────────────────────────────
# Stage 1: Build C++ backend (and Drogon)
# ─────────────────────────────────────────
FROM ubuntu:22.04 AS cpp-builder

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    build-essential cmake git ca-certificates \
    libssl-dev zlib1g-dev libjsoncpp-dev \
    uuid-dev libspdlog-dev libc-ares-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/ ./backend/

# 🔧 FIX: clone Drogon WITH submodules so trantor exists
RUN rm -rf backend/drogon && \
    git clone --recurse-submodules https://github.com/drogonframework/drogon.git backend/drogon && \
    mkdir -p backend/drogon/build && cd backend/drogon/build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release -DBUILD_EXAMPLES=OFF -DBUILD_CTL=OFF && \
    make -j"$(nproc)" && \
    make install

# Build your app
RUN mkdir -p backend/build && cd backend/build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release && \
    make -j"$(nproc)"

# ─────────────────────────────────────────
# Stage 2: Build React frontend
# ─────────────────────────────────────────
FROM node:20-alpine AS react-builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

# ─────────────────────────────────────────
# Stage 3: Runtime — Nginx + Drogon
# ─────────────────────────────────────────
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    nginx \
    libssl3 zlib1g libjsoncpp25 \
    libspdlog1 libc-ares2 \
    supervisor \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Drogon + Trantor shared libs from builder
COPY --from=cpp-builder /usr/local/lib/ /usr/local/lib/
RUN ldconfig

# Copy backend binary
COPY --from=cpp-builder /app/backend/build/hello_server /usr/local/bin/hello_server
RUN chmod +x /usr/local/bin/hello_server

# Copy React build
COPY --from=react-builder /app/dist /var/www/html

# Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Supervisor config (runs nginx + drogon together)
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
