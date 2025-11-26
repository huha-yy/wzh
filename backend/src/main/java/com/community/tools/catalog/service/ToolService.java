package com.community.tools.catalog.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.tools.catalog.entity.Tool;
import com.community.tools.catalog.mapper.ToolMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ToolService {
    private final ToolMapper toolMapper;

    public Page<Tool> list(int page, int size, Long categoryId, Long warehouseId, String keyword) {
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Tool> q = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        if (categoryId != null) q.eq("category_id", categoryId);
        if (warehouseId != null) q.eq("warehouse_id", warehouseId);
        if (keyword != null && !keyword.isEmpty()) q.like("name", keyword);
        return toolMapper.selectPage(Page.of(page, size), q);
    }
}

