package com.axiqra.api.controller;

import com.axiqra.api.annotation.RequireScope;
import com.axiqra.common.domain.dto.FeedbackSubmitRequest;
import com.axiqra.common.domain.vo.FeedbackDetailVO;
import com.axiqra.common.domain.vo.SolutionFeedbackStatsVO;
import com.axiqra.core.service.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Feedback Controller
 *
 * @author Axiqra Team
 * @date 2026-06-11
 */
@Tag(name = "Feedback", description = "反馈接口")
@RestController
@RequestMapping("/api/v1/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @Operation(summary = "提交反馈")
    @PostMapping
    @RequireScope("feedback:write")
    public ResponseEntity<FeedbackDetailVO> submitFeedback(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody FeedbackSubmitRequest request) {
        FeedbackDetailVO result = feedbackService.submitFeedback(userId, request);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "获取反馈列表")
    @GetMapping
    @RequireScope("feedback:read")
    public ResponseEntity<List<FeedbackDetailVO>> listFeedbacks(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String targetType,
            @RequestParam Long targetId) {
        List<FeedbackDetailVO> result = feedbackService.listFeedbacks(userId, targetType, targetId);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "获取 Solution 反馈统计")
    @GetMapping("/solutions/{solutionId}/stats")
    @RequireScope("feedback:read")
    public ResponseEntity<SolutionFeedbackStatsVO> getSolutionFeedbackStats(@PathVariable Long solutionId) {
        SolutionFeedbackStatsVO result = feedbackService.getSolutionFeedbackStats(solutionId);
        return ResponseEntity.ok(result);
    }
}
