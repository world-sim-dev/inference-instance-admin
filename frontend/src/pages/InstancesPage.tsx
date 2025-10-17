/**
 * InstancesPage Component
 * Main page for instance management with table, search, and filters
 */

import React, { useCallback } from 'react';
import { Card, message } from 'antd';
import { 
  InstanceTable, 
  InstanceSearchBar 
} from '../components';
import { useInstances } from '../hooks';
import { useAppContext, useAppActions } from '../contexts/useAppContext';
import type { Instance } from '../types/instance';

/**
 * InstancesPage Component
 */
export const InstancesPage: React.FC = () => {
  const { state } = useAppContext();
  const actions = useAppActions();
  const {
    filteredInstances,
    loading,
    error,
    filterOptions,
    refetch,
  } = useInstances();

  const { ui } = state;
  const { searchTerm, filters, pagination } = ui;

  /**
   * Handle search term change
   */
  const handleSearchChange = useCallback((searchTerm: string) => {
    actions.setSearchTerm(searchTerm);
  }, [actions]);

  /**
   * Handle filters change
   */
  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    actions.setFilters(newFilters);
    // Reset pagination when filters change
    actions.setPagination({ current: 1 });
  }, [actions]);

  /**
   * Handle table change (pagination, sorting, filtering)
   */
  const handleTableChange = useCallback((paginationConfig: any, _filters: any, _sorter: any) => {
    if (paginationConfig) {
      actions.setPagination({
        current: paginationConfig.current,
        pageSize: paginationConfig.pageSize,
      });
    }
  }, [actions]);

  /**
   * Handle create instance click
   */
  const handleCreateClick = useCallback(() => {
    actions.toggleModal('createInstance', true);
  }, [actions]);

  /**
   * Handle edit instance
   */
  const handleEdit = useCallback((instance: Instance) => {
    actions.setSelectedInstance(instance.id);
    actions.toggleModal('editInstance', true);
  }, [actions]);

  /**
   * Handle delete instance
   */
  const handleDelete = useCallback((instance: Instance) => {
    actions.setSelectedInstance(instance.id);
    actions.toggleModal('deleteConfirm', true);
  }, [actions]);

  /**
   * Handle view history
   */
  const handleViewHistory = useCallback((instance: Instance) => {
    actions.setSelectedInstance(instance.id);
    actions.toggleModal('viewHistory', true);
  }, [actions]);

  /**
   * Handle view details
   */
  const handleViewDetails = useCallback((instance: Instance) => {
    actions.setSelectedInstance(instance.id);
    actions.toggleModal('viewDetails', true);
  }, [actions]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  /**
   * Handle reset filters
   */
  const handleResetFilters = useCallback(() => {
    actions.resetFilters();
    actions.setPagination({ current: 1 });
  }, [actions]);

  // Calculate pagination info
  const paginationConfig = {
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: filteredInstances.length,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) => 
      `${range[0]}-${range[1]} of ${total} instances`,
    pageSizeOptions: ['10', '20', '50', '100'],
  };

  // Get current page data
  const startIndex = (pagination.current - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const currentPageInstances = filteredInstances.slice(startIndex, endIndex);

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title="Instance Management"
        style={{ minHeight: '600px' }}
      >
        {/* Search and Filter Bar */}
        <InstanceSearchBar
          searchTerm={searchTerm}
          filters={filters}
          filterOptions={filterOptions}
          loading={loading}
          resultsCount={filteredInstances.length}
          totalCount={state.instances.data.length}
          onSearchChange={handleSearchChange}
          onFiltersChange={handleFiltersChange}
          onCreateClick={handleCreateClick}
          onRefresh={handleRefresh}
          onResetFilters={handleResetFilters}
        />

        {/* Instance Table */}
        <InstanceTable
          instances={currentPageInstances}
          loading={loading}
          pagination={paginationConfig}
          onChange={handleTableChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewHistory={handleViewHistory}
          onViewDetails={handleViewDetails}
        />

        {/* Error Display */}
        {error && (
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            backgroundColor: '#fff2f0', 
            border: '1px solid #ffccc7',
            borderRadius: 6,
            color: '#ff4d4f'
          }}>
            Error: {error}
          </div>
        )}
      </Card>
    </div>
  );
};

export default InstancesPage;