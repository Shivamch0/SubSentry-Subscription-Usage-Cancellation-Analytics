import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('health check is public and reports API readiness', async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
});

test('data routes require an access token', async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/customers`);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).message, 'Access token is required');
});

test('registration validates credentials before accessing persistence', async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '', email: 'bad', password: 'short' }) });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /valid email/i);
});
