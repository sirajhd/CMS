import db from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getMaterials(req, res) {
  const { role, id: userId, companyId } = req.user;
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

    if (role === 'SuperAdmin') {
      if (req.query.companyId) {
        queryText += ' WHERE m.company_id = $1';
        params.push(req.query.companyId);
      }
    } else {
      // Company tenant isolation
      queryText += ' WHERE m.company_id = $1';
      params.push(companyId);

      if (role !== 'Admin') {
        queryText += `
          AND (
            p.house_holder_id = $2 
            OR p.engineer_id = $2 
            OR p.manager_id = $2
          )
        `;
        params.push(userId);
      }
    }

    if (projectId) {
      queryText += ` AND m.project_id = $${params.length + 1}`;
      params.push(projectId);
    }

    queryText += ' ORDER BY m.created_at DESC;';

    const result = await db.query(queryText, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error retrieving materials:', error);
    return res.status(500).json({ message: 'Failed to retrieve materials.', error: error.message });
  }
}

export async function createMaterial(req, res) {
  const { projectId, materialName, description, quantity, unit, estimatedCost } = req.body;
  const { id: userId, role, companyId } = req.user;

  if (role !== 'Engineer') {
    return res.status(403).json({ 
      message: 'Access Denied: Only site engineers can requisition construction materials. Administrators cannot create material requisitions.' 
    });
  }

  if (!projectId || !materialName || !quantity || !unit) {
    return res.status(400).json({ message: 'Project, material name, quantity, and unit are required.' });
  }

  try {
    // Validate project belongs to user's company and engineer is assigned
    const projCheck = await db.query(
      'SELECT id, name, company_id, engineer_id FROM projects WHERE id = $1 AND company_id = $2',
      [projectId, companyId]
    );

    if (projCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Target project site not found in your company workspace.' });
    }

    if (projCheck.rows[0].engineer_id !== userId) {
      return res.status(403).json({
        message: 'Access Denied: You are not the designated Site Engineer for this project.',
      });
    }

    const queryText = `
      INSERT INTO materials (
        company_id, project_id, material_name, description, quantity, unit, estimated_cost, requested_by, approval_status, delivery_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Approved', 'Pending')
      RETURNING *;
    `;
    const result = await db.query(queryText, [
      companyId,
      projectId,
      materialName,
      description || '',
      Number(quantity) || 1,
      unit,
      Number(estimatedCost) || 0.00,
      userId,
    ]);

    const material = result.rows[0];

    await logAudit({
      companyId,
      userId,
      action: 'REQUISITION_MATERIAL',
      entityType: 'MATERIAL',
      entityId: material.id,
      details: `Material "${material.material_name}" (${material.quantity} ${material.unit}) requisitioned for project "${projCheck.rows[0].name}".`,
    });

    return res.status(201).json({
      message: 'Material requisition registered in workspace.',
      material,
    });
  } catch (error) {
    console.error('Error requisitioning materials:', error);
    return res.status(500).json({ message: 'Failed to register material requisition.', error: error.message });
  }
}

export async function recordDelivery(req, res) {
  const { id } = req.params;
  const { deliveryDate, notes, waybillDocUrl } = req.body;
  const { role, id: userId, companyId } = req.user;

  if (role !== 'Manager') {
    return res.status(403).json({ 
      message: 'Access Denied: Only site operations managers can confirm site delivery. Administrators cannot record delivery.' 
    });
  }

  try {
    const queryText = `
      UPDATE materials
      SET delivery_status = 'Delivered',
          delivery_date = $1,
          waybill_doc_url = $2,
          description = CASE WHEN $3 <> '' THEN description || ' | Drop Note: ' || $3 ELSE description END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND company_id = $5
      RETURNING *;
    `;
    const result = await db.query(queryText, [
      deliveryDate || new Date().toISOString().split('T')[0],
      waybillDocUrl || 'Site_Receiving_Waybill.pdf',
      notes || '',
      id,
      companyId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Material consignment not found in your company workspace.' });
    }

    const material = result.rows[0];

    await logAudit({
      companyId,
      userId,
      action: 'DELIVER_MATERIAL',
      entityType: 'MATERIAL',
      entityId: id,
      details: `Consignment "${material.material_name}" delivery confirmed by Operations Manager.`,
    });

    return res.status(200).json({
      message: 'Site offloading verified and delivery confirmed.',
      material,
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
