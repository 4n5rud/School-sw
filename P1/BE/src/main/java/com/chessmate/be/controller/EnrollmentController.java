package com.chessmate.be.controller;

import com.chessmate.be.dto.request.EnrollmentCreateRequest;
import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.EnrollmentResponse;
import com.chessmate.be.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 수강 API 컨트롤러
 * 수강 등록, 조회 엔드포인트 제공
 */
@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
@Slf4j
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    /**
     * 수강 등록
     * POST /api/enrollments
     *
     * @param request 수강 등록 요청
     * @return 수강 정보
     */
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> enrollCourse(
            @Valid @RequestBody EnrollmentCreateRequest request) {

        Long memberId = extractMemberIdFromAuthentication();
        log.info("🔐 [권한 검증 통과] STUDENT 역할 확인됨 - Enroll course: {} by member: {}", request.getCourseId(), memberId);

        EnrollmentResponse enrollment = enrollmentService.enrollCourse(request, memberId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(enrollment, "수강 등록이 완료되었습니다")
        );
    }

    /**
     * 내 수강 목록 조회
     * GET /api/enrollments/my?page=0&size=10
     *
     * @param pageable 페이지네이션 정보
     * @return 수강 페이지 정보
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Page<EnrollmentResponse>>> getMyEnrollments(
            Pageable pageable) {

        Long memberId = extractMemberIdFromAuthentication();
        log.debug("Get enrollments for member: {}", memberId);

        Page<EnrollmentResponse> enrollments = enrollmentService.getMyEnrollments(memberId, pageable);
        return ResponseEntity.ok(ApiResponse.success(enrollments));
    }

    /**
     * 강의 완강 처리
     * PUT /api/enrollments/{enrollmentId}/complete
     *
     * @param courseId 강의 ID
     * @return 완료 메시지
     */
    @PutMapping("/courses/{courseId}/complete")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Void>> completeCourse(
            @PathVariable Long courseId) {

        Long memberId = extractMemberIdFromAuthentication();
        log.info("Complete course: {} by member: {}", courseId, memberId);

        enrollmentService.completeCourse(memberId, courseId);
        return ResponseEntity.ok(
                ApiResponse.success(null, "강의 완강 처리 되었습니다")
        );
    }

    /**
     * SecurityContext에서 Member ID 추출
     */
    private Long extractMemberIdFromAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();

        if (principal instanceof Long) {
            return (Long) principal;
        }

        return Long.parseLong(principal.toString());
    }
}

