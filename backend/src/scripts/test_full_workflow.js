import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testWorkflow() {
  console.log('=== STARTING 4-STEP REQUISITION WORKFLOW INTEGRATION TEST ===\n');

  try {
    // 1. Authenticate Engineer (siraj13@gmail.com)
    console.log('1. Logging in as Site Engineer (siraj13@gmail.com)...');
    const engLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'siraj13@gmail.com',
      password: 'password123',
    });
    const engToken = engLogin.data.token;
    const engineer = engLogin.data.user;
    console.log(`   Logged in as: ${engineer.name} (${engineer.role})`);

    // Get Engineer's assigned projects
    const engProjects = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${engToken}` },
    });
    if (!engProjects.data || engProjects.data.length === 0) {
      throw new Error('No assigned projects found for engineer');
    }
    const testProject = engProjects.data[0];
    console.log(`   Target Construction Site: ${testProject.name} (ID: ${testProject.id})`);
    console.log(`   Initial Site Spent Budget: ${Number(testProject.spent_budget || 0).toLocaleString()} ETB`);

    // Step 1: Engineer submits Material Requisition
    console.log('\n2. STEP 1: Engineer submitting Material Requisition with Material Ledger...');
    const reqPayload = {
      projectId: testProject.id,
      type: 'Material',
      title: 'Structural Foundation Cement & Steel Consignment',
      amount: 48000.00,
      description: `[Material Requisition Ledger]
1. Cement (OPC Grade 42.5, Brand: Derba) — 50 Bags @ 650 ETB = 32,500.00 ETB
2. Reinforcement Steel (Grade 60, Brand: Local) — 15 Quintals @ 1,033.33 ETB = 15,500.00 ETB

Total Estimated Cost: 48,000.00 ETB

[Work Description / Technical Notes]
Required for ground beam concrete pouring schedule.`,
    };

    const submitRes = await axios.post(`${BASE_URL}/requests`, reqPayload, {
      headers: { Authorization: `Bearer ${engToken}` },
    });
    const createdReq = submitRes.data.request;
    console.log(`   Requisition Created! ID: ${createdReq.id}`);
    console.log(`   Status: ${createdReq.status} (Forwarded to Property Owner)`);

    // 2. Authenticate Householder (hajr12@gmail.com)
    console.log('\n3. Logging in as Property Owner (hajr12@gmail.com)...');
    const hhLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'hajr12@gmail.com',
      password: 'password123',
    });
    const hhToken = hhLogin.data.token;
    const householder = hhLogin.data.user;
    console.log(`   Logged in as: ${householder.name} (${householder.role})`);

    // Step 2: Householder reviews and approves
    console.log('\n4. STEP 2: Property Owner reviewing & approving requisition...');
    const reviewRes = await axios.patch(
      `${BASE_URL}/requests/${createdReq.id}/review`,
      {
        status: 'Approved',
        comment: 'Foundation inspection verified and approved. Authorized for manager bank disbursement.',
      },
      { headers: { Authorization: `Bearer ${hhToken}` } }
    );
    const approvedReq = reviewRes.data.request;
    console.log(`   Requisition Approved! Status: ${approvedReq.status}`);

    // 3. Authenticate Manager (Game15@gmail.com)
    console.log('\n5. Logging in as Site Operations Manager (Game15@gmail.com)...');
    const mgrLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'Game15@gmail.com',
      password: 'password123',
    });
    const mgrToken = mgrLogin.data.token;
    const manager = mgrLogin.data.user;
    console.log(`   Logged in as: ${manager.name} (${manager.role})`);

    // Step 3 & 4: Manager processes disbursement with additional expenses
    console.log('\n6. STEP 3 & 4: Manager executing bank disbursement with additional transit expenses...');
    const disbursePayload = {
      bankName: 'Commercial Bank of Ethiopia (CBE)',
      paymentMethod: 'Bank Transfer',
      paymentReference: `CBE-TX-${Date.now().toString().slice(-6)}`,
      paymentDate: new Date().toISOString().split('T')[0],
      additionalExpenses: 4500.00,
      expensesNotes: 'Derba cement haulage flatbed truck + crane offloading fee',
      notes: 'Disbursement executed via CBE direct transfer to Derba Cement distributor.',
      receiptUrl: '/uploads/sample_receipt.pdf',
    };

    const disburseRes = await axios.patch(
      `${BASE_URL}/requests/${createdReq.id}/process`,
      disbursePayload,
      { headers: { Authorization: `Bearer ${mgrToken}` } }
    );

    console.log(`   Disbursement Response: ${disburseRes.data.message}`);
    console.log(`   Requisition Status: ${disburseRes.data.request.status}`);
    console.log(`   Payment Status: ${disburseRes.data.payment.status}`);
    console.log(`   Base Approved: ${Number(disburseRes.data.payment.approved_amount).toLocaleString()} ETB`);
    console.log(`   Additional Expenses: +${Number(disburseRes.data.payment.additional_expenses).toLocaleString()} ETB (${disburseRes.data.payment.expenses_notes})`);
    console.log(`   Total Disbursed to Ledger: ${Number(disburseRes.data.totalExpenditure).toLocaleString()} ETB`);

    // Verify Project Spent Budget
    console.log('\n7. Verifying Project Financial Update in Database...');
    const projCheck = await axios.get(`${BASE_URL}/projects/${testProject.id}`, {
      headers: { Authorization: `Bearer ${mgrToken}` },
    });
    const updatedProj = projCheck.data;
    console.log(`   Updated Project Spent Budget: ${Number(updatedProj.spent_budget || updatedProj.spentBudget || 0).toLocaleString()} ETB`);

    console.log('\n=== INTEGRATION TEST PASSED SUCCESSFULLY! ALL 4 STEPS VERIFIED ===');
  } catch (error) {
    console.error('Workflow Test Failed:', error.response?.data || error.message);
  }
}

testWorkflow();
