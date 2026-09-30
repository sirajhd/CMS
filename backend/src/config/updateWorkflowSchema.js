import db from './db.js';

export async function updateWorkflowSchema() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update requests status check constraint
    await client.query('ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;');
    await client.query(`
      ALTER TABLE requests 
      ADD CONSTRAINT requests_status_check 
      CHECK (status IN ('Submitted', 'Under Review', 'Approved', 'Revision Required', 'Rejected', 'Processing', 'Done', 'Completed'));
    `);

    // 2. Add financial breakdown columns to payments table
    await client.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_name VARCHAR(150);');
    await client.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS additional_expenses NUMERIC(15, 2) DEFAULT 0.00;');
    await client.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15, 2) DEFAULT 0.00;');
    await client.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS expenses_notes TEXT;');

    await client.query('COMMIT');
    console.log('✅ Workflow schema and PostgreSQL constraints updated successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to update workflow schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

updateWorkflowSchema().then(() => process.exit(0)).catch(() => process.exit(1));
