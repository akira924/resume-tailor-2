import type { IResume } from '../../../vite-ts/src/types/resume';
import type { ResumeSettings } from '../../../vite-ts/src/sections/resume/resume-settings';

import { pdf } from '@react-pdf/renderer';

import { ResumePdfDocument } from '../../../vite-ts/src/sections/resume/resume-pdf';

// ----------------------------------------------------------------------

export async function downloadResumePdf(resume: IResume, settings: ResumeSettings) {
  const blob = await pdf(<ResumePdfDocument resume={resume} settings={settings} />).toBlob();

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${resume.personal_info.name} - Resume.pdf`;
  link.click();

  // Chrome only starts reading the blob after this click has returned.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
