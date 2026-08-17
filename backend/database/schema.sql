-- =====================================================
-- Bangladesh Construction Management System
-- MySQL Database Schema
-- Compatible with live shared hosting (e.g. InfinityFree, cPanel)
-- =====================================================


-- ==================== USERS ====================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','project_manager','engineer','accountant','site_supervisor') NOT NULL DEFAULT 'engineer',
    phone VARCHAR(20),
    avatar VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================== CLIENTS ====================
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    company VARCHAR(200),
    email VARCHAR(150),
    phone VARCHAR(20) NOT NULL,
    nid VARCHAR(30),
    address TEXT,
    district VARCHAR(100),
    division VARCHAR(100),
    client_type ENUM('individual','corporate','government') DEFAULT 'individual',
    notes TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== PROJECTS ====================
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    client_id INT,
    project_type ENUM('residential','commercial','industrial','infrastructure','renovation') DEFAULT 'residential',
    status ENUM('planning','active','on_hold','completed','cancelled') DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    actual_end_date DATE,
    location TEXT,
    district VARCHAR(100),
    division VARCHAR(100),
    total_area DECIMAL(12,2),
    area_unit ENUM('sqft','sqm','katha','bigha','decimal') DEFAULT 'sqft',
    total_budget DECIMAL(18,2) DEFAULT 0,
    approved_budget DECIMAL(18,2) DEFAULT 0,
    manager_id INT,
    engineer_id INT,
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    progress INT DEFAULT 0,
    notes TEXT,
    -- Building & Structural Specifications
    building_type VARCHAR(100) DEFAULT 'Residential Apartment',
    stories_above_ground INT DEFAULT 1,
    basement_floors INT DEFAULT 0,
    total_units INT DEFAULT 0,
    gross_floor_area DECIMAL(14,2) DEFAULT 0,
    footprint_area DECIMAL(12,2) DEFAULT 0,
    far_value DECIMAL(6,2) DEFAULT 0,
    mgc_percentage DECIMAL(5,2) DEFAULT 0,
    structural_system VARCHAR(150) DEFAULT 'RCC Frame with Shear Wall',
    foundation_system VARCHAR(150) DEFAULT 'Cast-in-situ Bored Piles',
    parking_capacity INT DEFAULT 0,
    rajuk_approval_no VARCHAR(100),
    approval_date DATE,
    soil_bearing_capacity VARCHAR(100),
    elevators_count INT DEFAULT 0,
    generator_capacity VARCHAR(100),
    fire_safety_status VARCHAR(100) DEFAULT 'Pending Inspection',
    setback_front VARCHAR(50),
    setback_rear VARCHAR(50),
    setback_left VARCHAR(50),
    setback_right VARCHAR(50),
    floor_details LONGTEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (manager_id) REFERENCES users(id),
    FOREIGN KEY (engineer_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== EMPLOYEES ====================
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    father_name VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    nid VARCHAR(30),
    photo VARCHAR(255),
    address TEXT,
    district VARCHAR(100),
    division VARCHAR(100),
    role ENUM('engineer','supervisor','mason','rod_binder','helper','electrician','plumber','painter','driver','security','other') DEFAULT 'helper',
    department VARCHAR(100),
    join_date DATE,
    salary_type ENUM('monthly','daily','weekly') DEFAULT 'monthly',
    salary DECIMAL(12,2) DEFAULT 0,
    blood_group VARCHAR(5),
    emergency_contact VARCHAR(20),
    bank_account VARCHAR(50),
    bank_name VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== PROJECT EMPLOYEES (Assignment) ====================
CREATE TABLE project_employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    employee_id INT NOT NULL,
    assigned_date DATE,
    removed_date DATE,
    role_in_project VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- ==================== ATTENDANCE ====================
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    project_id INT,
    attendance_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status ENUM('present','absent','half_day','holiday','leave') DEFAULT 'present',
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    daily_wage DECIMAL(10,2) DEFAULT 0,
    notes VARCHAR(255),
    recorded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_attendance (employee_id, attendance_date),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- ==================== SUPPLIERS ====================
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    company VARCHAR(200),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    district VARCHAR(100),
    trade_license VARCHAR(50),
    product_categories VARCHAR(255),
    payment_terms VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================== MATERIALS ====================
CREATE TABLE materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category ENUM('cement','sand','brick','rod_steel','aggregate','paint','electrical','plumbing','wood','glass','tile','waterproofing','other') DEFAULT 'other',
    unit ENUM('kg','ton','bag','cft','sft','piece','bundle','litre','drum','roll','other') DEFAULT 'piece',
    unit_price DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    min_stock_alert DECIMAL(12,2) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================== MATERIAL STOCK (per project) ====================
CREATE TABLE material_stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    material_id INT NOT NULL,
    supplier_id INT,
    quantity DECIMAL(14,3) DEFAULT 0,
    unit_price DECIMAL(12,2) DEFAULT 0,
    total_price DECIMAL(18,2) DEFAULT 0,
    purchase_date DATE,
    invoice_no VARCHAR(50),
    received_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- ==================== MATERIAL USAGE ====================
CREATE TABLE material_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    material_id INT NOT NULL,
    quantity_used DECIMAL(14,3) DEFAULT 0,
    usage_date DATE NOT NULL,
    used_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (used_by) REFERENCES users(id)
);

