/**
 * HelpSystem Component
 * Provides contextual help and keyboard shortcuts display
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Modal, 
  Drawer, 
  Tabs, 
  List, 
  Typography, 
  Space, 
  Tag, 
  Button, 
  Input,
  Card,
  Divider,
  Tooltip,
  FloatButton
} from 'antd';
import { 
  QuestionCircleOutlined, 
  KeyOutlined, 
  BookOutlined, 
  SearchOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { formatShortcutKey, type KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

/**
 * Help content item
 */
export interface HelpItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  searchTerms?: string[];
}

/**
 * FAQ item
 */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

/**
 * Props for HelpSystem component
 */
export interface HelpSystemProps {
  /** Available keyboard shortcuts */
  shortcuts?: KeyboardShortcut[];
  /** Help content items */
  helpItems?: HelpItem[];
  /** FAQ items */
  faqItems?: FAQItem[];
  /** Whether to show floating help button */
  showFloatingButton?: boolean;
  /** Initial tab to show */
  defaultTab?: string;
}

/**
 * Default help content
 */
const defaultHelpItems: HelpItem[] = [
  {
    id: 'getting-started',
    title: '开始使用',
    content: `
      欢迎使用实例管理系统！这里是一些基本操作指南：
      
      1. **查看实例列表**: 主页面显示所有实例的列表
      2. **创建新实例**: 点击"创建实例"按钮
      3. **编辑实例**: 点击实例行的编辑按钮
      4. **删除实例**: 点击实例行的删除按钮
      5. **查看历史**: 点击历史按钮查看实例变更记录
    `,
    category: '基础操作',
    tags: ['入门', '基础'],
    searchTerms: ['开始', '入门', '基础', '操作'],
  },
  {
    id: 'search-filter',
    title: '搜索和过滤',
    content: `
      使用搜索和过滤功能快速找到所需的实例：
      
      - **搜索**: 在搜索框中输入实例名称、模型名称或描述
      - **状态过滤**: 按实例状态筛选（活跃、非活跃、待处理、错误）
      - **集群过滤**: 按集群名称筛选
      - **模型过滤**: 按模型名称筛选
      - **重置过滤**: 点击重置按钮清除所有过滤条件
    `,
    category: '搜索功能',
    tags: ['搜索', '过滤', '筛选'],
    searchTerms: ['搜索', '过滤', '筛选', '查找'],
  },
  {
    id: 'instance-management',
    title: '实例管理',
    content: `
      详细的实例管理操作说明：
      
      **创建实例**:
      - 填写基本信息（名称、描述）
      - 选择模型和版本
      - 配置资源分配
      - 设置优先级和环境变量
      
      **编辑实例**:
      - 修改实例配置
      - 更新资源分配
      - 调整优先级设置
      
      **删除实例**:
      - 确认删除操作
      - 注意：删除操作不可撤销
    `,
    category: '实例操作',
    tags: ['实例', '管理', '创建', '编辑', '删除'],
    searchTerms: ['实例', '管理', '创建', '编辑', '删除', '配置'],
  },
];

/**
 * Default FAQ items
 */
const defaultFAQItems: FAQItem[] = [
  {
    id: 'faq-1',
    question: '如何创建新的实例？',
    answer: '点击页面右上角的"创建实例"按钮，填写必要的信息后提交即可。',
    category: '基础操作',
  },
  {
    id: 'faq-2',
    question: '实例状态有哪些类型？',
    answer: '实例状态包括：活跃（正在运行）、非活跃（已停止）、待处理（正在启动）、错误（运行异常）。',
    category: '状态说明',
  },
  {
    id: 'faq-3',
    question: '如何查看实例的历史记录？',
    answer: '点击实例行的历史按钮，可以查看该实例的所有变更记录和操作历史。',
    category: '历史记录',
  },
  {
    id: 'faq-4',
    question: '可以批量操作实例吗？',
    answer: '目前支持批量选择和删除操作，更多批量操作功能正在开发中。',
    category: '批量操作',
  },
];

/**
 * HelpSystem Component
 */
