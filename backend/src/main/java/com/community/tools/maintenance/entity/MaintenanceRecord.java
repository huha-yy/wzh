package com.community.tools.maintenance.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("maintenance_records")
public class MaintenanceRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long toolId;
    private Long orderItemId;
    private Integer type;
    private Integer result;
    private String title;
    private String description;
    private Long handledBy;
    private LocalDateTime scheduledAt;
    private LocalDateTime completedAt;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

