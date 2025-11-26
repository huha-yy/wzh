# 数据库表结构设计（社区共享工具管理系统）—无外键版本

## 设计原则
- 表名与字段小写、下划线分隔；主键 `id` 使用 `bigint unsigned auto_increment`
- 每表包含四个通用字段：`created_by`、`updated_by`、`created_at`、`updated_at`
- 合理字段长度（2 的 n 次方），关键字段建立索引；本方案不使用任何数据库外键约束
- MySQL 8.0，`InnoDB` 引擎，`utf8mb4` 字符集

---

## 1. users（用户表）
用途：存储居民、后台管理人员、工具维护人员的账户信息

字段与约束：
- id bigint unsigned PK auto_increment
- username varchar(64) NOT NULL UNIQUE
- password_hash varchar(128) NOT NULL
- phone varchar(32) NULL UNIQUE
- real_name varchar(64) NULL
- status tinyint unsigned NOT NULL DEFAULT 1 COMMENT '1启用 0禁用'
- created_by bigint unsigned NULL
- updated_by bigint unsigned NULL
- created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
- updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

索引：
- uidx_users_username（UNIQUE）
- uidx_users_phone（UNIQUE）

SQL：
```sql
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  username VARCHAR(64) NOT NULL UNIQUE COMMENT '登录用户名',
  password_hash VARCHAR(128) NOT NULL COMMENT '密码哈希',
  phone VARCHAR(32) NULL UNIQUE COMMENT '联系电话',
  real_name VARCHAR(64) NULL COMMENT '真实姓名',
  status TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '账户状态：1启用 0禁用',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 2. roles（角色表）
用途：系统角色配置（resident、admin、maintainer）

字段与约束：
- id bigint unsigned PK auto_increment
- code varchar(32) NOT NULL UNIQUE COMMENT 'resident/admin/maintainer'
- name varchar(64) NOT NULL
- description varchar(256) NULL
- created_by, updated_by, created_at, updated_at 同上

SQL：
```sql
CREATE TABLE roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  code VARCHAR(32) NOT NULL UNIQUE COMMENT '角色编码：resident/admin/maintainer',
  name VARCHAR(64) NOT NULL COMMENT '角色名称',
  description VARCHAR(256) NULL COMMENT '角色描述',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 3. user_roles（用户角色关联表）
用途：用户与角色的多对多关系（无外键版本保留索引，不声明外键）

字段与约束：
- id bigint unsigned PK auto_increment
- user_id bigint unsigned NOT NULL
- role_id bigint unsigned NOT NULL
- created_by, updated_by, created_at, updated_at 同上

索引与唯一：
- uidx_user_roles_user_role UNIQUE(user_id, role_id)
- idx_user_roles_user_id
- idx_user_roles_role_id

SQL：
```sql
CREATE TABLE user_roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  role_id BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uidx_user_roles_user_role (user_id, role_id),
  KEY idx_user_roles_user_id (user_id),
  KEY idx_user_roles_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 4. tool_categories（工具分类表）
用途：工具类别层级管理（无外键版本保留 parent_id 索引）

字段与约束：
- id bigint unsigned PK auto_increment
- name varchar(64) NOT NULL UNIQUE
- parent_id bigint unsigned NULL
- description varchar(256) NULL
- created_by, updated_by, created_at, updated_at 同上

索引：
- idx_tool_categories_parent_id

SQL：
```sql
CREATE TABLE tool_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  name VARCHAR(64) NOT NULL UNIQUE COMMENT '分类名称',
  parent_id BIGINT UNSIGNED NULL COMMENT '父分类ID',
  description VARCHAR(256) NULL COMMENT '分类说明',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY idx_tool_categories_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. warehouses（维护库房/维护点表）
用途：工具存放与领取地点

字段与约束：
- id bigint unsigned PK auto_increment
- name varchar(64) NOT NULL
- address varchar(256) NULL
- contact_name varchar(64) NULL
- contact_phone varchar(32) NULL
- created_by, updated_by, created_at, updated_at 同上

索引：
- idx_warehouses_name

