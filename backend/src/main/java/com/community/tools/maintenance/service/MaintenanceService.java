package com.community.tools.maintenance.service;

import com.community.tools.maintenance.entity.MaintenanceRecord;
import com.community.tools.maintenance.mapper.MaintenanceRecordMapper;
import com.community.tools.order.entity.RentalOrder;
import com.community.tools.order.entity.RentalOrderItem;
import com.community.tools.order.mapper.RentalOrderMapper;
import com.community.tools.order.mapper.RentalOrderItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MaintenanceService {
    private final MaintenanceRecordMapper recordMapper;
    private final RentalOrderMapper orderMapper;
    private final RentalOrderItemMapper itemMapper;

    @Transactional
    public MaintenanceRecord saveRecord(MaintenanceRecord record) {
        recordMapper.insert(record);
        return record;
    }

    @Transactional
    public void completeInspection(Long orderItemId, boolean qualified) {
        MaintenanceRecord r = new MaintenanceRecord();
        r.setOrderItemId(orderItemId);
        r.setType(1);
        r.setResult(qualified ? 1 : 2);
        r.setTitle("inspection");
        r.setCompletedAt(LocalDateTime.now());
        RentalOrderItem item = itemMapper.selectById(orderItemId);
        if (item == null) throw new RuntimeException("order item not found");
        r.setToolId(item.getToolId());
        recordMapper.insert(r);

        if (item != null) {
            item.setStatus(qualified ? 3 : 4);
            itemMapper.updateById(item);
            java.util.List<RentalOrderItem> items = itemMapper.selectList(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<RentalOrderItem>().eq("order_id", item.getOrderId()));
            boolean allQualified = items.stream().allMatch(it -> it.getStatus() != null && it.getStatus() == 3);
            if (allQualified) {
                RentalOrder order = orderMapper.selectById(item.getOrderId());
                if (order != null) {
                    order.setStatus(5);
                    order.setCompletedAt(LocalDateTime.now());
                    orderMapper.updateById(order);
                }
            }
        }
    }

    @Transactional
    public void closeOrder(Long orderId) {
        RentalOrder order = orderMapper.selectById(orderId);
        order.setStatus(5);
        order.setCompletedAt(LocalDateTime.now());
        orderMapper.updateById(order);
    }

    @Transactional
    public void scheduleInspection(Long orderId, LocalDateTime scheduledAt, Long inspectorId, String note) {
        MaintenanceRecord r = new MaintenanceRecord();
        r.setOrderItemId(null);
        r.setType(1);
        r.setTitle("schedule");
        r.setScheduledAt(scheduledAt);
        if (inspectorId != null) r.setHandledBy(inspectorId);
        if (note != null && !note.isEmpty()) r.setDescription(note);
        java.util.List<RentalOrderItem> relatedItems = itemMapper.selectList(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<RentalOrderItem>().eq("order_id", orderId));
        if (relatedItems == null || relatedItems.isEmpty()) {
            throw new RuntimeException("order has no items");
        }
        r.setToolId(relatedItems.get(0).getToolId());
        recordMapper.insert(r);
        RentalOrder order = orderMapper.selectById(orderId);
        order.setStatus(4);
        orderMapper.updateById(order);
    }

    public com.baomidou.mybatisplus.extension.plugins.pagination.Page<MaintenanceRecord> pageRecords(int page, int size, com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<MaintenanceRecord> q) {
        return recordMapper.selectPage(com.baomidou.mybatisplus.extension.plugins.pagination.Page.of(page, size), q);
    }

    public com.community.tools.maintenance.MaintenanceController.MaintStats stats() {
        com.community.tools.maintenance.MaintenanceController.MaintStats s = new com.community.tools.maintenance.MaintenanceController.MaintStats();
        java.util.Map<Integer, Long> typeCounts = new java.util.LinkedHashMap<>();
        for (int t = 1; t <= 3; t++) {
            typeCounts.put(t, recordMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<MaintenanceRecord>().eq("type", t)));
        }
        java.time.LocalDate today = java.time.LocalDate.now();
        java.util.Map<String, Long> last7Scheduled = new java.util.LinkedHashMap<>();
        java.util.Map<String, Long> last7Completed = new java.util.LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            java.time.LocalDate d = today.minusDays(i);
            java.time.LocalDateTime start = d.atStartOfDay();
            java.time.LocalDateTime end = d.atTime(23,59,59);
            Long sc = recordMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<MaintenanceRecord>().ge("scheduled_at", start).le("scheduled_at", end));
            Long cc = recordMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<MaintenanceRecord>().ge("completed_at", start).le("completed_at", end));
            last7Scheduled.put(d.toString(), sc);
            last7Completed.put(d.toString(), cc);
        }
        s.setTypeCounts(typeCounts);
        s.setLast7Scheduled(last7Scheduled);
        s.setLast7Completed(last7Completed);
        return s;
    }

    public java.util.List<Long> findOrderItemIds(Long orderId) {
        java.util.List<RentalOrderItem> items = itemMapper.selectList(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<RentalOrderItem>().eq("order_id", orderId));
        java.util.List<Long> ids = new java.util.ArrayList<>();
        for (RentalOrderItem it : items) ids.add(it.getId());
        return ids;
    }

    public java.util.List<Long> findOrderToolIds(Long orderId) {
        java.util.List<RentalOrderItem> items = itemMapper.selectList(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<RentalOrderItem>().eq("order_id", orderId));
        java.util.Set<Long> set = new java.util.LinkedHashSet<>();
        for (RentalOrderItem it : items) set.add(it.getToolId());
        return new java.util.ArrayList<>(set);
    }
}
