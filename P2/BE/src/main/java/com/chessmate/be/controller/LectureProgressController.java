package com.chessmate.be.controller;

import com.chessmate.be.dto.request.LectureProgressRequest;
import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.LectureProgressResponse;
import com.chessmate.be.service.LectureProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
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
 * 강의 시청 진행 API 컨트롤러
 * 학생의 강의 시청 진행 상황 관리 엔드포인트
 */
@RestController
@RequestMapping("/api/lecture-progress")
@RequiredArgsConstructor
@Slf4j
public class LectureProgressController {

    private final LectureProgressService lectureProgressService;

    /**
     * 강의 시청 진행 상황 저장
     * POST /api/lecture-progress
     *
     * @param request 진행 정보 저장 요청
     * @return 저장된 진행 정보
     */
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<LectureProgressResponse>> saveProgress(
            @Valid @RequestBody LectureProgressRequest request) {

        Long memberId = extractMemberIdFromAuthentication();
        log.info("Save progress for lecture: {} by member: {}", request.getLectureId(), memberId);

        LectureProgressResponse progress = lectureProgressService.saveProgress(
                memberId, request.getLectureId(), request.getLastPosition());

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(progress, "강의 진행 상황이 저장되었습니다")
        );
    }

    /**
     * 강의 시청 진행 정보 조회
     * GET /api/lecture-progress/lectures/{lectureId}
     *
     * @param lectureId 강의 ID
     * @return 진행 정보
     */
    @GetMapping("/lectures/{lectureId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<LectureProgressResponse>> getProgress(
            @PathVariable Long lectureId) {

        Long memberId = extractMemberIdFromAuthentication();
        log.debug("Get progress for lecture: {} by member: {}", lectureId, memberId);

        LectureProgressResponse progress = lectureProgressService.getProgress(memberId, lectureId);
        return ResponseEntity.ok(ApiResponse.success(progress));
    }

    /**
     * 내 강의 시청 진행 목록 조회
     * GET /api/lecture-progress/my
     *
     * @return 진행 정보 리스트
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<LectureProgressResponse>>> getMyProgress() {

        Long memberId = extractMemberIdFromAuthentication();
        log.debug("Get all progress for member: {}", memberId);

        List<LectureProgressResponse> progressList = lectureProgressService.getProgressByMember(memberId);
        return ResponseEntity.ok(ApiResponse.success(progressList));
    }

    /**
     * 강의 시청 진행 정보 삭제
     * DELETE /api/lecture-progress/lectures/{lectureId}
     *
     * @param lectureId 강의 ID
     * @return 삭제 성공 메시지
     */
    @DeleteMapping("/lectures/{lectureId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Void>> deleteProgress(
            @PathVariable Long lectureId) {

        Long memberId = extractMemberIdFromAuthentication();
        log.info("Delete progress for lecture: {} by member: {}", lectureId, memberId);

        lectureProgressService.deleteProgress(memberId, lectureId);
        return ResponseEntity.ok(
                ApiResponse.success(null, "강의 진행 정보가 삭제되었습니다")
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

