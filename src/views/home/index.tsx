import * as React from 'react';
import { Card, Col, Row } from 'antd';
import Icon from '@/components/Icon';
import styles from './index.module.less';

interface FeatureItem {
  icon: string;
  title: string;
  desc: string;
}

interface ModuleGroup {
  key: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  features: FeatureItem[];
}

// 系统模块分组：按功能域介绍各模块能力
const MODULE_GROUPS: ModuleGroup[] = [
  {
    key: 'system',
    title: '系统管理',
    desc: '维护平台的组织、账号、权限与日志',
    icon: 'mdi:shield-account',
    color: '#1677ff',
    features: [
      {
        icon: 'mdi:account-multiple-outline',
        title: '用户管理',
        desc: '账号查询、新增、编辑、删除与导出，支持按部门树筛选。',
      },
      {
        icon: 'mdi:sitemap',
        title: '部门管理',
        desc: '维护组织架构树，支持部门新增、修改、删除与层级调整。',
      },
      {
        icon: 'mdi:menu',
        title: '菜单管理',
        desc: '配置系统菜单与按钮权限，支持排序、显隐与层级维护。',
      },
      {
        icon: 'mdi:shield-account',
        title: '角色管理',
        desc: '维护角色，并为角色分配菜单与按钮操作权限。',
      },
      {
        icon: 'mdi:book-open-variant',
        title: '字典管理',
        desc: '统一维护字典类型与字典项，支持启用 / 停用。',
      },
      {
        icon: 'mdi:bullhorn',
        title: '公告管理',
        desc: '公告新建、发布、下架、置顶与批量操作。',
      },
      {
        icon: 'mdi:clipboard-list',
        title: '操作日志',
        desc: '记录并查询系统操作日志，支持条件筛选与导出。',
      },
      {
        icon: 'mdi:login',
        title: '登录日志',
        desc: '记录用户登录行为与来源信息，支持查询与导出。',
      },
    ],
  },
  {
    key: 'monitor',
    title: '系统监控',
    desc: '实时掌握系统运行状态与资源使用情况',
    icon: 'mdi:monitor',
    color: '#14b8a6',
    features: [
      {
        icon: 'mdi:account-supervisor',
        title: '在线用户',
        desc: '查看在线会话与登录信息，支持强制下线。',
      },
      {
        icon: 'mdi:server',
        title: '服务监控',
        desc: '展示服务器 CPU、内存、磁盘等运行指标。',
      },
      {
        icon: 'mdi:database',
        title: 'Redis 监控',
        desc: '查看 Redis 运行状态、内存占用与命令统计。',
      },
      {
        icon: 'mdi:database-sync',
        title: '数据源监控',
        desc: '连接池与 SQL 执行概览，支持跳转数据源控制台。',
      },
    ],
  },
  {
    key: 'profile',
    title: '个人中心',
    desc: '管理个人资料与账号安全',
    icon: 'mdi:account-circle-outline',
    color: '#7c3aed',
    features: [
      {
        icon: 'mdi:account',
        title: '基本资料',
        desc: '查看并修改个人基础信息，变更记录写入操作日志。',
      },
      {
        icon: 'mdi:lock',
        title: '密码安全',
        desc: '修改登录密码，修改成功后需重新登录。',
      },
    ],
  },
];

// 平台特性
const TRAITS: FeatureItem[] = [
  { icon: 'mdi:shield-lock', title: 'RBAC 权限控制', desc: '' },
  { icon: 'mdi:route', title: '动态路由菜单', desc: '' },
  { icon: 'mdi:view-dashboard', title: '标签页缓存', desc: '' },
  { icon: 'mdi:palette', title: '亮色 / 暗色主题', desc: '' },
  { icon: 'mdi:devices', title: '响应式布局', desc: '' },
  { icon: 'mdi:api', title: '统一请求封装', desc: '' },
  { icon: 'mdi:language-typescript', title: 'TypeScript 类型约束', desc: '' },
  { icon: 'mdi:alert-circle-outline', title: '403 / 404 与错误边界', desc: '' },
];

// 顶部横幅技术栈
const TECH_TAGS = ['React 19', 'TypeScript', 'Ant Design', 'Vite', 'Redux Toolkit', 'ECharts'];

// 顶部统计
const STATS = [
  { value: '13', label: '功能模块' },
  { value: '3', label: '功能分组' },
  { value: '1', label: '权限体系' },
];

const Home: React.FC = () => {
  return (
    <div className={styles.homePage}>
      {/* 顶部横幅 */}
      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          <div className={styles.bannerBadge}>
            <Icon icon="mdi:rocket-launch-outline" size={16} />
            <span>企业级后台管理平台</span>
          </div>
          <h1 className={styles.bannerTitle}>Terra Admin 管理系统</h1>
          <p className={styles.bannerDesc}>
            基于 React + TypeScript + Ant Design 构建的一体化后台管理系统，内置完善的权限体系、系统管理能力与运行监控能力，帮助团队快速搭建与维护业务后台。
          </p>
          <div className={styles.bannerTags}>
            {TECH_TAGS.map((tag) => (
              <span key={tag} className={styles.bannerTag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.bannerStats}>
          {STATS.map((stat) => (
            <div key={stat.label} className={styles.statItem}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 系统模块 */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>系统模块</h2>
        <span className={styles.sectionDesc}>按功能域划分，覆盖日常管理全部场景</span>
      </div>

      <Row gutter={[20, 0]}>
        {MODULE_GROUPS.map((group) => (
          <Col key={group.key} xs={24} md={12} xl={8}>
            <Card className={styles.moduleCard}>
              <div className={styles.moduleHeader}>
                <span
                  className={styles.moduleIcon}
                  style={{ color: group.color, background: `${group.color}1a` }}
                >
                  <Icon icon={group.icon} size={22} />
                </span>
                <div>
                  <div className={styles.moduleTitle}>{group.title}</div>
                  <div className={styles.moduleDesc}>{group.desc}</div>
                </div>
              </div>

              <div className={styles.featureList}>
                {group.features.map((feature) => (
                  <div key={feature.title} className={styles.featureItem}>
                    <span className={styles.featureIcon} style={{ color: group.color }}>
                      <Icon icon={feature.icon} size={15} />
                    </span>
                    <div>
                      <div className={styles.featureTitle}>{feature.title}</div>
                      <div className={styles.featureDesc}>{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 平台特性 */}
      <div className={styles.sectionHeader} style={{ marginTop: 4 }}>
        <h2 className={styles.sectionTitle}>平台特性</h2>
        <span className={styles.sectionDesc}>开箱即用的基础能力</span>
      </div>

      <Card className={styles.traitCard}>
        <div className={styles.traitList}>
          {TRAITS.map((trait) => (
            <div key={trait.title} className={styles.traitItem}>
              <Icon icon={trait.icon} size={16} />
              <span>{trait.title}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Home;
