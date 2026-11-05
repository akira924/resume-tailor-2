import type { IProfile } from 'src/types/profile';

import { parsePhoneNumber } from 'react-phone-number-input/input';

import { fDate } from 'src/utils/format-time';

import {
  PROMPT_INTRO,
  PROMPT_RULES,
  CANDIDATE_HEADING,
  JOB_DESCRIPTION_HEADING,
} from './ai-prompt-template';

// ----------------------------------------------------------------------

const JOB_DESCRIPTION_PLACEHOLDER = '';

/** The profile stores "+13233648638"; this returns "+1 323 364 8638". */
function formatPhone(phoneNumber: string) {
  return parsePhoneNumber(phoneNumber)?.formatInternational() ?? phoneNumber;
}

/** A missing end date means ongoing, so it reads "Present". */
function formatPeriod(startDate: string | null, endDate: string | null, template: string) {
  const start = fDate(startDate, template);
  const end = fDate(endDate, template);

  if (!start) return end;

  return `${start} - ${end || 'Present'}`;
}

function toLine(parts: (string | null)[]) {
  return `- ${parts.filter(Boolean).join(', ')}`;
}

function buildCareerLine({ level, yearsOfExperience: years }: IProfile['career']) {
  const experience = `over ${years} ${years === 1 ? 'year' : 'years'} of experience`;

  return level
    ? `${level} level with ${experience}`
    : `${experience[0].toUpperCase()}${experience.slice(1)}`;
}

function buildCandidate({ personal, career, experience, education, certifications }: IProfile) {
  const blocks = [
    [
      `Full Name: ${personal.fullName}`,
      `Email Address: ${personal.email}`,
      `Phone Number: ${formatPhone(personal.phoneNumber)}`,
      `Location: ${personal.location}`,
    ].join('\n'),
  ];

  // Empty lists are left out so the AI isn't invited to invent entries.
  if (experience.length) {
    const lines = experience.map((job) =>
      toLine([
        job.company,
        job.location,
        formatPeriod(job.startDate, job.endDate, 'MM/YYYY'),
        `${job.bulletCount} ${job.bulletCount === 1 ? 'Bullet Point' : 'Bullet Points'}`,
      ])
    );
    blocks.push(['Work Experience:', ...lines].join('\n'));
  }

  blocks.push(buildCareerLine(career));

  if (education.length) {
    const lines = education.map((edu) =>
      toLine([
        edu.institution,
        edu.degree,
        edu.major,
        formatPeriod(edu.startDate, edu.endDate, 'YYYY'),
      ])
    );
    blocks.push(['Education:', ...lines].join('\n'));
  }

  if (certifications.length) {
    const lines = certifications.map((cert) =>
      toLine([cert.name, cert.institution, fDate(cert.date, 'YYYY')])
    );
    blocks.push(['Certifications', ...lines].join('\n'));
  }

  return blocks.join('\n\n');
}

/** Builds the full prompt to paste into an AI tool. */
export function buildAiPrompt(profile: IProfile) {
  return [
    PROMPT_INTRO,
    `${CANDIDATE_HEADING}\n${buildCandidate(profile)}`,
    PROMPT_RULES,
    `${JOB_DESCRIPTION_HEADING}\n${JOB_DESCRIPTION_PLACEHOLDER}`,
  ].join('\n\n');
}
