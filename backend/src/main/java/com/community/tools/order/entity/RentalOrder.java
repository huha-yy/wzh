package com.community.tools.order.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("rental_orders")
public class RentalOrder {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Integer status;
    private BigDecimal totalAmount;
    private LocalDateTime approvedAt;
    private Long approvedBy;
    private LocalDateTime pickedUpAt;
    private LocalDateTime returnAppliedAt;
    private LocalDateTime completedAt;
    private Long pickupCodeId;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

