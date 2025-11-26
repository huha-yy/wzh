package com.community.tools.catalog;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.tools.catalog.entity.Tool;
import com.community.tools.catalog.service.ToolService;
import com.community.tools.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tools")
@RequiredArgsConstructor
public class ToolController {
    private final ToolService toolService;

    @GetMapping
    public ApiResponse<Page<Tool>> list(@RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "10") int size,
                                        @RequestParam(required = false) Long categoryId,
                                        @RequestParam(required = false) Long warehouseId,
                                        @RequestParam(required = false) String keyword) {
        return ApiResponse.ok(toolService.list(page, size, categoryId, warehouseId, keyword));
    }
}

