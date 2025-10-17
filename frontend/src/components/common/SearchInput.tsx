/**
 * SearchInput Component
 * Reusable search input with debouncing and clear functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from 'antd';
import { SearchOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Search } = Input;

/**
 * Props for SearchInput component
 */
export interface SearchInputProps {
  value?: string;
  placeholder?: string;
  debounceMs?: number;
  allowClear?: boolean;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  onClear?: () => void;
}

/**
 * Custom hook for debounced value
 */
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * SearchInput Component
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  placeholder = 'Search...',
  debounceMs = 300,
  allowClear = true,
  size = 'middle',
  disabled = false,
  loading = false,
  onSearch,
  onChange,
  onClear,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const debouncedValue = useDebounce(inputValue, debounceMs);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Call onSearch when debounced value changes
  useEffect(() => {
    if (onSearch && debouncedValue !== value) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch, value]);

  /**
   * Handle input change
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Call onChange immediately for controlled components
    if (onChange) {
      onChange(newValue);
    }
  }, [onChange]);

  /**
   * Handle search button click
   */
  const handleSearch = useCallback((searchValue: string) => {
    if (onSearch) {
      onSearch(searchValue);
    }
  }, [onSearch]);

  /**
   * Handle clear button click
   */
  const handleClear = useCallback(() => {
    setInputValue('');
    if (onClear) {
      onClear();
    }
    if (onChange) {
      onChange('');
    }
    if (onSearch) {
      onSearch('');
    }
  }, [onClear, onChange, onSearch]);

  return (
    <Search
      value={inputValue}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      loading={loading}
      allowClear={allowClear}
      onChange={handleChange}
      onSearch={handleSearch}
      suffix={
        inputValue && allowClear ? (
          <CloseCircleOutlined 
            onClick={handleClear}
            style={{ cursor: 'pointer', color: '#bfbfbf' }}
          />
        ) : (
          <SearchOutlined style={{ color: '#bfbfbf' }} />
        )
      }
      enterButton={false}
    />
  );
};

export default SearchInput;