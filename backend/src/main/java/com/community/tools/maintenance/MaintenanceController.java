package com.community.tools.maintenance;

import com.community.tools.common.ApiResponse;
import com.community.tools.maintenance.entity.MaintenanceRecord;
import com.community.tools.maintenance.service.MaintenanceService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {
    private final MaintenanceService service;

    @PostMapping
    public ApiResponse<Long> add(@RequestBody MaintenanceRecord record) {
        return ApiResponse.ok(service.saveRecord(record).getId());
    }

    @PostMapping("/inspection/complete")
    public ApiResponse<Void> complete(@RequestBody CompleteReq req) {
        service.completeInspection(req.orderItemId, req.qualified);
        return ApiResponse.ok(null);
    }

    @PostMapping("/orders/{orderId}/close")
    public ApiResponse<Void> close(@PathVariable Long orderId) {
        service.closeOrder(orderId);
        return ApiResponse.ok(null);
    }

    @Data
    public static class CompleteReq {
        public Long orderItemId;
        public boolean qualified;
    }
}

