import multer from 'multer';
import path from 'path';
import db from '../config/db.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

export async function getDocuments(req, res) {
  const { role, id: userId } = req.user;
  const { projectId } = req.query;

  try {
    let queryText = `
      SELECT 
        d.*,
        p.name AS project_name,
        u.name AS uploaded_by_name
      FROM documents d
      JOIN projects p ON d.project_id = p.id
      JOIN users u ON d.uploaded_by = u.id
    `;
    const params = [];

    if (projectId) {
      if (role !== 'Admin') {
        queryText += `
          WHERE d.project_id = $1 AND (
            p.house_holder_id = $2 OR 
            p.engineer_id = $2 OR 
            p.manager_id = $2
          )
        `;
        params.push(projectId, userId);
      } else {
        queryText += ' WHERE d.project_id = $1';
        params.push(projectId);
      }
    } else if (role !== 'Admin') {
      queryText += `
        WHERE p.house_holder_id = $1 
           OR p.engineer_id = $1 
           OR p.manager_id = $1
      `;
      params.push(userId);
    }

    queryText += ' ORDER BY d.created_at DESC';

    const result = await db.query(queryText, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ message: 'Failed to retrieve documents.', error: error.message });
  }
}

export async function uploadDocument(req, res) {
  const { projectId, name, type } = req.body;
  const { id: userId, role } = req.user;

  if (!projectId || !name || !type) {
    return res.status(400).json({ message: 'Project ID, document name, and type classification are required.' });
  }

  try {
    // Enforce site membership check: user must be Admin OR assigned stakeholder of this project
    if (role !== 'Admin') {
      const accessQuery = `
        SELECT id, name FROM projects 
        WHERE id = $1 AND (
          house_holder_id = $2 OR 
          engineer_id = $2 OR 
          manager_id = $2
        )
      `;
      const accessResult = await db.query(accessQuery, [projectId, userId]);

      if (accessResult.rows.length === 0) {
        return res.status(403).json({ 
          message: 'Access Denied: Only assigned site members (Property Owner, Lead Engineer, Site Manager) or system administrators can upload documents to this construction project.' 
        });
      }
    }

    const file = req.file;
    const fileUrl = file ? `/uploads/${file.filename}` : '/uploads/sample_document.pdf';
    const fileSize = file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : '2.4 MB';
    const fileType = file ? path.extname(file.originalname).replace('.', '').toUpperCase() : 'PDF';

    const insertQuery = `
      INSERT INTO documents (project_id, name, type, file_type, file_size, file_url, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const insertResult = await db.query(insertQuery, [
      projectId,
      name,
      type,
      fileType,
      fileSize,
      fileUrl,
      userId,
    ]);

    const createdDocId = insertResult.rows[0].id;

    // Fetch joined document with project name and author name
    const populated = await db.query(`
      SELECT 
        d.*,
        p.name AS project_name,
        u.name AS uploaded_by_name
      FROM documents d
      JOIN projects p ON d.project_id = p.id
      JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = $1
    `, [createdDocId]);

    return res.status(201).json({
      message: 'Document saved to archive.',
      document: populated.rows[0] || insertResult.rows[0],
    });
  } catch (error) {
    console.error('Error saving document:', error);
    return res.status(500).json({ message: 'Failed to archive document.', error: error.message });
  }
}

export default {
  uploadMiddleware,
  getDocuments,
  uploadDocument,
};
