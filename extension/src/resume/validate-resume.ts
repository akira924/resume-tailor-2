import type { IResume } from '../../../vite-ts/src/types/resume';

import * as z from 'zod';

import { parseResumeJson } from '../../../vite-ts/src/sections/resume/resume-utils';

// ----------------------------------------------------------------------

const text = z.string().nullish();
const textList = z.array(z.string()).nullish();

// parseResumeJson turns anything into a resume, leaving out whatever it doesn't recognize. Here the
// JSON is pasted in from elsewhere, so check it's a resume first, rather than download a blank PDF.
// Only what makes it a resume is required: the renderer copes with the rest being left out.
const ResumeSchema = z.object({
  personal_info: z.object({ name: z.string().trim().min(1) }),
  experience: z.array(
    z.object({
      company: text,
      title: text,
      location: text,
      period: text,
      role_description: text,
      sentences: textList,
      used_skills: textList,
    })
  ),
  headline: text,
  summary: text,
  company_target: text,
  online_presence: z.object({ linkedin: text, github: text, website: text }).nullish(),
  skillsets: z.array(z.object({ category: text, skills: textList })).nullish(),
  education: z
    .array(z.object({ institution: text, degree: text, major: text, period: text }))
    .nullish(),
  certification: z.array(z.object({ name: text, institution: text, date: text })).nullish(),
});

type ValidationResult = { resume: IResume; error: null } | { resume: null; error: string };

export function validateResumeJson(json: string): ValidationResult {
  let data: unknown;

  try {
    data = JSON.parse(json);
  } catch {
    return { resume: null, error: 'Invalid JSON' };
  }

  const result = ResumeSchema.safeParse(data);

  if (!result.success) {
    const path = result.error.issues[0]?.path.join('.');

    return { resume: null, error: path ? `Invalid resume JSON: check ${path}` : 'Invalid resume JSON' };
  }

  return parseResumeJson(json);
}
