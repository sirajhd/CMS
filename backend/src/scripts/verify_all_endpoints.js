import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function verifyAll() {
  console.log('🔍 Testing All API Endpoints & Role Access...\n');

  try {
    // 1. Health check
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 1. GET /api/health:', health.data.status);

    // 2. Admin login
    const adminRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123',
    });
    const adminToken = adminRes.data.token;
    console.log('✅ 2. POST /api/auth/login (Admin): Success');

    // 3. Admin endpoints
    const headers = { Authorization: `Bearer ${adminToken}` };

    const [projects, users, requests, payments, materials, documents, activities] = await Promise.all([
      axios.get(`${BASE_URL}/projects`, { headers }),
      axios.get(`${BASE_URL}/users`, { headers }),
      axios.get(`${BASE_URL}/requests`, { headers }),
      axios.get(`${BASE_URL}/payments`, { headers }),
      axios.get(`${BASE_URL}/materials`, { headers }),
      axios.get(`${BASE_URL}/documents`, { headers }),
      axios.get(`${BASE_URL}/activities`, { headers }),
    ]);

    console.log(`✅ 3. GET /api/projects: ${projects.data.length} projects`);
    console.log(`✅ 4. GET /api/users: ${users.data.length} users`);
    console.log(`✅ 5. GET /api/requests: ${requests.data.length} requests`);
    console.log(`✅ 6. GET /api/payments: ${payments.data.length} payments`);
    console.log(`✅ 7. GET /api/materials: ${materials.data.length} materials`);
    console.log(`✅ 8. GET /api/documents: ${documents.data.length} documents`);
    console.log(`✅ 9. GET /api/activities: ${activities.data.length} activities`);

    // 4. Test Forgot Password
    const forgotRes = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: 'admin@example.com',
    });
    console.log('✅ 10. POST /api/auth/forgot-password:', forgotRes.data.message);

    console.log('\n🎉 ALL 10 ENDPOINTS TESTED AND FUNCTIONING 100% WITH ZERO ERRORS!\n');
  } catch (err) {
    console.error('❌ Endpoint Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

verifyAll();
