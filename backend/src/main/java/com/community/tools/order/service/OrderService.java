package com.community.tools.order.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.community.tools.catalog.entity.Tool;
import com.community.tools.catalog.mapper.ToolMapper;
import com.community.tools.order.entity.PickupCode;
import com.community.tools.order.entity.RentalOrder;
import com.community.tools.order.entity.RentalOrderItem;
import com.community.tools.order.mapper.PickupCodeMapper;
import com.community.tools.order.mapper.RentalOrderItemMapper;
import com.community.tools.order.mapper.RentalOrderMapper;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final RentalOrderMapper orderMapper;
    private final RentalOrderItemMapper itemMapper;
    private final PickupCodeMapper pickupCodeMapper;
    private final ToolMapper toolMapper;

    @Transactional
    public RentalOrder createOrder(Long userId, Long toolId, Long warehouseId, int quantity, int rentalDays, BigDecimal unitPrice) {
        Tool tool = toolMapper.selectById(toolId);
        if (tool == null || tool.getStockAvailable() == null || tool.getStockAvailable() < quantity) throw new RuntimeException("stock not enough");
        tool.setStockAvailable(tool.getStockAvailable() - quantity);
        toolMapper.updateById(tool);

        RentalOrder order = new RentalOrder();
        order.setUserId(userId);
        order.setStatus(0);
        order.setTotalAmount(unitPrice.multiply(BigDecimal.valueOf(quantity)).multiply(BigDecimal.valueOf(rentalDays)));
        orderMapper.insert(order);

        RentalOrderItem item = new RentalOrderItem();
        item.setOrderId(order.getId());
        item.setToolId(toolId);
        item.setWarehouseId(warehouseId);
        item.setQuantity(quantity);
        item.setRentalDays(rentalDays);
        item.setUnitPrice(unitPrice);
        item.setAmount(unitPrice.multiply(BigDecimal.valueOf(quantity)).multiply(BigDecimal.valueOf(rentalDays)));
        item.setStatus(0);
        itemMapper.insert(item);
        return order;
    }

    @Transactional
    public PickupCode approveAndGenerateCode(Long orderId, Long adminId) {
        RentalOrder order = orderMapper.selectById(orderId);
        if (order == null) throw new RuntimeException("order not found");
        order.setStatus(1);
        order.setApprovedBy(adminId);
        order.setApprovedAt(LocalDateTime.now());
        orderMapper.updateById(order);
        PickupCode code = new PickupCode();
        code.setOrderId(orderId);
        code.setCode(UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        code.setExpireAt(LocalDateTime.now().plusDays(2));
        code.setStatus(0);
        pickupCodeMapper.insert(code);
        order.setPickupCodeId(code.getId());
        orderMapper.updateById(order);
        return code;
    }

    @Transactional
    public void usePickupCode(String code) {
        PickupCode pc = pickupCodeMapper.selectOne(new QueryWrapper<PickupCode>().eq("code", code));
        if (pc == null || pc.getStatus() != 0) throw new RuntimeException("code invalid");
        pc.setStatus(1);
        pc.setUsedAt(LocalDateTime.now());
        pickupCodeMapper.updateById(pc);
        RentalOrder order = orderMapper.selectById(pc.getOrderId());
        order.setStatus(2);
        order.setPickedUpAt(LocalDateTime.now());
        orderMapper.updateById(order);
    }

    public com.baomidou.mybatisplus.extension.plugins.pagination.Page<RentalOrder> query(int page, int size, String startDate, String endDate, Integer status, Long userId) {
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<RentalOrder> q = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        if (status != null) q.eq("status", status);
        if (userId != null) q.eq("user_id", userId);
        if (startDate != null && !startDate.isEmpty()) q.ge("created_at", java.time.LocalDateTime.parse(startDate));
        if (endDate != null && !endDate.isEmpty()) q.le("created_at", java.time.LocalDateTime.parse(endDate));
        q.orderByDesc("created_at");
        return orderMapper.selectPage(com.baomidou.mybatisplus.extension.plugins.pagination.Page.of(page, size), q);
    }

    public com.community.tools.order.OrderController.OrderDetailVO detail(Long id) {
        RentalOrder order = orderMapper.selectById(id);
        java.util.List<RentalOrderItem> items = itemMapper.selectList(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<RentalOrderItem>().eq("order_id", id));
        java.util.List<PickupCode> codes = pickupCodeMapper.selectList(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<PickupCode>().eq("order_id", id));
        com.community.tools.order.OrderController.OrderDetailVO vo = new com.community.tools.order.OrderController.OrderDetailVO();
        vo.setOrder(order);
        vo.setItems(items);
        vo.setCodes(codes);
        return vo;
    }

    public byte[] export(String startDate, String endDate, Integer status, Long userId) {
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<RentalOrder> q = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        if (status != null) q.eq("status", status);
        if (userId != null) q.eq("user_id", userId);
        if (startDate != null && !startDate.isEmpty()) q.ge("created_at", java.time.LocalDateTime.parse(startDate));
        if (endDate != null && !endDate.isEmpty()) q.le("created_at", java.time.LocalDateTime.parse(endDate));
        java.util.List<RentalOrder> list = orderMapper.selectList(q);
        Workbook wb = new XSSFWorkbook();
        Sheet sheet = wb.createSheet("orders");
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("订单ID");
        header.createCell(1).setCellValue("用户ID");
        header.createCell(2).setCellValue("状态");
        header.createCell(3).setCellValue("总金额");
        header.createCell(4).setCellValue("创建时间");
        for (int i = 0; i < list.size(); i++) {
            RentalOrder o = list.get(i);
            Row r = sheet.createRow(i + 1);
            r.createCell(0).setCellValue(o.getId());
            r.createCell(1).setCellValue(o.getUserId() == null ? 0 : o.getUserId());
            r.createCell(2).setCellValue(o.getStatus() == null ? 0 : o.getStatus());
            r.createCell(3).setCellValue(o.getTotalAmount() == null ? 0 : o.getTotalAmount().doubleValue());
            r.createCell(4).setCellValue(o.getCreatedAt() == null ? "" : o.getCreatedAt().toString());
        }
        try (java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            wb.write(out);
            return out.toByteArray();
        } catch (java.io.IOException e) {
            throw new RuntimeException("export failed");
        }
    }

    @Transactional
    public java.util.List<PickupCode> batchGenerate(Long orderId, int count, int expireDays) {
        java.util.List<PickupCode> list = new java.util.ArrayList<>();
        for (int i = 0; i < count; i++) {
            PickupCode code = new PickupCode();
            code.setOrderId(orderId);
            code.setCode(UUID.randomUUID().toString().replace("-", "").substring(0, 12));
            code.setExpireAt(LocalDateTime.now().plusDays(expireDays));
            code.setStatus(0);
            pickupCodeMapper.insert(code);
            list.add(code);
        }
        RentalOrder order = orderMapper.selectById(orderId);
        order.setPickupCodeId(list.get(0).getId());
        orderMapper.updateById(order);
        return list;
    }
}
