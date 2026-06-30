import {
  Table as MuiTable, TableHead, TableBody, TableRow,
  TableCell, Box,
} from '@mui/material';

export function Table({ children, className = '', stickyHeader = false }) {
  return (
    <Box className={className} sx={{ width: '100%', overflowX: 'auto' }}>
      <MuiTable
        stickyHeader={stickyHeader}
        sx={{ minWidth: 500, tableLayout: 'auto' }}
      >
        {children}
      </MuiTable>
    </Box>
  );
}

export function Th({
  children,
  className = '',
  sortable = false,
  onClick,
  align = 'left',
  sx = {},
}) {
  return (
    <TableCell
      className={className}
      align={align}
      onClick={sortable ? onClick : undefined}
      sx={{
        cursor: sortable ? 'pointer' : 'default',
        userSelect: sortable ? 'none' : undefined,
        whiteSpace: 'nowrap',
        transition: 'color 0.1s ease',
        '&:hover': sortable ? { color: 'text.primary' } : {},
        ...sx,
      }}
    >
      {children}
    </TableCell>
  );
}

export function Td({
  children,
  className = '',
  align = 'left',
  sx = {},
}) {
  return (
    <TableCell className={className} align={align} sx={sx}>
      {children}
    </TableCell>
  );
}

export function Tr({ children, className = '', onClick, sx = {} }) {
  return (
    <TableRow
      className={className}
      onClick={onClick}
      hover
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        '&:last-child td': { border: 0 },
        ...sx,
      }}
    >
      {children}
    </TableRow>
  );
}

export { TableHead as Thead, TableBody as Tbody, TableRow as TRow };
