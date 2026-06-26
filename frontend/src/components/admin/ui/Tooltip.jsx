import { useState } from 'react';

export function Tooltip({ children, content, placement = 'top', className = '' }) {
  const [visible, setVisible] = useState(false);

  const placementClasses = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          className={`absolute z-50 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-900 dark:bg-gray-700 text-white shadow-lg pointer-events-none ${placementClasses[placement] || placementClasses.top}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
