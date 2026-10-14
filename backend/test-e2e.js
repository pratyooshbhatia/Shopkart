require('dotenv').config();
const http = require('http');

async function runE2ETests() {
  console.log('====================================================');
  console.log('🚀 SHOPKART END-TO-END VERIFICATION SUITE (LAB 01 & 02)');
  console.log('====================================================\n');

  const PORT = process.env.PORT || 5001;
  const BASE_URL = `http://localhost:${PORT}`;
  let cookieHeader = null;

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      if (setCookie.includes('token=;') || setCookie.includes('Max-Age=0')) {
        cookieHeader = null;
      } else {
        cookieHeader = setCookie.split(';')[0];
      }
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    return { status: res.status, headers: res.headers, data, setCookie };
  }

  let passed = 0;
  let total = 0;

  function assert(title, condition, extra = '') {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title} ${extra}`);
    }
  }

  const timestamp = Date.now();
  const testUser = {
    fullName: 'Alice Walker',
    email: `alice_${timestamp}@shopkart.com`,
    password: 'securePassword123',
    phone: '+1-555-0199',
  };

  console.log('--- TEST GROUP 1: Registration (POST /customers/register) ---');
  
  // 1. Missing field
  const missingRes = await request('/customers/register', {
    method: 'POST',
    body: JSON.stringify({ email: testUser.email, password: testUser.password }),
  });
  assert('Missing required fields returns 400', missingRes.status === 400 && missingRes.data.success === false);

  // 2. Short password
  const shortPassRes = await request('/customers/register', {
    method: 'POST',
    body: JSON.stringify({ ...testUser, password: '123' }),
  });
  assert('Password < 6 characters returns 400', shortPassRes.status === 400 && shortPassRes.data.success === false);

  // 3. Successful registration
  const regRes = await request('/customers/register', {
    method: 'POST',
    body: JSON.stringify(testUser),
  });
  assert('Valid registration returns 201 with customer data', 
    regRes.status === 201 && 
    regRes.data.success === true && 
    regRes.data.customer.email === testUser.email &&
    regRes.data.customer.password === undefined
  );

  // 4. Duplicate registration
  const dupRes = await request('/customers/register', {
    method: 'POST',
    body: JSON.stringify(testUser),
  });
  assert('Duplicate email registration returns 409 Conflict', dupRes.status === 409 && dupRes.data.success === false);

  console.log('\n--- TEST GROUP 2: Login & HttpOnly Cookie (POST /customers/login) ---');

  // 5. Invalid password
  const wrongPassRes = await request('/customers/login', {
    method: 'POST',
    body: JSON.stringify({ email: testUser.email, password: 'wrongPassword!' }),
  });
  assert('Invalid password returns 401 Unauthorized', wrongPassRes.status === 401 && wrongPassRes.data.success === false);

  // 6. Invalid email
  const wrongEmailRes = await request('/customers/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'nonexistent@shopkart.com', password: testUser.password }),
  });
  assert('Non-existent email returns 401 Unauthorized', wrongEmailRes.status === 401 && wrongEmailRes.data.success === false);

  // 7. Successful login
  const loginRes = await request('/customers/login', {
    method: 'POST',
    body: JSON.stringify({ email: testUser.email, password: testUser.password }),
  });
  const hasHttpOnly = loginRes.setCookie && loginRes.setCookie.toLowerCase().includes('httponly');
  const hasToken = loginRes.setCookie && loginRes.setCookie.includes('token=');
  assert('Valid login returns 200 and sets HttpOnly JWT cookie', 
    loginRes.status === 200 && 
    loginRes.data.success === true && 
    hasToken && 
    hasHttpOnly
  );

  console.log('\n--- TEST GROUP 3: Protected Profile (GET /customers/me) ---');

  // 8. Access with valid cookie
  const meRes = await request('/customers/me');
  assert('Authenticated GET /customers/me returns 200 with customer profile', 
    meRes.status === 200 && 
    meRes.data.email === testUser.email && 
    meRes.data.fullName === testUser.fullName &&
    meRes.data.password === undefined
  );

  // 9. Access without cookie
  const tempCookie = cookieHeader;
  cookieHeader = null;
  const unauthRes = await request('/customers/me');
  assert('Unauthenticated GET /customers/me returns 401 Unauthorized', unauthRes.status === 401 && unauthRes.data.success === false);
  cookieHeader = tempCookie;

  console.log('\n--- TEST GROUP 4: Password Change (PATCH /customers/change-password) ---');

  // 10. Change password
  const newPassword = 'brandNewPassword999';
  const changeRes = await request('/customers/change-password', {
    method: 'PATCH',
    body: JSON.stringify({ oldPassword: testUser.password, newPassword }),
  });
  assert('Change password with valid credentials returns 200', changeRes.status === 200 && changeRes.data.success === true);

  // 11. Login with old password fails
  cookieHeader = null;
  const oldLoginRes = await request('/customers/login', {
    method: 'POST',
    body: JSON.stringify({ email: testUser.email, password: testUser.password }),
  });
  assert('Login with old password now returns 401', oldLoginRes.status === 401);

  // 12. Login with new password succeeds
  const newLoginRes = await request('/customers/login', {
    method: 'POST',
    body: JSON.stringify({ email: testUser.email, password: newPassword }),
  });
  assert('Login with new password succeeds and refreshes cookie', newLoginRes.status === 200 && newLoginRes.setCookie.includes('token='));

  console.log('\n--- TEST GROUP 5: Logout (POST /customers/logout) ---');

  // 13. Logout
  const logoutRes = await request('/customers/logout', { method: 'POST' });
  assert('Logout returns 200 and clears authentication cookie', logoutRes.status === 200 && logoutRes.data.success === true);

  // 14. Access after logout
  const postLogoutMe = await request('/customers/me');
  assert('Accessing /customers/me after logout returns 401 Unauthorized', postLogoutMe.status === 401);

  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${passed}/${total} TESTS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  console.log('====================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error('E2E Test Runner Error:', err);
  process.exit(1);
});
