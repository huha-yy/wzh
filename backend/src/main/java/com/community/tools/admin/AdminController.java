package com.community.tools.admin;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.tools.catalog.mapper.ToolMapper;
import com.community.tools.common.ApiResponse;
import com.community.tools.order.entity.RentalOrder;
import com.community.tools.order.mapper.RentalOrderMapper;
import com.community.tools.system.entity.Role;
import com.community.tools.system.entity.User;
import com.community.tools.system.entity.UserRole;
import com.community.tools.system.mapper.RoleMapper;
import com.community.tools.system.mapper.UserMapper;
import com.community.tools.system.mapper.UserRoleMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final RentalOrderMapper orderMapper;
    private final ToolMapper toolMapper;
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final UserRoleMapper userRoleMapper;

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

    @GetMapping("/users")
    public ApiResponse<Page<UserVO>> users(@RequestParam(defaultValue = "1") int page,
                                           @RequestParam(defaultValue = "20") int size,
                                           @RequestParam(required = false) String username,
                                           @RequestParam(required = false) Integer status) {
        QueryWrapper<User> q = new QueryWrapper<>();
        if (username != null && !username.isEmpty()) q.like("username", username);
        if (status != null) q.eq("status", status);
        q.orderByDesc("created_at");
        Page<User> p = userMapper.selectPage(Page.of(page, size), q);
        Page<UserVO> result = new Page<>(p.getCurrent(), p.getSize(), p.getTotal());
        List<UserVO> vos = p.getRecords().stream().map(u -> {
            UserVO vo = new UserVO();
            vo.id = u.getId();
            vo.username = u.getUsername();
            vo.realName = u.getRealName();
            vo.phone = u.getPhone();
            vo.status = u.getStatus();
            List<Long> roleIds = userRoleMapper.selectList(new QueryWrapper<UserRole>().eq("user_id", u.getId()))
                    .stream().map(UserRole::getRoleId).collect(Collectors.toList());
            List<Role> roles = roleIds.isEmpty() ? java.util.Collections.emptyList() : roleMapper.selectList(new QueryWrapper<Role>().in("id", roleIds));
            vo.roles = roles.stream().map(Role::getCode).collect(Collectors.toList());
            return vo;
        }).collect(Collectors.toList());
        result.setRecords(vos);
        return ApiResponse.ok(result);
    }

    @GetMapping("/roles")
    public ApiResponse<List<Role>> roles() {
        return ApiResponse.ok(roleMapper.selectList(null));
    }

    @PostMapping("/users/{id}/status")
    public ApiResponse<Void> setStatus(@PathVariable Long id, @RequestParam Integer status) {
        User u = userMapper.selectById(id);
        if (u == null) throw new RuntimeException("user not found");
        u.setStatus(status);
        userMapper.updateById(u);
        return ApiResponse.ok(null);
    }

    @PostMapping("/users/{id}/roles/{roleId}")
    public ApiResponse<Void> assignRole(@PathVariable Long id, @PathVariable Long roleId) {
        User u = userMapper.selectById(id);
        if (u == null) throw new RuntimeException("user not found");
        Role r = roleMapper.selectById(roleId);
        if (r == null) throw new RuntimeException("role not found");
        UserRole exists = userRoleMapper.selectOne(new QueryWrapper<UserRole>().eq("user_id", id).eq("role_id", roleId));
        if (exists == null) {
            UserRole ur = new UserRole();
            ur.setUserId(id);
            ur.setRoleId(roleId);
            userRoleMapper.insert(ur);
        }
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/users/{id}/roles/{roleId}")
    public ApiResponse<Void> revokeRole(@PathVariable Long id, @PathVariable Long roleId) {
        userRoleMapper.delete(new QueryWrapper<UserRole>().eq("user_id", id).eq("role_id", roleId));
        return ApiResponse.ok(null);
    }

    @PostMapping("/users/{id}")
    public ApiResponse<Void> updateUser(@PathVariable Long id, @RequestBody EditUserReq req) {
        User u = userMapper.selectById(id);
        if (u == null) throw new RuntimeException("user not found");
        if (req.username != null && !req.username.isEmpty() && !req.username.equals(u.getUsername())) {
            User exists = userMapper.selectOne(new QueryWrapper<User>().eq("username", req.username));
            if (exists != null && !exists.getId().equals(id)) throw new RuntimeException("username exists");
            u.setUsername(req.username);
        }
        if (req.phone != null && !req.phone.isEmpty()) {
            if (u.getPhone() == null || !req.phone.equals(u.getPhone())) {
                User phoneExists = userMapper.selectOne(new QueryWrapper<User>().eq("phone", req.phone));
                if (phoneExists != null && !phoneExists.getId().equals(id)) throw new RuntimeException("phone exists");
                u.setPhone(req.phone);
            }
        } else {
            u.setPhone(null);
        }
        if (req.realName != null) {
            u.setRealName(req.realName);
        }
        userMapper.updateById(u);
        return ApiResponse.ok(null);
    }

    @Data
    public static class UserVO {
        public Long id;
        public String username;
        public String realName;
        public String phone;
        public Integer status;
        public List<String> roles;
    }

    @Data
    public static class EditUserReq {
        public String username;
        public String realName;
        public String phone;
    }
}

