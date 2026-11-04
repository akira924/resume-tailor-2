import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

// Dates are stored as the ISO strings the frontend date pickers produce.
// `endDate: null` means the job or study is ongoing ("Present").

export const CAREER_LEVELS = [
  'Junior',
  'Mid',
  'Mid-Senior',
  'Senior',
  'Senior/Staff',
  'Staff',
  'Lead',
  'Principal',
] as const;

const experienceSchema = new Schema(
  {
    company: { type: String, required: true, trim: true },
    title: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    bulletCount: { type: Number, required: true, min: 1, max: 10, default: 3 },
  },
  { _id: false }
);

const educationSchema = new Schema(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, default: '', trim: true },
    major: { type: String, default: '', trim: true },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
  },
  { _id: false }
);

const certificationSchema = new Schema(
  {
    institution: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    date: { type: String, default: null },
  },
  { _id: false }
);

const profileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    personal: {
      fullName: { type: String, default: '', trim: true },
      phoneNumber: { type: String, default: '', trim: true },
      location: { type: String, default: '', trim: true },
    },
    links: {
      linkedin: { type: String, default: '', trim: true },
      github: { type: String, default: '', trim: true },
      website: { type: String, default: '', trim: true },
    },
    // Overall seniority, shown above the job list. `level: ''` means not set.
    career: {
      level: { type: String, enum: ['', ...CAREER_LEVELS], default: '' },
      yearsOfExperience: { type: Number, min: 1, max: 20, default: 1 },
    },
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
  },
  { timestamps: true }
);

export type Profile = InferSchemaType<typeof profileSchema>;
export type ProfileDocument = HydratedDocument<Profile>;

export const ProfileModel = model('Profile', profileSchema);

/**
 * Shape returned to the frontend. The email isn't stored on the profile:
 * it is always the account email, so it can't drift from the address the user signs in with.
 */
export function toPublicProfile(profile: ProfileDocument, email: string) {
  const { personal, links, career, experience, education, certifications } = profile.toObject();

  return {
    personal: { ...personal, email },
    links,
    career,
    experience,
    education,
    certifications,
    updatedAt: profile.updatedAt,
  };
}
