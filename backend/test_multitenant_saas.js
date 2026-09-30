import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=====================================================');
  console.log('🚀 MULTI-TENANT SAAS PLATFORM INTEGRATION TEST SUITE');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Super Admin Login & Platform Stats
    // -------------------------------------------------------------
    console.log('--- TEST 1: Super Admin Platform Master Access ---');
    const saLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@hdtech.com',
      password: 'password123',
    });
    const saToken = saLoginRes.data.token;
    assert(saLoginRes.data.user.role === 'SuperAdmin', 'SuperAdmin logged in with role SuperAdmin');
    assert(saLoginRes.data.user.companyId === null, 'SuperAdmin has null companyId (Platform Scope)');

    const statsRes = await axios.get(`${BASE_URL}/superadmin/stats`, {
      headers: { Authorization: `Bearer ${saToken}` },
    });
    assert(statsRes.data.stats.totalCompanies >= 3, `Platform stats retrieved (${statsRes.data.stats.totalCompanies} companies registered)`);

    const companiesRes = await axios.get(`${BASE_URL}/superadmin/companies`, {
      headers: { Authorization: `Bearer ${saToken}` },
    });
    assert(Array.isArray(companiesRes.data.companies), 'SuperAdmin successfully listed all company tenants');

    // -------------------------------------------------------------
    // TEST 2: Self-Service Company Tenant Registration
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Self-Service Company Workspace Registration ---');
    const randomSuffix = Math.floor(Math.random() * 10000);
    const newCompanyData = {
      name: `Horizon Builders ${randomSuffix}`,
      code: `HB${randomSuffix}`.slice(0, 8),
      email: `contact@horizon${randomSuffix}.com`,
      phone: '+251 91 555 1234',
      address: 'Kazanchis, Addis Ababa',
      adminName: `Abebe Horizon ${randomSuffix}`,
      adminEmail: `admin@horizon${randomSuffix}.com`,
      adminPassword: 'password123',
    };

    const regRes = await axios.post(`${BASE_URL}/auth/register-company`, newCompanyData);
    assert(regRes.data.token && regRes.data.user, 'New Company self-registered successfully');
    assert(regRes.data.user.company.name === newCompanyData.name, 'Company workspace initialized with correct name');
    assert(regRes.data.user.role === 'Admin', 'Initial user is assigned Company System Admin role');

    const hbToken = regRes.data.token;
    const hbCompanyId = regRes.data.user.companyId;

    // -------------------------------------------------------------
    // TEST 3: Tenant Isolation & Scoped CRUD
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Strict Tenant Isolation & Data Scoping ---');
    // Horizon Admin creates a user in their workspace
    const newUserRes = await axios.post(
      `${BASE_URL}/users`,
      {
        name: `Engineer Kidus ${randomSuffix}`,
        email: `engineer@horizon${randomSuffix}.com`,
        password: 'password123',
        role: 'Engineer',
        phone: '+251 91 888 7777',
      },
      { headers: { Authorization: `Bearer ${hbToken}` } }
    );
    assert(newUserRes.data.user.email === `engineer@horizon${randomSuffix}.com`, 'Horizon Admin created Engineer user');
    const kidusId = newUserRes.data.user.id;

    // Horizon Admin creates a project in their workspace
    const newProjRes = await axios.post(
      `${BASE_URL}/projects`,
      {
        name: `Horizon Tower ${randomSuffix}`,
        location: 'Kazanchis Lot 4',
        total_budget: 15000000,
        engineer_id: kidusId,
      },
      { headers: { Authorization: `Bearer ${hbToken}` } }
    );
    const hbProjectId = newProjRes.data.project.id;
    assert(newProjRes.data.project.name === `Horizon Tower ${randomSuffix}`, 'Horizon Admin created project');

    // Login as Apex Admin (Company 2)
    const apexLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@apex.com',
      password: 'password123',
    });
    const apexToken = apexLoginRes.data.token;

    // Apex Admin fetches projects -> MUST NOT SEE Horizon Tower!
    const apexProjectsRes = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${apexToken}` },
    });
    const apexProjectList = Array.isArray(apexProjectsRes.data) ? apexProjectsRes.data : (apexProjectsRes.data.projects || []);
    const leakFound = apexProjectList.some((p) => p.id === hbProjectId);
    assert(!leakFound, 'Apex Admin CANNOT see Horizon Tower in project listing (Isolated)');

    // Apex Admin directly attempts to access Horizon Tower by ID -> MUST BE REJECTED 403/404!
    let unauthorizedBlocked = false;
    try {
      await axios.get(`${BASE_URL}/projects/${hbProjectId}`, {
        headers: { Authorization: `Bearer ${apexToken}` },
      });
    } catch (err) {
      unauthorizedBlocked = err.response?.status === 403 || err.response?.status === 404;
    }
    assert(unauthorizedBlocked, 'Cross-tenant project access by ID blocked with 403/404 Forbidden');

    // Apex Admin directly attempts to delete Horizon Tower -> MUST BE BLOCKED!
    let crossDeleteBlocked = false;
    try {
      await axios.delete(`${BASE_URL}/projects/${hbProjectId}`, {
        headers: { Authorization: `Bearer ${apexToken}` },
      });
    } catch (err) {
      crossDeleteBlocked = err.response?.status === 403 || err.response?.status === 404;
    }
    assert(crossDeleteBlocked, 'Cross-tenant project deletion blocked with 403/404 Forbidden');

    // -------------------------------------------------------------
    // TEST 4: Tenant Suspension Enforcement
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Platform SuperAdmin Tenant Suspension Enforcement ---');
    // SuperAdmin suspends Horizon Builders
    await axios.patch(
      `${BASE_URL}/superadmin/companies/${hbCompanyId}/status`,
      { status: 'SUSPENDED' },
      { headers: { Authorization: `Bearer ${saToken}` } }
    );

    // Horizon Admin attempts API call -> MUST BE REJECTED WITH 403 Forbidden!
    let suspensionEnforcedOnApi = false;
    try {
      await axios.get(`${BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${hbToken}` },
      });
    } catch (err) {
      suspensionEnforcedOnApi = err.response?.status === 403;
    }
    assert(suspensionEnforcedOnApi, 'Suspended company API request blocked with 403 Forbidden');

    // Horizon Admin attempts login -> MUST BE REJECTED WITH 403 Forbidden!
    let suspensionEnforcedOnLogin = false;
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: `admin@horizon${randomSuffix}.com`,
        password: 'password123',
      });
    } catch (err) {
      suspensionEnforcedOnLogin = err.response?.status === 403;
    }
    assert(suspensionEnforcedOnLogin, 'Suspended company login blocked with 403 Forbidden');

    // SuperAdmin reactivates Horizon Builders
    await axios.patch(
      `${BASE_URL}/superadmin/companies/${hbCompanyId}/status`,
      { status: 'ACTIVE' },
      { headers: { Authorization: `Bearer ${saToken}` } }
    );

    const hbReloginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: `admin@horizon${randomSuffix}.com`,
      password: 'password123',
    });
    assert(hbReloginRes.data.token, 'Reactivated company user successfully logged in again');

    // -------------------------------------------------------------
    // TEST 5: Complete Operational Approval Pipeline within Workspace
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Preserved Workflow: Engineer -> Householder -> Manager -> Done ---');
    // Login as Apex Engineer
    const engLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'engineer@apex.com',
      password: 'password123',
    });
    const engToken = engLogin.data.token;
    const engProjects = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${engToken}` },
    });
    const engProjList = Array.isArray(engProjects.data) ? engProjects.data : (engProjects.data.projects || []);
    const apexProj = engProjList[0];
    assert(apexProj, `Apex Engineer found assigned project (${apexProj?.name})`);

    // Engineer submits requisition
    const reqRes = await axios.post(
      `${BASE_URL}/requests`,
      {
        project_id: apexProj.id,
        title: `Reinforced Steel Grade 60 Requisition ${randomSuffix}`,
        description: 'Urgent foundation reinforcements for Block B',
        type: 'Material',
        amount: 85000,
        materials: [
          {
            materialName: 'Grade 60 Steel',
            materialType: 'High-Tensile',
            brand: 'Derba',
            unit: 'Quintals',
            quantity: 20,
            unitPrice: 4250,
            totalPrice: 85000,
          }
        ]
      },
      { headers: { Authorization: `Bearer ${engToken}` } }
    );
    const reqId = reqRes.data.request.id;
    assert(reqRes.data.request.status === 'Submitted' || reqRes.data.request.status === 'Pending', 'Requisition created in Submitted/Pending status');

    // Login as Apex Householder
    const hhLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'owner@apex.com',
      password: 'password123',
    });
    const hhToken = hhLogin.data.token;

    // Householder approves requisition
    const approveRes = await axios.patch(
      `${BASE_URL}/requests/${reqId}/review`,
      {
        status: 'Approved',
        comment: 'Verified against structural drawings. Approved.',
      },
      { headers: { Authorization: `Bearer ${hhToken}` } }
    );
    assert(approveRes.data.request.status === 'Approved', 'Householder approved requisition -> status changed to Approved');

    // Login as Apex Manager
    const mgrLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'manager@apex.com',
      password: 'password123',
    });
    const mgrToken = mgrLogin.data.token;

    // Manager fetches payments to find the approved payment record
    const mgrPaymentsRes = await axios.get(`${BASE_URL}/payments`, {
      headers: { Authorization: `Bearer ${mgrToken}` },
    });
    const paymentList = Array.isArray(mgrPaymentsRes.data) ? mgrPaymentsRes.data : (mgrPaymentsRes.data.payments || []);
    const matchingPayment = paymentList.find((p) => p.request_id === reqId);
    assert(Boolean(matchingPayment), 'Manager received automatically forwarded approved payment record');

    // Manager processes payment & records disbursement with bank receipt & additional expense
    const disburseRes = await axios.patch(
      `${BASE_URL}/payments/${matchingPayment.id}/process`,
      {
        paymentMethod: 'Bank Transfer',
        bankName: 'Commercial Bank of Ethiopia',
        paymentReference: `TXN-${randomSuffix}`,
        additionalExpenses: 3500, // e.g. transport expense
        expensesNotes: 'Crane and truck transport costs',
        notes: 'Disbursed full tranche plus crane transport',
      },
      { headers: { Authorization: `Bearer ${mgrToken}` } }
    );
    assert(disburseRes.data.payment.status === 'Paid', 'Manager completed payment -> Payment status is Paid');
    assert(Number(disburseRes.data.payment.total_amount) === 88500, 'Total expenditure calculated correctly (85,000 + 3,500 = 88,500 ETB)');

    // Verify requisition status changed to Done
    const reqStatusCheck = await axios.get(`${BASE_URL}/requests/${reqId}`, {
      headers: { Authorization: `Bearer ${mgrToken}` },
    });
    assert(reqStatusCheck.data.request.status === 'Done', 'Requisition lifecycle completed with status Done');

    // -------------------------------------------------------------
    // TEST 6: Platform Audit Trail Recording
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: SaaS Audit Trail Integrity ---');
    const logsRes = await axios.get(`${BASE_URL}/superadmin/audit-logs`, {
      headers: { Authorization: `Bearer ${saToken}` },
    });
    assert(logsRes.data.auditLogs.length > 0, `SuperAdmin retrieved ${logsRes.data.auditLogs.length} platform audit events`);

    console.log('\n=====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test suite encountered an error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
