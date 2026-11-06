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

async function createActiveUser(email: string) {
  await request(app)
    .post('/api/auth/sign-up')
    .send({ email, password: 'correct-horse', firstName: 'Ada', lastName: 'Lovelace' })
    .expect(201);

  await mongoose.connection.db?.collection('users').updateOne({ email }, { $set: { isActive: 1 } });

  const signIn = await request(app)
    .post('/api/auth/sign-in')
    .send({ email, password: 'correct-horse' })
    .expect(200);

  return signIn.body.accessToken as string;
}

const validResume = {
  data: {
    personal_info: { name: 'Ada Lovelace' },
    skillsets: [{ category: 'Math', skills: ['Analysis', 'Notes'] }],
    custom_field: { nested: [1, null, true] },
  },
  settings: { marginVertical: 36, sectionOrder: ['education', 'skills'], colorTheme: 'navy' },
};

describe('GET /api/resume', () => {
  it('requires a token', async () => {
    await request(app).get('/api/resume').expect(401);
  });

  it('returns null before the first save', async () => {
    const token = await createActiveUser('ada@example.com');

    const res = await request(app)
      .get('/api/resume')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.equal(res.body.resume, null);
  });
});

describe('PUT /api/resume', () => {
  it('requires a token', async () => {
    await request(app).put('/api/resume').send(validResume).expect(401);
  });

  it('saves the JSON and settings unchanged and returns them on the next GET', async () => {
    const token = await createActiveUser('ada@example.com');

    await request(app)
      .put('/api/resume')
      .set('Authorization', `Bearer ${token}`)
      .send(validResume)
      .expect(200);

    const res = await request(app)
      .get('/api/resume')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.deepEqual(res.body.resume.data, validResume.data);
    assert.deepEqual(res.body.resume.settings, validResume.settings);
    assert.ok(res.body.resume.updatedAt);
  });

  it('keeps one resume per user and replaces it on each save', async () => {
    const token = await createActiveUser('ada@example.com');

    for (const data of [validResume.data, { headline: 'Engineer' }]) {
      await request(app)
        .put('/api/resume')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validResume, data })
        .expect(200);
    }

    const count = await mongoose.connection.db?.collection('resumes').countDocuments();
    assert.equal(count, 1);

    const res = await request(app).get('/api/resume').set('Authorization', `Bearer ${token}`);
    assert.deepEqual(res.body.resume.data, { headline: 'Engineer' });
  });

  it('does not show one user the resume of another', async () => {
    const adaToken = await createActiveUser('ada@example.com');
    const bobToken = await createActiveUser('bob@example.com');

    await request(app)
      .put('/api/resume')
      .set('Authorization', `Bearer ${adaToken}`)
      .send(validResume)
      .expect(200);

    const res = await request(app).get('/api/resume').set('Authorization', `Bearer ${bobToken}`);
    assert.equal(res.body.resume, null);
  });

  it('accepts empty objects', async () => {
    const token = await createActiveUser('ada@example.com');

    const res = await request(app)
      .put('/api/resume')
      .set('Authorization', `Bearer ${token}`)
      .send({ data: {}, settings: {} })
      .expect(200);

    assert.deepEqual(res.body.resume.data, {});
    assert.deepEqual(res.body.resume.settings, {});
  });

  it('accepts whatever keys the user typed, including $ and dots', async () => {
    const token = await createActiveUser('ada@example.com');
    const data = { $note: 'a', 'a.b': 'c', nested: { $set: 1, 'x.y': 2 } };

    await request(app)
      .put('/api/resume')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validResume, data })
      .expect(200);

    const res = await request(app).get('/api/resume').set('Authorization', `Bearer ${token}`);
    assert.deepEqual(res.body.resume.data, data);
  });

  it('rejects data that is not a JSON object', async () => {
    const token = await createActiveUser('ada@example.com');

    for (const data of [[], 'text', null, undefined]) {
      const res = await request(app)
        .put('/api/resume')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validResume, data })
        .expect(400);

      assert.equal(res.body.message, 'Resume data must be a JSON object');
    }
  });
});
