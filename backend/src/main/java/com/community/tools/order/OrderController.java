package com.community.tools.order;

import com.community.tools.common.ApiResponse;
import com.community.tools.order.entity.PickupCode;
import com.community.tools.order.entity.RentalOrder;
import com.community.tools.order.service.OrderService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    public ApiResponse<RentalOrder> create(@RequestBody CreateOrderReq req) {
        return ApiResponse.ok(orderService.createOrder(req.userId, req.toolId, req.warehouseId, req.quantity, req.rentalDays, req.unitPrice));
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<PickupCode> approve(@PathVariable Long id, @RequestParam Long adminId) {
        return ApiResponse.ok(orderService.approveAndGenerateCode(id, adminId));
    }

    @PostMapping("/pickup/{code}/use")
    public ApiResponse<Void> use(@PathVariable String code) {
        orderService.usePickupCode(code);
        return ApiResponse.ok(null);
    }

    @GetMapping("/{id}/pickup-codes")
    public ApiResponse<java.util.List<PickupCode>> listCodes(@PathVariable Long id) {
        return ApiResponse.ok(orderService.detail(id).getCodes());
    }

    @PostMapping("/{id}/pickup-codes/batch")
    public ApiResponse<java.util.List<PickupCode>> batch(@PathVariable Long id,
                                                         @RequestParam int count,
                                                         @RequestParam(defaultValue = "2") int expireDays) {
        return ApiResponse.ok(orderService.batchGenerate(id, count, expireDays));
    }

    @GetMapping
    public ApiResponse<com.baomidou.mybatisplus.extension.plugins.pagination.Page<RentalOrder>> query(@RequestParam(defaultValue = "1") int page,
                                                                                                    @RequestParam(defaultValue = "20") int size,
                                                                                                    @RequestParam(required = false) String startDate,
                                                                                                    @RequestParam(required = false) String endDate,
                                                                                                    @RequestParam(required = false) Integer status,
                                                                                                    @RequestParam(required = false) Long userId) {
        return ApiResponse.ok(orderService.query(page, size, startDate, endDate, status, userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderDetailVO> detail(@PathVariable Long id) {
        return ApiResponse.ok(orderService.detail(id));
    }

    @GetMapping("/export")
    public org.springframework.http.ResponseEntity<byte[]> export(@RequestParam(required = false) String startDate,
                                                                  @RequestParam(required = false) String endDate,
                                                                  @RequestParam(required = false) Integer status,
                                                                  @RequestParam(required = false) Long userId) {
        byte[] bytes = orderService.export(startDate, endDate, status, userId);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=orders.xlsx");
        headers.set(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        return new org.springframework.http.ResponseEntity<>(bytes, headers, org.springframework.http.HttpStatus.OK);
    }

    @Data
    public static class CreateOrderReq {
        public Long userId;
        public Long toolId;
        public Long warehouseId;
        public int quantity;
        public int rentalDays;
        public BigDecimal unitPrice;
    }

    @lombok.Data
    public static class OrderDetailVO {
        public RentalOrder order;
        public java.util.List<RentalOrderItem> items;
        public java.util.List<PickupCode> codes;
    }
}
