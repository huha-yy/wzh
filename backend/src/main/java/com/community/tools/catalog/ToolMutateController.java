package com.community.tools.catalog;

import com.community.tools.catalog.entity.Tool;
import com.community.tools.catalog.mapper.ToolMapper;
import com.community.tools.common.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tools")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('MAINTAINER')")
public class ToolMutateController {
    private final ToolMapper mapper;

    @PostMapping
    public ApiResponse<Long> create(@RequestBody CreateReq req) {
        Tool t = new Tool();
        t.setCategoryId(req.categoryId);
        t.setWarehouseId(req.warehouseId);
        t.setName(req.name);
        t.setAssetCode(req.assetCode);
        t.setModelSpec(req.modelSpec);
        t.setRentalPrice(req.rentalPrice);
        t.setDeposit(req.deposit);
        t.setStatus(1);
        t.setStockTotal(req.stockTotal);
        t.setStockAvailable(req.stockAvailable);
        t.setDescription(req.description);
        mapper.insert(t);
        return ApiResponse.ok(t.getId());
    }

    @Data
    public static class CreateReq {
        public Long categoryId;
        public Long warehouseId;
        public String name;
        public String assetCode;
        public String modelSpec;
        public java.math.BigDecimal rentalPrice;
        public java.math.BigDecimal deposit;
        public Integer stockTotal;
        public Integer stockAvailable;
        public String description;
    }
}

