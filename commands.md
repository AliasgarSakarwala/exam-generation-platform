instantiate db: `psql -U postgres -d "CT3-db" -f "C:\COSC-499\team-3-capstone-ct3\app\Database\CT3.ddl"`

intiating .config and .editor: `wsl dos2unix Docker-backend/entrypoint.sh`

local host 800: `php artisan serve --host localhost --port 8000`
