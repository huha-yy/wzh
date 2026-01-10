-- 添加用户地址字段
-- 执行时间: 2026-01-10

ALTER TABLE users ADD COLUMN address VARCHAR(256) NULL COMMENT '常用地址' AFTER real_name;
