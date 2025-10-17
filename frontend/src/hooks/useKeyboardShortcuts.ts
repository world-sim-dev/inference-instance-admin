/**
 * useKeyboardShortcuts Hook
 * Provides keyboard shortcut functionality for better user experience
 */

import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  /** Key combination (e.g., 'ctrl+s', 'alt+n', 'escape') */
  key: string;
  /** Callback function to execute */
  callback: (event: KeyboardEvent) => void;
  /** Description for help display */
  description?: string;
  /** Whether to prevent default behavior */
  preventDefault?: boolean;
  /** Whether to stop event propagation */
  stopPropagation?: boolean;
  /** Whether shortcut is enabled */
  enabled?: boolean;
  /** Target element (defaults to document) */
  target?: HTMLElement | Document;
}

/**
 * Shortcut key parser
 */
const parseShortcut = (shortcut: string): {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  key: string;
} => {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  
  return {
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd'),
    key: key === 'space' ? ' ' : key,
  };
};

/**
 * Check if event matches shortcut
 */
const matchesShortcut = (event: KeyboardEvent, shortcut: string): boolean => {
  const parsed = parseShortcut(shortcut);
  
  return (
    event.ctrlKey === parsed.ctrl &&
    event.altKey === parsed.alt &&
    event.shiftKey === parsed.shift &&
    event.metaKey === parsed.meta &&
    event.key.toLowerCase() === parsed.key
  );
};

/**
 * useKeyboardShortcuts Hook
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const shortcutsRef = useRef<KeyboardShortcut[]>([]);

  // Update shortcuts ref
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Handle keydown events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const activeShortcuts = shortcutsRef.current.filter(s => s.enabled !== false);
    
    for (const shortcut of activeShortcuts) {
      if (matchesShortcut(event, shortcut.key)) {
        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }
        
        shortcut.callback(event);
        break; // Only execute first matching shortcut
      }
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const targets = new Set<HTMLElement | Document>();
    
    // Collect all unique targets
    shortcuts.forEach(shortcut => {
      const target = shortcut.target || document;
      targets.add(target);
    });

    // Add event listeners to all targets
    targets.forEach(target => {
      target.addEventListener('keydown', handleKeyDown as EventListener);
    });

    // Cleanup
    return () => {
      targets.forEach(target => {
        target.removeEventListener('keydown', handleKeyDown as EventListener);
      });
    };
  }, [handleKeyDown, shortcuts]);

  return {
    shortcuts: shortcuts.filter(s => s.enabled !== false),
  };
};

/**
 * Common keyboard shortcuts
 */
export const createCommonShortcuts = (actions: {
  onSave?: () => void;
  onCreate?: () => void;
  onRefresh?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onHelp?: () => void;
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onSave) {
    shortcuts.push({
      key: 'ctrl+s',
      callback: (e) => {
        e.preventDefault();
        actions.onSave!();
      },
      description: '保存',
      preventDefault: true,
    });
  }

  if (actions.onCreate) {
    shortcuts.push({
      key: 'ctrl+n',
      callback: (e) => {
        e.preventDefault();
        actions.onCreate!();
      },
      description: '新建',
      preventDefault: true,
    });
  }

  if (actions.onRefresh) {
    shortcuts.push({
      key: 'f5',
      callback: (e) => {
        e.preventDefault();
        actions.onRefresh!();
      },
      description: '刷新',
      preventDefault: true,
    });
    
    shortcuts.push({
      key: 'ctrl+r',
      callback: (e) => {
        e.preventDefault();
        actions.onRefresh!();
      },
      description: '刷新',
      preventDefault: true,
    });
  }

  if (actions.onSearch) {
    shortcuts.push({
      key: 'ctrl+f',
      callback: (e) => {
        e.preventDefault();
        actions.onSearch!();
      },
      description: '搜索',
      preventDefault: true,
    });
  }

  if (actions.onEscape) {
    shortcuts.push({
      key: 'escape',
      callback: actions.onEscape,
      description: '取消/关闭',
    });
  }

  if (actions.onDelete) {
    shortcuts.push({
      key: 'delete',
      callback: actions.onDelete,
      description: '删除',
    });
  }

  if (actions.onEdit) {
    shortcuts.push({
      key: 'f2',
      callback: actions.onEdit,
      description: '编辑',
    });
  }

  if (actions.onHelp) {
    shortcuts.push({
      key: 'f1',
      callback: (e) => {
        e.preventDefault();
        actions.onHelp!();
      },
      description: '帮助',
      preventDefault: true,
    });
  }

  return shortcuts;
};

/**
 * useGlobalShortcuts Hook
 * For application-wide shortcuts
 */
export const useGlobalShortcuts = (actions: {
  onSave?: () => void;
  onCreate?: () => void;
  onRefresh?: () => void;
  onSearch?: () => void;
  onHelp?: () => void;
}) => {
  const shortcuts = createCommonShortcuts(actions);
  
  return useKeyboardShortcuts(shortcuts);
};

/**
 * useModalShortcuts Hook
 * For modal-specific shortcuts
 */
export const useModalShortcuts = (actions: {
  onSave?: () => void;
  onCancel?: () => void;
  onEscape?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onSave) {
    shortcuts.push({
      key: 'ctrl+enter',
      callback: (e) => {
        e.preventDefault();
        actions.onSave!();
      },
      description: '保存并关闭',
      preventDefault: true,
    });
  }

  if (actions.onCancel || actions.onEscape) {
    shortcuts.push({
      key: 'escape',
      callback: actions.onCancel || actions.onEscape!,
      description: '取消',
    });
  }

  return useKeyboardShortcuts(shortcuts);
};

/**
 * useTableShortcuts Hook
 * For table-specific shortcuts
 */
export const useTableShortcuts = (actions: {
  onRefresh?: () => void;
  onCreate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
}) => {
  const shortcuts = createCommonShortcuts(actions);
  
  return useKeyboardShortcuts(shortcuts);
};

/**
 * Keyboard shortcut display component props
 */
export interface ShortcutDisplayProps {
  shortcuts: KeyboardShortcut[];
  title?: string;
}

/**
 * Format shortcut key for display
 */
export const formatShortcutKey = (key: string): string => {
  return key
    .split('+')
    .map(part => {
      switch (part.toLowerCase()) {
        case 'ctrl':
        case 'control':
          return 'Ctrl';
        case 'alt':
          return 'Alt';
        case 'shift':
          return 'Shift';
        case 'meta':
        case 'cmd':
          return '⌘';
        case 'escape':
          return 'Esc';
        case 'delete':
          return 'Del';
        case 'space':
          return 'Space';
        default:
          return part.toUpperCase();
      }
    })
    .join(' + ');
};

export default useKeyboardShortcuts;