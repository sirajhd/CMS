import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import db from './db.js';

async function clearAllSystemData() {
  console.log('🔄 Starting full system wipe...');

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Clear all operational transaction tables
    console.log('🗑️  Clearing documents, materials, payments, comments, requests, and projects...');
    await client.query('TRUNCATE TABLE documents CASCADE;');
    await client.query('TRUNCATE TABLE materials CASCADE;');
    await client.query('TRUNCATE TABLE payments CASCADE;');
    await client.query('TRUNCATE TABLE request_comments CASCADE;');
    await client.query('TRUNCATE TABLE requests CASCADE;');
    await client.query('TRUNCATE TABLE projects CASCADE;');

    // 2. Clear all users and keep ONLY the primary Admin account
    console.log('🗑️  Clearing all users...');
    await client.query('TRUNCATE TABLE users CASCADE;');

    // 3. Insert fresh primary Administrator
    console.log('👤 Creating fresh Administrator account...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    await client.query(`
      INSERT INTO users (name, email, password_hash, role, phone, title)
      VALUES ($1, $2, $3, 'Admin', $4, $5);
    `, [
      'HDtech-CMS Administrator',
      'admin@example.com',
      passwordHash,
      '+251 91 100 0000',
      'System & Project Administrator'
    ]);

    await client.query('COMMIT');
    console.log('✅ Database successfully cleared. Only fresh Admin account remains.');

    // 4. Clean uploads folder
    const uploadsDir = path.resolve('uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
          console.log(`🗑️  Deleted uploaded file: ${file}`);
        }
      }
    }

    console.log('✨ System is 100% clean and ready for fresh registration!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error clearing database:', error);
  } finally {
    client.release();
    process.exit();
  }
}

clearAllSystemData();
