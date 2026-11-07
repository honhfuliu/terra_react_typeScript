import * as React from 'react';
import { Button, Empty, Input, Popover, Spin, Tooltip, message } from 'antd';
import { SearchOutlined, DownOutlined } from '@ant-design/icons';
import Icon from '@/components/Icon';
import styles from './index.module.less';

interface IconSelectProps {
  value?: string;
  onChange?: (value?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

interface IconifySearchResponse {
  icons: string[];
  total: number;
}

// 默认推荐图标
const defaultIcons = [
  'mdi:home',
  'mdi:view-dashboard',
  'mdi:account',
  'mdi:account-group',
  'mdi:shield-account',
  'mdi:domain',
  'mdi:menu',
  'mdi:folder',
  'mdi:database',
  'mdi:book-open-variant',
  'mdi:clipboard-text',
  'mdi:cog',
  'mdi:bell',
  'mdi:chart-bar',
  'mdi:file-document',
  'mdi:cloud',
  'mdi:monitor',
  'mdi:lock',
  'mdi:calendar',
  'mdi:message-text',
];

const IconSelect: React.FC<IconSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = '请选择图标',
}) => {
  const [open, setOpen] = React.useState(false);
  const [keyword, setKeyword] = React.useState('');
  const [selectedIcon, setSelectedIcon] = React.useState<string | undefined>(value);
  const [icons, setIcons] = React.useState<string[]>(defaultIcons);
  const [loading, setLoading] = React.useState(false);

  // 打开面板时，同步当前表单值
  const handleOpenChange = (visible: boolean) => {
    if (disabled) return;

    if (visible) {
      setSelectedIcon(value);
      setKeyword('');
      setIcons(defaultIcons);
    }

    setOpen(visible);
  };

  // 搜索 Iconify 图标
  React.useEffect(() => {
    if (!open) return;

    const query = keyword.trim();

    if (!query) {
      setIcons(defaultIcons);
      setLoading(false);
      return;
    }

    if (query.length < 2) {
      setIcons([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          query,
          limit: '64',
        });
        const response = await fetch(`https://api.iconify.design/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('图标搜索失败');
        }
        const data: IconifySearchResponse = await response.json();
        setIcons(data.icons || []);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          message.error('图标搜索失败，请检查网络后重试');
          setIcons([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [keyword, open]);

  // 选择图标
  const handleSelect = (icon: string) => {
    setSelectedIcon(icon);
  };

  // 确认选择
  const handleConfirm = () => {
    if (!selectedIcon) {
      message.warning('请先选择一个图标');
      return;
    }

    onChange?.(selectedIcon);
    setOpen(false);
  };

  // 取消选择
  const handleCancel = () => {
    setSelectedIcon(value);
    setOpen(false);
  };

  // Popover 内容
  const popoverContent = (
    <div className={styles.container}>
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="请输入图标名称，例如 home、user、setting"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {selectedIcon && (
        <div className={styles.selected}>
          <span>当前选择：</span>
          <Icon icon={selectedIcon} size={20} />
          <span>{selectedIcon}</span>
        </div>
      )}

      <Spin spinning={loading}>
        {icons.length > 0 ? (
          <div className={styles.iconGrid}>
            {icons.map((icon) => (
              <Tooltip key={icon} title={icon}>
                <div
                  className={`${styles.iconItem} ${selectedIcon === icon ? styles.active : ''}`}
                  onClick={() => handleSelect(icon)}
                >
                  <Icon icon={icon} size={24} />
                  <span>{icon.split(':')[1]}</span>
                </div>
              </Tooltip>
            ))}
          </div>
        ) : (
          <Empty
            className={styles.empty}
            description={
              keyword.trim().length < 2 ? '请输入至少两个字符进行搜索' : '没有找到相关图标'
            }
          />
        )}
      </Spin>

      <div className={styles.footer}>
        <Button size="small" onClick={handleCancel}>
          取消
        </Button>
        <Button size="small" type="primary" onClick={handleConfirm} disabled={!selectedIcon}>
          确定
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      title="选择菜单图标"
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomLeft"
      arrow={false}
      classNames={{ root: styles.popover }}
      mouseEnterDelay={0}
    >
      <Button disabled={disabled} className={styles.trigger}>
        {value ? (
          <>
            <Icon icon={value} size={18} />
            <span>{value}</span>
          </>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}

        <DownOutlined className={styles.arrow} />
      </Button>
    </Popover>
  );
};

export default IconSelect;
