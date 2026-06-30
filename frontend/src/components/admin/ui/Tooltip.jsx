import { Tooltip as MuiTooltip } from '@mui/material';

export function Tooltip({ children, content, placement = 'top', className = '' }) {
  if (!content) return children;
  return (
    <MuiTooltip title={content} placement={placement} arrow>
      <span className={className} style={{ display: 'inline-flex' }}>
        {children}
      </span>
    </MuiTooltip>
  );
}
