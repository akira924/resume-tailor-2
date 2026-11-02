import type { IUserStatus, IUserListItem } from 'src/types/user';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type Props = {
  row: IUserListItem & { status: IUserStatus };
};

export function UserTableRow({ row }: Props) {
  return (
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
        <Label variant="soft" color={row.status === 'active' ? 'success' : 'warning'}>
          {row.status}
        </Label>
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fDate(row.createdAt)}</TableCell>
    </TableRow>
  );
}
