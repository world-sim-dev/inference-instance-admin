import React from 'react';
import { useResponsive } from '../../hooks';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  mobile?: React.ReactNode;
  tablet?: React.ReactNode;
  desktop?: React.ReactNode;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  mobile,
  tablet,
  desktop,
  className,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getContent = () => {
    if (isMobile && mobile) return mobile;
    if (isTablet && tablet) return tablet;
    if (isDesktop && desktop) return desktop;
    return children;
  };

  return (
    <div className={className}>
      {getContent()}
    </div>
  );
};

// Utility components for conditional rendering
export const MobileOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobile } = useResponsive();
  return isMobile ? <>{children}</> : null;
};

export const TabletOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isTablet } = useResponsive();
  return isTablet ? <>{children}</> : null;
};

export const DesktopOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDesktop } = useResponsive();
  return isDesktop ? <>{children}</> : null;
};

export const MobileAndTablet: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobile, isTablet } = useResponsive();
  return (isMobile || isTablet) ? <>{children}</> : null;
};