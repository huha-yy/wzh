package com.community.tools.order;

import com.community.tools.common.ApiResponse;
import com.community.tools.order.entity.PickupCode;
import com.community.tools.order.entity.RentalOrder;
import com.community.tools.order.entity.RentalOrderItem;
import com.community.tools.order.service.OrderService;
import com.community.tools.system.entity.User;
import com.community.tools.system.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESIDENT')")
    public ApiResponse<RentalOrder> create(@RequestBody CreateOrderReq req) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User u = userService.getUserByUsername(auth.getName());
        return ApiResponse.ok(orderService.createOrder(u.getId(), req.toolId, req.warehouseId, req.quantity, req.rentalDays, req.unitPrice));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MAINTAINER')")
    public ApiResponse<PickupCode> approve(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User u = userService.getUserByUsername(auth.getName());
        return ApiResponse.ok(orderService.approveAndGenerateCode(id, u.getId()));
    }

    @PostMapping("/pickup/{code}/use")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MAINTAINER')")
    public ApiResponse<RentalOrder> use(@PathVariable String code) {
        return ApiResponse.ok(orderService.usePickupCode(code));
    }

    @GetMapping("/{id}/pickup-codes")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<java.util.List<PickupCode>> listCodes(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdminOrMaintainer = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority)
                .anyMatch(a -> "ROLE_ADMIN".equals(a) || "ROLE_MAINTAINER".equals(a));
        boolean isResident = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority)
                .anyMatch(a -> "ROLE_RESIDENT".equals(a));
        if (isResident && !isAdminOrMaintainer) {
            User u = userService.getUserByUsername(auth.getName());
            RentalOrder o = orderService.detail(id).getOrder();
            if (o == null || !o.getUserId().equals(u.getId())) throw new RuntimeException("forbidden");
        }
        return ApiResponse.ok(orderService.detail(id).getCodes());
    }

    @PostMapping("/{id}/pickup-codes/batch")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MAINTAINER')")
    public ApiResponse<java.util.List<PickupCode>> batch(@PathVariable Long id,
                                                         @RequestParam(name = "count") int count,
                                                         @RequestParam(name = "expireDays", defaultValue = "2") int expireDays) {
        return ApiResponse.ok(orderService.batchGenerate(id, count, expireDays));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MAINTAINER') or hasRole('RESIDENT')")
    public ApiResponse<com.baomidou.mybatisplus.extension.plugins.pagination.Page<RentalOrder>> query(@RequestParam(name = "page", defaultValue = "1") int page,
                                                                                                    @RequestParam(name = "size", defaultValue = "20") int size,
                                                                                                    @RequestParam(name = "startDate", required = false) String startDate,
                                                                                                    @RequestParam(name = "endDate", required = false) String endDate,
                                                                                                    @RequestParam(name = "status", required = false) Integer status,
                                                                                                    @RequestParam(name = "userId", required = false) Long userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdminOrMaintainer = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority)
                .anyMatch(a -> "ROLE_ADMIN".equals(a) || "ROLE_MAINTAINER".equals(a));
        boolean isResident = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority)
                .anyMatch(a -> "ROLE_RESIDENT".equals(a));
        if (isResident && !isAdminOrMaintainer) {
            User u = userService.getUserByUsername(auth.getName());
            userId = u != null ? u.getId() : null;
        }
        return ApiResponse.ok(orderService.query(page, size, startDate, endDate, status, userId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<OrderDetailVO> detail(@PathVariable Long id) {
        return ApiResponse.ok(orderService.detail(id));
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public org.springframework.http.ResponseEntity<byte[]> export(@RequestParam(name = "startDate", required = false) String startDate,
                                                                  @RequestParam(name = "endDate", required = false) String endDate,
                                                                  @RequestParam(name = "status", required = false) Integer status,
                                                                  @RequestParam(name = "userId", required = false) Long userId) {
        byte[] bytes = orderService.export(startDate, endDate, status, userId);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=orders.xlsx");
        headers.set(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        return new org.springframework.http.ResponseEntity<>(bytes, headers, org.springframework.http.HttpStatus.OK);
    }

    @PostMapping("/{id}/apply-return")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESIDENT')")
    public ApiResponse<Void> applyReturn(@PathVariable Long id) {
        orderService.applyReturn(id);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESIDENT')")
    public ApiResponse<Void> cancel(@PathVariable Long id) {
        orderService.cancel(id);
        return ApiResponse.ok(null);
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