SQL：
```sql
CREATE TABLE warehouses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  name VARCHAR(64) NOT NULL COMMENT '库房/维护点名称',
  address VARCHAR(256) NULL COMMENT '详细地址',
  contact_name VARCHAR(64) NULL COMMENT '联系人',
  contact_phone VARCHAR(32) NULL COMMENT '联系电话',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY idx_warehouses_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 6. tools（工具表）
用途：工具基础信息与库存状态

字段与约束：
- id bigint unsigned PK auto_increment
- category_id bigint unsigned NOT NULL
- warehouse_id bigint unsigned NOT NULL
- name varchar(64) NOT NULL
- asset_code varchar(64) NOT NULL UNIQUE
- model_spec varchar(128) NULL
- rental_price decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '日租价'
- deposit decimal(10,2) NOT NULL DEFAULT 0.00
- status tinyint unsigned NOT NULL DEFAULT 1 COMMENT '1可借 2已借 3维修中'
- stock_total smallint unsigned NOT NULL DEFAULT 0
- stock_available smallint unsigned NOT NULL DEFAULT 0
- description varchar(256) NULL
- created_by, updated_by, created_at, updated_at 同上

索引：
- idx_tools_category_id
- idx_tools_warehouse_id
- uidx_tools_asset_code（UNIQUE）

SQL：
```sql
CREATE TABLE tools (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  category_id BIGINT UNSIGNED NOT NULL COMMENT '工具分类ID',
  warehouse_id BIGINT UNSIGNED NOT NULL COMMENT '所在库房ID',
  name VARCHAR(64) NOT NULL COMMENT '工具名称',
  asset_code VARCHAR(64) NOT NULL UNIQUE COMMENT '资产编码/唯一编号',
  model_spec VARCHAR(128) NULL COMMENT '型号规格',
  rental_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '日租价格',
  deposit DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '押金',
  status TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1可借 2已借 3维修中',
  stock_total SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '总库存数量',
  stock_available SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '可用库存数量',
  description VARCHAR(256) NULL COMMENT '工具描述/备注',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY idx_tools_category_id (category_id),
  KEY idx_tools_warehouse_id (warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 7. rental_orders（租赁订单表）
用途：居民提交的租赁订单与流程状态（pickup_code_id 保留但不声明外键）

字段与约束：
- id bigint unsigned PK auto_increment
- user_id bigint unsigned NOT NULL
- status tinyint unsigned NOT NULL DEFAULT 0 COMMENT '0待审核 1已通过 2已领取 3已申请归还 4已安排验收 5已完成 6已取消'
- total_amount decimal(10,2) NOT NULL DEFAULT 0.00
- approved_at datetime NULL
- approved_by bigint unsigned NULL
- picked_up_at datetime NULL
- return_applied_at datetime NULL
- completed_at datetime NULL
- pickup_code_id bigint unsigned NULL
- created_by, updated_by, created_at, updated_at 同上

索引：
- idx_rental_orders_user_id
- idx_rental_orders_status
- idx_rental_orders_approved_by

SQL：
```sql
CREATE TABLE rental_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '下单居民用户ID',
  status TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '订单状态：0待审核 1已通过 2已领取 3已申请归还 4已安排验收 5已完成 6已取消',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '订单总金额',
  approved_at DATETIME NULL COMMENT '审核时间',
  approved_by BIGINT UNSIGNED NULL COMMENT '审核人用户ID',
  picked_up_at DATETIME NULL COMMENT '领取时间',
  return_applied_at DATETIME NULL COMMENT '归还申请时间',
  completed_at DATETIME NULL COMMENT '完成时间',
  pickup_code_id BIGINT UNSIGNED NULL COMMENT '关联领取码ID',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY idx_rental_orders_user_id (user_id),
  KEY idx_rental_orders_status (status),
  KEY idx_rental_orders_approved_by (approved_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 8. rental_order_items（订单明细表）
用途：订单中的工具明细、数量与时长

字段与约束：
- id bigint unsigned PK auto_increment
- order_id bigint unsigned NOT NULL
- tool_id bigint unsigned NOT NULL
- warehouse_id bigint unsigned NOT NULL
- quantity smallint unsigned NOT NULL DEFAULT 1
- rental_days int unsigned NOT NULL DEFAULT 1
- unit_price decimal(10,2) NOT NULL DEFAULT 0.00
- amount decimal(10,2) NOT NULL DEFAULT 0.00
- status tinyint unsigned NOT NULL DEFAULT 0 COMMENT '0已锁定 1已领取 2已申请归还 3验收合格 4验收不合格 5已完成'
- created_by, updated_by, created_at, updated_at 同上

索引：
- idx_order_items_order_id
- idx_order_items_tool_id
- idx_order_items_warehouse_id

SQL：
```sql
CREATE TABLE rental_order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  order_id BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  tool_id BIGINT UNSIGNED NOT NULL COMMENT '工具ID',
  warehouse_id BIGINT UNSIGNED NOT NULL COMMENT '库房ID',
  quantity SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '租借数量',
  rental_days INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '租赁时长(天)',
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '单价(日)',
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '小计金额',
  status TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '明细状态：0已锁定 1已领取 2已申请归还 3验收合格 4验收不合格 5已完成',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY idx_order_items_order_id (order_id),
  KEY idx_order_items_tool_id (tool_id),
  KEY idx_order_items_warehouse_id (warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 9. pickup_codes（领取码/提取码表）
用途：锁定库存后生成的提取码，领取校验

字段与约束：
- id bigint unsigned PK auto_increment
- order_id bigint unsigned NOT NULL
- code varchar(32) NOT NULL UNIQUE
- expire_at datetime NULL
- used_at datetime NULL
- status tinyint unsigned NOT NULL DEFAULT 0 COMMENT '0生效 1已使用 2已过期 3已作废'
- created_by, updated_by, created_at, updated_at 同上

索引：
- uidx_pickup_codes_code（UNIQUE）
- idx_pickup_codes_order_id

SQL：
```sql
CREATE TABLE pickup_codes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  order_id BIGINT UNSIGNED NOT NULL COMMENT '关联订单ID',
  code VARCHAR(32) NOT NULL UNIQUE COMMENT '领取码',
  expire_at DATETIME NULL COMMENT '过期时间',
  used_at DATETIME NULL COMMENT '使用时间',
  status TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '领取码状态：0生效 1已使用 2已过期 3已作废',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY idx_pickup_codes_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 10. maintenance_records（维护/巡检/维修记录表）
用途：工具的巡检、维修、保养记录及验收结论

字段与约束：
- id bigint unsigned PK auto_increment
- tool_id bigint unsigned NOT NULL
- order_item_id bigint unsigned NULL COMMENT '如因归还不合格触发的维修则关联订单明细'
- type tinyint unsigned NOT NULL COMMENT '1巡检 2维修 3保养'
- result tinyint unsigned NULL COMMENT '1合格 2不合格 3已修复'
- title varchar(128) NOT NULL
- description text NULL
- handled_by bigint unsigned NULL COMMENT '维护人员ID'
- scheduled_at datetime NULL
- completed_at datetime NULL
- created_by, updated_by, created_at, updated_at 同上

索引：
- idx_maint_tool_id
- idx_maint_order_item_id
- idx_maint_handled_by

SQL：
```sql
CREATE TABLE maintenance_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  tool_id BIGINT UNSIGNED NOT NULL COMMENT '工具ID',
  order_item_id BIGINT UNSIGNED NULL COMMENT '关联订单明细ID(归还不合格触发维修时)',
  type TINYINT UNSIGNED NOT NULL COMMENT '类型：1巡检 2维修 3保养',
  result TINYINT UNSIGNED NULL COMMENT '结果：1合格 2不合格 3已修复',
  title VARCHAR(128) NOT NULL COMMENT '记录标题',
  description TEXT NULL COMMENT '详细说明',
  handled_by BIGINT UNSIGNED NULL COMMENT '维护人员用户ID',
  scheduled_at DATETIME NULL COMMENT '计划处理时间',
  completed_at DATETIME NULL COMMENT '完成时间',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY idx_maint_tool_id (tool_id),
  KEY idx_maint_order_item_id (order_item_id),
  KEY idx_maint_handled_by (handled_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 设计说明（无外键版本）
- 数据一致性维护方案：
  - 插入/更新前进行存在性校验：如 `order_id`、`tool_id` 等在应用层先查询确认存在；失败则拒绝写入
  - 使用事务保证跨表原子性：下单锁库存、生成领取码、状态更新等操作在同一事务中完成
  - 级联处理由服务层实现：删除用户/工具前，服务层检查并处理关联记录（软删除或状态迁移）
  - 定期一致性审计：离线任务通过 LEFT JOIN 检测孤儿记录并输出修复报告
  - 约束替代：保留必要唯一索引与业务校验（如领取码唯一、资产编码唯一）以降低错误概率
- 应用层完整性保障措施：
  - 统一领域服务封装写操作，避免绕过校验的直写；所有写请求必须走服务方法
  - 提供幂等接口与重试安全，防止并发下重复写入导致数据异常
  - 细粒度权限控制，限制对关键表的直接删除与越权更新
  - 完整的集成测试覆盖典型流程与异常流程（超期归还、验收不合格等）

---

## 方案对比分析（有外键 vs 无外键）
- 性能影响：
  - 无外键：写入路径无需外键校验与锁定，批量导入更快，水平拆分更灵活
  - 有外键：数据库保障一致性但写入有额外检查，复杂级联可能降低吞吐
- 数据安全性：
  - 无外键：数据库不阻拦无效引用，需应用层严控，存在孤儿数据风险
  - 有外键：强一致性，阻止无效引用与不合法删除，天然更安全
- 开发维护难度：
  - 无外键：迁移和分库更简单，但服务逻辑更复杂、测试成本更高
  - 有外键：业务代码更轻，迁移需谨慎（依赖顺序、级联影响），数据库设计更严谨

---

## 说明
- 本文件为无外键版本，仅移除外键约束；其余字段类型、默认值、唯一性与索引均保持不变
- 若需切换至有外键版本，请参考 `docs/db/schema.md`
