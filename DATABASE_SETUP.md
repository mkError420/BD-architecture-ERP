# Database Setup Guide

## Production Configuration (Live Site)

The live site at https://mkposs.gt.tc/ is configured to connect to a remote database:
- **Host**: sql107.infinityfree.com
- **Database**: if0_42333746_mk_pos
- **User**: if0_42333746
- **Port**: 3306

This configuration is already set in `backend/.env` and should work for the production environment.

## For Local Development

If you want to run the application locally, you need to set up a local MySQL database:

### Step 1: Install MySQL
- Download and install MySQL from https://dev.mysql.com/downloads/mysql/
- Or use XAMPP/WAMP which includes MySQL

### Step 2: Create Database
```sql
CREATE DATABASE construction_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Import Schema
Run the schema file to create all tables:
```bash
mysql -u root -p construction_db < backend/database/schema.sql
```

### Step 4: Update .env Configuration
Edit `backend/.env` and update the database settings:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=construction_db
DB_USER=root
DB_PASS=your_mysql_password
```

### Step 5: Test Connection
Run the test script:
```bash
cd backend
php test_connection.php
```

## For Production Deployment

Keep the current remote database configuration in `backend/.env`:
```env
DB_HOST=sql107.infinityfree.com
DB_PORT=3306
DB_NAME=if0_42333746_mk_pos
DB_USER=if0_42333746
DB_PASS=VHxnlDleyPf09
```

## Deploying Schema to Production

If the database schema is not yet deployed to the remote database, you need to import it:

### Method 1: Using phpMyAdmin (if available)
1. Access phpMyAdmin for your hosting control panel
2. Select database: if0_42333746_mk_pos
3. Import the schema file: `backend/database/schema.sql`

### Method 2: Using MySQL Command Line
```bash
mysql -h sql107.infinityfree.com -u if0_42333746 -p if0_42333746_mk_pos < backend/database/schema.sql
```

### Method 3: Using Hosting Control Panel
1. Go to your hosting control panel (InfinityFree)
2. Navigate to MySQL Databases
3. Use the phpMyAdmin tool to import the schema.sql file

## Troubleshooting

### Connection Refused
- Ensure MySQL server is running on the remote host
- Check if the host and port are correct
- Verify firewall settings on the hosting provider

### Access Denied
- Check username and password in .env
- Ensure the database user has proper permissions
- Contact hosting support if credentials are incorrect

### Database Not Found
- Verify the database name in .env
- Create the database if it doesn't exist
- Import the schema as described above

### Tables Not Found
- If you get "Table doesn't exist" errors, the schema needs to be imported
- Run the schema import steps above

## API Endpoints Fixed

The following API routes were added to backend/index.php:
- project-payments
- security-deposits
- boq
- project-schedule
- purchases
- stock
- labour-wages
- tools
- vehicles

## CORS Configuration

CORS headers have been added to allow cross-origin requests from the frontend.
