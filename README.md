# 🏗️ Bangladesh Construction Management Software (Buildium-solution)

A full-stack, enterprise-grade Construction Management ERP designed specifically for Bangladesh's construction industry. Built with **React 18 + Vite**, **Tailwind CSS v4**, **PHP 8+ REST API**, and **MySQL 8**.

---

## 🌟 Key Modules & Features

1. **📊 Executive Dashboard**: KPI cards (Active Projects, Budget, Labor headcount, Invoiced vs Received), monthly expense bar chart, financial cash flow line chart, project status distribution pie chart, and live site stats.
2. **🏢 Project Management**: Full project lifecycle tracking (Planning → Active → Completed), BDT budget allocations, Bangladesh district/division locations, BNBC compliance specs, progress bars, and landowner association.
3. **👤 Client Directory**: Landowners, corporate developers, and government authorities with NID tracking, contact log, and project history.
4. **👷 Worker & Engineer Management**: Masons (রাজমিস্ত্রি), Rod Binders (রডবাইন্ডার), Helpers (হেলপার), Electricians, Supervisors, and Engineers with daily/monthly wage rates, NID, blood group, and emergency contacts.
5. **✅ Daily Site Attendance Register**: Live check-in/out times, overtime hours calculation, automated daily wage liabilities preview, batch attendance marking (Present/Absent/Half Day), and bulk save to database.
6. **🧱 Material & Supply Catalog**: Bangladesh construction items categorized with Bangla labels (Cement - সিমেন্ট, Sand - বালু, Brick - ইট, Rod/Steel - রড, Stone Chips - খোয়া, Paint - রং) with units (`bag`, `ton`, `cft`, `piece`, `sft`, `kg`, `drum`), BDT rates, and minimum stock alerts.
7. **🚚 Vendor & Supplier Network**: Suppliers with trade licenses, payment terms (COD, Credit), product lines, and warehouse addresses.
8. **📋 Work Orders & Site Execution**: Structural milestone tasks (Foundation, Structure, Masonry, Electrical, Plumbing, Roofing, Finishing), worker assignment, due dates, cost estimates, and percentage progress.
9. **💰 Financial Management**:
   - **Expense Tracking**: Categorized vouchers (Material, Labor, Equipment, Utility, Permit) with approval workflow and BDT summaries.
   - **Invoicing & Billing**: Line-item bill generator, BDT VAT & discounts, partial payment receipts, printable tax invoice view.
   - **Salary & Payroll**: Monthly worker disbursements, overtime bonuses, deductions, and payment channel tracking (bKash, Nagad, Bank transfer).
10. **📁 Compliance & Document Storage**: RAJUK/CDA building permits, structural CAD drawings (DWG/PDF), soil test lab reports (BUET/BRTC), and notarized contracts.
11. **📈 Analytics & Executive Reports**: Project performance audit sheet, expense category breakdown, monthly labor wage liability statements, and material stock consumption reports with Print/PDF export.
12. **👥 User & Role Permissions**: Role-based access control (Admin, Project Manager, Site Engineer, Accountant, Site Supervisor).
13. **⚙️ Enterprise Settings**: Company profile, NBR BIN / TIN compliance, 15% standard VAT rate defaults, and bilingual support.

---

## 🚀 Getting Started & Installation

### 1. Database Setup (MySQL)
1. Open **phpMyAdmin** or your MySQL client (e.g. XAMPP, Laragon, MySQL Workbench).
2. Import the schema file located at:
   ```
   backend/database/schema.sql
   ```
3. This creates the `construction_db` database, all 14 relational tables, indexes, and default administrator credentials.

### 2. Backend Setup (PHP)
1. Place the project folder into your web server root (e.g., `C:/xampp/htdocs/construction-v1` or `C:/laragon/www/construction-v1`).
2. Verify `backend/.env` credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=construction_db
   DB_USER=root
   DB_PASS=
   JWT_SECRET=your_super_secret_jwt_key_2025
   ```
3. Make sure Apache `mod_rewrite` and `mod_headers` are enabled.

### 3. Frontend Setup (React + Vite)
1. Open a terminal in the `frontend` folder:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🔑 Default Login Credentials

- **Email**: `admin@construction.com`
- **Password**: `password`
- **Role**: `admin` (System Administrator)

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, React Router v6, Recharts, Lucide Icons, React Hot Toast
- **Backend**: Pure PHP 8+ REST API (Zero external framework dependencies, native PDO & HMAC SHA256 JWT auth)
- **Database**: MySQL 8+ with UTF8MB4 Unicode support