-- ==================== WORK ORDERS ====================
CREATE TABLE work_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(30) UNIQUE NOT NULL,
    project_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM('foundation','structure','masonry','electrical','plumbing','finishing','roofing','flooring','painting','other') DEFAULT 'other',
    assigned_to INT,
    supervisor_id INT,
    start_date DATE,
    due_date DATE,
    completed_date DATE,
    status ENUM('pending','in_progress','completed','on_hold','cancelled') DEFAULT 'pending',
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    progress INT DEFAULT 0,
    estimated_cost DECIMAL(15,2) DEFAULT 0,
    actual_cost DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (assigned_to) REFERENCES employees(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== EXPENSES ====================
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_code VARCHAR(30) UNIQUE NOT NULL,
    project_id INT,
    category ENUM('material','labor','equipment','transport','utility','professional_fee','permit','other') DEFAULT 'other',
    title VARCHAR(200) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    expense_date DATE NOT NULL,
    paid_to VARCHAR(150),
    payment_method ENUM('cash','bank_transfer','cheque','mobile_banking') DEFAULT 'cash',
    transaction_ref VARCHAR(100),
    vat_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    is_approved TINYINT(1) DEFAULT 0,
    approved_by INT,
    approved_at DATETIME,
    receipt_file VARCHAR(255),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== INVOICES ====================
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(30) UNIQUE NOT NULL,
    project_id INT NOT NULL,
    client_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(15,2) DEFAULT 0,
    vat DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    status ENUM('draft','sent','partially_paid','paid','overdue','cancelled') DEFAULT 'draft',
    payment_date DATE,
    payment_method ENUM('cash','bank_transfer','cheque','mobile_banking'),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== INVOICE ITEMS ====================
CREATE TABLE invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,3) DEFAULT 1,
    unit_price DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- ==================== DOCUMENTS ====================
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    title VARCHAR(200) NOT NULL,
    doc_type ENUM('drawing','permit','contract','report','photo','other') DEFAULT 'other',
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    file_type VARCHAR(50),
    description TEXT,
    uploaded_by INT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- ==================== SALARY PAYMENTS ====================
CREATE TABLE salary_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    project_id INT,
    payment_month VARCHAR(7) NOT NULL,
    basic_salary DECIMAL(12,2) DEFAULT 0,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    bonus DECIMAL(12,2) DEFAULT 0,
    deduction DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2) DEFAULT 0,
    payment_date DATE,
    payment_method ENUM('cash','bank_transfer','mobile_banking') DEFAULT 'cash',
    transaction_ref VARCHAR(100),
    status ENUM('pending','paid') DEFAULT 'pending',
    paid_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (paid_by) REFERENCES users(id)
);

-- ==================== COMPANY SETTINGS ====================
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================== ACTIVITY LOGS ====================
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100),
    module VARCHAR(50),
    record_id INT,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==================== CLIENT PAYMENTS ====================
