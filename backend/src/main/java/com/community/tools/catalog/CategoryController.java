package com.community.tools.catalog;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.community.tools.catalog.entity.ToolCategory;
import com.community.tools.catalog.mapper.ToolCategoryMapper;
import com.community.tools.common.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final ToolCategoryMapper mapper;
    private final com.community.tools.catalog.mapper.ToolMapper toolMapper;

    @GetMapping
    public ApiResponse<List<ToolCategory>> list(@RequestParam(name = "parentId", required = false) Long parentId) {
        QueryWrapper<ToolCategory> q = new QueryWrapper<>();
        if (parentId != null) q.eq("parent_id", parentId);
        return ApiResponse.ok(mapper.selectList(q));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Long> create(@RequestBody CreateReq req) {
        if (req.name == null || req.name.isEmpty()) return ApiResponse.error("名称不能为空");
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<ToolCategory> q = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<ToolCategory>().eq("name", req.name);
        if (req.parentId == null) q.isNull("parent_id"); else q.eq("parent_id", req.parentId);
        Long exists = mapper.selectCount(q);
        if (exists != null && exists > 0) return ApiResponse.error("同级分类名称已存在");
        ToolCategory c = new ToolCategory();
        c.setName(req.name);
        c.setParentId(req.parentId);
        c.setDescription(req.description);
        mapper.insert(c);
        return ApiResponse.ok(c.getId());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> update(@PathVariable Long id, @RequestBody CreateReq req) {
        ToolCategory c = mapper.selectById(id);
        if (c == null) return ApiResponse.error("分类不存在");
        Long targetParent = req.parentId != null ? req.parentId : c.getParentId();
        String targetName = (req.name != null && !req.name.isEmpty()) ? req.name : c.getName();
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<ToolCategory> q = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<ToolCategory>().eq("name", targetName);
        if (targetParent == null) q.isNull("parent_id"); else q.eq("parent_id", targetParent);
        q.ne("id", id);
        Long exists = mapper.selectCount(q);
        if (exists != null && exists > 0) return ApiResponse.error("同级分类名称已存在");
        if (req.name != null && !req.name.isEmpty()) c.setName(req.name);
        c.setDescription(req.description);
        if (req.parentId != null) c.setParentId(req.parentId);
        mapper.updateById(c);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        ToolCategory c = mapper.selectById(id);
        if (c == null) return ApiResponse.error("分类不存在");
        Long children = mapper.selectCount(new QueryWrapper<ToolCategory>().eq("parent_id", id));
        if (children != null && children > 0) return ApiResponse.error("该分类存在子分类，无法删除");
        Long ref = toolMapper.selectCount(new QueryWrapper<com.community.tools.catalog.entity.Tool>().eq("category_id", id));
        if (ref != null && ref > 0) return ApiResponse.error("该分类仍被工具引用，无法删除");
        mapper.deleteById(id);
        return ApiResponse.ok(null);
    }

    @Data
    public static class CreateReq {
        public String name;
        public Long parentId;
        public String description;
    }
}

