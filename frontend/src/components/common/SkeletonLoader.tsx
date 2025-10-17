/**
 * SkeletonLoader Component
 * Provides skeleton loading states for better user experience
 */

import React from 'react';
import { Skeleton, Card, Space, Row, Col } from 'antd';

/**
 * Props for SkeletonLoader component
 */
export interface SkeletonLoaderProps {
  /** Type of skeleton to display */
  type?: 'table' | 'card' | 'form' | 'list' | 'details';
  /** Number of skeleton items */
  count?: number;
  /** Whether to show avatar */
  avatar?: boolean;
  /** Number of lines for paragraph */
  lines?: number;
  /** Custom style */
  style?: React.CSSProperties;
  /** Whether skeleton is active (animated) */
  active?: boolean;
}

/**
 * Table skeleton component
 */
const TableSkeleton: React.FC<{ count: number; active: boolean }> = ({ count, active }) => (
  <div>
    {/* Table header skeleton */}
    <div style={{ 
      padding: '16px', 
      borderBottom: '1px solid #f0f0f0',
      backgroundColor: '#fafafa'
    }}>
      <Skeleton.Input active={active} style={{ width: '100%', height: '32px' }} />
    </div>
    
    {/* Table rows skeleton */}
    {Array.from({ length: count }, (_, index) => (
      <div key={index} style={{ 
        padding: '16px', 
        borderBottom: '1px solid #f0f0f0' 
      }}>
        <Row gutter={16} align="middle">
          <Col span={4}>
            <Skeleton.Input active={active} style={{ width: '100%' }} />
          </Col>
          <Col span={3}>
            <Skeleton.Button active={active} size="small" />
          </Col>
          <Col span={4}>
            <Skeleton.Input active={active} style={{ width: '100%' }} />
          </Col>
          <Col span={3}>
            <Skeleton.Input active={active} style={{ width: '100%' }} />
          </Col>
          <Col span={4}>
            <Skeleton.Input active={active} style={{ width: '100%' }} />
          </Col>
          <Col span={3}>
            <Skeleton.Input active={active} style={{ width: '100%' }} />
          </Col>
          <Col span={3}>
            <Space>
              <Skeleton.Button active={active} size="small" />
              <Skeleton.Button active={active} size="small" />
              <Skeleton.Button active={active} size="small" />
            </Space>
          </Col>
        </Row>
      </div>
    ))}
  </div>
);

/**
 * Card skeleton component
 */
const CardSkeleton: React.FC<{ count: number; active: boolean }> = ({ count, active }) => (
  <Row gutter={[16, 16]}>
    {Array.from({ length: count }, (_, index) => (
      <Col key={index} xs={24} sm={12} md={8} lg={6}>
        <Card>
          <Skeleton
            active={active}
            avatar
            paragraph={{ rows: 4 }}
            title={{ width: '60%' }}
          />
        </Card>
      </Col>
    ))}
  </Row>
);

/**
 * Form skeleton component
 */
const FormSkeleton: React.FC<{ active: boolean }> = ({ active }) => (
  <div style={{ padding: '24px' }}>
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Form title */}
      <Skeleton.Input active={active} style={{ width: '200px', height: '32px' }} />
      
      {/* Form fields */}
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index}>
          <Skeleton.Input 
            active={active} 
            style={{ width: '120px', height: '20px', marginBottom: '8px' }} 
          />
          <Skeleton.Input 
            active={active} 
            style={{ width: '100%', height: '40px' }} 
          />
        </div>
      ))}
      
      {/* Form buttons */}
      <Space>
        <Skeleton.Button active={active} />
        <Skeleton.Button active={active} />
      </Space>
    </Space>
  </div>
);

/**
 * List skeleton component
 */
const ListSkeleton: React.FC<{ count: number; active: boolean }> = ({ count, active }) => (
  <div>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} style={{ 
        padding: '16px', 
        borderBottom: '1px solid #f0f0f0' 
      }}>
        <Skeleton
          active={active}
          avatar
          paragraph={{ rows: 2 }}
          title={{ width: '40%' }}
        />
      </div>
    ))}
  </div>
);

/**
 * Details skeleton component
 */
const DetailsSkeleton: React.FC<{ active: boolean }> = ({ active }) => (
  <div style={{ padding: '24px' }}>
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Title */}
      <Skeleton.Input active={active} style={{ width: '300px', height: '32px' }} />
      
      {/* Sections */}
      {Array.from({ length: 4 }, (_, sectionIndex) => (
        <div key={sectionIndex}>
          <Skeleton.Input 
            active={active} 
            style={{ width: '150px', height: '24px', marginBottom: '16px' }} 
          />
          <Row gutter={[16, 16]}>
            {Array.from({ length: 4 }, (_, itemIndex) => (
              <Col key={itemIndex} span={12}>
                <Skeleton.Input 
                  active={active} 
                  style={{ width: '80px', height: '16px', marginBottom: '4px' }} 
                />
                <Skeleton.Input 
                  active={active} 
                  style={{ width: '100%', height: '20px' }} 
                />
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </Space>
  </div>
);

/**
 * SkeletonLoader Component
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'table',
  count = 5,
  avatar = false,
  lines = 3,
  style,
  active = true,
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'table':
        return <TableSkeleton count={count} active={active} />;
      case 'card':
        return <CardSkeleton count={count} active={active} />;
      case 'form':
        return <FormSkeleton active={active} />;
      case 'list':
        return <ListSkeleton count={count} active={active} />;
      case 'details':
        return <DetailsSkeleton active={active} />;
      default:
        return (
          <Skeleton
            active={active}
            avatar={avatar}
            paragraph={{ rows: lines }}
          />
        );
    }
  };

  return (
    <div style={style}>
      {renderSkeleton()}
    </div>
  );
};

/**
 * Skeleton wrapper for conditional loading
 */
export const SkeletonWrapper: React.FC<{
  loading: boolean;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
}> = ({ loading, skeleton, children }) => {
  if (loading) {
    return <>{skeleton || <SkeletonLoader />}</>;
  }
  return <>{children}</>;
};

export default SkeletonLoader;