import * as React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import styles from './index.module.less';
import Toolbar from '@/components/RichTextEditor/Toolbar';

interface RichTextEditorProps {
  // 受控值（antd Form.Item 会自动注入）
  value?: string;
  // 内容变化回调（antd Form.Item 会自动注入）
  onChange?: (value: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  // 初始内容：优先受控 value，其次默认 content

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: value,
    // 内容变化时同步给 Form.Item
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  // 受控模式：外部 value 变化（如编辑回填）时同步到编辑器
  // 仅当外部值与编辑器当前 HTML 不一致时才更新，避免输入时光标跳动
  React.useEffect(() => {
    if (!editor || value === undefined) return;
    const currentHtml = editor.getHTML();
    if (value !== currentHtml) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className={styles.editor}>
      <Toolbar editor={editor} />

      <div className={styles.content}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
