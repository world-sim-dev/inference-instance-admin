/**
 * React Context for global application state management
 */

import { createContext } from 'react';
import type { AppContextValue } from './types';

/**
 * Create the App Context
 */
export const AppContext = createContext<AppContextValue | undefined>(undefined);