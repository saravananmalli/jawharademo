import { CircularProgress } from '@mui/material';

export function Spinner({ size = 20, className = '' }) {
  return <CircularProgress size={size} className={className} color="primary" />;
}
