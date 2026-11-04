import type { ProfileSchemaType } from './profile-schema';

import { useFieldArray, useFormContext } from 'react-hook-form';

import { Field } from 'src/components/hook-form';

import { newExperience } from './profile-schema';
import { MONTH_PICKER_PROPS } from './profile-constants';
import { ProfileListCard, ProfileListItem } from './profile-list-card';

// ----------------------------------------------------------------------

export function ProfileExperience() {
  const { control } = useFormContext<ProfileSchemaType>();

  const { fields, append, remove } = useFieldArray({ control, name: 'experience' });

  return (
    <ProfileListCard
      title="Work experience"
      subheader="Most recent first"
      addLabel="Add job"
      emptyText="No work experience yet."
      count={fields.length}
      onAdd={() => append(newExperience)}
    >
      {fields.map((field, index) => (
        <ProfileListItem key={field.id} label={`Job ${index + 1}`} onRemove={() => remove(index)}>
          <Field.Text name={`experience.${index}.company`} label="Company" />
          <Field.Text name={`experience.${index}.title`} label="Job title" />
          <Field.Text name={`experience.${index}.location`} label="Location" />
          <Field.NumberInput
            name={`experience.${index}.bulletCount`}
            min={1}
            max={10}
            captionText="Bullet points"
            helperText="How many bullet points to write for this job"
          />
          <Field.DatePicker
            name={`experience.${index}.startDate`}
            label="Start date"
            {...MONTH_PICKER_PROPS}
          />
          <Field.DatePicker
            name={`experience.${index}.endDate`}
            label="End date"
            {...MONTH_PICKER_PROPS}
            slotProps={{
              ...MONTH_PICKER_PROPS.slotProps,
              textField: { helperText: 'Leave empty if you still work here' },
            }}
          />
        </ProfileListItem>
      ))}
    </ProfileListCard>
  );
}
