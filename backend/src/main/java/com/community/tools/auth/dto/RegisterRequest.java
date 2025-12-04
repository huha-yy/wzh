package com.community.tools.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度必须在3-20个字符之间")
    private String username;
    
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 20, message = "密码长度必须在6-20个字符之间")
    private String password;
    
    @NotBlank(message = "真实姓名不能为空")
    @Size(min = 2, max = 10, message = "真实姓名长度必须在2-10个字符之间")
    private String realName;
    
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "请输入正确的手机号码")
    private String phone;
}

