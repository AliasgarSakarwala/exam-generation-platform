# Docker-backend/Dockerfile

FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libjpeg-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    curl \
    postgresql-client \
    libpq-dev

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:2.5 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy Laravel project
COPY backend/ /var/www/

# Copy entrypoint script
COPY Docker-backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Install PHP dependencies (will be done in entrypoint to avoid volume mount conflicts)
# RUN composer install --no-dev --no-interaction --optimize-autoloader

# Expose port
EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
