package com.community.tools.catalog;

import com.community.tools.catalog.entity.Tool;
import com.community.tools.catalog.mapper.ToolMapper;
import com.community.tools.common.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tools")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('MAINTAINER')")
public class ToolMutateController {
    private final ToolMapper mapper;
    private final com.community.tools.catalog.mapper.WarehouseMapper warehouseMapper;
    private final com.community.tools.catalog.mapper.ToolCategoryMapper categoryMapper;

    @PostMapping
    public ApiResponse<Long> create(@RequestBody CreateReq req) {
        if (req.assetCode != null && !req.assetCode.isEmpty()) {
            com.community.tools.catalog.entity.Tool exists = mapper.selectOne(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<com.community.tools.catalog.entity.Tool>().eq("asset_code", req.assetCode));
            if (exists != null) return ApiResponse.error("资产编码已存在");
        }
        Tool t = new Tool();
        t.setCategoryId(req.categoryId);
        t.setWarehouseId(req.warehouseId);
        t.setName(req.name);
        t.setAssetCode(req.assetCode);
        t.setModelSpec(req.modelSpec);
        t.setRentalPrice(req.rentalPrice);
        t.setDeposit(req.deposit);
        t.setStatus(1);
        t.setStockTotal(req.stockTotal);
        t.setStockAvailable(req.stockAvailable);
        t.setDescription(req.description);
        mapper.insert(t);
        return ApiResponse.ok(t.getId());
    }

