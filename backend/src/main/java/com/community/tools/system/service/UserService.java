package com.community.tools.system.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.community.tools.system.entity.Role;
import com.community.tools.system.entity.User;
import com.community.tools.system.entity.UserRole;
import com.community.tools.system.mapper.RoleMapper;
import com.community.tools.system.mapper.UserMapper;
import com.community.tools.system.mapper.UserRoleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final UserRoleMapper userRoleMapper;
    private final RoleMapper roleMapper;

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

        Role resident = roleMapper.selectOne(new QueryWrapper<Role>().eq("code", "resident"));
        if (resident != null) {
            UserRole ur = new UserRole();
            ur.setUserId(u.getId());
            ur.setRoleId(resident.getId());
            userRoleMapper.insert(ur);
        }
        return u;
    }

    public User validate(String username, String rawPassword) {
        User u = userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
        if (u == null) throw new RuntimeException("用户不存在");
        if (u.getStatus() != null && u.getStatus() != 1) throw new RuntimeException("账号已禁用");
        if (!passwordEncoder.matches(rawPassword, u.getPasswordHash())) throw new RuntimeException("invalid password");
        return u;
    }

    /**
     * 根据用户ID获取用户角色
     */
    public List<Role> getRolesByUserId(Long userId) {
        List<Long> roleIds = userRoleMapper.selectList(
            new QueryWrapper<UserRole>().eq("user_id", userId)
        ).stream().map(UserRole::getRoleId).collect(Collectors.toList());
        
        if (roleIds.isEmpty()) {
            return List.of();
        }
        
        return roleMapper.selectList(new QueryWrapper<Role>().in("id", roleIds));
    }

    /**
     * 根据用户名获取用户角色
     */
    public List<Role> getUserRoles(String username) {
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
        if (user == null) {
            return List.of();
        }
        return getRolesByUserId(user.getId());
    }

    /**
     * 根据用户名获取用户信息
     */
    public User getUserByUsername(String username) {
        return userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
    }

    /**
     * 根据用户ID获取用户信息
     */
    public User getUserById(Long id) {
        return userMapper.selectById(id);
    }

    /**
     * 更新用户个人资料
     */
    public void updateProfile(String username, String realName, String phone, String address) {
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        // 如果修改了手机号，检查手机号是否已被其他用户使用
        if (phone != null && !phone.trim().isEmpty() && !phone.equals(user.getPhone())) {
            User phoneExists = userMapper.selectOne(new QueryWrapper<User>().eq("phone", phone));
            if (phoneExists != null && !phoneExists.getId().equals(user.getId())) {
                throw new RuntimeException("手机号已被使用");
            }
        }

        // 更新用户信息
        if (realName != null) {
            user.setRealName(realName.trim().isEmpty() ? null : realName);
        }
        if (phone != null) {
            user.setPhone(phone.trim().isEmpty() ? null : phone);
        }
        if (address != null) {
            user.setAddress(address.trim().isEmpty() ? null : address);
        }

        userMapper.updateById(user);
    }

    /**
     * 修改密码
     */
    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new RuntimeException("原密码错误");
        }

        // 验证新密码
        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new RuntimeException("新密码长度至少为6位");
        }

        // 更新密码
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);
    }
}

