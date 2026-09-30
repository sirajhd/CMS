import db from './src/config/db.js';

const BASE_URL = 'http://localhost:5000/api';

async function login(email, password = 'password123') {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Login failed for ${email}: ${txt}`);
  }
  const data = await res.json();
  return { token: data.token, user: data.user };
}

async function api(method, path, token, body = null, isMultipart = false) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('========================================================');
  console.log('SSA CONSTRUCTION PROJECT - RBAC & RESTRICTIONS AUDIT');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate all roles
    console.log('--- Phase 1: Authentication ---');
    const admin = await login('admin@example.com');
    const engineer = await login('siraj13@gmail.com');
    const houseHolder = await login('hajr12@gmail.com');
    const manager = await login('Game15@gmail.com');
    console.log('✓ All 4 stakeholder accounts authenticated successfully.\n');

    // 2. Test Admin Capabilities: User Management
    console.log('--- Phase 2: Admin Exclusive User Management ---');
    const tempUserEmail = `testuser_${Date.now()}@example.com`;
    
    // Add user
    const createUserRes = await api('POST', '/users', admin.token, {
      name: 'Test SSA Engineer',
      email: tempUserEmail,
      role: 'Engineer',
      title: 'Structural QA Specialist',
      phone: '+251911000000',
      password: 'password123',
    });
    assert(createUserRes.status === 201, 'Admin CAN create new users', JSON.stringify(createUserRes.data));
    const createdUserId = createUserRes.data?.user?.id;

    // Edit user
    const updateUserRes = await api('PUT', `/users/${createdUserId}`, admin.token, {
      name: 'Test SSA Engineer (Updated)',
      email: tempUserEmail,
      role: 'Engineer',
      title: 'Senior Lead Structural QA',
      phone: '+251911999999',
    });
    assert(updateUserRes.status === 200 && updateUserRes.data?.user?.name === 'Test SSA Engineer (Updated)', 'Admin CAN edit existing users', JSON.stringify(updateUserRes.data));

    // Delete user
    const deleteUserRes = await api('DELETE', `/users/${createdUserId}`, admin.token);
    assert(deleteUserRes.status === 200, 'Admin CAN delete users', JSON.stringify(deleteUserRes.data));

    // Non-admin CANNOT manage users
    const engUserCreateRes = await api('POST', '/users', engineer.token, {
      name: 'Illegal User',
      email: `illegal_${Date.now()}@example.com`,
      role: 'Engineer',
    });
    assert(engUserCreateRes.status === 403, 'Engineer CANNOT create users (403 Forbidden)', JSON.stringify(engUserCreateRes.data));

    console.log('');

    // 3. Test Admin Capabilities: Project Management & Role Assignment
    console.log('--- Phase 3: Admin Project Management & Stakeholder Assignment ---');
    const createProjRes = await api('POST', '/projects', admin.token, {
      name: 'SSA Bole Luxury Villa Alpha',
      location: 'Addis Ababa, Bole Sub-City, Site #44',
      houseHolderId: houseHolder.user.id,
      engineerId: engineer.user.id,
      managerId: manager.user.id,
      totalBudget: 4500000.00,
      description: 'SSA Construction Project - 3-Story Luxury Residential Villa',
    });
    assert(createProjRes.status === 201, 'Admin CAN create new projects and assign roles (Householder, Engineer, Manager)', JSON.stringify(createProjRes.data));
    const testProjectId = createProjRes.data?.project?.id;

    // Admin edit project
    const updateProjRes = await api('PUT', `/projects/${testProjectId}`, admin.token, {
      name: 'SSA Bole Luxury Villa Alpha (Revised Scope)',
      location: 'Addis Ababa, Bole Sub-City, Site #44',
      totalBudget: 4800000.00,
    });
    assert(updateProjRes.status === 200, 'Admin CAN edit project details', JSON.stringify(updateProjRes.data));

    console.log('');

    // 4. Test Strict Admin Access Restrictions (Prohibitions)
    console.log('--- Phase 4: Strict Admin Prohibitions & Security Enforcement ---');
    
    // Restriction A: Admin must NOT submit site requisitions
    const adminReqRes = await api('POST', '/requests', admin.token, {
      projectId: testProjectId,
      type: 'Payment',
      title: 'Illegal Admin Request',
      amount: 50000,
      description: 'Admin attempting requisition creation',
    });
    assert(adminReqRes.status === 403, 'Admin CANNOT create site requisitions (403 Forbidden)', JSON.stringify(adminReqRes.data));

    // Restriction B: Admin must NOT upload payment receipts or expense vouchers
    const adminDocRes = await api('POST', '/documents', admin.token, {
      projectId: testProjectId,
      name: 'Unauthorized Bank Receipt',
      type: 'Payment Receipt',
    });
    assert(adminDocRes.status === 403, 'Admin CANNOT upload payment receipts (403 Forbidden)', JSON.stringify(adminDocRes.data));

    console.log('');

    // 5. Test 4-Step Pipeline: Engineer -> Householder -> Manager (With Admin Restricted)
    console.log('--- Phase 5: Approval Pipeline (Engineer -> Householder -> Manager) ---');

    // Step 1: Designated Engineer submits requisition
    const engSubmitRes = await api('POST', '/requests', engineer.token, {
      projectId: testProjectId,
      type: 'Material',
      title: 'Foundation Grade 60 Rebar & OPC Cement Consignment',
      amount: 320000.00,
      description: 'Requisition for 400 quintals of reinforcement steel and 200 bags of OPC cement.',
    });
    assert(engSubmitRes.status === 201, 'Step 1: Assigned Site Engineer CAN submit requisition', JSON.stringify(engSubmitRes.data));
    const createdReqId = engSubmitRes.data?.request?.id;

    // Restriction C: Admin must NOT approve or review requisition
    const adminReviewRes = await api('PATCH', `/requests/${createdReqId}/review`, admin.token, {
      status: 'Approved',
      comment: 'Admin trying to approve',
    });
    assert(adminReviewRes.status === 403, 'Admin CANNOT review/approve requisitions (403 Forbidden)', JSON.stringify(adminReviewRes.data));

    // Restriction D: Engineer cannot self-approve
    const engSelfApproveRes = await api('PATCH', `/requests/${createdReqId}/review`, engineer.token, {
      status: 'Approved',
      comment: 'Engineer self approving',
    });
    assert(engSelfApproveRes.status === 403, 'Engineer CANNOT self-approve requisition (403 Forbidden)', JSON.stringify(engSelfApproveRes.data));

    // Step 2: Householder reviews & approves
    const hhReviewRes = await api('PATCH', `/requests/${createdReqId}/review`, houseHolder.token, {
      status: 'Approved',
      comment: 'Structural foundation inspection passed. Approved for manager disbursement.',
    });
    assert(hhReviewRes.status === 200 && hhReviewRes.data?.request?.status === 'Approved', 'Step 2: Property Owner (Householder) CAN review & approve requisition', JSON.stringify(hhReviewRes.data));

    // Restriction E: Admin must NOT process disbursement or record expenses
    const adminDisburseRes = await api('PATCH', `/requests/${createdReqId}/process`, admin.token, {
      bankName: 'Commercial Bank of Ethiopia (CBE)',
      paymentMethod: 'Bank Transfer',
      paymentReference: 'TXN-ADMIN-ILLEGAL',
      paymentDate: '2026-09-29',
      additionalExpenses: 15000,
    });
    assert(adminDisburseRes.status === 403, 'Admin CANNOT process disbursement (403 Forbidden)', JSON.stringify(adminDisburseRes.data));

    // Step 3 & 4: Manager processes disbursement with bank receipt & additional expenses
    const mgrDisburseRes = await api('PATCH', `/requests/${createdReqId}/process`, manager.token, {
      bankName: 'Commercial Bank of Ethiopia (CBE)',
      paymentMethod: 'Bank Transfer',
      paymentReference: 'TXN-CBE-9948217',
      paymentDate: '2026-09-29',
      additionalExpenses: 12500.00,
      expensesNotes: 'Flatbed crane haulage and offloading labor costs',
      notes: 'Disbursement executed to Derba Cement supplier account.',
    });
    assert(
      mgrDisburseRes.status === 200 && mgrDisburseRes.data?.request?.status === 'Done',
      'Step 3 & 4: Assigned Site Operations Manager CAN disburse funds and mark status as Done',
      JSON.stringify(mgrDisburseRes.data)
    );

    // Verify spent budget automatically incremented (320000 + 12500 = 332500)
    const updatedProjRes = await api('GET', `/projects/${testProjectId}`, admin.token);
    assert(
      Number(updatedProjRes.data?.spent_budget) === 332500,
      'Financial Ledger: Project spent budget automatically incremented to 332,500 ETB',
      `Spent budget: ${updatedProjRes.data?.spent_budget}`
    );

    console.log('');

    // 6. Clean up test project by Admin
    console.log('--- Phase 6: Admin Project Deletion ---');
    const deleteProjRes = await api('DELETE', `/projects/${testProjectId}`, admin.token);
    assert(deleteProjRes.status === 200, 'Admin CAN delete projects', JSON.stringify(deleteProjRes.data));

    console.log('');
    console.log('========================================================');
    console.log(`AUDIT COMPLETED: ${passed} Passed, ${failed} Failed.`);
    console.log('========================================================');

    process.exit(failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  }
}

runTests();
