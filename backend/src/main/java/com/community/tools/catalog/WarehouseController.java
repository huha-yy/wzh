package com.community.tools.catalog;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.community.tools.catalog.entity.Warehouse;
import com.community.tools.catalog.mapper.WarehouseMapper;
import com.community.tools.common.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseMapper mapper;
    private final com.community.tools.catalog.mapper.ToolMapper toolMapper;

    @GetMapping
    public ApiResponse<List<Warehouse>> list(@RequestParam(name = "name", required = false) String name) {
        QueryWrapper<Warehouse> q = new QueryWrapper<>();
        if (name != null && !name.isEmpty()) q.like("name", name);
        return ApiResponse.ok(mapper.selectList(q));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Long> create(@RequestBody CreateReq req) {
        if (req.contactPhone != null && !req.contactPhone.isEmpty()) {
            if (!req.contactPhone.matches("^1[3-9]\\d{9}$")) return ApiResponse.error("联系电话格式不正确");
        }
        Warehouse w = new Warehouse();
        w.setName(req.name);
        w.setAddress(req.address);
        w.setContactName(req.contactName);
        w.setContactPhone(req.contactPhone);
        mapper.insert(w);
        return ApiResponse.ok(w.getId());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> update(@PathVariable Long id, @RequestBody CreateReq req) {
        Warehouse w = mapper.selectById(id);
        if (w == null) return ApiResponse.error("仓库不存在");
        if (req.contactPhone != null && !req.contactPhone.isEmpty()) {
            if (!req.contactPhone.matches("^1[3-9]\\d{9}$")) return ApiResponse.error("联系电话格式不正确");
        }
        if (req.name != null && !req.name.isEmpty()) w.setName(req.name);
        if (req.address != null) w.setAddress(req.address);
        if (req.contactName != null) w.setContactName(req.contactName);
        if (req.contactPhone != null) w.setContactPhone(req.contactPhone);
        mapper.updateById(w);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        Warehouse w = mapper.selectById(id);
        if (w == null) return ApiResponse.error("仓库不存在");
        Long ref = toolMapper.selectCount(new QueryWrapper<com.community.tools.catalog.entity.Tool>().eq("warehouse_id", id));
        if (ref != null && ref > 0) return ApiResponse.error("该仓库仍被工具引用，无法删除");
        mapper.deleteById(id);
        return ApiResponse.ok(null);
    }

    @Data
    public static class CreateReq {
        public String name;
        public String address;
        public String contactName;
        public String contactPhone;
    }
}

