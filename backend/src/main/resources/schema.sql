CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  username VARCHAR(64) NOT NULL UNIQUE COMMENT '登录用户名',
  password_hash VARCHAR(128) NOT NULL COMMENT '密码哈希',
  phone VARCHAR(32) NULL UNIQUE COMMENT '联系电话',
  real_name VARCHAR(64) NULL COMMENT '真实姓名',
  address VARCHAR(256) NULL COMMENT '常用地址',
  status TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '账户状态：1启用 0禁用',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  code VARCHAR(32) NOT NULL UNIQUE COMMENT '角色编码：resident/admin/maintainer',
  name VARCHAR(64) NOT NULL COMMENT '角色名称',
  description VARCHAR(256) NULL COMMENT '角色描述',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  role_id BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uidx_user_roles_user_role (user_id, role_id),
  KEY idx_user_roles_user_id (user_id),
  KEY idx_user_roles_role_id (role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tool_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  name VARCHAR(64) NOT NULL UNIQUE COMMENT '分类名称',
  parent_id BIGINT UNSIGNED NULL COMMENT '父分类ID',
  description VARCHAR(256) NULL COMMENT '分类说明',
  created_by BIGINT UNSIGNED NULL COMMENT '创建者用户ID',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新者用户ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY idx_tool_categories_parent_id (parent_id),
  CONSTRAINT fk_tool_categories_parent FOREIGN KEY (parent_id) REFERENCES tool_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS warehouses (
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

CREATE TABLE IF NOT EXISTS tools (
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
  KEY idx_tools_warehouse_id (warehouse_id),
  CONSTRAINT fk_tools_category FOREIGN KEY (category_id) REFERENCES tool_categories(id),
  CONSTRAINT fk_tools_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rental_orders (
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
  KEY idx_rental_orders_approved_by (approved_by),
  CONSTRAINT fk_rental_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rental_order_items (
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
  KEY idx_order_items_warehouse_id (warehouse_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES rental_orders(id),
  CONSTRAINT fk_order_items_tool FOREIGN KEY (tool_id) REFERENCES tools(id),
  CONSTRAINT fk_order_items_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pickup_codes (
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
  KEY idx_pickup_codes_order_id (order_id),
  CONSTRAINT fk_pickup_codes_order FOREIGN KEY (order_id) REFERENCES rental_orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS maintenance_records (
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
  KEY idx_maint_handled_by (handled_by),
  CONSTRAINT fk_maint_tool FOREIGN KEY (tool_id) REFERENCES tools(id),
  CONSTRAINT fk_maint_order_item FOREIGN KEY (order_item_id) REFERENCES rental_order_items(id),
  CONSTRAINT fk_maint_handled_by FOREIGN KEY (handled_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
