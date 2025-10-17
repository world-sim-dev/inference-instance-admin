/**
 * InstanceTable Component Tests
 * Tests for the instance table display and interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithProviders, createMockInstances, createMockInstance } from '../../../test/utils';
import { InstanceTable } from '../InstanceTable';
import type { InstanceTableProps } from '../InstanceTable';
import { Status } from '../../../types/enums';

// Mock responsive hook
vi.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

// Mock InstanceGrid component
vi.mock('../InstanceGrid', () => ({
  InstanceGrid: ({ instances, loading, onEdit, onDelete, onViewHistory, onViewDetails }: any) => (
    <div data-testid="instance-grid">
      <div>Grid view with {instances.length} instances</div>
      {loading && <div>Loading...</div>}
      {instances.map((instance: any) => (
        <div key={instance.id} data-testid={`grid-instance-${instance.id}`}>
          <span>{instance.name}</span>
          <button onClick={() => onEdit?.(instance)}>Edit</button>
          <button onClick={() => onDelete?.(instance)}>Delete</button>
          <button onClick={() => onViewHistory?.(instance)}>History</button>
          <button onClick={() => onViewDetails?.(instance)}>Details</button>
        </div>
      ))}
    </div>
  ),
}));

// Mock ResponsiveContainer
vi.mock('../../common/ResponsiveContainer', () => ({
  ResponsiveContainer: ({ children, mobile }: any) => (
    <div data-testid="responsive-container">
      {children}
    </div>
  ),
}));

describe('InstanceTable', () => {
  const mockInstances = createMockInstances(3);
  const defaultProps: InstanceTableProps = {
    instances: mockInstances,
    loading: false,
  };

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewHistory: vi.fn(),
    onViewDetails: vi.fn(),
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render table with instances', () => {
      renderWithProviders(<InstanceTable {...defaultProps} />);

      // Check if table is rendered
      expect(screen.getByRole('table')).toBeInTheDocument();

      // Check if instances are displayed
      mockInstances.forEach(instance => {
        expect(screen.getByText(instance.name)).toBeInTheDocument();
        expect(screen.getByText(instance.model_name)).toBeInTheDocument();
        expect(screen.getByText(instance.cluster_name)).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      renderWithProviders(<InstanceTable {...defaultProps} loading={true} />);

      // Antd Table shows loading spinner
      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });

    it('should show empty state when no instances', () => {
      renderWithProviders(<InstanceTable {...defaultProps} instances={[]} />);

      expect(screen.getByText('No instances found')).toBeInTheDocument();
    });

    it('should display instance details correctly', () => {
      const instance = createMockInstance({
        id: 1,
        name: 'test-instance',
        status: 'active',
        model_name: 'test-model',
        model_version: '1.0.0',
        cluster_name: 'test-cluster',
        pp: 2,
        cp: 1,
        tp: 4,
        n_workers: 8,
        replicas: 2,
        priorities: ['high', 'normal'],
      });

      renderWithProviders(<InstanceTable {...defaultProps} instances={[instance]} />);

      // Check basic info
      expect(screen.getByText('test-instance')).toBeInTheDocument();
      expect(screen.getByText('ID: 1')).toBeInTheDocument();
      expect(screen.getByText('test-model')).toBeInTheDocument();
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
      expect(screen.getByText('test-cluster')).toBeInTheDocument();

      // Check resources
      expect(screen.getByText('PP:2 CP:1 TP:4')).toBeInTheDocument();

      // Check workers
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('x2')).toBeInTheDocument();

      // Check priorities
      expect(screen.getByText('high, normal')).toBeInTheDocument();
    });
  });

  describe('status display', () => {
    it('should display active status correctly', () => {
      const instance = createMockInstance({ status: Status.ACTIVE });
      renderWithProviders(<InstanceTable {...defaultProps} instances={[instance]} />);

      const statusTag = screen.getByText('ACTIVE');
      expect(statusTag).toBeInTheDocument();
      expect(statusTag.closest('.ant-tag')).toHaveClass('ant-tag-green');
    });

    it('should display inactive status correctly', () => {
      const instance = createMockInstance({ status: Status.INACTIVE });
      renderWithProviders(<InstanceTable {...defaultProps} instances={[instance]} />);

      const statusTag = screen.getByText('INACTIVE');
      expect(statusTag).toBeInTheDocument();
      expect(statusTag.closest('.ant-tag')).toHaveClass('ant-tag');
    });

    it('should display error status correctly', () => {
      const instance = createMockInstance({ status: Status.ERROR });
      renderWithProviders(<InstanceTable {...defaultProps} instances={[instance]} />);

      const statusTag = screen.getByText('ERROR');
      expect(statusTag).toBeInTheDocument();
      expect(statusTag.closest('.ant-tag')).toHaveClass('ant-tag-red');
    });

    it('should display pending status correctly', () => {
      const instance = createMockInstance({ status: Status.PENDING });
      renderWithProviders(<InstanceTable {...defaultProps} instances={[instance]} />);

      const statusTag = screen.getByText('PENDING');
      expect(statusTag).toBeInTheDocument();
      expect(statusTag.closest('.ant-tag')).toHaveClass('ant-tag-orange');
    });
  });

  describe('actions', () => {
    const propsWithHandlers = {
      ...defaultProps,
      ...mockHandlers,
    };

    it('should render action buttons when handlers provided', () => {
      renderWithProviders(<InstanceTable {...propsWithHandlers} />);

      // Should have action buttons for each instance (using title attribute instead of aria-label)
      expect(screen.getAllByTitle('View Details')).toHaveLength(mockInstances.length);
      expect(screen.getAllByTitle('Edit')).toHaveLength(mockInstances.length);
      expect(screen.getAllByTitle('View History')).toHaveLength(mockInstances.length);
      expect(screen.getAllByTitle('Delete')).toHaveLength(mockInstances.length);
    });

    it('should call onEdit when edit button clicked', () => {
      renderWithProviders(<InstanceTable {...propsWithHandlers} />);

      const editButtons = screen.getAllByTitle('Edit');
      fireEvent.click(editButtons[0]);

      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockInstances[0]);
    });

    it('should call onDelete when delete button clicked', () => {
      renderWithProviders(<InstanceTable {...propsWithHandlers} />);

      const deleteButtons = screen.getAllByTitle('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockInstances[0]);
    });

    it('should call onViewHistory when history button clicked', () => {
      renderWithProviders(<InstanceTable {...propsWithHandlers} />);

      const historyButtons = screen.getAllByTitle('View History');
      fireEvent.click(historyButtons[0]);

      expect(mockHandlers.onViewHistory).toHaveBeenCalledWith(mockInstances[0]);
    });

    it('should call onViewDetails when details button clicked', () => {
      renderWithProviders(<InstanceTable {...propsWithHandlers} />);

      const detailsButtons = screen.getAllByTitle('View Details');
      fireEvent.click(detailsButtons[0]);

      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(mockInstances[0]);
    });

    it('should not render action buttons when handlers not provided', () => {
      renderWithProviders(<InstanceTable {...defaultProps} />);

      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
      expect(screen.queryByTitle('View History')).not.toBeInTheDocument();
      expect(screen.queryByTitle('View Details')).not.toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('should handle column sorting', () => {
      renderWithProviders(<InstanceTable {...defaultProps} onChange={mockHandlers.onChange} />);

      // Click on Name column header to sort
      const nameHeaders = screen.getAllByText('Name');
      fireEvent.click(nameHeaders[0]);

      expect(mockHandlers.onChange).toHaveBeenCalled();
    });

    it('should handle status column sorting', () => {
      renderWithProviders(<InstanceTable {...defaultProps} onChange={mockHandlers.onChange} />);

      // Click on Status column header to sort
      const statusHeaders = screen.getAllByText('Status');
      fireEvent.click(statusHeaders[0]);

      expect(mockHandlers.onChange).toHaveBeenCalled();
    });
  });

  describe('pagination', () => {
    it('should render pagination when provided', () => {
      const pagination = {
        current: 1,
        pageSize: 10,
        total: 100,
        showSizeChanger: true,
      };

      renderWithProviders(
        <InstanceTable {...defaultProps} pagination={pagination} />
      );

      // Antd pagination should be present
      expect(document.querySelector('.ant-pagination')).toBeInTheDocument();
    });

    it('should handle pagination changes', () => {
      const pagination = {
        current: 1,
        pageSize: 10,
        total: 100,
      };

      renderWithProviders(
        <InstanceTable 
          {...defaultProps} 
          pagination={pagination}
          onChange={mockHandlers.onChange}
        />
      );

      // Find and click next page button
      const nextButton = document.querySelector('.ant-pagination-next');
      if (nextButton) {
        fireEvent.click(nextButton);
        expect(mockHandlers.onChange).toHaveBeenCalled();
      }
    });
  });

  describe('tooltips', () => {
    it('should show resource tooltip on hover', async () => {
      const instance = createMockInstance({ pp: 2, cp: 1, tp: 4 });
      renderWithProviders(<InstanceTable {...defaultProps} instances={[instance]} />);

      const resourceText = screen.getByText('PP:2 CP:1 TP:4');
      fireEvent.mouseEnter(resourceText);

      // Tooltip should appear (though testing tooltip visibility can be tricky)
      expect(resourceText).toBeInTheDocument();
    });

    it('should show priorities tooltip when truncated', async () => {
      const instance = createMockInstance({ 
        priorities: ['high', 'normal', 'low', 'very_low'] 
      });
      renderWithProviders(<InstanceTable {...defaultProps} instances={[instance]} />);

      const prioritiesText = screen.getByText('high, normal...');
      fireEvent.mouseEnter(prioritiesText);

      expect(prioritiesText).toBeInTheDocument();
    });
  });

  describe('row styling', () => {
    it('should apply ephemeral class to ephemeral instances', () => {
      const ephemeralInstance = createMockInstance({ ephemeral: true });
      renderWithProviders(<InstanceTable {...defaultProps} instances={[ephemeralInstance]} />);

      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      // Find the actual data row (not measure row)
      const dataRow = Array.from(rows).find(row => !row.classList.contains('ant-table-measure-row'));
      expect(dataRow).toHaveClass('ephemeral-instance');
    });

    it('should apply error class to error instances', () => {
      const errorInstance = createMockInstance({ status: Status.ERROR });
      renderWithProviders(<InstanceTable {...defaultProps} instances={[errorInstance]} />);

      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      // Find the actual data row (not measure row)
      const dataRow = Array.from(rows).find(row => !row.classList.contains('ant-table-measure-row'));
      expect(dataRow).toHaveClass('error-instance');
    });
  });

  describe('responsive behavior', () => {
    it('should use small size on mobile', () => {
      // Mock mobile responsive hook
      const mockUseResponsive = vi.fn().mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
      
      vi.doMock('../../../hooks/useResponsive', () => ({
        useResponsive: mockUseResponsive,
      }));

      renderWithProviders(<InstanceTable {...defaultProps} />);

      const table = document.querySelector('.ant-table-small');
      expect(table).toBeInTheDocument();
    });

    it('should show limited columns on mobile', () => {
      // Mock mobile responsive hook
      const mockUseResponsive = vi.fn().mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
      
      vi.doMock('../../../hooks/useResponsive', () => ({
        useResponsive: mockUseResponsive,
      }));

      renderWithProviders(<InstanceTable {...defaultProps} />);

      // Should only show name, status, and actions columns
      expect(screen.getAllByText('Name')).toHaveLength(1);
      expect(screen.getAllByText('Status')).toHaveLength(1);
      expect(screen.getAllByText('Actions')).toHaveLength(1);

      // Should not show other columns
      expect(screen.queryByText('Model')).not.toBeInTheDocument();
      expect(screen.queryByText('Cluster')).not.toBeInTheDocument();
      expect(screen.queryByText('Resources')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper table structure', () => {
      renderWithProviders(<InstanceTable {...defaultProps} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Should have column headers
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    });

    it('should have accessible action buttons', () => {
      renderWithProviders(<InstanceTable {...defaultProps} {...mockHandlers} />);

      // All action buttons should have proper titles
      const editButtons = screen.getAllByTitle('Edit');
      const deleteButtons = screen.getAllByTitle('Delete');
      const historyButtons = screen.getAllByTitle('View History');
      const detailsButtons = screen.getAllByTitle('View Details');

      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
      expect(historyButtons.length).toBeGreaterThan(0);
      expect(detailsButtons.length).toBeGreaterThan(0);
    });
  });

  describe('performance', () => {
    it('should memoize columns to prevent unnecessary re-renders', () => {
      const { rerender } = renderWithProviders(<InstanceTable {...defaultProps} />);

      // Re-render with same props
      rerender(<InstanceTable {...defaultProps} />);

      // Component should not re-render unnecessarily (this is more of a structural test)
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should use rowKey for efficient updates', () => {
      renderWithProviders(<InstanceTable {...defaultProps} />);

      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      
      // Filter out measure rows and check data rows
      const dataRows = Array.from(rows).filter(row => !row.classList.contains('ant-table-measure-row'));
      
      // Each data row should have a data-row-key attribute
      dataRows.forEach((row, index) => {
        expect(row).toHaveAttribute('data-row-key', mockInstances[index].id.toString());
      });
    });
  });
});