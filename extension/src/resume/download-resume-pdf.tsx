import type { IResume } from '../../../vite-ts/src/types/resume';
import type { ResumeSettings } from '../../../vite-ts/src/sections/resume/resume-settings';

import { pdf } from '@react-pdf/renderer';

import { saveToFolder, toSafeFileName } from './download-folder';
import { ResumePdfDocument } from '../../../vite-ts/src/sections/resume/resume-pdf';

// ----------------------------------------------------------------------

/**
 * Saves into a folder named after the target company, inside `folder` or else Chrome's download
 * folder. Returns the path inside `folder`, if given: Chrome shows no download notice for those.
 */
export async function downloadResumePdf(
  resume: IResume,
  settings: ResumeSettings,
  folder: FileSystemDirectoryHandle | null
) {
  const blob = await pdf(<ResumePdfDocument resume={resume} settings={settings} />).toBlob();

  // Added after making the name safe, as that shortens long names and would cut off ".pdf".
  const personName = toSafeFileName(resume.personal_info.name).replace(/\s+/g, '_');
  const fileName = `${personName || 'Candidate'}_resume.pdf`;
  const companyFolder = toSafeFileName(resume.company_target);

  if (folder) return saveToFolder(folder, companyFolder, blob, fileName);

  const url = URL.createObjectURL(blob);

  // Not a download link: those can't save into a subfolder.
  await chrome.downloads.download({
    url,
    filename: companyFolder ? `${companyFolder}/${fileName}` : fileName,
    conflictAction: 'uniquify',
  });

  // Chrome may still be reading the blob when the call above returns.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);

  return null;
}
