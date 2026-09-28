import db from '../config/db.js';

export async function getMaterials(req, res) {
  const { role, id: userId } = req.user;
  const { projectId } = req.query;

  try {
    let queryText = `
      SELECT 
        m.*,
        p.name AS project_name,
        u.name AS requested_by_name
      FROM materials m
      JOIN projects p ON m.project_id = p.id
      JOIN users u ON m.requested_by = u.id
    `;
    const params = [];

    if (projectId) {
      queryText += ' WHERE m.project_id = $1';
      params.push(projectId);
    } else if (role !== 'Admin') {
      queryText += `
        WHERE p.house_holder_id = $1 
           OR p.engineer_id = $1 
           OR p.manager_id = $1
      `;
      params.push(userId);
    }

    queryText += ' ORDER BY m.created_at DESC';

    const result = await db.query(queryText, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error retrieving materials:', error);
    return res.status(500).json({ message: 'Failed to retrieve materials.', error: error.message });
  }
}

export async function createMaterial(req, res) {
  const { projectId, materialName, description, quantity, unit, estimatedCost } = req.body;
  const { id: userId, role } = req.user;

  if (role !== 'Engineer' && role !== 'Admin') {
    return res.status(403).json({ message: 'Only site engineers or administrators can requisition construction materials.' });
  }

  if (!projectId || !materialName || !quantity || !unit) {
    return res.status(400).json({ message: 'Project, material name, quantity, and unit are required.' });
  }

  try {
    const queryText = `
      INSERT INTO materials (
        project_id, material_name, description, quantity, unit, estimated_cost, requested_by, approval_status, delivery_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Approved', 'Pending')
      RETURNING *;
    `;
    const result = await db.query(queryText, [
      projectId,
      materialName,
      description || '',
      Number(quantity) || 1,
      unit,
      Number(estimatedCost) || 0.00,
      userId,
    ]);

    return res.status(201).json({
      message: 'Material requisition registered.',
      material: result.rows[0],
    });
  } catch (error) {
    console.error('Error requisitioning materials:', error);
    return res.status(500).json({ message: 'Failed to register material requisition.', error: error.message });
  }
}

export async function recordDelivery(req, res) {
  const { id } = req.params;
  const { deliveryDate, notes, waybillDocUrl } = req.body;
  const { role } = req.user;

  if (role !== 'Manager' && role !== 'Admin') {
    return res.status(403).json({ message: 'Only operations managers or administrators can confirm site delivery.' });
  }

  try {
    const queryText = `
      UPDATE materials
      SET delivery_status = 'Delivered',
          delivery_date = $1,
          waybill_doc_url = $2,
          description = CASE WHEN $3 <> '' THEN description || ' | Drop Note: ' || $3 ELSE description END
      WHERE id = $4
      RETURNING *;
    `;
    const result = await db.query(queryText, [
      deliveryDate || new Date().toISOString().split('T')[0],
      waybillDocUrl || 'Site_Receiving_Waybill.pdf',
      notes || '',
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Material consignment not found.' });
    }

    return res.status(200).json({
      message: 'Site offloading verified and delivery confirmed.',
      material: result.rows[0],
    });
  } catch (error) {
    console.error('Error confirming delivery:', error);
    return res.status(500).json({ message: 'Failed to record delivery.', error: error.message });
  }
}

export default {
  getMaterials,
  createMaterial,
  recordDelivery,
};
