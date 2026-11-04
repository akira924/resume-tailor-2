// ----------------------------------------------------------------------

/** Dates are ISO strings. `endDate: null` means ongoing ("Present"). */

export type IProfileExperience = {
  company: string;
  title: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  /** How many bullet points the resume should have for this job. */
  bulletCount: number;
};

export type IProfileEducation = {
  institution: string;
  degree: string;
  major: string;
  startDate: string | null;
  endDate: string | null;
};

export type IProfileCertification = {
  institution: string;
  name: string;
  date: string | null;
};

/** The signed-in user's resume profile, as returned by GET /api/profile. */
export type IProfile = {
  personal: {
    fullName: string;
    email: string;
    phoneNumber: string;
    location: string;
  };
  links: {
    linkedin: string;
    github: string;
    website: string;
  };
  experience: IProfileExperience[];
  education: IProfileEducation[];
  certifications: IProfileCertification[];
  /** null until the profile is saved for the first time. */
  updatedAt: string | null;
};
