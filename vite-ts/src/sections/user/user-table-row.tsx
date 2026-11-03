import type { LabelColor } from 'src/components/label';
import type { IUserStatus, IUserListItem } from 'src/types/user';

import { useState } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { fDate } from 'src/utils/format-time';

import { updateUserStatus } from 'src/actions/user';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type UserAction = {
  label: string;
  icon: React.ComponentProps<typeof Iconify>['icon'];
  color?: string;
  isActive: IUserListItem['isActive'];
  successMessage: string;
};

const STATUS_COLORS: Record<IUserStatus, LabelColor> = {
  active: 'success',
  pending: 'warning',
  rejected: 'error',
  deactivated: 'default',
};

/** Menu items per status. Statuses without an entry (rejected) get no menu. */
const STATUS_ACTIONS: Partial<Record<IUserStatus, UserAction[]>> = {
  active: [
    {
      label: 'Deactivate',
      icon: 'solar:forbidden-circle-bold',
      color: 'error.main',
      isActive: 2,
      successMessage: 'User deactivated',
    },
  ],
  pending: [
    {
      label: 'Approve',
      icon: 'solar:check-circle-bold',
      color: 'success.main',
      isActive: 1,
      successMessage: 'User approved',
    },
    {
      label: 'Reject',
      icon: 'solar:close-circle-bold',
      color: 'error.main',
      isActive: -1,
      successMessage: 'User rejected',
    },
  ],
  deactivated: [
    {
      label: 'Activate',
      icon: 'solar:check-circle-bold',
      color: 'success.main',
      isActive: 1,
      successMessage: 'User activated',
    },
  ],
};

// ----------------------------------------------------------------------

type Props = {
  row: IUserListItem & { status: IUserStatus };
};

export function UserTableRow({ row }: Props) {
  const menuActions = usePopover();

  const [submitting, setSubmitting] = useState(false);

  const actions = row.role === 'admin' ? undefined : STATUS_ACTIONS[row.status];

  const handleAction = async (action: UserAction) => {
    menuActions.onClose();
    setSubmitting(true);

    try {
      await updateUserStatus(row.id, action.isActive);
      toast.success(action.successMessage);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong!');
    } finally {
      setSubmitting(false);
    }
  };

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        {actions?.map((action) => (
          <MenuItem
            key={action.label}
            onClick={() => handleAction(action)}
            sx={{ color: action.color }}
          >
            <Iconify icon={action.icon} />
            {action.label}
          </MenuItem>
        ))}
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <TableRow hover tabIndex={-1}>
        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar alt={row.displayName}>{row.firstName.charAt(0).toUpperCase()}</Avatar>

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              {row.displayName}
              <Box component="span" sx={{ color: 'text.disabled' }}>
                {row.email}
              </Box>
            </Stack>
          </Box>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{row.role}</TableCell>

        <TableCell>
          <Label variant="soft" color={STATUS_COLORS[row.status]}>
            {row.status}
          </Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{fDate(row.createdAt)}</TableCell>

        <TableCell align="right" sx={{ px: 1 }}>
          {actions && (
            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              disabled={submitting}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>

      {actions && renderMenuActions()}
    </>
  );
}
