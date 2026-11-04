import type { IProfile } from 'src/types/profile';

import * as z from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import { schemaUtils } from 'src/components/hook-form';

import { CAREER_LEVELS } from './profile-constants';

// ----------------------------------------------------------------------
// Mirrors the validation in server/src/routes/profile.ts.

const required = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} is required!` });

/** Empty, or a URL. A missing protocol is allowed: the server adds `https://`. */
const link = (label: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        !value ||
        z.url().safeParse(/^https?:\/\//i.test(value) ? value : `https://${value}`).success,
      {
        error: `${label} must be a valid URL!`,
      }
    );

const date = z.string().nullable();

function endAfterStart(item: { startDate: string | null; endDate: string | null }) {
  return !item.startDate || !item.endDate || new Date(item.endDate) >= new Date(item.startDate);
}

const endDateError = { error: 'End date must be after start date!', path: ['endDate'] };

export const ProfileSchema = z.object({
  personal: z.object({
    fullName: required('Full name'),
    email: schemaUtils.email(),
    phoneNumber: z
      .string()
      .refine((value) => !value || isValidPhoneNumber(value), { error: 'Invalid phone number!' }),
    location: z.string(),
  }),
  links: z.object({
    linkedin: link('LinkedIn'),
    github: link('GitHub'),
    website: link('Website'),
  }),
  career: z.object({
    level: z.union([z.literal(''), z.enum(CAREER_LEVELS)]),
    yearsOfExperience: z
      .number({ error: 'Years of experience is required!' })
      .int()
      .min(1, { error: 'Must be at least 1 year!' })
      .max(20, { error: 'Must be at most 20 years!' }),
  }),
  experience: z.array(
    z
      .object({
        company: required('Company'),
        title: z.string(),
        location: z.string(),
        startDate: date,
        endDate: date,
        bulletCount: z.number().int().min(1).max(10),
      })
      .refine(endAfterStart, endDateError)
  ),
  education: z.array(
    z
      .object({
        institution: required('Institution'),
        degree: z.string(),
        major: z.string(),
        startDate: date,
        endDate: date,
      })
      .refine(endAfterStart, endDateError)
  ),
  certifications: z.array(
    z.object({
      institution: required('Institution'),
      name: required('Certification'),
      date,
    })
  ),
});

export type ProfileSchemaType = z.infer<typeof ProfileSchema>;

// ----------------------------------------------------------------------

export const defaultValues: ProfileSchemaType = {
  personal: { fullName: '', email: '', phoneNumber: '', location: '' },
  links: { linkedin: '', github: '', website: '' },
  career: { level: '', yearsOfExperience: 1 },
  experience: [],
  education: [],
  certifications: [],
};

export const newExperience: ProfileSchemaType['experience'][number] = {
  company: '',
  title: '',
  location: '',
  startDate: null,
  endDate: null,
  bulletCount: 3,
};

export const newEducation: ProfileSchemaType['education'][number] = {
  institution: '',
  degree: '',
  major: '',
  startDate: null,
  endDate: null,
};

export const newCertification: ProfileSchemaType['certifications'][number] = {
  institution: '',
  name: '',
  date: null,
};

export function toFormValues({ updatedAt, career, ...profile }: IProfile): ProfileSchemaType {
  return {
    ...profile,
    career: { ...defaultValues.career, ...career } as ProfileSchemaType['career'],
  };
}
