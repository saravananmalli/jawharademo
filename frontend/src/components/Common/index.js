// Shared UI component library — single import point.
// When moving to full MFE with Module Federation, expose THIS file
// as the remote entry so all apps import from one place:
//
//   import { Button, Rating, PriceDisplay } from 'jawhara-ui/components';
//
// For now, within this app use:
//   import { Button, Rating } from '../components/Common';

export { default as Button }         from './Button';
export { default as Badge }          from './Badge';
export { default as Rating }         from './Rating';
export { default as Input }          from './Input';
export { default as PriceDisplay }   from './PriceDisplay';
export { default as QuantityControl} from './QuantityControl';
export { default as EmptyState }     from './EmptyState';
export { default as PageLoader }     from './PageLoader';
