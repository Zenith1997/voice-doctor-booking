const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
process.env.DB_PATH = ':memory:';
delete process.env.OPENAI_API_KEY;
const { app, db } = require('../server');
let server;
let base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  db.close();
});
test('health checks database availability', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});
test('doctor listing returns seeded records', async () => {
  const res = await fetch(`${base}/api/doctors`);
  assert.equal(res.status, 200);
  const { doctors } = await res.json();
  assert.ok(Array.isArray(doctors));
  assert.ok(doctors.length >= 4);
  assert.ok(doctors.some(doctor => doctor.name === 'Dr Sarah Nguyen'));
});
test('anonymous users cannot create doctors', async () => {
  const res = await fetch(`${base}/api/doctors`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Unauthorized doctor' })
  });
  assert.equal(res.status, 401);
});
test('incorrect password cannot log in', async () => {
  const res = await fetch(`${base}/api/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@voicecare.local', password: 'wrong-password' })
  });
  assert.equal(res.status, 401);
});
test('admin login, authenticated session and logout work end to end', async () => {
  const login = await fetch(`${base}/api/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@voicecare.local', password: 'admin123' })
  });
  assert.equal(login.status, 200);
  const body = await login.json();
  assert.equal(body.user.role, 'admin');
  assert.ok(body.token);
  const headers = { Authorization: `Bearer ${body.token}` };
  const me = await fetch(`${base}/api/me`, { headers });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.email, 'admin@voicecare.local');
  assert.equal((await fetch(`${base}/api/logout`, { method: 'POST', headers })).status, 200);
  assert.equal((await fetch(`${base}/api/me`, { headers })).status, 401);
});
test('admin can create, update and deactivate a doctor; invalid input is rejected', async () => {
  const login = await fetch(`${base}/api/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@voicecare.local', password: 'admin123' })
  });
  const { token } = await login.json();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const invalid = await fetch(`${base}/api/doctors`, { method: 'POST', headers, body: '{}' });
  assert.equal(invalid.status, 400);
  const doctor = { name: 'Dr Test', specialty: 'GP', location: 'Test Clinic', bio: 'Integration test' };
  const created = await fetch(`${base}/api/doctors`, { method: 'POST', headers, body: JSON.stringify(doctor) });
  assert.equal(created.status, 201);
  let { doctors } = await (await fetch(`${base}/api/doctors`)).json();
  const record = doctors.find(item => item.name === doctor.name);
  assert.ok(record);
  const updated = await fetch(`${base}/api/doctors/${record.id}`, {
    method: 'PUT', headers, body: JSON.stringify({ ...doctor, location: 'Updated Clinic' })
  });
  assert.equal(updated.status, 200);
  ({ doctors } = await (await fetch(`${base}/api/doctors`)).json());
  assert.equal(doctors.find(item => item.id === record.id).location, 'Updated Clinic');
  assert.equal((await fetch(`${base}/api/doctors/${record.id}`, { method: 'DELETE', headers })).status, 200);
  ({ doctors } = await (await fetch(`${base}/api/doctors`)).json());
  assert.ok(!doctors.some(item => item.id === record.id));
  await fetch(`${base}/api/logout`, { method: 'POST', headers });
});
