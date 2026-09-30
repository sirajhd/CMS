import bcrypt from 'bcryptjs';
import db from './db.js';

export async function runMultiTenantMigration() {
  console.log('🔄 Starting PostgreSQL Multi-Tenant SaaS Schema Migration & Seed...');

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    console.log('📦 Dropping old tables if existing...');
    await client.query(`
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS expenses CASCADE;
      DROP TABLE IF EXISTS materials CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS request_comments CASCADE;
      DROP TABLE IF EXISTS requests CASCADE;
      DROP TABLE IF EXISTS project_assignments CASCADE;
      DROP TABLE IF EXISTS sites CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS companies CASCADE;
    `);

    console.log('🔨 Creating Multi-Tenant SaaS Tables...');

    // 1. Companies Table (Tenants)
    await client.query(`
      CREATE TABLE companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        subdomain VARCHAR(100) UNIQUE,
        logo_url VARCHAR(255),
        status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        total_sites INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Users Table (Tenant Scoped, except Platform Super Admin)
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('SuperAdmin', 'Admin', 'House Holder', 'Engineer', 'Manager')),
        phone VARCHAR(50),
        title VARCHAR(255),
        status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
        reset_password_token VARCHAR(255),
        reset_password_expires TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Projects Table (Tenant Scoped)
    await client.query(`
      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100),
        location VARCHAR(255) NOT NULL,
        house_holder_id UUID REFERENCES users(id) ON DELETE SET NULL,
        engineer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'On Hold', 'Completed')),
        progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        total_budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        spent_budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        start_date DATE NOT NULL,
        expected_completion DATE NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Sites Table (Physical site parcels within projects)
    await client.query(`
      CREATE TABLE sites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Project Assignments (Explicit stakeholder site assignment mapping)
    await client.query(`
      CREATE TABLE project_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
      );
    `);

    // 6. Requests / Requisitions Table (Tenant Scoped)
    await client.query(`
      CREATE TABLE requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('Payment', 'Material', 'Agreement', 'Technical Document', 'Variation', 'Other')),
        title VARCHAR(255) NOT NULL,
        amount NUMERIC(15, 2) DEFAULT 0.00,
        description TEXT NOT NULL,
        submitted_by UUID NOT NULL REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Approved', 'Revision Required', 'Rejected', 'Processing', 'Done', 'Completed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Request Comments / Milestone Approvals Table (Tenant Scoped)
    await client.query(`
      CREATE TABLE request_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id),
        decision VARCHAR(50) DEFAULT 'Approved',
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Payments Table (Disbursements & Bank Ledger - Tenant Scoped)
    await client.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
        requested_amount NUMERIC(15, 2) NOT NULL,
        approved_amount NUMERIC(15, 2) NOT NULL,
        additional_expenses NUMERIC(15, 2) DEFAULT 0.00,
        total_amount NUMERIC(15, 2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Paid')),
        bank_name VARCHAR(150),
        payment_method VARCHAR(100),
        payment_reference VARCHAR(150),
        receipt_doc_url VARCHAR(255),
        payment_date DATE,
        notes TEXT,
        expenses_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Expenses Table (Itemized Project Expenses)
    await client.query(`
      CREATE TABLE expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        description TEXT,
        recorded_by UUID NOT NULL REFERENCES users(id),
        expense_date DATE DEFAULT CURRENT_DATE,
        receipt_url VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. Materials Table (Consignments & Waybills - Tenant Scoped)
    await client.query(`
      CREATE TABLE materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
        material_name VARCHAR(255) NOT NULL,
        description TEXT,
        quantity NUMERIC(10, 2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        estimated_cost NUMERIC(15, 2) NOT NULL,
        requested_by UUID NOT NULL REFERENCES users(id),
        approval_status VARCHAR(50) DEFAULT 'Pending',
        delivery_status VARCHAR(50) DEFAULT 'Pending' CHECK (delivery_status IN ('Pending', 'Ordered', 'Delivered')),
        delivery_date DATE,
        waybill_doc_url VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 11. Documents Table (Repository & Blueprints - Tenant Scoped)
    await client.query(`
      CREATE TABLE documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size VARCHAR(50) NOT NULL,
        file_url VARCHAR(255) NOT NULL,
        uploaded_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 12. Audit Logs Table (Platform-wide and Tenant-level audit trail)
    await client.query(`
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100),
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('🌱 Seeding Platform Super Admin & Construction Tenants...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Platform Super Admin (Company ID = null)
    const superAdminRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role, phone, title)
      VALUES ('Platform Super Administrator', 'superadmin@hdtech.com', $1, 'SuperAdmin', '+251 90 000 0000', 'Chief Platform Architect')
      RETURNING id;
    `, [passwordHash]);

    const superAdminId = superAdminRes.rows[0].id;

    // 2. Default Company Workspace (HDtech Construction)
    const defCompanyRes = await client.query(`
      INSERT INTO companies (name, code, subdomain, logo_url, status, email, phone, address, total_sites)
      VALUES (
        'HDtech Construction Group',
        'HDTECH-MAIN',
        'hdtech',
        '/logos/hdtech_logo.svg',
        'ACTIVE',
        'contact@hdtech-cms.com',
        '+251 91 100 0000',
        'Bole Sub-City, Addis Ababa, Ethiopia',
        1
      ) RETURNING id;
    `);
    const defCompanyId = defCompanyRes.rows[0].id;

    // Primary Company Admin for HDtech Construction
    await client.query(`
      INSERT INTO users (company_id, name, email, password_hash, role, phone, title)
      VALUES ($1, 'HDtech-CMS Administrator', 'admin@example.com', $2, 'Admin', '+251 91 100 0000', 'Head of Workspace Administration');
    `, [defCompanyId, passwordHash]);

    // 3. Construction Tenant A: Apex Engineering & Construction
    const compARes = await client.query(`
      INSERT INTO companies (name, code, subdomain, logo_url, status, email, phone, address, total_sites)
      VALUES (
        'Apex Engineering & Construction',
        'APEX-CORP',
        'apex',
        '/logos/apex_logo.svg',
        'ACTIVE',
        'info@apexconstruction.et',
        '+251 91 111 2222',
        'Kazanchis Commercial Corridor, Addis Ababa',
        1
      ) RETURNING id;
    `);
    const companyAId = compARes.rows[0].id;

    // Users for Tenant A
    const userARes = await client.query(`
      INSERT INTO users (company_id, name, email, password_hash, role, phone, title)
      VALUES 
        ($1, 'Apex Company Admin', 'admin@apex.com', $2, 'Admin', '+251 91 111 0001', 'Managing Director'),
        ($1, 'Eng. Yared Tadesse', 'engineer@apex.com', $2, 'Engineer', '+251 91 111 0002', 'Senior Structural Engineer'),
        ($1, 'Ato Bekele Gebre (Owner)', 'owner@apex.com', $2, 'House Holder', '+251 91 111 0003', 'Property Developer / Client'),
        ($1, 'Manager Aster Mulugeta', 'manager@apex.com', $2, 'Manager', '+251 91 111 0004', 'Operations & Finance Manager')
      RETURNING id, role, email;
    `, [companyAId, passwordHash]);

    const usersA = {};
    userARes.rows.forEach(r => { usersA[r.role] = r.id; });

    // Project for Tenant A
    const projARes = await client.query(`
      INSERT INTO projects (
        company_id, name, code, location, house_holder_id, engineer_id, manager_id,
        status, progress, total_budget, spent_budget, start_date, expected_completion, description
      ) VALUES (
        $1, 'Apex Royal Heights Villa', 'APX-2026-01', 'Bole Atlas, Addis Ababa',
        $2, $3, $4, 'Active', 35, 6500000.00, 2150000.00, '2026-08-01', '2027-05-31',
        'Modern 4-story luxury residence with reinforced concrete shear walls.'
      ) RETURNING id;
    `, [companyAId, usersA['House Holder'], usersA['Engineer'], usersA['Manager']]);
    const projAId = projARes.rows[0].id;

    // Site for Tenant A
    await client.query(`
      INSERT INTO sites (company_id, project_id, name, location, details)
      VALUES ($1, $2, 'Main Villa Lot #12', 'Bole Atlas Plot 12/B', 'Primary structural footing and basement excavation zone');
    `, [companyAId, projAId]);

    // Assignments for Tenant A
    await client.query(`
      INSERT INTO project_assignments (company_id, project_id, user_id, role)
      VALUES 
        ($1, $2, $3, 'Engineer'),
        ($1, $2, $4, 'House Holder'),
        ($1, $2, $5, 'Manager');
    `, [companyAId, projAId, usersA['Engineer'], usersA['House Holder'], usersA['Manager']]);

    // 4. Construction Tenant B: BlueStar Global Builders
    const compBRes = await client.query(`
      INSERT INTO companies (name, code, subdomain, logo_url, status, email, phone, address, total_sites)
      VALUES (
        'BlueStar Global Builders',
        'BLUESTAR-INTL',
        'bluestar',
        '/logos/bluestar_logo.svg',
        'ACTIVE',
        'contact@bluestarbuilders.com',
        '+251 92 222 3333',
        'CMC Michael Commercial Zone, Addis Ababa',
        1
      ) RETURNING id;
    `);
    const companyBId = compBRes.rows[0].id;

    // Users for Tenant B
    const userBRes = await client.query(`
      INSERT INTO users (company_id, name, email, password_hash, role, phone, title)
      VALUES 
        ($1, 'BlueStar Company Admin', 'admin@bluestar.com', $2, 'Admin', '+251 92 222 0001', 'General Manager'),
        ($1, 'Eng. Meron Fikru', 'engineer@bluestar.com', $2, 'Engineer', '+251 92 222 0002', 'Project Technical Lead'),
        ($1, 'W/ro Selamawit Desta (Owner)', 'owner@bluestar.com', $2, 'House Holder', '+251 92 222 0003', 'Commercial Property Owner'),
        ($1, 'Manager Dawit Alemu', 'manager@bluestar.com', $2, 'Manager', '+251 92 222 0004', 'Site Operations Executive')
      RETURNING id, role, email;
    `, [companyBId, passwordHash]);

    const usersB = {};
    userBRes.rows.forEach(r => { usersB[r.role] = r.id; });

    // Project for Tenant B
    const projBRes = await client.query(`
      INSERT INTO projects (
        company_id, name, code, location, house_holder_id, engineer_id, manager_id,
        status, progress, total_budget, spent_budget, start_date, expected_completion, description
      ) VALUES (
        $1, 'BlueStar Commercial Plaza Tower', 'BST-2026-99', 'CMC Main Square, Addis Ababa',
        $2, $3, $4, 'Active', 20, 14200000.00, 3800000.00, '2026-07-15', '2027-12-31',
        '7-Story mixed-use retail and office complex with dual underground parking.'
      ) RETURNING id;
    `, [companyBId, usersB['House Holder'], usersB['Engineer'], usersB['Manager']]);
    const projBId = projBRes.rows[0].id;

    // Site for Tenant B
    await client.query(`
      INSERT INTO sites (company_id, project_id, name, location, details)
      VALUES ($1, $2, 'Tower A & Retail Arcade', 'CMC Plot #808', 'Tower foundation column pad casting');
    `, [companyBId, projBId]);

    // Assignments for Tenant B
    await client.query(`
      INSERT INTO project_assignments (company_id, project_id, user_id, role)
      VALUES 
        ($1, $2, $3, 'Engineer'),
        ($1, $2, $4, 'House Holder'),
        ($1, $2, $5, 'Manager');
    `, [companyBId, projBId, usersB['Engineer'], usersB['House Holder'], usersB['Manager']]);

    // Initial audit log
    await client.query(`
      INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, details)
      VALUES 
        (NULL, $1::uuid, 'INITIALIZE_PLATFORM', 'SYSTEM', 'ROOT', 'Multi-Tenant SaaS platform initialized with SuperAdmin and sample companies.'),
        ($2::uuid, $3::uuid, 'INITIALIZE_COMPANY', 'COMPANY', $2::text, 'Apex Engineering workspace provisioned.'),
        ($4::uuid, $5::uuid, 'INITIALIZE_COMPANY', 'COMPANY', $4::text, 'BlueStar Global Builders workspace provisioned.');
    `, [superAdminId, companyAId, usersA['Admin'], companyBId, usersB['Admin']]);

    await client.query('COMMIT');
    console.log('✅ Multi-Tenant PostgreSQL SaaS Schema & Seed Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Multi-Tenant Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run directly if invoked from CLI
if (process.argv[1]?.includes('migrate.js')) {
  runMultiTenantMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMultiTenantMigration;
