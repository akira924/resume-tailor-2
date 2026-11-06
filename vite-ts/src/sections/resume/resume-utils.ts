import type { IResume } from 'src/types/resume';

// ----------------------------------------------------------------------

type ParseResult = { resume: IResume; error: null } | { resume: null; error: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown) => (typeof value === 'string' ? value : '');

const strList = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const objList = (value: unknown) => (Array.isArray(value) ? value.filter(isObject) : []);

/**
 * Parses editor text into a resume. Missing or wrongly-typed fields fall back to
 * empty values so a half-edited document never crashes the PDF renderer.
 */
export function parseResumeJson(text: string): ParseResult {
  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch (error) {
    return { resume: null, error: error instanceof Error ? error.message : 'Invalid JSON' };
  }

  if (!isObject(data)) {
    return { resume: null, error: 'Top-level value must be a JSON object' };
  }

  const personal = isObject(data.personal_info) ? data.personal_info : {};
  const online = isObject(data.online_presence) ? data.online_presence : {};

  const resume: IResume = {
    personal_info: {
      name: str(personal.name),
      email: str(personal.email),
      phone: str(personal.phone),
      location: str(personal.location),
    },
    headline: str(data.headline),
    online_presence: {
      linkedin: str(online.linkedin),
      github: str(online.github),
      website: str(online.website),
    },
    company_target: str(data.company_target),
    summary: str(data.summary),
    skillsets: objList(data.skillsets).map((set) => ({
      category: str(set.category),
      skills: strList(set.skills),
    })),
    experience: objList(data.experience).map((job) => ({
      company: str(job.company),
      location: str(job.location),
      title: str(job.title),
      period: str(job.period),
      role_description: str(job.role_description),
      sentences: strList(job.sentences),
      used_skills: strList(job.used_skills),
    })),
    education: objList(data.education).map((edu) => ({
      institution: str(edu.institution),
      degree: str(edu.degree),
      major: str(edu.major),
      period: str(edu.period),
    })),
    certification: objList(data.certification).map((cert) => ({
      name: str(cert.name),
      institution: str(cert.institution),
      date: str(cert.date),
    })),
  };

  return { resume, error: null };
}
