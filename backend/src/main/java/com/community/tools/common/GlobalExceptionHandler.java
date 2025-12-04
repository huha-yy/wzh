package com.community.tools.common;

import org.springframework.http.HttpStatus;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ApiResponse<Void> handleValidation(Exception e) {
        String msg = e.getMessage();
        return new ApiResponse<>(HttpStatus.BAD_REQUEST.value(), msg, null);
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleAll(Exception e) {
        String msg = e.getMessage();
        if (msg == null || msg.isEmpty()) msg = e.getClass().getSimpleName();
        return ApiResponse.error(msg);
    }
}

