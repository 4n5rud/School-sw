package com.chessmate.be.controller;

import com.chessmate.be.dto.request.CourseCreateRequest;
import com.chessmate.be.dto.request.CourseUpdateRequest;
import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.CourseResponse;
import com.chessmate.be.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 강의 API 컨트롤러
 * 강의 CRUD 엔드포인트 제공
 */
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Slf4j
public class CourseController {

    private final CourseService courseService;

    /**
     * 강의 등록 (강사만)
     * POST /api/courses
     *
     * @param request 강의 등록 요청
     * @return 등록된 강의 정보
     */
    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CourseCreateRequest request) {

        Long instructorId = extractMemberIdFromAuthentication();
        log.info("Create course request from instructor: {}", instructorId);

        CourseResponse course = courseService.createCourse(request, instructorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(course, "강의가 등록되었습니다")
        );
    }

    /**
     * 강의 목록 조회 (전체 강의 - 카테고리 없음)
     * GET /api/courses?page=0&size=100
     *
     * 기본 동작:
     * - 파라미터 없음: 전체 강의 100개까지 한 페이지에 표시
     * - ?page=0&size=10: 원하는 크기로 페이지네이션 가능
     *
     * @param page 페이지 번호 (기본값: 0)
     * @param size 페이지당 개수 (기본값: 100 - 모든 강의 표시)
     * @return 강의 페이지 정보
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> getAllCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        // 페이지 크기 제한 (최대 100)
        if (size > 100) {
            size = 100;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        log.debug("Get all courses - page: {}, size: {}", page, size);
        Page<CourseResponse> courses = courseService.getAllCourses(pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * 강의 상세 조회
     * GET /api/courses/{courseId}
     *
     * @param courseId 강의 ID
     * @return 강의 상세 정보
     */
    @GetMapping("/{courseId}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(
            @PathVariable Long courseId) {

        log.debug("Get course detail: {}", courseId);
        CourseResponse course = courseService.getCourseById(courseId);
        return ResponseEntity.ok(ApiResponse.success(course));
    }

    /**
     * 강의 검색 및 필터링
     * GET /api/courses/search?keyword=주식&category=DOMESTIC_STOCK&page=0&size=50
     *
     * @param keyword 검색 키워드 (제목 기반, 기본값: 빈 문자열 = 모든 강의)
     * @param category 카테고리 필터 (선택사항, 지정 시 필터링)
     * @param page 페이지 번호 (기본값: 0)
     * @param size 페이지 크기 (기본값: 50 - 최대 100)
     * @return 검색 결과 페이지
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> searchCourses(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        log.info("Search courses - keyword: {}, category: {}, page: {}, size: {}", keyword, category, page, size);

        // 페이지 크기 제한 (최대 100)
        if (size > 100) {
            size = 100;
            log.warn("Page size limited to 100");
        }

        Pageable pageable = PageRequest.of(
            page,
            size,
            Sort.by("createdAt").descending()
        );

        Page<CourseResponse> result = courseService.searchCourses(
            keyword,
            category,
            pageable
        );

        log.info("Search result: {} courses found", result.getTotalElements());
        return ResponseEntity.ok(ApiResponse.success(
            result,
            result.getTotalElements() > 0 ? "강의 검색 결과입니다." : "검색 결과가 없습니다."
        ));
    }


    /**
     * 카테고리별 강의 조회
     * GET /api/courses/category/{category}?page=0&size=10
     *
     * @param category 강의 카테고리 (DOMESTIC_STOCK, OVERSEAS_STOCK, CRYPTO, NFT, ETF, FUTURES)
     * @param pageable 페이지네이션 정보
     * @return 강의 페이지 정보
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> getCoursesByCategory(
            @PathVariable String category,
            Pageable pageable) {

        log.debug("Get courses by category: {}", category);
        Page<CourseResponse> courses = courseService.getCoursesByCategoryName(category, pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * 강사별 강의 조회
     * GET /api/courses/instructor/{instructorId}?page=0&size=10
     *
     * @param instructorId 강사 ID
     * @param pageable 페이지네이션 정보
     * @return 강의 페이지 정보
     */
    @GetMapping("/instructor/{instructorId}")
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> getCoursesByInstructor(
            @PathVariable Long instructorId,
            Pageable pageable) {

        log.debug("Get courses by instructor: {}", instructorId);
        Page<CourseResponse> courses = courseService.getCoursesByInstructor(instructorId, pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * 강의 수정 (강사만 자신의 강의 수정 가능)
     * PUT /api/courses/{courseId}
     *
     * @param courseId 강의 ID
     * @param request 강의 수정 요청
     * @return 수정된 강의 정보
     */
    @PutMapping("/{courseId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable Long courseId,
            @Valid @RequestBody CourseUpdateRequest request) {

        Long instructorId = extractMemberIdFromAuthentication();
        log.info("Update course: {} by instructor: {}", courseId, instructorId);

        CourseResponse course = courseService.updateCourse(courseId, request, instructorId);
        return ResponseEntity.ok(
                ApiResponse.success(course, "강의가 수정되었습니다")
        );
    }

    /**
     * 강의 삭제 (강사만 자신의 강의 삭제 가능)
     * DELETE /api/courses/{courseId}
     *
     * @param courseId 강의 ID
     * @return 삭제 완료 메시지
     */
    @DeleteMapping("/{courseId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(
            @PathVariable Long courseId) {

        Long instructorId = extractMemberIdFromAuthentication();
        log.info("Delete course: {} by instructor: {}", courseId, instructorId);

        courseService.deleteCourse(courseId, instructorId);
        return ResponseEntity.ok(
                ApiResponse.success(null, "강의가 삭제되었습니다")
        );
    }


    /**
     * SecurityContext에서 Member ID 추출
     * JWT 토큰에서 추출된 Member ID를 반환
     */
    private Long extractMemberIdFromAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();

        if (principal instanceof Long) {
            return (Long) principal;
        }

        // principal이 String인 경우 Long으로 변환
        return Long.parseLong(principal.toString());
    }
}

