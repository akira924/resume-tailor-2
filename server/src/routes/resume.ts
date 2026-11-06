import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../lib/http-error.js';
import { requireAuth } from '../middleware/require-auth.js';
import { ResumeModel, toPublicResume } from '../models/resume.js';

const jsonObject = (label: string) =>
  z.record(z.string(), z.unknown(), { error: `${label} must be a JSON object` });

const updateResumeSchema = z.object({
  data: jsonObject('Resume data'),
  settings: jsonObject('Resume settings'),
});

export const resumeRouter = Router();

resumeRouter.use(requireAuth);

/** The user's saved resume, or null before the first save. */
resumeRouter.get('/', async (req, res) => {
  const resume = await ResumeModel.findOne({ userId: req.userId });

  res.json({ resume: resume && toPublicResume(resume) });
});

/** Replaces the whole resume. */
resumeRouter.put('/', async (req, res) => {
  const data = updateResumeSchema.parse(req.body);

  const resume = await ResumeModel.findOneAndUpdate(
    { userId: req.userId },
    { $set: data },
    { upsert: true, returnDocument: 'after', runValidators: true }
  );

  if (!resume) {
    throw new HttpError(500, 'Failed to save resume');
  }

  res.json({ resume: toPublicResume(resume) });
});
