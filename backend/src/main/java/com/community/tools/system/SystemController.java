package com.community.tools.system;

import com.community.tools.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SystemController {
    private final ConfigService configService;

    @GetMapping("/config")
    public ApiResponse<ConfigService.ConfigVO> getConfig() {
        return ApiResponse.ok(configService.get());
    }

    @PostMapping("/config")
    public ApiResponse<ConfigService.ConfigVO> setConfig(@RequestBody ConfigService.ConfigVO vo) {
        return ApiResponse.ok(configService.set(vo));
    }

    @GetMapping("/logs")
    public ApiResponse<List<String>> logs(@RequestParam(name = "page", defaultValue = "1") int page,
                                          @RequestParam(name = "size", defaultValue = "50") int size,
                                          @RequestParam(name = "keyword", required = false) String keyword) throws Exception {
        Path path = Path.of("logs/app.log");
        if (!Files.exists(path)) return ApiResponse.ok(java.util.Collections.emptyList());
        List<String> all = Files.readAllLines(path);
        if (keyword != null && !keyword.isEmpty()) {
            all = all.stream().filter(l -> l.contains(keyword)).collect(Collectors.toList());
        }
        int from = Math.max(0, (page - 1) * size);
        int to = Math.min(all.size(), from + size);
        return ApiResponse.ok(all.subList(from, to));
    }
}

