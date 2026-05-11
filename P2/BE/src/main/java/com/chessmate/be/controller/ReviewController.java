package com.chessmate.be.controller;

import com.chessmate.be.dto.request.ReviewCreateRequest;
import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.CourseReviewSummary;
import com.chessmate.be.dto.response.ReviewResponse;
import com.chessmate.be.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 리뷰 API 컨트롤러
 * 강의 리뷰 조회, 작성, 삭제 엔드포인트 제공
 */
@RestController
@RequestMapping("/api/courses/{courseId}/reviews")
@RequiredArgsConstructor
@Slf4j
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * 강의 리뷰 목록 조회 (공개)
     * GET /api/courses/{courseId}/reviews
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getCourseReviews(
            @PathVariable Long courseId) {
        log.debug("Get reviews for course: {}", courseId);

        List<ReviewResponse> reviews = reviewService.getCourseReviews(courseId);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    /**
     * 강의 리뷰 요약 통계 조회 (공개)
     * GET /api/courses/{courseId}/reviews/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<CourseReviewSummary>> getCourseReviewSummary(
            @PathVariable Long courseId) {
        log.debug("Get review summary for course: {}", courseId);

        CourseReviewSummary summary = reviewService.getCourseReviewSummary(courseId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    /**
     * 리뷰 작성 또는 수정 (STUDENT 전용)
     * POST /api/courses/{courseId}/reviews
     */
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<ReviewResponse>> createOrUpdateReview(
            @PathVariable Long courseId,
            @Valid @RequestBody ReviewCreateRequest request) {
        Long memberId = currentMemberId();
        log.info("Create/update review for course: {} by member: {}", courseId, memberId);

        ReviewResponse review = reviewService.createOrUpdateReview(courseId, request, memberId);
        return ResponseEntity.ok(ApiResponse.success(review, "리뷰가 저장되었습니다"));
    }

    /**
     * 내 리뷰 삭제 (STUDENT 전용)
     * DELETE /api/courses/{courseId}/reviews
     */
    @DeleteMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long courseId) {
        Long memberId = currentMemberId();
        log.info("Delete review for course: {} by member: {}", courseId, memberId);

        reviewService.deleteReview(courseId, memberId);
        return ResponseEntity.ok(ApiResponse.success(null, "리뷰가 삭제되었습니다"));
    }

    /**
     * SecurityContext에서 Member ID 추출
     */
    private Long currentMemberId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();

        if (principal instanceof Long) {
            return (Long) principal;
        }

        return Long.parseLong(principal.toString());
    }
}
