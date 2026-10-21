'use client';

import { useContext } from 'react';
import { HousekeepingContext } from '../../../context/HousekeepingContext';

export const useHousekeeping = () => {
  const context = useContext(HousekeepingContext);
  if (!context) {
    throw new Error('useHousekeeping must be used within a HousekeepingProvider');
  }
  return context;
};
