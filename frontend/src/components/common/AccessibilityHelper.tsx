/**
 * AccessibilityHelper Component
 * Provides accessibility enhancements and ARIA support
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Button, Tooltip, Space } from 'antd';
import { 
  EyeOutlined, 
  SoundOutlined, 
  FontSizeOutlined,
  HighlightOutlined,
  KeyOutlined
} from '@ant-design/icons';

/**
 * Accessibility options
 */
export interface AccessibilityOptions {
  /** Enable high contrast mode */
  highContrast?: boolean;
  /** Font size multiplier */
  fontSize?: number;
  /** Enable focus indicators */
  focusIndicators?: boolean;
  /** Enable screen reader announcements */
  screenReader?: boolean;
  /** Enable keyboard navigation hints */
  keyboardHints?: boolean;
}

/**
 * ARIA live region types
 */
export type AriaLiveType = 'polite' | 'assertive' | 'off';

/**
 * Screen reader announcement hook
 */
export const useScreenReader = () => {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: AriaLiveType = 'polite') => {
    if (!liveRegionRef.current) return;

    // Clear previous message
    liveRegionRef.current.textContent = '';
    
    // Set new message after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.setAttribute('aria-live', priority);
        liveRegionRef.current.textContent = message;
      }
    }, 100);
  }, []);

  const LiveRegion = useCallback(() => (
    <div
      ref={liveRegionRef}
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    />
  ), []);

  return { announce, LiveRegion };
};

/**
 * Focus management hook
 */
