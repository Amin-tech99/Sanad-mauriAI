import React from 'react';
import { useIsMobile } from '../hooks/use-mobile';
import Workspace from './workspace';
import { MobileWorkspace } from './mobile-workspace';

export function ResponsiveWorkspace() {
  const isMobile = useIsMobile();

  // Show mobile version for screens smaller than 768px
  if (isMobile) {
    return <MobileWorkspace />;
  }

  // Show desktop version for larger screens
  return <Workspace />;
}