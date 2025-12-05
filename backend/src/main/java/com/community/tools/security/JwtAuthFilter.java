package com.community.tools.security;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.community.tools.system.entity.Role;
import com.community.tools.system.entity.User;
import com.community.tools.system.mapper.RoleMapper;
import com.community.tools.system.mapper.UserMapper;
import com.community.tools.system.mapper.UserRoleMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtTokenProvider jwt;
    private final UserMapper userMapper;
    private final UserRoleMapper userRoleMapper;
    private final RoleMapper roleMapper;

    public JwtAuthFilter(JwtTokenProvider jwt, UserMapper userMapper, UserRoleMapper userRoleMapper, RoleMapper roleMapper) {
        this.jwt = jwt;
        this.userMapper = userMapper;
        this.userRoleMapper = userRoleMapper;
        this.roleMapper = roleMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);
            try {
                String subject = jwt.parse(token);
                User user;
                try {
                    Long id = Long.valueOf(subject);
                    user = userMapper.selectById(id);
                } catch (NumberFormatException ignore) {
                    user = userMapper.selectOne(new QueryWrapper<User>().eq("username", subject));
                }
                if (user != null && (user.getStatus() != null && user.getStatus() == 1)) {
                    List<Long> roleIds = userRoleMapper.selectList(
                        new QueryWrapper<com.community.tools.system.entity.UserRole>().eq("user_id", user.getId())
                    ).stream().map(ur -> ur.getRoleId()).collect(Collectors.toList());
                    List<Role> roles = roleMapper.selectList(new QueryWrapper<Role>().in("id", roleIds));
                    List<SimpleGrantedAuthority> authorities = roles.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getCode().toUpperCase()))
                        .collect(Collectors.toList());
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(user.getUsername(), null, authorities);
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception ignored) {}
        }
        chain.doFilter(request, response);
    }
}

