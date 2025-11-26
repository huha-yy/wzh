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

    public User register(String username, String rawPassword) {
        User exists = userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
        if (exists != null) throw new RuntimeException("username taken");
        User u = new User();
        u.setUsername(username);
        u.setPasswordHash(passwordEncoder.encode(rawPassword));
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