    @Data
    public static class CreateReq {
        public Long categoryId;
        public Long warehouseId;
        public String name;
        public String assetCode;
        public String modelSpec;
        public java.math.BigDecimal rentalPrice;
        public java.math.BigDecimal deposit;
        public Integer stockTotal;
        public Integer stockAvailable;
        public String description;
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(@PathVariable Long id, @RequestBody UpdateReq req) {
        Tool t = mapper.selectById(id);
        if (t == null) return ApiResponse.error("tool not found");
        if (req.categoryId != null) t.setCategoryId(req.categoryId);
        if (req.warehouseId != null) t.setWarehouseId(req.warehouseId);
        if (req.name != null && !req.name.isEmpty()) t.setName(req.name);
        if (req.assetCode != null) t.setAssetCode(req.assetCode);
        if (req.modelSpec != null) t.setModelSpec(req.modelSpec);
        if (req.rentalPrice != null) t.setRentalPrice(req.rentalPrice);
        if (req.deposit != null) t.setDeposit(req.deposit);
        if (req.description != null) t.setDescription(req.description);
        mapper.updateById(t);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{id}/status")
    public ApiResponse<Void> setStatus(@PathVariable Long id, @RequestParam(name = "status") Integer status) {
        Tool t = mapper.selectById(id);
        if (t == null) return ApiResponse.error("tool not found");
        if (status == null || (status != 0 && status != 1)) return ApiResponse.error("invalid status");
        t.setStatus(status);
        mapper.updateById(t);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{id}/stock/adjust")
    public ApiResponse<Tool> adjustStock(@PathVariable Long id,
                                         @RequestParam(name = "deltaTotal", defaultValue = "0") Integer deltaTotal,
                                         @RequestParam(name = "deltaAvailable", defaultValue = "0") Integer deltaAvailable) {
        Tool t = mapper.selectById(id);
        if (t == null) return ApiResponse.error("tool not found");
        int total = (t.getStockTotal() == null ? 0 : t.getStockTotal()) + (deltaTotal == null ? 0 : deltaTotal);
        int avail = (t.getStockAvailable() == null ? 0 : t.getStockAvailable()) + (deltaAvailable == null ? 0 : deltaAvailable);
        if (total < 0) return ApiResponse.error("stock total negative");
        if (avail < 0) return ApiResponse.error("stock available negative");
        if (avail > total) return ApiResponse.error("stock available exceeds total");
        t.setStockTotal(total);
        t.setStockAvailable(avail);
        mapper.updateById(t);
        return ApiResponse.ok(t);
    }

    @Data
    public static class UpdateReq {
        public Long categoryId;
        public Long warehouseId;
        public String name;
        public String assetCode;
        public String modelSpec;
        public java.math.BigDecimal rentalPrice;
        public java.math.BigDecimal deposit;
        public String description;
    }

    @lombok.Data
    public static class ImportResult {
        public int success;
        public int failed;
        public java.util.List<String> errors;
    }

    @PostMapping("/import")
    public ApiResponse<ImportResult> importExcel(@RequestParam("file") MultipartFile file,
                                                 @RequestParam(name = "dryRun", defaultValue = "false") boolean dryRun) {
        ImportResult result = new ImportResult();
        result.errors = new java.util.ArrayList<>();
        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            if (sheet == null) return ApiResponse.error("文件内容为空");
            Row header = sheet.getRow(0);
            java.util.Map<String,Integer> idx = new java.util.HashMap<>();
            for (int i = 0; i < header.getLastCellNum(); i++) {
                String k = header.getCell(i) != null ? header.getCell(i).toString().trim() : null;
                if (k != null && !k.isEmpty()) idx.put(k.toLowerCase(), i);
            }
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String name = getStr(row, idx.get("name"));
                String modelSpec = getStr(row, idx.get("modelspec"));
                String assetCode = getStr(row, idx.get("assetcode"));
                Long categoryId = getLong(row, idx.get("categoryid"));
                Long warehouseId = getLong(row, idx.get("warehouseid"));
                String categoryName = getStr(row, idx.get("categoryname"));
                String warehouseName = getStr(row, idx.get("warehousename"));
                java.math.BigDecimal rentalPrice = getDecimal(row, idx.get("rentalprice"));
                java.math.BigDecimal deposit = getDecimal(row, idx.get("deposit"));
                Integer stockTotal = getInt(row, idx.get("stocktotal"));
                Integer stockAvailable = getInt(row, idx.get("stockavailable"));
                String description = getStr(row, idx.get("description"));

                java.util.List<String> err = new java.util.ArrayList<>();
                if (name == null || name.isEmpty()) err.add("名称不能为空");
                if (rentalPrice == null || rentalPrice.compareTo(java.math.BigDecimal.ZERO) < 0) err.add("日租价不合法");
                if (deposit != null && deposit.compareTo(java.math.BigDecimal.ZERO) < 0) err.add("押金不合法");
                int st = stockTotal == null ? 0 : stockTotal;
                int sa = stockAvailable == null ? 0 : stockAvailable;
                if (sa < 0 || st < 0 || sa > st) err.add("库存不合法");
                if (assetCode != null && !assetCode.isEmpty()) {
                    com.community.tools.catalog.entity.Tool dup = mapper.selectOne(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<com.community.tools.catalog.entity.Tool>().eq("asset_code", assetCode));
                    if (dup != null) err.add("资产编码重复");
                }
                if (categoryId == null && categoryName != null && !categoryName.isEmpty()) {
                    com.community.tools.catalog.entity.ToolCategory c = categoryMapper.selectOne(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<com.community.tools.catalog.entity.ToolCategory>().eq("name", categoryName));
                    categoryId = c != null ? c.getId() : null;
                }
                if (warehouseId == null && warehouseName != null && !warehouseName.isEmpty()) {
                    com.community.tools.catalog.entity.Warehouse w = warehouseMapper.selectOne(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<com.community.tools.catalog.entity.Warehouse>().eq("name", warehouseName));
                    warehouseId = w != null ? w.getId() : null;
                }
                if (!err.isEmpty()) {
                    result.failed++;
                    result.errors.add("第" + (r+1) + "行: " + String.join("; ", err));
                    continue;
                }
                if (!dryRun) {
                    Tool t = new Tool();
                    t.setName(name);
                    t.setModelSpec(modelSpec);
                    t.setAssetCode(assetCode);
                    t.setCategoryId(categoryId);
                    t.setWarehouseId(warehouseId);
                    t.setRentalPrice(rentalPrice);
                    t.setDeposit(deposit);
                    t.setStockTotal(st);
                    t.setStockAvailable(sa);
                    t.setStatus(1);
                    t.setDescription(description);
                    mapper.insert(t);
                }
                result.success++;
            }
            return ApiResponse.ok(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private static String getStr(Row row, Integer idx) {
        if (idx == null) return null;
        org.apache.poi.ss.usermodel.Cell c = row.getCell(idx);
        return c == null ? null : c.toString().trim();
    }
    private static Integer getInt(Row row, Integer idx) {
        if (idx == null) return null;
        try { return (int) Math.floor(row.getCell(idx).getNumericCellValue()); } catch (Exception e) { return null; }
    }
    private static Long getLong(Row row, Integer idx) {
        if (idx == null) return null;
        try { return (long) Math.floor(row.getCell(idx).getNumericCellValue()); } catch (Exception e) { return null; }
    }
    private static java.math.BigDecimal getDecimal(Row row, Integer idx) {
        if (idx == null) return null;
        try { return new java.math.BigDecimal(row.getCell(idx).toString()); } catch (Exception e) { return null; }
    }

    @lombok.Data
    public static class BatchStatusReq {
        public java.util.List<Long> ids;
        public Integer status;
    }

    @lombok.Data
    public static class BatchAdjustReq {
        public java.util.List<Long> ids;
        public Integer deltaTotal;
        public Integer deltaAvailable;
    }

    @PostMapping("/batch/status")
    public ApiResponse<Integer> batchStatus(@RequestBody BatchStatusReq req) {
        if (req.status == null || (req.status != 0 && req.status != 1)) return ApiResponse.error("invalid status");
        int count = 0;
        for (Long id : req.ids == null ? java.util.Collections.<Long>emptyList() : req.ids) {
            Tool t = mapper.selectById(id);
            if (t == null) continue;
            t.setStatus(req.status);
            mapper.updateById(t);
            count++;
        }
        return ApiResponse.ok(count);
    }

    @PostMapping("/batch/stock/adjust")
    public ApiResponse<Integer> batchAdjust(@RequestBody BatchAdjustReq req) {
        java.util.List<Long> ids = req.ids == null ? java.util.Collections.<Long>emptyList() : req.ids;
        // 预检查
        for (Long id : ids) {
            Tool t = mapper.selectById(id);
            if (t == null) return ApiResponse.error("tool not found: " + id);
            int total = (t.getStockTotal() == null ? 0 : t.getStockTotal()) + (req.deltaTotal == null ? 0 : req.deltaTotal);
            int avail = (t.getStockAvailable() == null ? 0 : t.getStockAvailable()) + (req.deltaAvailable == null ? 0 : req.deltaAvailable);
            if (total < 0) return ApiResponse.error("stock total negative for: " + id);
            if (avail < 0) return ApiResponse.error("stock available negative for: " + id);
            if (avail > total) return ApiResponse.error("stock available exceeds total for: " + id);
        }
        int count = 0;
        for (Long id : ids) {
            Tool t = mapper.selectById(id);
            int total = (t.getStockTotal() == null ? 0 : t.getStockTotal()) + (req.deltaTotal == null ? 0 : req.deltaTotal);
            int avail = (t.getStockAvailable() == null ? 0 : t.getStockAvailable()) + (req.deltaAvailable == null ? 0 : req.deltaAvailable);
            t.setStockTotal(total);
            t.setStockAvailable(avail);
            mapper.updateById(t);
            count++;
        }
        return ApiResponse.ok(count);
    }
}
