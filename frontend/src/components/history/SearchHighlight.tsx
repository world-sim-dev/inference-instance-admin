/**
 * SearchHighlight Component
 * Highlights search terms in text with customizable styling
 */

import React, { useMemo } from 'react';
import { Typography } from 'antd';
import { HistorySearchService } from '../../services/historySearchService';

const { Text } = Typography;

/**
 * Props for SearchHighlight component
 */
export interface SearchHighlightProps {
  /** Text to highlight */
  text: string;
  /** Search term to highlight */
  searchTerm?: string;
  /** Whether search is case sensitive */
  caseSensitive?: boolean;
  /** Search mode */
  searchMode?: 'contains' | 'exact' | 'regex';
  /** Whether highlighting is enabled */
  enabled?: boolean;
  /** Custom highlight style */
  highlightStyle?: React.CSSProperties;
  /** Custom highlight class name */
  highlightClassName?: string;
  /** Text component props */
  textProps?: any;
  /** Maximum length before truncation */
  maxLength?: number;
  /** Whether to show tooltip with full text */
  showTooltip?: boolean;
}

/**
 * Default highlight style
 */
const DEFAULT_HIGHLIGHT_STYLE: React.CSSProperties = {
  backgroundColor: '#fff566',
  padding: '1px 2px',
  borderRadius: '2px',
  fontWeight: 500,
  color: '#000'
};

/**
 * SearchHighlight Component
 */
export const SearchHighlight: React.FC<SearchHighlightProps> = ({
  text,
  searchTerm,
  caseSensitive = false,
  searchMode = 'contains',
  enabled = true,
  highlightStyle = DEFAULT_HIGHLIGHT_STYLE,
  highlightClassName,
  textProps = {},
  maxLength,
  showTooltip = true
}) => {
  /**
   * Process text with highlighting
   */
  const processedContent = useMemo(() => {
    if (!text) return null;
    
    // Truncate text if maxLength is specified
    let displayText = text;
    let wasTruncated = false;
    
    if (maxLength && text.length > maxLength) {
      displayText = text.substring(0, maxLength) + '...';
      wasTruncated = true;
    }

    // If highlighting is disabled or no search term, return plain text
    if (!enabled || !searchTerm || !searchTerm.trim()) {
      return (
        <Text 
          {...textProps}
          title={showTooltip && wasTruncated ? text : undefined}
        >
          {displayText}
        </Text>
      );
    }

    // Generate highlighted HTML
    const highlightedHtml = HistorySearchService.highlightText(
      displayText,
      searchTerm,
      {
        caseSensitive,
        mode: searchMode,
        highlightTags: {
          pre: '<mark>',
          post: '</mark>'
        }
      }
    );

    // Parse HTML and create React elements
    const parts = highlightedHtml.split(/(<mark>.*?<\/mark>)/g);
    
    const elements = parts.map((part, index) => {
      if (part.startsWith('<mark>') && part.endsWith('</mark>')) {
        // Extract text from mark tags
        const highlightedText = part.replace(/<\/?mark>/g, '');
        return (
          <span
            key={index}
            style={highlightStyle}
            className={highlightClassName}
          >
            {highlightedText}
          </span>
        );
      } else {
        return part;
      }
    });

    return (
      <Text 
        {...textProps}
        title={showTooltip && wasTruncated ? text : undefined}
      >
        {elements}
      </Text>
    );
  }, [
    text,
    searchTerm,
    caseSensitive,
    searchMode,
    enabled,
    highlightStyle,
    highlightClassName,
    textProps,
    maxLength,
    showTooltip
  ]);

  return <>{processedContent}</>;
};

/**
 * FieldHighlight Component
 * Specialized component for highlighting specific fields in history records
 */
export interface FieldHighlightProps extends Omit<SearchHighlightProps, 'text'> {
  /** Field value to highlight */
  value: any;
  /** Field name for context */
  fieldName?: string;
  /** Whether to format the value */
  formatValue?: boolean;
}

export const FieldHighlight: React.FC<FieldHighlightProps> = ({
  value,
  fieldName,
  formatValue = true,
  ...highlightProps
}) => {
  /**
   * Format field value for display
   */
  const formattedValue = useMemo(() => {
    if (value === null || value === undefined) {
      return '';
    }

    if (!formatValue) {
      return String(value);
    }

    // Format based on field type
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }

    return String(value);
  }, [value, formatValue]);

  return (
    <SearchHighlight
      text={formattedValue}
      {...highlightProps}
    />
  );
};

/**
 * MultiFieldHighlight Component
 * Highlights search terms across multiple fields
 */
export interface MultiFieldHighlightProps {
  /** Fields to highlight */
  fields: Array<{
    label: string;
    value: any;
    fieldName?: string;
  }>;
  /** Search term */
  searchTerm?: string;
  /** Search options */
  searchOptions?: {
    caseSensitive?: boolean;
    searchMode?: 'contains' | 'exact' | 'regex';
  };
  /** Whether highlighting is enabled */
  enabled?: boolean;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Separator between fields */
  separator?: string;
  /** Custom field renderer */
  renderField?: (field: { label: string; value: any; fieldName?: string }, highlighted: React.ReactNode) => React.ReactNode;
}

export const MultiFieldHighlight: React.FC<MultiFieldHighlightProps> = ({
  fields,
  searchTerm,
  searchOptions = {},
  enabled = true,
  direction = 'vertical',
  separator = ' | ',
  renderField
}) => {
  const { caseSensitive = false, searchMode = 'contains' } = searchOptions;

  const renderedFields = fields.map((field, index) => {
    const highlighted = (
      <FieldHighlight
        value={field.value}
        fieldName={field.fieldName}
        searchTerm={searchTerm}
        caseSensitive={caseSensitive}
        searchMode={searchMode}
        enabled={enabled}
      />
    );

    const content = renderField ? renderField(field, highlighted) : (
      <span key={index}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {field.label}:
        </Text>{' '}
        {highlighted}
      </span>
    );

    return content;
  });

  if (direction === 'horizontal') {
    return (
      <>
        {renderedFields.map((field, index) => (
          <React.Fragment key={index}>
            {field}
            {index < renderedFields.length - 1 && separator}
          </React.Fragment>
        ))}
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {renderedFields}
    </div>
  );
};

export default SearchHighlight;