CREATE TABLE client_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_code VARCHAR(30) UNIQUE NOT NULL,
    project_id INT NOT NULL,
    client_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('cash','bank_transfer','cheque','mobile_banking') DEFAULT 'cash',
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    cheque_number VARCHAR(50),
    transaction_ref VARCHAR(100),
    payment_for ENUM('advance','milestone','final','retention','other') DEFAULT 'advance',
    milestone_id INT,
    notes TEXT,
    received_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- ==================== PAYMENT PLANS / MILESTONES ====================
CREATE TABLE payment_milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    milestone_name VARCHAR(200) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    due_date DATE,
    completion_percentage INT DEFAULT 0,
    status ENUM('pending','partial','completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- ==================== SECURITY DEPOSITS ====================
CREATE TABLE security_deposits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deposit_code VARCHAR(30) UNIQUE NOT NULL,
    project_id INT NOT NULL,
    client_id INT NOT NULL,
    deposit_type ENUM('earnest_money','security_money','performance_guarantee','retention_money','other') DEFAULT 'security_money',
    amount DECIMAL(15,2) NOT NULL,
    deposit_date DATE NOT NULL,
    refund_date DATE,
    status ENUM('active','refunded','forfeited','partial_refund') DEFAULT 'active',
    refund_amount DECIMAL(15,2) DEFAULT 0,
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    cheque_number VARCHAR(50),
    transaction_ref VARCHAR(100),
    notes TEXT,
    received_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- ==================== BOQ (BILL OF QUANTITIES) ====================
CREATE TABLE boq_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    item_code VARCHAR(30) NOT NULL,
    category VARCHAR(100),
    description TEXT NOT NULL,
    unit ENUM('sqft','sft','cft','cum','kg','ton','meter','run_meter','piece','lot','each','no') DEFAULT 'piece',
    quantity DECIMAL(14,3) NOT NULL,
    unit_rate DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    work_type ENUM('civil','electrical','plumbing','finishing','other') DEFAULT 'civil',
    priority ENUM('high','medium','low') DEFAULT 'medium',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- ==================== BOQ COST ESTIMATES ====================
CREATE TABLE boq_estimates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    estimate_name VARCHAR(200) NOT NULL,
    estimate_type ENUM('preliminary','detailed','revised') DEFAULT 'preliminary',
    total_cost DECIMAL(18,2) NOT NULL,
    contingency_percentage DECIMAL(5,2) DEFAULT 5,
    contingency_amount DECIMAL(15,2) DEFAULT 0,
    grand_total DECIMAL(18,2) NOT NULL,
    prepared_by INT,
    approved_by INT,
    approved_at DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (prepared_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- ==================== BOQ RATE ANALYSIS ====================
CREATE TABLE boq_rate_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    boq_item_id INT NOT NULL,
    material_cost DECIMAL(12,2) DEFAULT 0,
    labor_cost DECIMAL(12,2) DEFAULT 0,
    equipment_cost DECIMAL(12,2) DEFAULT 0,
    overhead_cost DECIMAL(12,2) DEFAULT 0,
    profit_percentage DECIMAL(5,2) DEFAULT 10,
    profit_amount DECIMAL(12,2) DEFAULT 0,
    final_rate DECIMAL(12,2) NOT NULL,
    analysis_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (boq_item_id) REFERENCES boq_items(id)
);

-- ==================== PROJECT SCHEDULING ====================
CREATE TABLE project_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    task_name VARCHAR(200) NOT NULL,
    task_description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    duration_days INT,
    progress INT DEFAULT 0,
    status ENUM('not_started','in_progress','completed','delayed','on_hold') DEFAULT 'not_started',
    priority ENUM('critical','high','medium','low') DEFAULT 'medium',
    dependencies VARCHAR(255),
    assigned_team VARCHAR(255),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== PURCHASE ORDERS ====================
CREATE TABLE purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(30) UNIQUE NOT NULL,
    project_id INT NOT NULL,
    supplier_id INT NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    subtotal DECIMAL(15,2) DEFAULT 0,
    vat DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    status ENUM('draft','pending','approved','ordered','partial_delivered','delivered','cancelled') DEFAULT 'draft',
    payment_terms VARCHAR(100),
    delivery_address TEXT,
    notes TEXT,
    created_by INT,
    approved_by INT,
    approved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- ==================== PURCHASE ORDER ITEMS ====================
CREATE TABLE purchase_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    material_id INT,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(14,3) NOT NULL,
    unit VARCHAR(20) DEFAULT 'piece',
    unit_price DECIMAL(12,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    received_quantity DECIMAL(14,3) DEFAULT 0,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- ==================== PURCHASE REQUESTS ====================
CREATE TABLE purchase_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_code VARCHAR(30) UNIQUE NOT NULL,
    project_id INT NOT NULL,
    requested_by INT NOT NULL,
    request_date DATE NOT NULL,
    required_date DATE,
    status ENUM('pending','approved','rejected','ordered') DEFAULT 'pending',
    priority ENUM('urgent','high','medium','low') DEFAULT 'medium',
    reason TEXT,
    approved_by INT,
    approved_at DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- ==================== PURCHASE REQUEST ITEMS ====================
CREATE TABLE purchase_request_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_request_id INT NOT NULL,
    material_id INT,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(14,3) NOT NULL,
    unit VARCHAR(20) DEFAULT 'piece',
    estimated_price DECIMAL(12,2),
    purpose TEXT,
    FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- ==================== QUOTATIONS ====================
CREATE TABLE quotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quotation_code VARCHAR(30) UNIQUE NOT NULL,
    project_id INT NOT NULL,
    supplier_id INT NOT NULL,
    quotation_date DATE NOT NULL,
    valid_until DATE,
    subtotal DECIMAL(15,2) DEFAULT 0,
    vat DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    status ENUM('received','under_review','accepted','rejected','expired') DEFAULT 'received',
    payment_terms VARCHAR(100),
    delivery_terms VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- ==================== QUOTATION ITEMS ====================
CREATE TABLE quotation_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quotation_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(14,3) NOT NULL,
    unit VARCHAR(20) DEFAULT 'piece',
    unit_price DECIMAL(12,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

-- ==================== STOCK TRANSFERS ====================
CREATE TABLE stock_transfers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transfer_code VARCHAR(30) UNIQUE NOT NULL,
    from_project_id INT,
    to_project_id INT NOT NULL,
    transfer_date DATE NOT NULL,
    status ENUM('pending','approved','in_transit','completed','cancelled') DEFAULT 'pending',
    notes TEXT,
    requested_by INT,
    approved_by INT,
    approved_at DATETIME,
    received_by INT,
    received_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_project_id) REFERENCES projects(id),
    FOREIGN KEY (to_project_id) REFERENCES projects(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- ==================== STOCK TRANSFER ITEMS ====================
CREATE TABLE stock_transfer_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_transfer_id INT NOT NULL,
    material_id INT NOT NULL,
    quantity DECIMAL(14,3) NOT NULL,
    unit VARCHAR(20) DEFAULT 'piece',
    notes TEXT,
    FOREIGN KEY (stock_transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- ==================== STOCK ADJUSTMENTS ====================
CREATE TABLE stock_adjustments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    adjustment_code VARCHAR(30) UNIQUE NOT NULL,
    project_id INT NOT NULL,
    material_id INT NOT NULL,
    adjustment_type ENUM('damage','loss','theft','expired','quality_issue','correction','other') DEFAULT 'correction',
    previous_quantity DECIMAL(14,3) NOT NULL,
    adjusted_quantity DECIMAL(14,3) NOT NULL,
    difference DECIMAL(14,3) NOT NULL,
    adjustment_date DATE NOT NULL,
    reason TEXT,
    approved_by INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== LABOUR WAGE SLIPS ====================
CREATE TABLE labour_wage_slips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slip_code VARCHAR(30) UNIQUE NOT NULL,
    project_id INT NOT NULL,
    employee_id INT NOT NULL,
    work_period_start DATE NOT NULL,
    work_period_end DATE NOT NULL,
    total_days INT DEFAULT 0,
    present_days INT DEFAULT 0,
    absent_days INT DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    daily_wage DECIMAL(10,2) DEFAULT 0,
    basic_wage DECIMAL(12,2) DEFAULT 0,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    bonus DECIMAL(10,2) DEFAULT 0,
    deduction DECIMAL(10,2) DEFAULT 0,
    net_wage DECIMAL(12,2) NOT NULL,
    payment_date DATE,
    payment_method ENUM('cash','bank_transfer','mobile_banking') DEFAULT 'cash',
    status ENUM('pending','paid') DEFAULT 'pending',
    paid_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (paid_by) REFERENCES users(id)
);

-- ==================== TOOLS INVENTORY ====================
CREATE TABLE tools_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tool_code VARCHAR(30) UNIQUE NOT NULL,
    tool_name VARCHAR(200) NOT NULL,
    category ENUM('power_tools','hand_tools','measuring','safety_equipment','heavy_machinery','vehicles','other') DEFAULT 'other',
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(12,2) DEFAULT 0,
    current_value DECIMAL(12,2) DEFAULT 0,
    tool_condition ENUM('excellent','good','fair','poor','broken') DEFAULT 'good',
    location VARCHAR(100),
    status ENUM('available','assigned','in_maintenance','retired') DEFAULT 'available',
    warranty_expiry DATE,
    last_service_date DATE,
    next_service_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================== TOOL ASSIGNMENTS ====================
CREATE TABLE tool_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tool_id INT NOT NULL,
    project_id INT NOT NULL,
    assigned_to INT,
    assigned_date DATE NOT NULL,
    return_date DATE,
    expected_return_date DATE,
    status ENUM('assigned','returned','overdue','lost') DEFAULT 'assigned',
    condition_on_assignment VARCHAR(50),
    condition_on_return VARCHAR(50),
    notes TEXT,
    assigned_by INT,
    received_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools_inventory(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (assigned_to) REFERENCES employees(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- ==================== TOOL MAINTENANCE ====================
CREATE TABLE tool_maintenance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tool_id INT NOT NULL,
    maintenance_type ENUM('routine','repair','replacement','inspection') DEFAULT 'routine',
    service_date DATE NOT NULL,
    service_provider VARCHAR(150),
    cost DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    next_service_date DATE,
    performed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools_inventory(id),
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- ==================== VEHICLES ====================
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_code VARCHAR(30) UNIQUE NOT NULL,
    vehicle_type ENUM('truck','pickup','car','motorcycle','excavator','bulldozer','crane','other') DEFAULT 'truck',
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INT,
    purchase_date DATE,
    purchase_price DECIMAL(15,2) DEFAULT 0,
    current_value DECIMAL(15,2) DEFAULT 0,
    fuel_type ENUM('diesel','petrol','cng','electric','other') DEFAULT 'diesel',
    capacity DECIMAL(10,2) DEFAULT 0,
    status ENUM('available','in_use','maintenance','retired') DEFAULT 'available',
    driver_id INT,
    insurance_expiry DATE,
    fitness_expiry DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES employees(id)
);

-- ==================== VEHICLE WORK SLIPS ====================
CREATE TABLE vehicle_work_slips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slip_code VARCHAR(30) UNIQUE NOT NULL,
    project_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    work_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    start_location VARCHAR(200),
    end_location VARCHAR(200),
    distance_km DECIMAL(8,2) DEFAULT 0,
    fuel_consumed DECIMAL(8,2) DEFAULT 0,
    fuel_cost DECIMAL(10,2) DEFAULT 0,
    work_description TEXT,
    daily_rate DECIMAL(10,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_rate DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending','approved','paid') DEFAULT 'pending',
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (driver_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- ==================== DEFAULT DATA ====================
INSERT INTO users (name, email, password, role) VALUES 
('System Admin', 'admin@construction.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
-- Default password: password

INSERT INTO settings (setting_key, setting_value) VALUES
('company_name', 'Bangladesh Construction Co.'),
('company_address', 'Dhaka, Bangladesh'),
('company_phone', '+880 1700-000000'),
('company_email', 'info@bdconstruction.com'),
('company_logo', ''),
('currency', 'BDT'),
('currency_symbol', '৳'),
('vat_rate', '15'),
('tax_rate', '5'),
('fiscal_year', '2025-2026'),
('language', 'en');
