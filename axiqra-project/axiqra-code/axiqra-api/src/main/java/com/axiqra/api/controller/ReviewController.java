package com.axiqra.api.controller;

import com.axiqra.api.annotation.RequireScope;
import com.axiqra.common.domain.vo.ReviewDetailVO;
import com.axiqra.core.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Review Controller
 *
 * @author Axiqra Team
 * @date 2026-06-11
 */
@Tag(name = "Review", description = "审核接口")
@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@Validated
public class ReviewController {

    private final ReviewService reviewService;

    @Operation(summary = "获取待审核队列")
    @GetMapping("/pending")
    @RequireScope("review:read")
    public ResponseEntity<List<ReviewDetailVO>> getPendingReviews(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "human") String queue,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit) {
        List<ReviewDetailVO> result = reviewService.getPendingReviews(userId, queue, limit);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "获取审核详情")
    @GetMapping("/{reviewId}")
    @RequireScope("review:read")
    public ResponseEntity<ReviewDetailVO> getReviewDetail(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long reviewId) {
        ReviewDetailVO result = reviewService.getReviewDetail(userId, reviewId);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "审核通过")
    @PostMapping("/{reviewId}/approve")
    @RequireScope("review:write")
    public ResponseEntity<ReviewDetailVO> approve(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long reviewId,
            @RequestParam(required = false) String reasonCode,
            @RequestParam(required = false) String notes) {
        ReviewDetailVO result = reviewService.approve(userId, reviewId, reasonCode, notes);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "审核拒绝")
    @PostMapping("/{reviewId}/reject")
    @RequireScope("review:write")
    public ResponseEntity<ReviewDetailVO> reject(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long reviewId,
            @RequestParam(required = false) String reasonCode,
            @RequestParam(required = false) String notes) {
        ReviewDetailVO result = reviewService.reject(userId, reviewId, reasonCode, notes);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "隔离内容")
    @PostMapping("/{reviewId}/quarantine")
    @RequireScope("review:write")
    public ResponseEntity<ReviewDetailVO> quarantine(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long reviewId,
            @RequestParam(required = false) String reasonCode,
            @RequestParam(required = false) String notes) {
        ReviewDetailVO result = reviewService.quarantine(userId, reviewId, reasonCode, notes);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "申诉")
    @PostMapping("/{reviewId}/appeal")
    @RequireScope("review:write")
    public ResponseEntity<ReviewDetailVO> appeal(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long reviewId,
            @RequestParam(required = false) String appealContent) {
        ReviewDetailVO result = reviewService.appeal(userId, reviewId, appealContent);
        return ResponseEntity.ok(result);
    }
}
