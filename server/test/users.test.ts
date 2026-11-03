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

function signUpPending(email: string) {
  return request(app)
    .post('/api/auth/sign-up')
    .send({ email, password: 'correct-horse', firstName: 'P', lastName: 'U' })
    .expect(201);
}

describe('pending approvals', () => {
  it('counts only unapproved non-admin users', async () => {
    const adminToken = await createUser('admin@example.com', { role: 'admin', isActive: 0 });
    await createUser('active@example.com');
    await signUpPending('pending@example.com');

    const res = await request(app)
      .get('/api/users/pending-count')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    assert.equal(res.body.count, 1);
  });

  it('pushes the new pending count to admins as soon as someone signs up', async () => {
    const adminToken = await createUser('admin@example.com', { role: 'admin' });

    const server = app.listen(0);
    const { port } = server.address() as import('node:net').AddressInfo;
    const controller = new AbortController();

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/users/events`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        signal: controller.signal,
      });
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type') ?? '', /text\/event-stream/);

      const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      const nextCount = async () => {
        while (!buffer.includes('\n\n')) {
          const { value, done } = await reader.read();
          if (done) throw new Error('stream ended');
          buffer += value;
        }
        const [event, ...rest] = buffer.split('\n\n');
        buffer = rest.join('\n\n');
        const data = event.split('\n').find((line) => line.startsWith('data: '))!;
        return JSON.parse(data.slice(6)).pendingCount as number;
      };

      assert.equal(await nextCount(), 0);

      await signUpPending('pending@example.com');

      assert.equal(await nextCount(), 1);
    } finally {
      controller.abort();
      server.closeAllConnections();
      server.close();
    }
  });

  it('rejects the event stream for non-admins', async () => {
    const userToken = await createUser('user@example.com');

    await request(app)
      .get('/api/users/events')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });
});

describe('PATCH /api/users/:id/status', () => {
  async function setup(isActive: number) {
    const adminToken = await createUser('admin@example.com', { role: 'admin' });
    await createUser('target@example.com');
    await mongoose.connection.db
      ?.collection('users')
      .updateOne({ email: 'target@example.com' }, { $set: { isActive } });
    const target = await mongoose.connection.db
      ?.collection('users')
      .findOne({ email: 'target@example.com' });
    return { adminToken, id: String(target!._id) };
  }

  function patchStatus(token: string, id: string, isActive: number) {
    return request(app)
      .patch(`/api/users/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive });
  }

  function signIn(email: string) {
    return request(app).post('/api/auth/sign-in').send({ email, password: 'correct-horse' });
  }

  it('approves a pending user', async () => {
    const { adminToken, id } = await setup(0);

    const res = await patchStatus(adminToken, id, 1).expect(200);
    assert.equal(res.body.user.isActive, 1);
    await signIn('target@example.com').expect(200);
  });

  it('rejects a pending user, who then cannot sign in', async () => {
    const { adminToken, id } = await setup(0);

    await patchStatus(adminToken, id, -1).expect(200);
    const res = await signIn('target@example.com').expect(403);
    assert.match(res.body.message, /rejected/);
  });

  it('reactivates a deactivated user', async () => {
    const { adminToken, id } = await setup(2);

    const blocked = await signIn('target@example.com').expect(403);
    assert.match(blocked.body.message, /deactivated/);

    await patchStatus(adminToken, id, 1).expect(200);
    await signIn('target@example.com').expect(200);
  });

  it('refuses changes to rejected users', async () => {
    const { adminToken, id } = await setup(-1);

    await patchStatus(adminToken, id, 1).expect(409);
  });

  it('refuses changes to admins', async () => {
    const { adminToken } = await setup(0);
    const admin = await mongoose.connection.db
      ?.collection('users')
      .findOne({ email: 'admin@example.com' });

    await patchStatus(adminToken, String(admin!._id), 2).expect(400);
  });

  it('validates the status and the id', async () => {
    const { adminToken, id } = await setup(0);

    await patchStatus(adminToken, id, 0).expect(400);
    await patchStatus(adminToken, 'not-an-id', 1).expect(404);
  });

  it('is admin-only', async () => {
    const { id } = await setup(0);
    const userToken = await createUser('user@example.com');

    await patchStatus(userToken, id, 1).expect(403);
  });
});

describe('ending sessions of deactivated users', () => {
  async function setup() {
    const adminToken = await createUser('admin@example.com', { role: 'admin' });
    const userToken = await createUser('target@example.com');
    const target = await mongoose.connection.db
      ?.collection('users')
      .findOne({ email: 'target@example.com' });
    return { adminToken, userToken, id: String(target!._id) };
  }

  it('rejects the existing token once the user is deactivated', async () => {
    const { adminToken, userToken, id } = await setup();

    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${userToken}`).expect(200);

    await request(app)
      .patch(`/api/users/${id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: 2 })
      .expect(200);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(401);
    assert.match(res.body.message, /deactivated/);
  });

  it('pushes session-ended to the user as soon as they are deactivated', async () => {
    const { adminToken, userToken, id } = await setup();

    const server = app.listen(0);
    const { port } = server.address() as import('node:net').AddressInfo;
    const controller = new AbortController();

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/auth/events`, {
        headers: { Authorization: `Bearer ${userToken}` },
        signal: controller.signal,
      });
      assert.equal(res.status, 200);

      await request(app)
        .patch(`/api/users/${id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: 2 })
        .expect(200);

      // The server closes the stream right after the event.
      const body = await res.text();
      assert.match(body, /event: session-ended/);
      assert.match(body, /deactivated/);
    } finally {
      controller.abort();
      server.closeAllConnections();
      server.close();
    }
  });
});
