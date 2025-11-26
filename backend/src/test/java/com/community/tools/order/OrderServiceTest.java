package com.community.tools.order;

import com.community.tools.catalog.entity.Tool;
import com.community.tools.catalog.mapper.ToolMapper;
import com.community.tools.order.entity.RentalOrder;
import com.community.tools.order.service.OrderService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;

@SpringBootTest
public class OrderServiceTest {
    @Autowired
    private OrderService orderService;
    @Autowired
    private ToolMapper toolMapper;

    @Test
    void createOrderAndApprove() {
        Tool t = new Tool();
        t.setName("T1");
        t.setCategoryId(1L);
        t.setWarehouseId(1L);
        t.setAssetCode("AC1");
        t.setStockTotal(10);
        t.setStockAvailable(10);
        toolMapper.insert(t);

        RentalOrder order = orderService.createOrder(1L, t.getId(), 1L, 2, 1, new BigDecimal("10"));
        Assertions.assertNotNull(order.getId());
        Tool after = toolMapper.selectById(t.getId());
        Assertions.assertEquals(8, after.getStockAvailable());
        var code = orderService.approveAndGenerateCode(order.getId(), 1L);
        Assertions.assertNotNull(code.getCode());
    }
}

