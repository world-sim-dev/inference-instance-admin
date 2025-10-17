/**
 * useResponsive Hook
 * Provides responsive breakpoint information
 */

import { useState, useEffect } from 'react';

export interface ResponsiveInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1200,
};

export const useResponsive = (): ResponsiveInfo => {
  const [screenWidth, setScreenWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1200; // Default for SSR
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenWidth < BREAKPOINTS.mobile;
  const isTablet = screenWidth >= BREAKPOINTS.mobile && screenWidth < BREAKPOINTS.tablet;
  const isDesktop = screenWidth >= BREAKPOINTS.tablet;

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
  };
};

/**
 * Get responsive value based on current screen size
 */
export const getResponsiveValue = <T>(
  values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
  },
  fallback: T
): T => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  if (isMobile && values.mobile !== undefined) {
    return values.mobile;
  }
  
  if (isTablet && values.tablet !== undefined) {
    return values.tablet;
  }
  
  if (isDesktop && values.desktop !== undefined) {
    return values.desktop;
  }
  
  return fallback;
};

export default useResponsive;