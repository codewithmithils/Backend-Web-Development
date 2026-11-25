require('dotenv').config();
process.env.ACCESS_SECRET =
  process.env.ACCESS_SECRET || 'lu54-test-secret-do-not-use-in-production-32chars';

const http = require('http');
const jwt = require('jsonwebtoken');
const SECRET = process.env.ACCESS_SECRET;
const token = (sub, role) => jwt.sign({ sub, role }, SECRET, {
  algorithm: 'HS256',
  expiresIn: '1h',
});

const originalLog = console.log;
console.log = () => {};
const app = require('../src/app');
console.log = originalLog;
const server = http.createServer(app);

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: server.address().port,
      path: options.path || '/',
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) { console.log(`  ✓ ${message}`); passed += 1; }
  else { console.log(`  ✗ ${message}`); failed += 1; }
}
function as(role, sub, method, path, body) {
  return request({
    method, path,
    headers: {
      Authorization: `Bearer ${token(sub, role)}`,
      'Content-Type': 'application/json',
    },
  }, body);
}

async function runTests() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  console.log('\nLU 54 — Authorization & RBAC Tests\n');

  console.log('Test 1: Owner edits their own post → 200');
  {
    const res = await as('member', 'u-A', 'PATCH', '/posts/1', { title: 'mine' });
    assert(res.status === 200, `Status is 200 (got ${res.status})`);
  }

  console.log('\nTest 2: Member B edits member A post → 403 (IDOR closed)');
  {
    const res = await as('member', 'u-B', 'PATCH', '/posts/1', { title: 'hacked' });
    assert(res.status === 403, `Status is 403 (got ${res.status})`);
    assert(res.body?.error?.code === 'FORBIDDEN',
      `error.code is FORBIDDEN (got ${res.body?.error?.code})`);
  }

  console.log('\nTest 3: Moderator deletes any post → 200');
  {
    const res = await as('moderator', 'u-mod', 'DELETE', '/posts/2');
    assert(res.status === 200, `Status is 200 (got ${res.status})`);
  }

  console.log('\nTest 4: Member hides a post → 403');
  {
    const res = await as('member', 'u-A', 'POST', '/posts/1/hide');
    assert(res.status === 403, `Status is 403 (got ${res.status})`);
    assert(res.body?.error?.code === 'FORBIDDEN',
      `error.code is FORBIDDEN (got ${res.body?.error?.code})`);
  }

  console.log('\nTest 5: Moderator hides a post → 200');
  {
    const res = await as('moderator', 'u-mod', 'POST', '/posts/1/hide');
    assert(res.status === 200, `Status is 200 (got ${res.status})`);
  }

  console.log('\nTest 6: Member calls admin-only delete user → 403');
  {
    const res = await as('member', 'u-B', 'DELETE', '/users/u-A');
    assert(res.status === 403, `Status is 403 (got ${res.status})`);
    assert(res.body?.error?.code === 'FORBIDDEN',
      `error.code is FORBIDDEN (got ${res.body?.error?.code})`);
  }

  console.log('\nTest 7: Admin deletes user → 200');
  {
    const res = await as('admin', 'u-admin', 'DELETE', '/users/u-A');
    assert(res.status === 200, `Status is 200 (got ${res.status})`);
  }

  console.log('\nTest 8: PATCH missing post → 404');
  {
    const res = await as('member', 'u-A', 'PATCH', '/posts/999', { title: 'x' });
    assert(res.status === 404, `Status is 404 (got ${res.status})`);
  }

  console.log('\nTest 9: Protected route without token → 401');
  {
    const res = await request({ path: '/posts' });
    assert(res.status === 401, `Status is 401 (got ${res.status})`);
  }

  await new Promise((resolve) => server.close(resolve));
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
  else console.log('All tests passed!');
}

runTests().catch((error) => {
  console.error('Test runner error:', error);
  server.close();
  process.exitCode = 1;
});
