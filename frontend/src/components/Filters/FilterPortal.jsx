// frontend/src/components/Filters/FilterPortal.jsx
import { createPortal } from 'react-dom';

const portalRoot = document.body;

export const FilterPortal = ({ children }) => {
  return createPortal(children, portalRoot);
};