import React, { useState, useEffect } from 'react';
import { Input, Button, Space, Alert, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
const { TextArea } = Input;

export interface JsonEditorProps {
  /** Current value as JSON array */
  value?: any[];
  /** Change handler */
  onChange?: (value: any[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Field type for validation */
  fieldType?: 'priorities' | 'envs' | 'generic';
  /** Whether the field is disabled */
  disabled?: boolean;
}

/**
 * JsonEditor Component
 * 
 * A specialized editor for JSON array fields like priorities and envs.
 * Provides both visual editing and raw JSON editing modes.
 */
export const JsonEditor: React.FC<JsonEditorProps> = ({
  value = [],
  onChange,
  placeholder = '输入JSON数据',
  fieldType = 'generic',
  disabled = false
}) => {
  const [editMode, setEditMode] = useState<'visual' | 'json'>('visual');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Update JSON text when value changes
  useEffect(() => {
    if (fieldType === 'envs' && Array.isArray(value)) {
      // For envs in JSON mode, convert array format to object format for display
      const envObj = {};
      value.forEach(env => {
        if (env && env.name) {
          (envObj as any)[env.name] = env.value;
        }
      });
      setJsonText(JSON.stringify(envObj, null, 2));
    } else {
      setJsonText(JSON.stringify(value, null, 2));
    }
  }, [value, fieldType]);

  // Handle visual mode changes
  const handleVisualChange = (newValue: any[]) => {
    onChange?.(newValue);
  };

  // Handle JSON text changes
  const handleJsonTextChange = (text: string) => {
    setJsonText(text);
    setJsonError(null);

    try {
      const parsed = JSON.parse(text);
      
      if (fieldType === 'envs') {
        // For envs, support both array and object formats in JSON mode
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          // Convert object format to array format for form compatibility
          const envArray = Object.entries(parsed).map(([key, val]) => ({
            name: key,
            value: String(val)
          }));
          onChange?.(envArray);
        } else if (Array.isArray(parsed)) {
          onChange?.(parsed);
        } else {
          setJsonError('环境变量必须是对象格式 {"key": "value"} 或数组格式');
        }
      } else {
        // For other field types, expect array format
        if (Array.isArray(parsed)) {
          onChange?.(parsed);
        } else {
          setJsonError('数据必须是数组格式');
        }
      }
    } catch (error) {
      setJsonError('无效的JSON格式');
    }
  };

  // Render priorities visual editor
  const renderPrioritiesEditor = () => {
    const priorities = ['high', 'normal', 'low', 'very_low'];
    const selectedPriorities = value as string[];

    const togglePriority = (priority: string) => {
      const newPriorities = selectedPriorities.includes(priority)
        ? selectedPriorities.filter(p => p !== priority)
        : [...selectedPriorities, priority];
      handleVisualChange(newPriorities);
    };

    return (
      <Space wrap>
        {priorities.map(priority => (
          <Tag.CheckableTag
            key={priority}
            checked={selectedPriorities.includes(priority)}
            onChange={() => togglePriority(priority)}
          >
            {priority}
          </Tag.CheckableTag>
        ))}
      </Space>
    );
  };

  // Render envs visual editor - keeps original array format for visual editing
  const renderEnvsEditor = () => {
    const envs = value as Array<{ name: string; value: string }>;

    const addEnv = () => {
      handleVisualChange([...envs, { name: '', value: '' }]);
    };

    const updateEnv = (index: number, field: 'name' | 'value', newValue: string) => {
      const newEnvs = [...envs];
      newEnvs[index] = { ...newEnvs[index], [field]: newValue };
      handleVisualChange(newEnvs);
    };

    const removeEnv = (index: number) => {
      const newEnvs = envs.filter((_, i) => i !== index);
      handleVisualChange(newEnvs);
    };

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {envs.map((env, index) => (
          <Space key={index} style={{ width: '100%' }}>
            <Input
              placeholder="环境变量名"
              value={env.name}
              onChange={(e) => updateEnv(index, 'name', e.target.value)}
              style={{ width: 150 }}
              disabled={disabled}
            />
            <Input
              placeholder="环境变量值 (支持: true/false, 数字, 字符串)"
              value={env.value}
              onChange={(e) => updateEnv(index, 'value', e.target.value)}
              style={{ flex: 1 }}
              disabled={disabled}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeEnv(index)}
              disabled={disabled}
            />
          </Space>
        ))}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addEnv}
          style={{ width: '100%' }}
          disabled={disabled}
        >
          添加环境变量
        </Button>
      </Space>
    );
  };

  // Render generic array editor
  const renderGenericEditor = () => {
    const items = value as string[];

    const addItem = () => {
      handleVisualChange([...items, '']);
    };

    const updateItem = (index: number, newValue: string) => {
      const newItems = [...items];
      newItems[index] = newValue;
      handleVisualChange(newItems);
    };

    const removeItem = (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      handleVisualChange(newItems);
    };

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {items.map((item, index) => (
          <Space key={index} style={{ width: '100%' }}>
            <Input
              placeholder="输入值"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              style={{ flex: 1 }}
              disabled={disabled}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeItem(index)}
              disabled={disabled}
            />
          </Space>
        ))}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addItem}
          style={{ width: '100%' }}
          disabled={disabled}
        >
          添加项目
        </Button>
      </Space>
    );
  };

  return (
    <div>
      <Space style={{ marginBottom: 8 }}>
        <Button
          size="small"
          type={editMode === 'visual' ? 'primary' : 'default'}
          onClick={() => setEditMode('visual')}
        >
          可视化编辑
        </Button>
        <Button
          size="small"
          type={editMode === 'json' ? 'primary' : 'default'}
          onClick={() => setEditMode('json')}
        >
          JSON编辑
        </Button>
      </Space>

      {editMode === 'visual' ? (
        <div>
          {fieldType === 'priorities' && renderPrioritiesEditor()}
          {fieldType === 'envs' && renderEnvsEditor()}
          {fieldType === 'generic' && renderGenericEditor()}
        </div>
      ) : (
        <div>
          <TextArea
            value={jsonText}
            onChange={(e) => handleJsonTextChange(e.target.value)}
            placeholder={placeholder}
            rows={6}
            disabled={disabled}
          />
          {jsonError && (
            <Alert
              message={jsonError}
              type="error"
              style={{ marginTop: 8 }}
            />
          )}
        </div>
      )}
    </div>
  );
};