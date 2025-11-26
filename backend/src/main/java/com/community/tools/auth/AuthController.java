package com.community.tools.auth;

import com.community.tools.auth.dto.LoginRequest;
import com.community.tools.auth.dto.RegisterRequest;
import com.community.tools.common.ApiResponse;
import com.community.tools.security.JwtTokenProvider;
import com.community.tools.system.entity.User;
import com.community.tools.system.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final JwtTokenProvider jwt;

    @PostMapping("/register")
    public ApiResponse<Long> register(@Valid @RequestBody RegisterRequest req) {
        User u = userService.register(req.getUsername(), req.getPassword());
        return ApiResponse.ok(u.getId());
    }

    @PostMapping("/login")
    public ApiResponse<String> login(@Valid @RequestBody LoginRequest req) {
        User u = userService.validate(req.getUsername(), req.getPassword());
        String token = jwt.generate(u.getId().toString());
        return ApiResponse.ok(token);
    }
}

