import { Box, Pagination as MuiPagination, Typography } from '@mui/material';

export function Pagination({ page, totalPages, onPage, totalItems, perPage, className = '' }) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, totalItems);

  return (
    <Box
      className={className}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}
    >
      <Typography variant="body2" color="text.secondary">
        Showing{' '}
        <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{from}–{to}</Box>
        {' '}of{' '}
        <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{totalItems}</Box>
        {' '}results
      </Typography>
      <MuiPagination
        count={totalPages}
        page={page}
        onChange={(_, p) => onPage(p)}
        shape="rounded"
        size="small"
        color="primary"
      />
    </Box>
  );
}
