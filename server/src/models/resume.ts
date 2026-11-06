import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const resumeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // Free-form on purpose: `data` is whatever JSON object the user typed in the editor, and the
    // frontend already falls back to defaults for missing or stale fields in both.
    data: { type: Schema.Types.Mixed, required: true },
    settings: { type: Schema.Types.Mixed, required: true },
  },
  // `minimize: false` keeps empty objects, which would otherwise be dropped and fail `required`.
  { timestamps: true, minimize: false }
);

export type Resume = InferSchemaType<typeof resumeSchema>;
export type ResumeDocument = HydratedDocument<Resume>;

export const ResumeModel = model('Resume', resumeSchema);

/** Shape returned to the frontend. */
export function toPublicResume(resume: ResumeDocument) {
  const { data, settings, updatedAt } = resume;

  return { data, settings, updatedAt };
}
