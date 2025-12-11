package com.community.tools.maintenance;

import com.community.tools.common.ApiResponse;
import com.community.tools.maintenance.entity.MaintenanceRecord;
import com.community.tools.maintenance.service.MaintenanceService;
import com.community.tools.system.entity.User;
import com.community.tools.system.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('MAINTAINER')")
public class MaintenanceController {
    private final MaintenanceService service;
    private final UserService userService;

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
    public ApiResponse<Void> close(@PathVariable("orderId") Long orderId) {
        service.closeOrder(orderId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/orders/{orderId}/schedule")
    public ApiResponse<Void> schedule(@PathVariable("orderId") Long orderId,
                                      @RequestParam(name = "scheduledAt", required = false) String scheduledAt,
                                      @RequestParam(name = "inspectorId", required = false) Long inspectorId,
                                      @RequestParam(name = "note", required = false) String note) {
        java.time.LocalDateTime t = scheduledAt != null && !scheduledAt.isEmpty() ? java.time.LocalDateTime.parse(scheduledAt) : java.time.LocalDateTime.now();
        if (inspectorId == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User u = userService.getUserByUsername(auth.getName());
            inspectorId = u != null ? u.getId() : null;
        }
        service.scheduleInspection(orderId, t, inspectorId, note);
        return ApiResponse.ok(null);
    }

    @GetMapping("/records")
    public ApiResponse<com.baomidou.mybatisplus.extension.plugins.pagination.Page<MaintenanceRecord>> list(@RequestParam(name = "page", defaultValue = "1") int page,
                                                                                                          @RequestParam(name = "size", defaultValue = "20") int size,
                                                                                                          @RequestParam(name = "type", required = false) Integer type,
                                                                                                          @RequestParam(name = "handledBy", required = false) Long handledBy,
                                                                                                          @RequestParam(name = "toolId", required = false) Long toolId,
                                                                                                          @RequestParam(name = "orderId", required = false) Long orderId,
                                                                                                          @RequestParam(name = "start", required = false) String start,
                                                                                                          @RequestParam(name = "end", required = false) String end) {
        com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<MaintenanceRecord> q = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
        if (type != null) q.eq("type", type);
        if (handledBy != null) q.eq("handled_by", handledBy);
        if (toolId != null) q.eq("tool_id", toolId);
        if (start != null && !start.isEmpty()) q.ge("scheduled_at", java.time.LocalDateTime.parse(start));
        if (end != null && !end.isEmpty()) q.le("scheduled_at", java.time.LocalDateTime.parse(end));
        if (orderId != null) {
            java.util.List<Long> itemIds = service.findOrderItemIds(orderId);
            java.util.List<Long> toolIds = service.findOrderToolIds(orderId);
            if (!itemIds.isEmpty() || !toolIds.isEmpty()) {
                q.and(w -> {
                    if (!itemIds.isEmpty()) {
                        w.in("order_item_id", itemIds);
                    }
                    if (!toolIds.isEmpty()) {
                        if (!itemIds.isEmpty()) {
                            w.or();
                        }
                        w.in("tool_id", toolIds);
                    }
                });
            } else {
                // 无明细时返回空结果
                q.eq("order_item_id", -1L);
            }
        }
        q.orderByDesc("scheduled_at");
        return ApiResponse.ok(service.pageRecords(page, size, q));
    }

    @GetMapping("/stats")
    public ApiResponse<MaintStats> stats() {
        return ApiResponse.ok(service.stats());
    }

    @lombok.Data
    public static class MaintStats {
        public java.util.Map<Integer, Long> typeCounts;
        public java.util.Map<String, Long> last7Scheduled;
        public java.util.Map<String, Long> last7Completed;
    }

    @Data
    public static class CompleteReq {
        public Long orderItemId;
        public boolean qualified;
    }
}
