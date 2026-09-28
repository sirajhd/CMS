import bcrypt from 'bcryptjs';
import db from './db.js';

async function runMigration() {
  console.log('🔄 Starting PostgreSQL Schema Migration & Seed...');

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    console.log('📦 Dropping old tables if existing...');
    await client.query(`
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS materials CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS request_comments CASCADE;
      DROP TABLE IF EXISTS requests CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log('🔨 Creating tables...');

    // 1. Users Table
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'House Holder', 'Engineer', 'Manager')),
        phone VARCHAR(50),
        title VARCHAR(255),
        reset_password_token VARCHAR(255),
        reset_password_expires TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Projects Table
    await client.query(`
      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Requests Table
    await client.query(`
      CREATE TABLE requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('Payment', 'Material', 'Agreement', 'Technical Document', 'Other')),
        title VARCHAR(255) NOT NULL,
        amount NUMERIC(15, 2) DEFAULT 0.00,
        description TEXT NOT NULL,
        submitted_by UUID NOT NULL REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Approved', 'Revision Required', 'Rejected', 'Completed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Request Comments Table
    await client.query(`
      CREATE TABLE request_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id),
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Payments Table
    await client.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
        requested_amount NUMERIC(15, 2) NOT NULL,
        approved_amount NUMERIC(15, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Paid')),
        payment_method VARCHAR(100),
        payment_reference VARCHAR(150),
        receipt_doc_url VARCHAR(255),
        payment_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Materials Table
    await client.query(`
      CREATE TABLE materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Documents Table
    await client.query(`
      CREATE TABLE documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        file_type VARCHAR(20) NOT NULL,
        file_size VARCHAR(50) NOT NULL,
        file_url VARCHAR(255) NOT NULL,
        uploaded_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('🌱 Seeding initial users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Seed Users
    const userRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role, phone, title)
      VALUES 
        ('Alemayehu Tadesse', 'admin@example.com', $1, 'Admin', '+251 91 123 4567', 'Master Platform Administrator'),
        ('Abebe Kebede', 'householder@example.com', $1, 'House Holder', '+251 92 234 5678', 'Property Owner (Bole Bulbula)'),
        ('Engineer Hana Worku', 'engineer@example.com', $1, 'Engineer', '+251 93 345 6789', 'Lead Structural Engineer'),
        ('Manager Daniel Hailu', 'manager@example.com', $1, 'Manager', '+251 94 456 7890', 'Site Operations Manager')
      RETURNING id, role;
    `, [passwordHash]);

    const usersByRole = {};
    userRes.rows.forEach(r => { usersByRole[r.role] = r.id; });

    console.log('🌱 Seeding construction project...');
    const projRes = await client.query(`
      INSERT INTO projects (
        name, location, house_holder_id, engineer_id, manager_id, status, progress, total_budget, spent_budget, start_date, expected_completion, description
      ) VALUES (
        'Modern Family House',
        'Bole Bulbula, Addis Ababa',
        $1, $2, $3,
        'Active',
        42,
        4850000.00,
        1750000.00,
        '2026-09-01',
        '2027-06-30',
        'Two-story residential villa with reinforced concrete frame and modern masonry finishes.'
      ) RETURNING id;
    `, [usersByRole['House Holder'], usersByRole['Engineer'], usersByRole['Manager']]);

    const projectId = projRes.rows[0].id;

    console.log('🌱 Seeding requests and milestone payments...');
    const reqRes = await client.query(`
      INSERT INTO requests (
        project_id, type, title, amount, description, submitted_by, status
      ) VALUES (
        $1, 'Payment', 'Foundation Payment Request', 150000.00,
        'Payment required for foundation earthwork, reinforcement bar placement, and C-25 concrete casting.',
        $2, 'Approved'
      ) RETURNING id;
    `, [projectId, usersByRole['Engineer']]);

    const requestId = reqRes.rows[0].id;

    await client.query(`
      INSERT INTO payments (
        project_id, request_id, requested_amount, approved_amount, status, payment_method, notes
      ) VALUES (
        $1, $2, 150000.00, 150000.00, 'Approved', 'Commercial Bank of Ethiopia', 'Authorized by Abebe Kebede'
      );
    `, [projectId, requestId]);

    await client.query(`
      INSERT INTO materials (
        project_id, material_name, description, quantity, unit, estimated_cost, requested_by, approval_status, delivery_status
      ) VALUES (
        $1, '16mm Deformed Steel Rebar (Grade 60)', 'Ground floor column vertical steel bars.',
        40.00, 'Quintals', 240000.00, $2, 'Approved', 'Pending'
      );
    `, [projectId, usersByRole['Engineer']]);

    await client.query('COMMIT');
    console.log('✅ PostgreSQL Schema & Seed Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
  } finally {
    client.release();
    process.exit();
  }
}

runMigration();
