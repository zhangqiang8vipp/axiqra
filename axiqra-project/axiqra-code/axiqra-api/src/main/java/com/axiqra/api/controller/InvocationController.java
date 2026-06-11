package com.axiqra.api.controller;

import com.axiqra.api.annotation.RequireScope;
import com.axiqra.common.domain.dto.InvocationReportRequest;
import com.axiqra.common.domain.vo.InvocationDetailVO;
import com.axiqra.common.domain.vo.SolutionFeedbackStatsVO;
import com.axiqra.common.response.ApiResponse;
import com.axiqra.core.service.InvocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Invocation Controller
 *
 * @author Axiqra Team
 * @date 2026-06-11
 */
@Tag(name = "Invocation", description = "调用记录接口")
@RestController
@RequestMapping("/api/v1/invocations")
@RequiredArgsConstructor
@Validated
public class InvocationController {

    private final InvocationService invocationService;

    @Operation(summary = "上报调用结果")
    @PostMapping
    @RequireScope("connect:write")
    public ResponseEntity<ApiResponse<InvocationDetailVO>> reportInvocation(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody InvocationReportRequest request) {
        InvocationDetailVO result = invocationService.reportInvocation(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Operation(summary = "获取调用详情")
    @GetMapping("/{invocationId}")
    @RequireScope("connect:read")
    public ResponseEntity<ApiResponse<InvocationDetailVO>> getInvocationDetail(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable @Positive Long invocationId) {
        if (!invocationService.isUserAuthorized(userId, invocationId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.fail(403, "无权限查看该调用记录"));
        }
        InvocationDetailVO result = invocationService.getInvocationDetail(userId, invocationId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Operation(summary = "获取指定 Solution 的反馈统计")
    @GetMapping("/solutions/{solutionId}/feedback-stats")
    @RequireScope("feedback:read")
    public ResponseEntity<ApiResponse<SolutionFeedbackStatsVO>> getSolutionFeedbackStats(@PathVariable @Positive Long solutionId) {
        SolutionFeedbackStatsVO result = invocationService.getSolutionFeedbackStats(solutionId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
