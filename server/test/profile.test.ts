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

const validProfile = {
  personal: {
    fullName: 'Ada Lovelace',
    email: 'Ada@Example.com',
    phoneNumber: '+14155550123',
    location: 'London, UK',
  },
  links: { linkedin: 'linkedin.com/in/ada', github: 'https://github.com/ada', website: '' },
  career: { level: 'Senior', yearsOfExperience: 7 },
  experience: [
    {
      company: 'Analytical Engines Ltd',
      title: 'Engineer',
      location: 'London',
      startDate: '2020-01-01T00:00:00+00:00',
      endDate: null,
      bulletCount: 4,
    },
  ],
  education: [
    {
      institution: 'University of London',
      degree: 'BSc',
      major: 'Mathematics',
      startDate: '2015-09-01T00:00:00+00:00',
      endDate: '2019-06-01T00:00:00+00:00',
    },
  ],
  certifications: [
    { institution: 'AWS', name: 'Solutions Architect', date: '2022-03-01T00:00:00+00:00' },
  ],
};

describe('GET /api/profile', () => {
  it('requires a token', async () => {
    await request(app).get('/api/profile').expect(401);
  });

  it('prefills name and email from the account before the first save', async () => {
    const token = await createActiveUser('ada@example.com');

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.equal(res.body.profile.personal.fullName, 'Ada Lovelace');
    assert.equal(res.body.profile.personal.email, 'ada@example.com');
    assert.deepEqual(res.body.profile.experience, []);
    assert.deepEqual(res.body.profile.career, { level: '', yearsOfExperience: 1 });
    assert.equal(res.body.profile.updatedAt, null);
  });
});

describe('PUT /api/profile', () => {
  it('saves the profile and returns it on the next GET', async () => {
    const token = await createActiveUser('ada@example.com');

    await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(validProfile)
      .expect(200);

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const { profile } = res.body;
    assert.equal(profile.personal.location, 'London, UK');
    assert.equal(profile.links.linkedin, 'https://linkedin.com/in/ada');
    assert.deepEqual(profile.career, { level: 'Senior', yearsOfExperience: 7 });
    assert.equal(profile.experience[0].bulletCount, 4);
    assert.equal(profile.experience[0].endDate, null);
    assert.equal(profile.education[0].major, 'Mathematics');
    assert.equal(profile.certifications[0].name, 'Solutions Architect');
    assert.ok(profile.updatedAt);
  });

  it('keeps one profile per user and replaces it on each save', async () => {
    const token = await createActiveUser('ada@example.com');

    for (const experience of [validProfile.experience, []]) {
      await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validProfile, experience })
        .expect(200);
    }

    const count = await mongoose.connection.db?.collection('profiles').countDocuments();
    assert.equal(count, 1);

    const res = await request(app).get('/api/profile').set('Authorization', `Bearer ${token}`);
    assert.deepEqual(res.body.profile.experience, []);
  });

  it('does not show one user the profile of another', async () => {
    const adaToken = await createActiveUser('ada@example.com');
    const bobToken = await createActiveUser('bob@example.com');

    await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${adaToken}`)
      .send(validProfile)
      .expect(200);

    const res = await request(app).get('/api/profile').set('Authorization', `Bearer ${bobToken}`);
    assert.equal(res.body.profile.personal.email, 'bob@example.com');
  });

  it('ignores a sent email and always returns the account email', async () => {
    const token = await createActiveUser('ada@example.com');

    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validProfile, personal: { ...validProfile.personal, email: 'other@example.com' } })
      .expect(200);

    assert.equal(res.body.profile.personal.email, 'ada@example.com');

    const stored = await mongoose.connection.db?.collection('profiles').findOne();
    assert.equal(stored?.personal.email, undefined);
  });

  it('rejects an invalid link', async () => {
    const token = await createActiveUser('ada@example.com');

    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validProfile, links: { ...validProfile.links, github: 'not a url' } })
      .expect(400);

    assert.equal(res.body.message, 'GitHub must be a valid URL');
  });

  it('rejects an end date before the start date', async () => {
    const token = await createActiveUser('ada@example.com');

    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...validProfile,
        experience: [{ ...validProfile.experience[0], endDate: '2019-01-01T00:00:00+00:00' }],
      })
      .expect(400);

    assert.equal(res.body.message, 'End date must be after start date');
  });

  it('rejects a bullet count outside 1-10', async () => {
    const token = await createActiveUser('ada@example.com');

    await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validProfile, experience: [{ ...validProfile.experience[0], bulletCount: 0 }] })
      .expect(400);
  });

  it('rejects an unknown level and years of experience outside 1-20', async () => {
    const token = await createActiveUser('ada@example.com');

    for (const career of [
      { level: 'Intern', yearsOfExperience: 5 },
      { level: 'Senior', yearsOfExperience: 0 },
      { level: 'Senior', yearsOfExperience: 21 },
    ]) {
      await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validProfile, career })
        .expect(400);
    }
  });
});
