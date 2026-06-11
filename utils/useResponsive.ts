import { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';

export interface ResponsiveInfo {
  /** True when running in a browser on a narrow screen (< 768px) */
  isMobileWeb: boolean;
  /** True when running in a browser on a wide screen (>= 768px) */
  isDesktopWeb: boolean;
  /** True when running in a native mobile app (iOS/Android) */
  isNativeMobile: boolean;
  /** True for any mobile experience: native mobile OR mobile-width web */
  isMobile: boolean;
  /** Current window width */
  width: number;
  /** Current window height */
  height: number;
}

const MOBILE_BREAKPOINT = 768;

function getResponsiveInfo(width: number, height: number): ResponsiveInfo {
  const isWeb = Platform.OS === 'web';
  const isMobileWeb = isWeb && width < MOBILE_BREAKPOINT;
  const isDesktopWeb = isWeb && width >= MOBILE_BREAKPOINT;
  const isNativeMobile = !isWeb;
  const isMobile = isMobileWeb || isNativeMobile;

  return {
    isMobileWeb,
    isDesktopWeb,
    isNativeMobile,
    isMobile,
    width,
    height,
  };
}

/**
 * Hook that provides responsive layout information.
 * Automatically updates when the window is resized (web) or dimensions change (native).
 */
export function useResponsive(): ResponsiveInfo {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  return getResponsiveInfo(dimensions.width, dimensions.height);
}

/**
 * Non-hook utility for one-off checks outside React components.
 */
export function getResponsive(): ResponsiveInfo {
  const { width, height } = Dimensions.get('window');
  return getResponsiveInfo(width, height);
}
