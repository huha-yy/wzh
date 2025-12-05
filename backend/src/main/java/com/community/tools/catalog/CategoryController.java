package com.community.tools.catalog;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.community.tools.catalog.entity.ToolCategory;
import com.community.tools.catalog.mapper.ToolCategoryMapper;
import com.community.tools.common.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final ToolCategoryMapper mapper;

    @GetMapping
    public ApiResponse<List<ToolCategory>> list(@RequestParam(name = "parentId", required = false) Long parentId) {
        QueryWrapper<ToolCategory> q = new QueryWrapper<>();
        if (parentId != null) q.eq("parent_id", parentId);
        return ApiResponse.ok(mapper.selectList(q));
    }

    @PostMapping
    public ApiResponse<Long> create(@RequestBody CreateReq req) {
        ToolCategory c = new ToolCategory();
        c.setName(req.name);
        c.setParentId(req.parentId);
        c.setDescription(req.description);
        mapper.insert(c);
        return ApiResponse.ok(c.getId());
    }

    @Data
    public static class CreateReq {
        public String name;
        public Long parentId;
        public String description;
    }
}

