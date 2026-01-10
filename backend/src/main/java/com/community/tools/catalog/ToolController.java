package com.community.tools.catalog;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.tools.catalog.entity.Tool;
import com.community.tools.catalog.service.ToolService;
import com.community.tools.common.ApiResponse;
import com.community.tools.system.entity.User;
import com.community.tools.system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tools")
@RequiredArgsConstructor
public class ToolController {
    private final ToolService toolService;
    private final UserService userService;

    @GetMapping
    public ApiResponse<Page<ToolVO>> list(@RequestParam(name = "page", defaultValue = "1") int page,
                                        @RequestParam(name = "size", defaultValue = "10") int size,
                                        @RequestParam(name = "categoryId", required = false) Long categoryId,
                                        @RequestParam(name = "warehouseId", required = false) Long warehouseId,
                                        @RequestParam(name = "keyword", required = false) String keyword) {
        // 获取当前用户ID
        Long currentUserId = null;
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                User user = userService.getUserByUsername(auth.getName());
                if (user != null) {
                    currentUserId = user.getId();
                }
            }
        } catch (Exception e) {
            // 如果获取用户失败，继续执行，只是不显示借用状态
        }

        Page<Tool> toolPage = toolService.list(page, size, categoryId, warehouseId, keyword);
        Page<ToolVO> result = new Page<>(toolPage.getCurrent(), toolPage.getSize(), toolPage.getTotal());

        java.util.List<ToolVO> voList = new java.util.ArrayList<>();
        for (Tool tool : toolPage.getRecords()) {
            ToolVO vo = new ToolVO();
            vo.setId(tool.getId());
            vo.setCategoryId(tool.getCategoryId());
            vo.setWarehouseId(tool.getWarehouseId());
            vo.setName(tool.getName());
            vo.setAssetCode(tool.getAssetCode());
            vo.setModelSpec(tool.getModelSpec());
            vo.setRentalPrice(tool.getRentalPrice());
            vo.setDeposit(tool.getDeposit());
            vo.setStatus(tool.getStatus());
            vo.setStockTotal(tool.getStockTotal());
            vo.setStockAvailable(tool.getStockAvailable());
            vo.setDescription(tool.getDescription());
            vo.setCreatedBy(tool.getCreatedBy());
            vo.setUpdatedBy(tool.getUpdatedBy());
            vo.setCreatedAt(tool.getCreatedAt());
            vo.setUpdatedAt(tool.getUpdatedAt());

            // 检查当前用户是否借了这个工具
            if (currentUserId != null) {
                boolean borrowed = toolService.isToolBorrowedByUser(tool.getId(), currentUserId);
                vo.setBorrowedByCurrentUser(borrowed);
            } else {
                vo.setBorrowedByCurrentUser(false);
            }

            voList.add(vo);
        }
        result.setRecords(voList);

        return ApiResponse.ok(result);
    }

    @lombok.Data
    public static class ToolVO {
        private Long id;
        private Long categoryId;
        private Long warehouseId;
        private String name;
        private String assetCode;
        private String modelSpec;
        private java.math.BigDecimal rentalPrice;
        private java.math.BigDecimal deposit;
        private Integer status;
        private Integer stockTotal;
        private Integer stockAvailable;
        private String description;
        private Long createdBy;
        private Long updatedBy;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime updatedAt;
        private Boolean borrowedByCurrentUser;
    }

    @GetMapping("/low-stock")
    public ApiResponse<Page<Tool>> lowStock(@RequestParam(name = "page", defaultValue = "1") int page,
                                            @RequestParam(name = "size", defaultValue = "10") int size,
                                            @RequestParam(name = "threshold", required = false) Integer threshold,
                                            @RequestParam(name = "categoryId", required = false) Long categoryId,
                                            @RequestParam(name = "warehouseId", required = false) Long warehouseId) {
        return ApiResponse.ok(toolService.lowStock(page, size, threshold, categoryId, warehouseId));
    }
}

