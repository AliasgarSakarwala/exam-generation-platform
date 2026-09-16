#!/bin/bash
set -e

# Install PHP dependencies first
echo "Installing PHP dependencies..."
composer install --no-interaction --optimize-autoloader

# Wait for Postgres
echo "Waiting for PostgreSQL..."
until PGPASSWORD=${DB_PASSWORD} psql -h db -U ${DB_USERNAME} -d ${DB_DATABASE} -c '\q' > /dev/null 2>&1; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is available"

# Run DDL script (creates your base tables)
echo "Running DDL script..."
PGPASSWORD=${DB_PASSWORD} psql -h db -U ${DB_USERNAME} -d ${DB_DATABASE} -f /var/www/../Database/CT3.ddl

# Laravel setup
echo "Generating app key..."
php artisan key:generate

# Initialize migrations table if it doesn't exist (without affecting other tables)
echo "Preparing migrations table..."
php artisan migrate:install || true  # Will fail gracefully if table exists

# Run regular migrations (only new ones)
echo "Running migrations..."
php artisan migrate --force

# If the specific remember_token migration fails, modify it to be conditional
echo "Attempting remember_token migration..."
php artisan migrate --path=database/migrations/2025_06_13_202412_add_remember_token_to_user_table.php --force || \
  echo "Warning: Remember token migration failed (table may not exist)"

# Seed data (with error handling)
echo "Seeding database..."
php artisan db:seed --class=DevSeeder --force || echo "Warning: Database seeding failed, but continuing..."

echo "Verifying database state..."
PGPASSWORD=${DB_PASSWORD} psql -h db -U ${DB_USERNAME} -d ${DB_DATABASE} -c "\dt"

echo "Starting server..."
php artisan serve --host=0.0.0.0 --port=8000