export const useFocusManagement = () => {
  const focusRef = useRef<HTMLElement>(null);

  const focusElement = useCallback((element?: HTMLElement | null) => {
    const target = element || focusRef.current;
    if (target) {
      target.focus();
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return { focusRef, focusElement, trapFocus };
};

/**
 * Keyboard navigation hook
 */
export const useKeyboardNavigation = (
  items: HTMLElement[],
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
  } = {}
) => {
  const { loop = true, orientation = 'vertical' } = options;
  const currentIndexRef = useRef(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isVertical = orientation === 'vertical';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    if (e.key === nextKey) {
      e.preventDefault();
      currentIndexRef.current = loop 
        ? (currentIndexRef.current + 1) % items.length
        : Math.min(currentIndexRef.current + 1, items.length - 1);
      items[currentIndexRef.current]?.focus();
    } else if (e.key === prevKey) {
      e.preventDefault();
      currentIndexRef.current = loop
        ? (currentIndexRef.current - 1 + items.length) % items.length
        : Math.max(currentIndexRef.current - 1, 0);
      items[currentIndexRef.current]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      currentIndexRef.current = 0;
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      currentIndexRef.current = items.length - 1;
      items[items.length - 1]?.focus();
    }
  }, [items, loop, orientation]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { currentIndex: currentIndexRef.current };
};

/**
 * Accessibility context
 */
const AccessibilityContext = React.createContext<{
  options: AccessibilityOptions;
  updateOptions: (options: Partial<AccessibilityOptions>) => void;
}>({
  options: {},
  updateOptions: () => {},
});

/**
 * Accessibility provider
 */
export const AccessibilityProvider: React.FC<{
  children: React.ReactNode;
  initialOptions?: AccessibilityOptions;
}> = ({ children, initialOptions = {} }) => {
  const [options, setOptions] = React.useState<AccessibilityOptions>(initialOptions);

  const updateOptions = useCallback((newOptions: Partial<AccessibilityOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  // Apply accessibility styles
  useEffect(() => {
    const root = document.documentElement;
    
    if (options.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (options.fontSize && options.fontSize !== 1) {
      root.style.fontSize = `${options.fontSize * 100}%`;
    } else {
      root.style.fontSize = '';
    }

    if (options.focusIndicators) {
      root.classList.add('focus-indicators');
    } else {
      root.classList.remove('focus-indicators');
    }
  }, [options]);

  return (
    <AccessibilityContext.Provider value={{ options, updateOptions }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * Use accessibility context
 */
export const useAccessibility = () => {
  return React.useContext(AccessibilityContext);
};

/**
 * Accessibility toolbar component
 */
export const AccessibilityToolbar: React.FC<{
  position?: 'top' | 'bottom' | 'left' | 'right';
  visible?: boolean;
}> = ({ position = 'top', visible = true }) => {
  const { options, updateOptions } = useAccessibility();

  if (!visible) return null;

  const toolbarStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
    backgroundColor: '#fff',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    padding: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    ...(position === 'top' && { top: '10px', right: '10px' }),
    ...(position === 'bottom' && { bottom: '10px', right: '10px' }),
    ...(position === 'left' && { top: '50%', left: '10px', transform: 'translateY(-50%)' }),
    ...(position === 'right' && { top: '50%', right: '10px', transform: 'translateY(-50%)' }),
  };

  return (
    <div style={toolbarStyle} role="toolbar" aria-label="Accessibility Tools">
      <Space size="small">
        <Tooltip title="高对比度模式">
          <Button
            type={options.highContrast ? 'primary' : 'default'}
            size="small"
            icon={<HighlightOutlined />}
            onClick={() => updateOptions({ highContrast: !options.highContrast })}
            aria-label="切换高对比度模式"
          />
        </Tooltip>

        <Tooltip title="增大字体">
          <Button
            size="small"
            icon={<FontSizeOutlined />}
            onClick={() => updateOptions({ fontSize: (options.fontSize || 1) + 0.1 })}
            aria-label="增大字体大小"
          />
        </Tooltip>

        <Tooltip title="减小字体">
          <Button
            size="small"
            icon={<FontSizeOutlined />}
            onClick={() => updateOptions({ fontSize: Math.max((options.fontSize || 1) - 0.1, 0.8) })}
            aria-label="减小字体大小"
            style={{ transform: 'scaleY(-1)' }}
          />
        </Tooltip>

        <Tooltip title="焦点指示器">
          <Button
            type={options.focusIndicators ? 'primary' : 'default'}
            size="small"
            icon={<EyeOutlined />}
            onClick={() => updateOptions({ focusIndicators: !options.focusIndicators })}
            aria-label="切换焦点指示器"
          />
        </Tooltip>

        <Tooltip title="键盘导航提示">
          <Button
            type={options.keyboardHints ? 'primary' : 'default'}
            size="small"
            icon={<KeyOutlined />}
            onClick={() => updateOptions({ keyboardHints: !options.keyboardHints })}
            aria-label="切换键盘导航提示"
          />
        </Tooltip>
      </Space>
    </div>
  );
};

/**
 * Skip link component
 */
export const SkipLink: React.FC<{
  href: string;
  children: React.ReactNode;
}> = ({ href, children }) => (
  <a
    href={href}
    style={{
      position: 'absolute',
      left: '-10000px',
      top: 'auto',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      zIndex: 999999,
      padding: '8px 16px',
      backgroundColor: '#000',
      color: '#fff',
      textDecoration: 'none',
      borderRadius: '0 0 4px 4px',
    }}
    onFocus={(e) => {
      e.target.style.left = '6px';
      e.target.style.top = '6px';
      e.target.style.width = 'auto';
      e.target.style.height = 'auto';
      e.target.style.overflow = 'visible';
    }}
    onBlur={(e) => {
      e.target.style.left = '-10000px';
      e.target.style.top = 'auto';
      e.target.style.width = '1px';
      e.target.style.height = '1px';
      e.target.style.overflow = 'hidden';
    }}
  >
    {children}
  </a>
);

/**
 * ARIA label helper
 */
export const withAriaLabel = <P extends object>(
  Component: React.ComponentType<P>,
  getAriaLabel: (props: P) => string
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <Component
      {...props}
      ref={ref}
      aria-label={getAriaLabel(props)}
    />
  ));

  WrappedComponent.displayName = `withAriaLabel(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default AccessibilityProvider;