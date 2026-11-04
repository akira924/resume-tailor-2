// ----------------------------------------------------------------------

/** Shape of a generated (tailored) resume, as produced by the tailoring pipeline. */

export type IResumeSkillset = {
  category: string;
  skills: string[];
};

export type IResumeExperience = {
  company: string;
  location: string;
  title: string;
  period: string;
  role_description: string;
  sentences: string[];
  used_skills: string[];
};

export type IResumeEducation = {
  institution: string;
  degree: string;
  major: string;
  period: string;
};

export type IResumeCertification = {
  name: string;
  institution: string;
  date: string;
};

export type IResume = {
  personal_info: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  headline: string;
  online_presence: {
    linkedin: string;
    github: string;
    website: string;
  };
  company_target: string;
  summary: string;
  skillsets: IResumeSkillset[];
  experience: IResumeExperience[];
  education: IResumeEducation[];
  /** Key is spelled this way in the source JSON. */
  cetification: IResumeCertification[];
};
