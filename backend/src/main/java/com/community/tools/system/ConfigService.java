package com.community.tools.system;

import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

@Service
public class ConfigService {
    private final AtomicInteger jwtExpireMinutes = new AtomicInteger(120);
    private final AtomicInteger defaultPageSize = new AtomicInteger(20);
    private final AtomicInteger exportLimit = new AtomicInteger(5000);

    public ConfigVO get() {
        ConfigVO vo = new ConfigVO();
        vo.jwtExpireMinutes = jwtExpireMinutes.get();
        vo.defaultPageSize = defaultPageSize.get();
        vo.exportLimit = exportLimit.get();
        return vo;
    }

    public ConfigVO set(ConfigVO vo) {
        if (vo.jwtExpireMinutes != null) jwtExpireMinutes.set(vo.jwtExpireMinutes);
        if (vo.defaultPageSize != null) defaultPageSize.set(vo.defaultPageSize);
        if (vo.exportLimit != null) exportLimit.set(vo.exportLimit);
        return get();
    }

    public static class ConfigVO {
        public Integer jwtExpireMinutes;
        public Integer defaultPageSize;
        public Integer exportLimit;
    }
}

