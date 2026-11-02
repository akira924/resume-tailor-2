import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo: MongoMemoryServer;
let app: import('express').Express;

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

  // Import after env is set, since config is validated at load time.
  const { createApp } = await import('../src/app.js');
  app = createApp();
  await mongoose.connect(mongo.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
});

async function createUser(email: string, fields: { role?: string; isActive?: number } = {}) {
  await request(app)
    .post('/api/auth/sign-up')
    .send({ email, password: 'correct-horse', firstName: 'Test', lastName: 'User' })
    .expect(201);

  await mongoose.connection.db
    ?.collection('users')
    .updateOne({ email }, { $set: { isActive: 1, ...fields } });

  const signIn = await request(app)
    .post('/api/auth/sign-in')
    .send({ email, password: 'correct-horse' })
    .expect(200);

  return signIn.body.accessToken as string;
}

describe('GET /api/users', () => {
  it('lists all users for an admin, without password hashes', async () => {
    const adminToken = await createUser('admin@example.com', { role: 'admin' });
    await request(app)
      .post('/api/auth/sign-up')
      .send({ email: 'pending@example.com', password: 'correct-horse', firstName: 'P', lastName: 'U' })
      .expect(201);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    assert.equal(res.body.users.length, 2);
    const pending = res.body.users.find((u: { email: string }) => u.email === 'pending@example.com');
    assert.equal(pending.isActive, 0);
    assert.ok(pending.createdAt);
    assert.equal(pending.passwordHash, undefined);
  });

  it('rejects non-admin users', async () => {
    const userToken = await createUser('user@example.com');

    await request(app).get('/api/users').set('Authorization', `Bearer ${userToken}`).expect(403);
  });

  it('rejects requests without a token', async () => {
    await request(app).get('/api/users').expect(401);
  });
});
