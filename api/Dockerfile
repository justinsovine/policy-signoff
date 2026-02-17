FROM php:8.4-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libxml2-dev libcurl4-openssl-dev \
    default-mysql-client \
    && docker-php-ext-install pdo_mysql zip bcmath xml curl \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Use artisan serve for local dev
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]