package com.community.tools.admin;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.community.tools.catalog.mapper.ToolMapper;
import com.community.tools.common.ApiResponse;
import com.community.tools.order.entity.RentalOrder;
import com.community.tools.order.mapper.RentalOrderMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final RentalOrderMapper orderMapper;
    private final ToolMapper toolMapper;

    @GetMapping("/stats")
    public ApiResponse<Stats> stats() {
        Stats s = new Stats();
        s.totalOrders = orderMapper.selectCount(null);
        s.statusCounts = new LinkedHashMap<>();
        for (int st = 0; st <= 6; st++) {
            s.statusCounts.put(st, orderMapper.selectCount(new QueryWrapper<RentalOrder>().eq("status", st)));
        }
        LocalDate today = LocalDate.now();
        s.last7 = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            LocalDateTime start = d.atStartOfDay();
            LocalDateTime end = d.atTime(23,59,59);
            Long c = orderMapper.selectCount(new QueryWrapper<RentalOrder>().ge("created_at", start).le("created_at", end));
            s.last7.put(d.toString(), c);
        }
        s.toolCount = toolMapper.selectCount(null);
        return ApiResponse.ok(s);
    }

    @Data
    public static class Stats {
        public Long totalOrders;
        public Map<Integer, Long> statusCounts;
        public Map<String, Long> last7;
        public Long toolCount;
    }
}

