package com.community.tools.order.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("pickup_codes")
public class PickupCode {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long orderId;
    private String code;
    private LocalDateTime expireAt;
    private LocalDateTime usedAt;
    private Integer status;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

