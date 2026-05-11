package com.chessmate.be.controller;

import com.chessmate.be.dto.request.AnswerRequest;
import com.chessmate.be.dto.request.QuestionCreateRequest;
import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.QuestionResponse;
import com.chessmate.be.service.CourseQuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 강의 Q&A API 컨트롤러
 * 질문 등록, 조회, 답변, 삭제 엔드포인트 제공
 */
@RestController
@RequestMapping("/api/courses/{courseId}/questions")
@RequiredArgsConstructor
@Slf4j
public class CourseQuestionController {

    private final CourseQuestionService courseQuestionService;

    /**
     * 질문 목록 조회 (공개)
     * GET /api/courses/{courseId}/questions?page=0&size=10
     *
     * @param courseId 강의 ID
     * @param page     페이지 번호 (기본값: 0)
     * @param size     페이지당 개수 (기본값: 10)
     * @return 질문 페이지 정보
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> getQuestions(
            @PathVariable Long courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.debug("Get questions: course {}, page {}, size {}", courseId, page, size);

        Page<QuestionResponse> questions = courseQuestionService.getQuestions(courseId, page, size);
        return ResponseEntity.ok(ApiResponse.success(questions));
    }

    /**
     * 질문 등록 (수강생만)
     * POST /api/courses/{courseId}/questions
     *
     * @param courseId 강의 ID
     * @param request  질문 요청 (title, content)
     * @return 등록된 질문 정보
     */
    @PostMapping
    public ResponseEntity<ApiResponse<QuestionResponse>> createQuestion(
            @PathVariable Long courseId,
            @Valid @RequestBody QuestionCreateRequest request) {

        Long memberId = extractMemberIdFromAuthentication();
        log.info("Create question: course {} by member {}", courseId, memberId);

        QuestionResponse question = courseQuestionService.createQuestion(courseId, request, memberId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(question, "질문이 등록되었습니다")
        );
    }

    /**
     * 질문 답변 (강의 담당 강사만)
     * POST /api/courses/{courseId}/questions/{questionId}/answer
     *
     * @param courseId   강의 ID
     * @param questionId 질문 ID
     * @param request    답변 요청
     * @return 답변이 등록된 질문 정보
     */
    @PostMapping("/{questionId}/answer")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<QuestionResponse>> answerQuestion(
            @PathVariable Long courseId,
            @PathVariable Long questionId,
            @Valid @RequestBody AnswerRequest request) {

        Long teacherId = extractMemberIdFromAuthentication();
        log.info("Answer question: {} in course {} by teacher {}", questionId, courseId, teacherId);

        QuestionResponse question = courseQuestionService.answerQuestion(questionId, request, teacherId);
        return ResponseEntity.ok(ApiResponse.success(question, "답변이 등록되었습니다"));
    }

    /**
     * 질문 삭제 (작성자 또는 강의 담당 강사)
     * DELETE /api/courses/{courseId}/questions/{questionId}
     *
     * @param courseId   강의 ID
     * @param questionId 질문 ID
     * @return 삭제 완료 메시지
     */
    @DeleteMapping("/{questionId}")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @PathVariable Long courseId,
            @PathVariable Long questionId) {

        Long memberId = extractMemberIdFromAuthentication();
        log.info("Delete question: {} in course {} by member {}", questionId, courseId, memberId);

        courseQuestionService.deleteQuestion(questionId, memberId);
        return ResponseEntity.ok(ApiResponse.success(null, "질문이 삭제되었습니다"));
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
