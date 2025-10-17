# History Interface User Guide

## Overview

The History Interface provides comprehensive tracking and visualization of all changes made to inference instances. This feature allows users to view detailed change history, compare different versions, and understand the evolution of their instances over time.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Viewing Instance History](#viewing-instance-history)
3. [History Modal Features](#history-modal-features)
4. [Comparing Versions](#comparing-versions)
5. [Filtering and Search](#filtering-and-search)
6. [Mobile Experience](#mobile-experience)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing History

There are several ways to access instance history:

1. **From Instance Table**: Click the "History" button in the actions column
2. **From Instance Details**: Click "View History" in the instance details modal
3. **From Dashboard**: Use the history icon next to any instance

### Understanding History Records

Each history record contains:
- **Operation Type**: Create, Update, or Delete
- **Timestamp**: When the change occurred
- **Changed Fields**: Which fields were modified
- **Old Values**: Previous field values
- **New Values**: Updated field values

## Viewing Instance History

### Opening the History Modal

1. Navigate to the instances table
2. Find the instance you want to examine
3. Click the "History" button (📋 icon) in the actions column
4. The history modal will open showing all changes for that instance

### History List View

The history list displays:
- **Chronological Order**: Most recent changes first
- **Operation Icons**: Visual indicators for create/update/delete operations
- **Timestamps**: Relative time (e.g., "2 hours ago") and absolute timestamps
- **Change Summary**: Brief description of what changed
- **Field Count**: Number of fields modified in each change

### History Record Details

Click on any history record to view detailed information:
- **Complete Field Values**: Full before/after values for all changed fields
- **JSON Formatting**: Syntax-highlighted JSON for complex fields
- **Metadata**: Operation timestamp, type, and change summary
- **Field Comparison**: Side-by-side view of old vs new values

## History Modal Features

### Navigation Controls

- **Close Button**: Close the modal (top-right X)
- **Refresh**: Reload history data (🔄 icon)
- **Export**: Download history as JSON or CSV
- **Print**: Print-friendly view of history

### Responsive Design

The history modal adapts to different screen sizes:
- **Desktop**: Full-width modal with detailed information
- **Tablet**: Optimized layout with collapsible sections
- **Mobile**: Compact view with touch-friendly controls

### Performance Features

- **Virtual Scrolling**: Smooth scrolling for instances with many history records
- **Lazy Loading**: Records load as you scroll
- **Caching**: Previously viewed records are cached for faster access
- **Debounced Search**: Search results update smoothly as you type

## Comparing Versions

### Selecting Records for Comparison

1. Open the history modal for an instance
2. Click the "Compare" button to enter comparison mode
3. Select two history records by clicking on them
4. Click "Compare Selected" to view the comparison

### Comparison View

The comparison view shows:
- **Side-by-Side Layout**: Old values on the left, new values on the right
- **Highlighted Differences**: Changed fields are highlighted in different colors
- **Field-by-Field Analysis**: Each changed field is shown separately
- **Change Types**: Added (green), removed (red), modified (yellow)

### Comparison Features

- **Field Filtering**: Show only changed fields or all fields
- **JSON Diff**: Advanced diff view for complex JSON fields
- **Export Comparison**: Save comparison results as a report
- **Navigation**: Jump between changed fields quickly

## Filtering and Search

### Time-Based Filtering

Filter history records by time period:
- **Last Hour**: Show changes from the past hour
- **Last Day**: Show changes from the past 24 hours
- **Last Week**: Show changes from the past 7 days
- **Custom Range**: Select specific start and end dates

### Operation Type Filtering

Filter by the type of operation:
- **Create**: Show only instance creation records
- **Update**: Show only modification records
- **Delete**: Show only deletion records
- **All**: Show all operation types (default)

### Field-Based Search

Search within history records:
- **Field Names**: Search for specific field names
- **Field Values**: Search within field values
- **Change Descriptions**: Search in change summaries
- **Full Text**: Search across all record content

### Advanced Filtering

Combine multiple filters:
```
Time Range: Last 7 days
Operation: Update
Field: status
Search: "active"
```

This would show all status updates to "active" in the past week.

## Mobile Experience

### Touch-Friendly Interface

- **Large Touch Targets**: Buttons and links are sized for finger navigation
- **Swipe Gestures**: Swipe left/right to navigate between records
- **Pull to Refresh**: Pull down to refresh history data
- **Tap to Expand**: Tap records to expand details

### Mobile-Specific Features

- **Compact View**: Condensed information display
- **Bottom Sheet**: History details slide up from bottom
- **Gesture Navigation**: Intuitive touch gestures
- **Offline Support**: View cached history when offline

### Mobile Layout

The mobile layout includes:
- **Header**: Instance name and close button
- **Filter Bar**: Collapsible filter options
- **Record List**: Scrollable list of history records
- **Detail Panel**: Expandable details for each record

## Troubleshooting

### Common Issues

#### History Not Loading

**Symptoms**: Empty history modal or loading spinner that doesn't stop

**Solutions**:
1. Check your internet connection
2. Refresh the page and try again
3. Clear browser cache and cookies
4. Contact support if the issue persists

#### Slow Performance

**Symptoms**: History modal takes a long time to load or scroll

**Solutions**:
1. Check if you have many history records (>1000)
2. Use filters to reduce the number of displayed records
3. Clear browser cache to free up memory
4. Close other browser tabs to free up resources

#### Missing History Records

**Symptoms**: Expected history records are not visible

**Solutions**:
1. Check if filters are applied that might hide records
2. Verify the time range filter includes the expected period
3. Ensure you have permission to view the instance history
4. Contact administrator if records should exist but don't appear

#### Comparison Not Working

**Symptoms**: Cannot compare two history records

**Solutions**:
1. Ensure you've selected exactly two records
2. Check that both records are for the same instance
3. Try refreshing the modal and selecting records again
4. Use a different browser if the issue persists

### Error Messages

#### "Failed to load history"
- **Cause**: Network connectivity or server issues
- **Solution**: Check connection and retry

#### "No history records found"
- **Cause**: Instance has no recorded changes or filters are too restrictive
- **Solution**: Adjust filters or verify instance has been modified

#### "Comparison unavailable"
- **Cause**: Selected records cannot be compared
- **Solution**: Select two different records from the same instance

### Performance Tips

1. **Use Filters**: Apply time and operation filters to reduce data load
2. **Close Unused Modals**: Don't keep multiple history modals open
3. **Regular Cleanup**: Clear browser cache periodically
4. **Stable Connection**: Use a stable internet connection for best performance

### Browser Compatibility

The history interface is tested and supported on:
- **Chrome**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

For the best experience, use the latest version of your preferred browser.

## Keyboard Shortcuts

When the history modal is open:
- **Escape**: Close the modal
- **Ctrl/Cmd + F**: Open search
- **Ctrl/Cmd + R**: Refresh history
- **Arrow Keys**: Navigate between records
- **Enter**: Open selected record details
- **Space**: Select/deselect record for comparison

## Accessibility Features

The history interface includes:
- **Screen Reader Support**: Full compatibility with screen readers
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast**: Support for high contrast themes
- **Focus Indicators**: Clear visual focus indicators
- **ARIA Labels**: Proper labeling for assistive technologies

## Data Privacy

History data handling:
- **Local Caching**: History is cached locally for performance
- **Secure Transmission**: All data is transmitted over HTTPS
- **Access Control**: History access respects user permissions
- **Data Retention**: History follows your organization's retention policies

## Getting Help

If you need assistance with the history interface:

1. **Documentation**: Check this guide and the API documentation
2. **Support**: Contact your system administrator
3. **Feedback**: Report issues or suggest improvements
4. **Training**: Request additional training if needed

## Feature Requests

To request new history interface features:
1. Document your use case and requirements
2. Submit through your organization's feature request process
3. Include specific examples of what you'd like to see
4. Provide feedback on current limitations

The history interface is continuously improved based on user feedback and usage patterns.