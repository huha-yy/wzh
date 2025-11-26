package com.community.tools.catalog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("tools")
public class Tool {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long categoryId;
    private Long warehouseId;
    private String name;
    private String assetCode;
    private String modelSpec;
    private BigDecimal rentalPrice;
    private BigDecimal deposit;
    private Integer status;
    private Integer stockTotal;
    private Integer stockAvailable;
    private String description;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

