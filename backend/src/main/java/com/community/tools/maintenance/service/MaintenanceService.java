package com.community.tools.maintenance.service;

import com.community.tools.maintenance.entity.MaintenanceRecord;
import com.community.tools.maintenance.mapper.MaintenanceRecordMapper;
import com.community.tools.order.entity.RentalOrder;
import com.community.tools.order.mapper.RentalOrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MaintenanceService {
    private final MaintenanceRecordMapper recordMapper;
    private final RentalOrderMapper orderMapper;

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
        recordMapper.insert(r);
    }

    @Transactional
    public void closeOrder(Long orderId) {
        RentalOrder order = orderMapper.selectById(orderId);
        order.setStatus(5);
        order.setCompletedAt(LocalDateTime.now());
        orderMapper.updateById(order);
    }
}

