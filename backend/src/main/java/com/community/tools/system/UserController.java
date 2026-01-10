package com.community.tools.system;

import com.community.tools.common.ApiResponse;
import com.community.tools.system.entity.Role;
import com.community.tools.system.entity.User;
import com.community.tools.system.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserProfile> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        User user = userService.getUserByUsername(username);
        List<Role> roles = userService.getUserRoles(username);

        UserProfile profile = new UserProfile();
        profile.setId(user.getId());
        profile.setUsername(user.getUsername());
        profile.setRealName(user.getRealName());
        profile.setPhone(user.getPhone());
        profile.setAddress(user.getAddress());
        profile.setStatus(user.getStatus());
        profile.setRoles(roles.stream().map(role -> role.getCode()).collect(Collectors.toList()));

        return ApiResponse.ok(profile);
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> updateProfile(@RequestBody UpdateProfileReq req) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        userService.updateProfile(username, req.getRealName(), req.getPhone(), req.getAddress());

        return ApiResponse.ok(null);
    }

    @PutMapping("/password")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> changePassword(@RequestBody ChangePasswordReq req) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        userService.changePassword(username, req.getOldPassword(), req.getNewPassword());

        return ApiResponse.ok(null);
    }

    @Data
    public static class UserProfile {
        private Long id;
        private String username;
        private String realName;
        private String phone;
        private String address;
        private Integer status;
        private List<String> roles;
    }

    @Data
    public static class UpdateProfileReq {
        private String realName;
        private String phone;
        private String address;
    }

    @Data
    public static class ChangePasswordReq {
        private String oldPassword;
        private String newPassword;
    }
}