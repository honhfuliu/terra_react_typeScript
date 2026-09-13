import { Editor } from '@tiptap/react';
import styles from './index.module.less';
import * as React from 'react';
import { Button, ColorPicker, Divider, Dropdown, Input, Popover, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  UndoOutlined,
  RedoOutlined,
  DownOutlined,
  FontColorsOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

interface ToolbarProps {
  editor: Editor | null;
}
const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  const [linkUrl, setLinkUrl] = useState('');
  if (!editor) {
    return null;
  }
  return (
    <div className={styles.toolbar}>
      {/* 加粗 */}
      <Tooltip title="加粗">
        <Button
          type={editor.isActive('bold') ? 'primary' : 'text'}
          icon={<BoldOutlined />}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
      </Tooltip>

      {/* 斜体 */}
      <Tooltip title="斜体">
        <Button
          type={editor.isActive('italic') ? 'primary' : 'text'}
          icon={<ItalicOutlined />}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
      </Tooltip>

      {/* 下划线 */}
      <Tooltip title="下划线">
        <Button
          type={editor.isActive('underline') ? 'primary' : 'text'}
          icon={<UnderlineOutlined />}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
      </Tooltip>

      <Divider vertical />

      {/* 无序列表 */}
      <Tooltip title="无序列表">
        <Button
          type={editor.isActive('bulletList') ? 'primary' : 'text'}
          icon={<UnorderedListOutlined />}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
      </Tooltip>

      {/* 有序列表 */}
      <Tooltip title="有序列表">
        <Button
          type={editor.isActive('orderedList') ? 'primary' : 'text'}
          icon={<OrderedListOutlined />}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
      </Tooltip>

      <Divider vertical />

      {/* 左对齐 */}
      <Tooltip title="左对齐">
        <Button
          type={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'text'}
          icon={<AlignLeftOutlined />}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        />
      </Tooltip>

      {/* 居中 */}
      <Tooltip title="居中">
        <Button
          type={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'text'}
          icon={<AlignCenterOutlined />}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        />
      </Tooltip>

      {/* 右对齐 */}
      <Tooltip title="右对齐">
        <Button
          type={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'text'}
          icon={<AlignRightOutlined />}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        />
      </Tooltip>

      <Divider vertical />

      <Dropdown
        menu={{
          items: [
            {
              key: 'paragraph',
              label: '段落',
            },
            {
              key: 'h1',
              label: '标题 1',
            },
            {
              key: 'h2',
              label: '标题 2',
            },
            {
              key: 'h3',
              label: '标题 3',
            },
          ],
          onClick: ({ key }) => {
            const chain = editor.chain().focus();
            switch (key) {
              case 'paragraph':
                chain.setParagraph().run();
                break;
              case 'h1':
                chain.toggleHeading({ level: 1 }).run();
                break;
              case 'h2':
                chain.toggleHeading({ level: 2 }).run();
                break;
              case 'h3':
                chain.toggleHeading({ level: 3 }).run();
                break;
            }
          },
        }}
      >
        <Button>
          段落 <DownOutlined />
        </Button>
      </Dropdown>

      <Divider vertical />

      <ColorPicker
        value={editor.getAttributes('textStyle').color}
        onChange={(color) => {
          editor.chain().focus().setColor(color.toHexString()).run();
        }}
      >
        <Button type="text" icon={<FontColorsOutlined />} />
      </ColorPicker>

      <Divider vertical />

      <ColorPicker
        onChange={(color) => {
          editor
            .chain()
            .focus()
            .toggleHighlight({
              color: color.toHexString(),
            })
            .run();
        }}
      />

      <Divider vertical />
      <Popover
        trigger="click"
        placement="bottom"
        content={
          <div style={{ width: 300 }}>
            <Input
              value={linkUrl}
              placeholder="请输入链接地址,如 https://www.xxx.com"
              onChange={(e) => setLinkUrl(e.target.value)}
              onPressEnter={() => {
                if (!linkUrl.trim()) {
                  editor.chain().focus().unsetLink().run();
                  return;
                }

                editor
                  .chain()
                  .focus()
                  .setLink({
                    href: linkUrl.trim(),
                  })
                  .run();
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 12,
              }}
            >
              <Button
                size="small"
                onClick={() => {
                  setLinkUrl('');
                }}
              >
                取消
              </Button>

              <Button
                type="primary"
                size="small"
                onClick={() => {
                  if (!linkUrl.trim()) {
                    editor.chain().focus().unsetLink().run();
                  } else {
                    editor
                      .chain()
                      .focus()
                      .setLink({
                        href: linkUrl.trim(),
                      })
                      .run();
                  }

                  setLinkUrl('');
                }}
              >
                确定
              </Button>
            </div>
          </div>
        }
      >
        <Tooltip title="链接">
          <Button
            type={editor.isActive('link') ? 'primary' : 'text'}
            icon={<LinkOutlined />}
            onClick={() => {
              const previousUrl = editor.getAttributes('link').href;

              setLinkUrl(previousUrl || '');
            }}
          />
        </Tooltip>
      </Popover>
      <Divider vertical />

      {/* 撤销 */}
      <Tooltip title="撤销">
        <Button
          type="text"
          icon={<UndoOutlined />}
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        />
      </Tooltip>

      {/* 重做 */}
      <Tooltip title="重做">
        <Button
          type="text"
          icon={<RedoOutlined />}
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </Tooltip>
    </div>
  );
};
export default Toolbar;
