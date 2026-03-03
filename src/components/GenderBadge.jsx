import React from 'react';
import { getGenderSymbol } from '../services/avatarService';

/**
 * GenderBadge Component
 * Displays gender symbol next to user name
 * Usage: <GenderBadge gender="male" /> or <GenderBadge gender="female" />
 */
const GenderBadge = ({ gender, size = 'sm', className = '' }) => {
  const symbol = getGenderSymbol(gender);
  
  if (!symbol) return null;

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <span className={`${sizeClasses[size] || sizeClasses.sm} ${className}`}>
      {symbol}
    </span>
  );
};

export default GenderBadge;
