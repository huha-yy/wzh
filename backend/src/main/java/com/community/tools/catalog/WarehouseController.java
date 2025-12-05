package com.community.tools.catalog;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.community.tools.catalog.entity.Warehouse;
import com.community.tools.catalog.mapper.WarehouseMapper;
import com.community.tools.common.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseMapper mapper;

    @GetMapping
    public ApiResponse<List<Warehouse>> list(@RequestParam(name = "name", required = false) String name) {
        QueryWrapper<Warehouse> q = new QueryWrapper<>();
        if (name != null && !name.isEmpty()) q.like("name", name);
        return ApiResponse.ok(mapper.selectList(q));
    }

    @PostMapping
    public ApiResponse<Long> create(@RequestBody CreateReq req) {
        Warehouse w = new Warehouse();
        w.setName(req.name);
        w.setAddress(req.address);
        w.setContactName(req.contactName);
        w.setContactPhone(req.contactPhone);
        mapper.insert(w);
        return ApiResponse.ok(w.getId());
    }

    @Data
    public static class CreateReq {
        public String name;
        public String address;
        public String contactName;
        public String contactPhone;
    }
}

