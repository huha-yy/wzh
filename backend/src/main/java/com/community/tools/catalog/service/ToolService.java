package com.community.tools.catalog.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.tools.catalog.entity.Tool;
import com.community.tools.catalog.mapper.ToolMapper;
import com.community.tools.order.entity.RentalOrderItem;
import com.community.tools.order.mapper.RentalOrderItemMapper;
import com.community.tools.order.mapper.RentalOrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ToolService {
    private final ToolMapper toolMapper;
    private final RentalOrderItemMapper orderItemMapper;
    private final RentalOrderMapper orderMapper;

    public Page<Tool> list(int page, int size, Long categoryId, Long warehouseId, String keyword) {
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Tool> q = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        if (categoryId != null) q.eq("category_id", categoryId);
        if (warehouseId != null) q.eq("warehouse_id", warehouseId);
        if (keyword != null && !keyword.isEmpty()) q.like("name", keyword);
        return toolMapper.selectPage(Page.of(page, size), q);
    }

    public Page<Tool> lowStock(int page, int size, Integer threshold, Long categoryId, Long warehouseId) {
        int th = threshold == null ? 5 : threshold;
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Tool> q = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        q.le("stock_available", th).eq("status", 1);
        if (categoryId != null) q.eq("category_id", categoryId);
        if (warehouseId != null) q.eq("warehouse_id", warehouseId);
        q.orderByAsc("stock_available");
        return toolMapper.selectPage(Page.of(page, size), q);
    }

    /**
     * 检查指定工具是否被指定用户借用（未归还）
     * @param toolId 工具ID
     * @param userId 用户ID
     * @return true表示用户当前借了这个工具，false表示没有借或已归还
     */
    public boolean isToolBorrowedByUser(Long toolId, Long userId) {
        // 查询该用户是否有未归还的订单项（状态为1:已领取 或 2:已申请归还）
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<RentalOrderItem> itemQuery =
            new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        itemQuery.eq("tool_id", toolId)
                 .in("status", java.util.Arrays.asList(1, 2)); // 1:已领取, 2:已申请归还

        java.util.List<RentalOrderItem> items = orderItemMapper.selectList(itemQuery);

        // 检查这些订单项是否属于当前用户
        for (RentalOrderItem item : items) {
            com.community.tools.order.entity.RentalOrder order = orderMapper.selectById(item.getOrderId());
            if (order != null && order.getUserId().equals(userId)) {
                return true;
            }
        }

        return false;
    }
}

