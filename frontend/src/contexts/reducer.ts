/**
 * Reducer function for global state management
 */

import type { AppState, AppAction } from './types';

/**
 * Main reducer function for application state
 */
export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    // Instance loading actions
    case 'LOAD_INSTANCES_START':
      return {
        ...state,
        instances: {
          ...state.instances,
          loading: true,
          error: null,
        },
      };

    case 'LOAD_INSTANCES_SUCCESS':
      return {
        ...state,
        instances: {
          ...state.instances,
          data: action.payload,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        },
        ui: {
          ...state.ui,
          pagination: {
            ...state.ui.pagination,
            total: action.payload.length,
          },
        },
      };

    case 'LOAD_INSTANCES_ERROR':
      return {
        ...state,
        instances: {
          ...state.instances,
          loading: false,
          error: action.payload,
        },
      };

    // Instance creation actions
    case 'CREATE_INSTANCE_START':
      return {
        ...state,
        instances: {
          ...state.instances,
          loading: true,
          error: null,
        },
      };

    case 'CREATE_INSTANCE_SUCCESS':
      return {
        ...state,
        instances: {
          ...state.instances,
          data: [...state.instances.data, action.payload],
          loading: false,
          error: null,
          lastUpdated: new Date(),
        },
        ui: {
          ...state.ui,
          pagination: {
            ...state.ui.pagination,
            total: state.ui.pagination.total + 1,
          },
        },
        modals: {
          ...state.modals,
          createInstance: false,
        },
      };

    case 'CREATE_INSTANCE_ERROR':
      return {
        ...state,
        instances: {
          ...state.instances,
          loading: false,
          error: action.payload,
        },
      };

    // Instance update actions
    case 'UPDATE_INSTANCE_START':
      return {
        ...state,
        instances: {
          ...state.instances,
          loading: true,
          error: null,
        },
      };

    case 'UPDATE_INSTANCE_SUCCESS':
      return {
        ...state,
        instances: {
          ...state.instances,
          data: state.instances.data.map(instance =>
            instance.id === action.payload.id ? action.payload : instance
          ),
          loading: false,
          error: null,
          lastUpdated: new Date(),
        },
        modals: {
          ...state.modals,
          editInstance: false,
        },
      };

    case 'UPDATE_INSTANCE_ERROR':
      return {
        ...state,
        instances: {
          ...state.instances,
          loading: false,
          error: action.payload,
        },
      };

    // Instance deletion actions
    case 'DELETE_INSTANCE_START':
      return {
        ...state,
        instances: {
          ...state.instances,
          loading: true,
          error: null,
        },
      };

    case 'DELETE_INSTANCE_SUCCESS':
      return {
        ...state,
        instances: {
          ...state.instances,
          data: state.instances.data.filter(instance => instance.id !== action.payload),
          loading: false,
          error: null,
          lastUpdated: new Date(),
        },
        ui: {
          ...state.ui,
          selectedInstanceId: state.ui.selectedInstanceId === action.payload ? null : state.ui.selectedInstanceId,
          pagination: {
            ...state.ui.pagination,
            total: Math.max(0, state.ui.pagination.total - 1),
          },
        },
        modals: {
          ...state.modals,
          deleteConfirm: false,
        },
      };

    case 'DELETE_INSTANCE_ERROR':
      return {
        ...state,
        instances: {
          ...state.instances,
          loading: false,
          error: action.payload,
        },
      };

    // UI state actions
    case 'SET_SELECTED_INSTANCE':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedInstanceId: action.payload,
        },
      };

    case 'SET_SEARCH_TERM':
      return {
        ...state,
        ui: {
          ...state.ui,
          searchTerm: action.payload,
          filters: {
            ...state.ui.filters,
            search: action.payload,
          },
          pagination: {
            ...state.ui.pagination,
            current: 1, // Reset to first page when searching
          },
        },
      };

    case 'SET_FILTERS':
      return {
        ...state,
        ui: {
          ...state.ui,
          filters: {
            ...state.ui.filters,
            ...action.payload,
          },
          pagination: {
            ...state.ui.pagination,
            current: 1, // Reset to first page when filtering
          },
        },
      };

    case 'SET_PAGINATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          pagination: {
            ...state.ui.pagination,
            ...action.payload,
          },
        },
      };

    case 'RESET_FILTERS':
      return {
        ...state,
        ui: {
          ...state.ui,
          searchTerm: '',
          filters: {
            status: [],
            cluster_name: [],
            model_name: [],
            ephemeral: null,
            search: '',
          },
          pagination: {
            ...state.ui.pagination,
            current: 1,
          },
        },
      };

    // Modal actions
    case 'TOGGLE_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modal]: action.payload.visible,
        },
      };

    case 'CLOSE_ALL_MODALS':
      return {
        ...state,
        modals: {
          createInstance: false,
          editInstance: false,
          deleteConfirm: false,
          viewHistory: false,
          viewDetails: false,
        },
      };

    // General actions
    case 'RESET_STATE':
      return {
        instances: {
          data: [],
          loading: false,
          error: null,
          lastUpdated: null,
        },
        ui: {
          selectedInstanceId: null,
          searchTerm: '',
          filters: {
            status: [],
            cluster_name: [],
            model_name: [],
            ephemeral: null,
            search: '',
          },
          pagination: {
            current: 1,
            pageSize: 10,
            total: 0,
          },
        },
        modals: {
          createInstance: false,
          editInstance: false,
          deleteConfirm: false,
          viewHistory: false,
          viewDetails: false,
        },
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        instances: {
          ...state.instances,
          error: null,
        },
      };

    default:
      return state;
  }
};