export const HelpSystem: React.FC<HelpSystemProps> = ({
  shortcuts = [],
  helpItems = defaultHelpItems,
  faqItems = defaultFAQItems,
  showFloatingButton = true,
  defaultTab = 'help',
}) => {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter help items based on search
  const filteredHelpItems = useMemo(() => {
    if (!searchTerm) return helpItems;
    
    const term = searchTerm.toLowerCase();
    return helpItems.filter(item => 
      item.title.toLowerCase().includes(term) ||
      item.content.toLowerCase().includes(term) ||
      item.tags?.some(tag => tag.toLowerCase().includes(term)) ||
      item.searchTerms?.some(searchTerm => searchTerm.toLowerCase().includes(term))
    );
  }, [helpItems, searchTerm]);

  // Filter FAQ items based on search
  const filteredFAQItems = useMemo(() => {
    if (!searchTerm) return faqItems;
    
    const term = searchTerm.toLowerCase();
    return faqItems.filter(item => 
      item.question.toLowerCase().includes(term) ||
      item.answer.toLowerCase().includes(term)
    );
  }, [faqItems, searchTerm]);

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {};
    
    shortcuts.forEach(shortcut => {
      const category = shortcut.description?.includes('保存') ? '编辑操作' :
                     shortcut.description?.includes('创建') ? '创建操作' :
                     shortcut.description?.includes('搜索') ? '搜索操作' :
                     shortcut.description?.includes('刷新') ? '页面操作' :
                     '其他操作';
      
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
    });
    
    return groups;
  }, [shortcuts]);

  const handleOpen = useCallback(() => {
    setVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setSearchTerm('');
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  return (
    <>
      {/* Floating Help Button */}
      {showFloatingButton && (
        <FloatButton
          icon={<QuestionCircleOutlined />}
          tooltip="帮助"
          onClick={handleOpen}
          style={{ right: 24, bottom: 24 }}
        />
      )}

      {/* Help Drawer */}
      <Drawer
        title={
          <Space>
            <BookOutlined />
            <span>帮助中心</span>
          </Space>
        }
        placement="right"
        width={600}
        open={visible}
        onClose={handleClose}
        extra={
          <Button type="text" icon={<CloseOutlined />} onClick={handleClose} />
        }
      >
        {/* Search Bar */}
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索帮助内容..."
            allowClear
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: '100%' }}
            prefix={<SearchOutlined />}
          />
        </div>

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          {/* Help Content Tab */}
          <TabPane
            tab={
              <Space>
                <BookOutlined />
                <span>使用指南</span>
              </Space>
            }
            key="help"
          >
            <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {filteredHelpItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Text type="secondary">未找到相关帮助内容</Text>
                </div>
              ) : (
                <List
                  dataSource={filteredHelpItems}
                  renderItem={(item) => (
                    <List.Item>
                      <Card size="small" style={{ width: '100%' }}>
                        <Title level={5}>{item.title}</Title>
                        {item.category && (
                          <Tag color="blue" style={{ marginBottom: 8 }}>
                            {item.category}
                          </Tag>
                        )}
                        <Paragraph>
                          <pre style={{ 
                            whiteSpace: 'pre-wrap', 
                            fontFamily: 'inherit',
                            margin: 0 
                          }}>
                            {item.content.trim()}
                          </pre>
                        </Paragraph>
                        {item.tags && (
                          <Space wrap>
                            {item.tags.map(tag => (
                              <Tag key={tag}>{tag}</Tag>
                            ))}
                          </Space>
                        )}
                      </Card>
                    </List.Item>
                  )}
                />
              )}
            </div>
          </TabPane>

          {/* Keyboard Shortcuts Tab */}
          <TabPane
            tab={
              <Space>
                <KeyOutlined />
                <span>快捷键</span>
              </Space>
            }
            key="shortcuts"
          >
            <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {Object.keys(groupedShortcuts).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Text type="secondary">暂无可用快捷键</Text>
                </div>
              ) : (
                Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                  <div key={category} style={{ marginBottom: 24 }}>
                    <Title level={5}>{category}</Title>
                    <List
                      size="small"
                      dataSource={shortcuts}
                      renderItem={(shortcut) => (
                        <List.Item>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text>{shortcut.description || '未知操作'}</Text>
                            <Tag style={{ fontFamily: 'monospace' }}>
                              {formatShortcutKey(shortcut.key)}
                            </Tag>
                          </Space>
                        </List.Item>
                      )}
                    />
                  </div>
                ))
              )}
            </div>
          </TabPane>

          {/* FAQ Tab */}
          <TabPane
            tab={
              <Space>
                <QuestionCircleOutlined />
                <span>常见问题</span>
              </Space>
            }
            key="faq"
          >
            <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {filteredFAQItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Text type="secondary">未找到相关问题</Text>
                </div>
              ) : (
                <List
                  dataSource={filteredFAQItems}
                  renderItem={(item) => (
                    <List.Item>
                      <Card size="small" style={{ width: '100%' }}>
                        <Title level={5} style={{ color: '#1890ff' }}>
                          Q: {item.question}
                        </Title>
                        <Paragraph>
                          <Text>A: {item.answer}</Text>
                        </Paragraph>
                        {item.category && (
                          <Tag color="green">
                            {item.category}
                          </Tag>
                        )}
                      </Card>
                    </List.Item>
                  )}
                />
              )}
            </div>
          </TabPane>
        </Tabs>
      </Drawer>
    </>
  );
};

/**
 * Contextual help tooltip
 */
export const HelpTooltip: React.FC<{
  title: string;
  content: string;
  children: React.ReactNode;
}> = ({ title, content, children }) => (
  <Tooltip
    title={
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{title}</div>
        <div>{content}</div>
      </div>
    }
    overlayStyle={{ maxWidth: 300 }}
  >
    {children}
  </Tooltip>
);

/**
 * Quick help button
 */
export const QuickHelpButton: React.FC<{
  onClick?: () => void;
  size?: 'small' | 'middle' | 'large';
}> = ({ onClick, size = 'small' }) => (
  <Tooltip title="帮助">
    <Button
      type="text"
      size={size}
      icon={<QuestionCircleOutlined />}
      onClick={onClick}
      style={{ color: '#1890ff' }}
    />
  </Tooltip>
);

export default HelpSystem;