import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../lib/http-error.js';
import { requireAuth } from '../middleware/require-auth.js';
import { UserModel } from '../models/user.js';
import { CAREER_LEVELS, ProfileModel, toPublicProfile } from '../models/profile.js';

const text = (max: number) => z.string().trim().max(max).default('');

const required = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max);

/** Empty, or a URL. A missing protocol gets `https://`, so "github.com/me" is accepted. */
const link = (label: string) =>
  z
    .string()
    .trim()
    .max(300)
    .transform((value) => (value && !/^https?:\/\//i.test(value) ? `https://${value}` : value))
    .pipe(z.union([z.literal(''), z.url({ error: `${label} must be a valid URL` })]))
    .default('');

const date = z.iso.datetime({ offset: true, error: 'Invalid date' }).nullable().default(null);

/** Rejects an end date before the start date. Either may be empty. */
function endAfterStart(item: { startDate: string | null; endDate: string | null }) {
  return !item.startDate || !item.endDate || new Date(item.endDate) >= new Date(item.startDate);
}

const experienceSchema = z
  .object({
    company: required('Company', 100),
    title: text(100),
    location: text(100),
    startDate: date,
    endDate: date,
    bulletCount: z.int().min(1).max(10),
  })
  .refine(endAfterStart, { error: 'End date must be after start date', path: ['endDate'] });

const educationSchema = z
  .object({
    institution: required('Institution', 100),
    degree: text(100),
    major: text(100),
    startDate: date,
    endDate: date,
  })
  .refine(endAfterStart, { error: 'End date must be after start date', path: ['endDate'] });

const certificationSchema = z.object({
  institution: required('Institution', 100),
  name: required('Certification', 150),
  date,
});

const updateProfileSchema = z.object({
  personal: z.object({
    // No email: the profile always shows the account email, so a sent one is ignored.
    fullName: required('Full name', 100),
    phoneNumber: text(30),
    location: text(100),
  }),
  links: z.object({
    linkedin: link('LinkedIn'),
    github: link('GitHub'),
    website: link('Website'),
  }),
  career: z.object({
    level: z.union([z.literal(''), z.enum(CAREER_LEVELS, { error: 'Invalid level' })]).default(''),
    yearsOfExperience: z.int().min(1).max(20),
  }),
  experience: z.array(experienceSchema).max(30),
  education: z.array(educationSchema).max(20),
  certifications: z.array(certificationSchema).max(50),
});

export const profileRouter = Router();

profileRouter.use(requireAuth);

async function findUser(userId: string | undefined) {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return user;
}

/** The user's resume profile. Before the first save, it is prefilled from their account. */
profileRouter.get('/', async (req, res) => {
  const [user, profile] = await Promise.all([
    findUser(req.userId),
    ProfileModel.findOne({ userId: req.userId }),
  ]);

  if (profile) {
    res.json({ profile: toPublicProfile(profile, user.email) });
    return;
  }

  res.json({
    profile: {
      personal: {
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phoneNumber: '',
        location: '',
      },
      links: { linkedin: '', github: '', website: '' },
      career: { level: '', yearsOfExperience: 1 },
      experience: [],
      education: [],
      certifications: [],
      updatedAt: null,
    },
  });
});

/** Replaces the whole profile. */
profileRouter.put('/', async (req, res) => {
  const data = updateProfileSchema.parse(req.body);

  const user = await findUser(req.userId);

  const profile = await ProfileModel.findOneAndUpdate(
    { userId: req.userId },
    { $set: data },
    { upsert: true, returnDocument: 'after', runValidators: true }
  );

  if (!profile) {
    throw new HttpError(500, 'Failed to save profile');
  }

  res.json({ profile: toPublicProfile(profile, user.email) });
});
