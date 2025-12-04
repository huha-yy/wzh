package com.community.tools.system.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.community.tools.system.entity.User;
import com.community.tools.system.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public User register(String username, String rawPassword, String realName, String phone) {
        // 检查用户名是否已存在
        User exists = userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
        if (exists != null) throw new RuntimeException("用户名已被使用");
        
        // 如果提供了手机号，检查手机号是否已被使用
        if (phone != null && !phone.trim().isEmpty()) {
            User phoneExists = userMapper.selectOne(new QueryWrapper<User>().eq("phone", phone));
            if (phoneExists != null) throw new RuntimeException("手机号已被使用");
        }
        
        User u = new User();
        u.setUsername(username);
        u.setPasswordHash(passwordEncoder.encode(rawPassword));
        u.setRealName(realName);
        if (phone != null && !phone.trim().isEmpty()) {
            u.setPhone(phone);
        }
        u.setStatus(1);
        userMapper.insert(u);
        return u;
    }

    public User validate(String username, String rawPassword) {
        User u = userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
        if (u == null) throw new RuntimeException("user not found");
        if (!passwordEncoder.matches(rawPassword, u.getPasswordHash())) throw new RuntimeException("invalid password");
        return u;
    }
}

