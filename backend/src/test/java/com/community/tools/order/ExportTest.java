package com.community.tools.order;

import com.community.tools.order.service.OrderService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class ExportTest {
    @Autowired
    private OrderService orderService;

    @Test
    void exportEmptyOk() {
        byte[] bytes = orderService.export(null, null, null, null);
        Assertions.assertTrue(bytes.length > 0);
    }
}

