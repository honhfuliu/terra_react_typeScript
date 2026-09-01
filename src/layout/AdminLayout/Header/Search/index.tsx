import * as React from 'react';
import styles from './index.module.less';
import { Grid, Input, Modal, Divider } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import Enter from '@/assets/svgs/Enter.svg?react';
import Up from '@/assets/svgs/Up.svg?react';
import Down from '@/assets/svgs/Down.svg?react';
import ESC from '@/assets/svgs/ESC.svg?react';
const Search: React.FC = () => {
  // 响应式处理
  const screens = Grid.useBreakpoint();
  // 对话框控制
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={styles.layout}>
      <div>
        {screens.lg && (
          <div
            className={styles.search}
            onClick={() => {
              setIsModalOpen(true);
            }}
          >
            <SearchOutlined style={{ fontSize: 14, cursor: 'pointer' }} />
            <span className={styles.text}>搜索菜单</span>
          </div>
        )}
        {!screens.lg && (
          <div
            onClick={() => {
              setIsModalOpen(true);
            }}
          >
            <SearchOutlined style={{ fontSize: 16, cursor: 'pointer' }} />
          </div>
        )}
      </div>
      {/*搜索框*/}
      <div>
        <Modal
          rootClassName={styles.full_modal}
          width={600}
          className={styles.custom_modal}
          title={
            <div className={styles.modal_title}>
              <div>
                <Input prefix={<SearchOutlined />} placeholder={'输入关键字搜索菜单'} />
              </div>
            </div>
          }
          closable
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          footer={null}
        >
          <div>
            <div>
              <Divider />
            </div>
            <div className={styles.modal_body}>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
              <p>Some contents...</p>
            </div>
            <div>
              <div>
                <Divider />
              </div>
            </div>
            <div className={styles.modal_footer}>
              <div className={styles.modal_footer_layout}>
                <div className={styles.footer_left}>
                  <div className={styles.footer_item}>
                    <div className={styles.footer_bg}>
                      <Up width={16} height={16} />
                    </div>
                  </div>
                  <div className={styles.footer_item}>
                    <div className={styles.footer_bg}>
                      <Down width={16} height={16} />
                    </div>
                    <span className={styles.footer_text}>导航</span>
                  </div>
                  <div className={styles.footer_item}>
                    <div className={styles.footer_bg}>
                      <ESC width={28} height={20} />
                    </div>
                    <span className={styles.footer_text}>关闭</span>
                  </div>
                  <div className={styles.footer_item}>
                    <div className={styles.footer_bg}>
                      <Enter width={20} height={16} />
                    </div>
                    <span className={styles.footer_text}>选择</span>
                  </div>
                </div>
                <div className={styles.footer_right}>共 0 项</div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
export default Search;
