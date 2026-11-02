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

const newUser = {
  email: 'Jane@Example.com',
  password: 'correct-horse',
  firstName: 'Jane',
  lastName: 'Doe',
};

describe('auth', () => {
  it('signs up, signs in and fetches the current user', async () => {
    const signUp = await request(app).post('/api/auth/sign-up').send(newUser).expect(201);
    assert.ok(signUp.body.accessToken);
    assert.equal(signUp.body.user.email, 'jane@example.com');
    assert.equal(signUp.body.user.passwordHash, undefined);
    assert.equal(signUp.body.user.isActive, 0);

    const signIn = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'jane@example.com', password: 'correct-horse' })
      .expect(200);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signIn.body.accessToken}`)
      .expect(200);

    assert.equal(me.body.user.displayName, 'Jane Doe');
    assert.equal(me.body.user.role, 'user');
  });

  it('rejects duplicate emails', async () => {
    await request(app).post('/api/auth/sign-up').send(newUser).expect(201);
    const res = await request(app).post('/api/auth/sign-up').send(newUser).expect(409);
    assert.match(res.body.message, /already exists/);
  });

  it('rejects invalid sign-up input with a message', async () => {
    const res = await request(app)
      .post('/api/auth/sign-up')
      .send({ ...newUser, password: 'short' })
      .expect(400);
    assert.match(res.body.message, /at least 8/);
  });

  it('rejects wrong password and unknown email with the same message', async () => {
    await request(app).post('/api/auth/sign-up').send(newUser).expect(201);

    const wrong = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: newUser.email, password: 'nope-nope' })
      .expect(401);
    const unknown = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'ghost@example.com', password: 'nope-nope' })
      .expect(401);

    assert.equal(wrong.body.message, unknown.body.message);
  });

  it('rejects /me without a valid token', async () => {
    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage').expect(401);
  });
});
