import type { ProfileSchemaType } from './profile-schema';

import { useFieldArray, useFormContext } from 'react-hook-form';

import { Field } from 'src/components/hook-form';

import { newEducation } from './profile-schema';
import { MONTH_PICKER_PROPS } from './profile-constants';
import { ProfileListCard, ProfileListItem } from './profile-list-card';

// ----------------------------------------------------------------------

export function ProfileEducation() {
  const { control } = useFormContext<ProfileSchemaType>();

  const { fields, append, remove } = useFieldArray({ control, name: 'education' });

  return (
    <ProfileListCard
      title="Education"
      subheader="Most recent first"
      addLabel="Add education"
      emptyText="No education yet."
      count={fields.length}
      onAdd={() => append(newEducation)}
    >
      {fields.map((field, index) => (
        <ProfileListItem
          key={field.id}
          label={`Education ${index + 1}`}
          onRemove={() => remove(index)}
        >
          <Field.Text
            name={`education.${index}.institution`}
            label="Institution"
            sx={{ gridColumn: { md: 'span 2' } }}
          />
          <Field.Text
            name={`education.${index}.degree`}
            label="Degree"
            placeholder="e.g. Bachelor of Science"
          />
          <Field.Text
            name={`education.${index}.major`}
            label="Major"
            placeholder="e.g. Computer Science"
          />
          <Field.DatePicker
            name={`education.${index}.startDate`}
            label="Start date"
            {...MONTH_PICKER_PROPS}
          />
          <Field.DatePicker
            name={`education.${index}.endDate`}
            label="End date"
            {...MONTH_PICKER_PROPS}
            slotProps={{
              ...MONTH_PICKER_PROPS.slotProps,
              textField: { helperText: 'Leave empty if you are still studying' },
            }}
          />
        </ProfileListItem>
      ))}
    </ProfileListCard>
  );
}
