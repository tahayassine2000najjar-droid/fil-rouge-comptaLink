import fs from 'fs';
import assert from 'assert';

const BASE_URL = 'http://localhost:4001/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- Starting tests ---');
  try {
    // 1. Register a cabinet
    console.log('1. Registering cabinet...');
    let res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'cabinet@test.com',
        password: 'password123',
        fullName: 'Cabinet Test User',
        role: 'cabinet',
        firmName: 'My Super Cabinet',
      }),
    });
    console.log(res.status, res.data);
    if (res.status === 409) {
      console.log('User already exists, let\'s login');
    } else {
      assert.strictEqual(res.status, 201);
    }

    // Since verify email might be required, let's bypass it via mongodb or it might not be checked during login?
    // Let's check if login requires isEmailVerified.
    console.log('2. Logging in...');
    res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'cabinet@test.com',
        password: 'password123',
      }),
    });
    console.log(res.status, res.data);
    assert.strictEqual(res.status, 200);
    const accessToken = res.data.accessToken;

    // 3. Get Me
    console.log('3. GET /me');
    res = await request('/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(res.status, res.data);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.profile.firmName, 'My Super Cabinet');

    // 4. Update Cabinet
    console.log('4. PATCH /cabinet/me');
    res = await request('/cabinet/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ description: 'A test description' }),
    });
    console.log(res.status, res.data);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.description, 'A test description');

    // 5. Get My Cabinet
    console.log('5. GET /cabinet/me');
    res = await request('/cabinet/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(res.status, res.data);
    assert.strictEqual(res.status, 200);

    // 6. List Cabinets
    console.log('6. GET /cabinets');
    let listRes = await request('/cabinets');
    console.log(listRes.status, listRes.data);
    assert.strictEqual(listRes.status, 200);

    // 7. Get single cabinet (id from /cabinet/me)
    const cabId = res.data?.data?._id;
    if (cabId) {
      console.log(`7. GET /cabinets/${cabId}`);
      res = await request(`/cabinets/${cabId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log(res.status, res.data);
      assert.strictEqual(res.status, 200);
    }

    console.log('--- All tests passed! ---');
  } catch (err) {
    console.error('Test failed:', err);
  }
}

runTests();
