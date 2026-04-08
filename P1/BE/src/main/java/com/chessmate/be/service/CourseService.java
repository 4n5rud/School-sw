package com.chessmate.be.service;

import com.chessmate.be.dto.request.CourseCreateRequest;
import com.chessmate.be.dto.request.CourseUpdateRequest;
import com.chessmate.be.dto.response.CourseResponse;
import com.chessmate.be.dto.response.CourseSearchResponse;
import com.chessmate.be.dto.response.CourseSearchResponse;
import com.chessmate.be.entity.Course;
import com.chessmate.be.entity.Member;
import com.chessmate.be.exception.AccessDeniedException;
import com.chessmate.be.exception.EntityNotFoundException;
import com.chessmate.be.repository.CourseRepository;
import com.chessmate.be.repository.EnrollmentRepository;
import com.chessmate.be.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 강의 서비스
 * 강의 CRUD 및 권한 관리 기능 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CourseService {

    private final CourseRepository courseRepository;
    private final MemberRepository memberRepository;
    private final EnrollmentRepository enrollmentRepository;

    /**
     * 강의 등록 (강사만 가능)
     * 
     * @param request 강의 등록 요청
     * @param instructorId 강사 ID (JWT에서 추출)
     * @return 등록된 강의 정보
     * @throws EntityNotFoundException 강사를 찾을 수 없는 경우
     * @throws AccessDeniedException 강사 역할이 아닌 경우
     */
    @Transactional
    public CourseResponse createCourse(CourseCreateRequest request, Long instructorId) {
        log.info("Create course request from instructor: {}", instructorId);
        
        // 1. 강사 정보 조회
        Member instructor = memberRepository.findById(instructorId)
                .orElseThrow(() -> {
                    log.warn("Instructor not found: {}", instructorId);
                    return new EntityNotFoundException("강사를 찾을 수 없습니다");
                });
        
        // 2. 강사 역할 확인
        if (!instructor.getRole().equals(Member.Role.TEACHER)) {
            log.warn("User is not a teacher: {} - {}", instructorId, instructor.getRole());
            throw new AccessDeniedException("강사만 강의를 등록할 수 있습니다");
        }
        
        // 3. Course 엔티티 생성 및 저장
        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .price(request.getPrice())
                .thumbnailUrl(request.getThumbnailUrl())
                .instructor(instructor)
                .build();
        
        Course savedCourse = courseRepository.save(course);
        log.info("Course created: {} by instructor: {}", savedCourse.getId(), instructorId);
        
        // 4. CourseResponse 반환 (수강 인원: 0)
        return CourseResponse.from(savedCourse, 0);
    }

    /**
     * 강의 상세 조회
     * 
     * @param courseId 강의 ID
     * @return 강의 상세 정보
     * @throws EntityNotFoundException 강의를 찾을 수 없는 경우
     */
    public CourseResponse getCourseById(Long courseId) {
        log.debug("Get course detail: {}", courseId);
        
        Course course = courseRepository.findByIdWithInstructor(courseId)
                .orElseThrow(() -> {
                    log.warn("Course not found: {}", courseId);
                    return new EntityNotFoundException("강의를 찾을 수 없습니다");
                });
        
        // 수강 인원 조회
        Integer studentCount = enrollmentRepository.countByCourseId(courseId);
        
        return CourseResponse.from(course, studentCount);
    }

    /**
     * 강의 목록 조회 (페이지네이션)
     * N+1 쿼리 문제 해결 - 배치 조회 사용
     *
     * @param pageable Spring Data의 Pageable (page, size, sort)
     * @return 강의 페이지 정보
     */
    public Page<CourseResponse> getAllCourses(Pageable pageable) {
        log.debug("Get all courses - page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        
        // 모든 강의와 강사 정보를 한 번에 조회
        Page<Course> courses = courseRepository.findAll(pageable);
        
        // 강의 ID 목록 추출
        List<Long> courseIds = courses.getContent().stream()
                .map(Course::getId)
                .toList();

        // 모든 강의의 수강생 수를 한 번의 쿼리로 조회
        Map<Long, Long> enrollmentCounts = new HashMap<>();
        if (!courseIds.isEmpty()) {
            List<java.util.Map<String, Object>> results = enrollmentRepository.countEnrollmentsByCourseIds(courseIds);
            for (java.util.Map<String, Object> result : results) {
                Long courseId = ((Number) result.get("courseId")).longValue();
                Long count = ((Number) result.get("count")).longValue();
                enrollmentCounts.put(courseId, count);
            }
        }

        // CourseResponse로 변환
        return courses.map(course -> {
            Integer studentCount = enrollmentCounts.getOrDefault(course.getId(), 0L).intValue();
            return CourseResponse.from(course, studentCount);
        });
    }

    /**
     * 카테고리별 강의 목록 조회
     * N+1 쿼리 문제 해결 - 배치 조회 사용
     *
     * @param category 강의 카테고리 (Enum)
     * @param pageable 페이지네이션 정보
     * @return 강의 페이지 정보
     */
    public Page<CourseResponse> getCoursesByCategory(Course.CourseCategory category, Pageable pageable) {
        log.debug("Get courses by category: {}", category);
        
        Page<Course> courses = courseRepository.findByCategory(category, pageable);
        
        // 강의 ID 목록 추출
        List<Long> courseIds = courses.getContent().stream()
                .map(Course::getId)
                .toList();

        // 모든 강의의 수강생 수를 한 번의 쿼리로 조회
        Map<Long, Long> enrollmentCounts = new HashMap<>();
        if (!courseIds.isEmpty()) {
            List<java.util.Map<String, Object>> results = enrollmentRepository.countEnrollmentsByCourseIds(courseIds);
            for (java.util.Map<String, Object> result : results) {
                Long courseId = ((Number) result.get("courseId")).longValue();
                Long count = ((Number) result.get("count")).longValue();
                enrollmentCounts.put(courseId, count);
            }
        }

        return courses.map(course -> {
            Integer studentCount = enrollmentCounts.getOrDefault(course.getId(), 0L).intValue();
            return CourseResponse.from(course, studentCount);
        });
    }

    /**
     * 카테고리별 강의 목록 조회 (String 기반 - 편의성)
     *
     * @param categoryName 강의 카테고리 이름 (String)
     * @param pageable 페이지네이션 정보
     * @return 강의 페이지 정보
     */
    public Page<CourseResponse> getCoursesByCategoryName(String categoryName, Pageable pageable) {
        log.debug("Get courses by category name: {}", categoryName);

        try {
            Course.CourseCategory category = Course.CourseCategory.valueOf(categoryName.toUpperCase());
            return getCoursesByCategory(category, pageable);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid category: {}", categoryName);
            throw new IllegalArgumentException("유효하지 않은 카테고리입니다: " + categoryName);
        }
    }

    /**
     * 강사별 강의 목록 조회
     * N+1 쿼리 문제 해결 - 배치 조회 사용
     *
     * @param instructorId 강사 ID
     * @param pageable 페이지네이션 정보
     * @return 강의 페이지 정보
     */
    public Page<CourseResponse> getCoursesByInstructor(Long instructorId, Pageable pageable) {
        log.debug("Get courses by instructor: {}", instructorId);
        
        Page<Course> courses = courseRepository.findByInstructorId(instructorId, pageable);
        
        // 강의 ID 목록 추출
        List<Long> courseIds = courses.getContent().stream()
                .map(Course::getId)
                .toList();

        // 모든 강의의 수강생 수를 한 번의 쿼리로 조회
        Map<Long, Long> enrollmentCounts = new HashMap<>();
        if (!courseIds.isEmpty()) {
            List<java.util.Map<String, Object>> results = enrollmentRepository.countEnrollmentsByCourseIds(courseIds);
            for (java.util.Map<String, Object> result : results) {
                Long courseId = ((Number) result.get("courseId")).longValue();
                Long count = ((Number) result.get("count")).longValue();
                enrollmentCounts.put(courseId, count);
            }
        }

        return courses.map(course -> {
            Integer studentCount = enrollmentCounts.getOrDefault(course.getId(), 0L).intValue();
            return CourseResponse.from(course, studentCount);
        });
    }

    /**
     * 강의 검색 (키워드 + 카테고리)
     * N+1 쿼리 문제 해결 - 배치 조회 사용
     *
     * @param keyword 검색 키워드 (제목 기반)
     * @param category 카테고리 필터 (Enum 기반, null이면 전체)
     * @param pageable 페이지네이션 정보
     * @return 검색 결과 페이지
     */
    public Page<CourseResponse> searchCourses(
        String keyword,
        String category,
        Pageable pageable
    ) {
        log.debug("Search courses - keyword: {}, category: {}, page: {}", keyword, category, pageable.getPageNumber());

        // 키워드가 빈 문자열이면 전체 조회
        String searchKeyword = (keyword != null && !keyword.trim().isEmpty())
            ? keyword.trim()
            : "";

        // 카테고리 처리 (String → Enum)
        Course.CourseCategory courseCategory = null;
        if (category != null && !category.trim().isEmpty()) {
            try {
                courseCategory = Course.CourseCategory.valueOf(category.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid category: {}", category);
                courseCategory = null; // 유효하지 않은 카테고리는 무시
            }
        }

        Page<Course> courses = courseRepository.searchByKeywordAndCategory(
            searchKeyword,
            courseCategory,
            pageable
        );

        // 강의 ID 목록 추출
        List<Long> courseIds = courses.getContent().stream()
                .map(Course::getId)
                .toList();

        // 모든 강의의 수강생 수를 한 번의 쿼리로 조회
        Map<Long, Long> enrollmentCounts = new HashMap<>();
        if (!courseIds.isEmpty()) {
            List<java.util.Map<String, Object>> results = enrollmentRepository.countEnrollmentsByCourseIds(courseIds);
            for (java.util.Map<String, Object> result : results) {
                Long courseId = ((Number) result.get("courseId")).longValue();
                Long count = ((Number) result.get("count")).longValue();
                enrollmentCounts.put(courseId, count);
            }
        }

        return courses.map(course -> {
            Integer studentCount = enrollmentCounts.getOrDefault(course.getId(), 0L).intValue();
            return CourseResponse.from(course, studentCount);
        });
    }

    /**
     * 강의 수정 (강사만 자신의 강의 수정 가능)
     * 
     * @param courseId 강의 ID
     * @param request 강의 수정 요청
     * @param instructorId 강사 ID (JWT에서 추출)
     * @return 수정된 강의 정보
     * @throws EntityNotFoundException 강의를 찾을 수 없는 경우
     * @throws AccessDeniedException 자신의 강의가 아닌 경우
     */
    @Transactional
    public CourseResponse updateCourse(Long courseId, CourseUpdateRequest request, Long instructorId) {
        log.info("Update course: {} by instructor: {}", courseId, instructorId);
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> {
                    log.warn("Course not found: {}", courseId);
                    return new EntityNotFoundException("강의를 찾을 수 없습니다");
                });
        
        // 1. 강의 강사와 현재 사용자가 동일한지 확인
        if (!course.getInstructor().getId().equals(instructorId)) {
            log.warn("Unauthorized access to course: {} by user: {}", courseId, instructorId);
            throw new AccessDeniedException("자신의 강의만 수정할 수 있습니다");
        }
        
        // 2. 강의 정보 수정
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setPrice(request.getPrice());
        course.setThumbnailUrl(request.getThumbnailUrl());
        
        Course updatedCourse = courseRepository.save(course);
        log.info("Course updated: {}", courseId);
        
        // 3. CourseResponse 반환
        Integer studentCount = enrollmentRepository.countByCourseId(courseId);
        return CourseResponse.from(updatedCourse, studentCount);
    }

    /**
     * 강의 삭제 (강사만 자신의 강의 삭제 가능)
     * 
     * @param courseId 강의 ID
     * @param instructorId 강사 ID (JWT에서 추출)
     * @throws EntityNotFoundException 강의를 찾을 수 없는 경우
     * @throws AccessDeniedException 자신의 강의가 아닌 경우
     */
    @Transactional
    public void deleteCourse(Long courseId, Long instructorId) {
        log.info("Delete course: {} by instructor: {}", courseId, instructorId);
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> {
                    log.warn("Course not found: {}", courseId);
                    return new EntityNotFoundException("강의를 찾을 수 없습니다");
                });
        
        // 1. 강의 강사와 현재 사용자가 동일한지 확인
        if (!course.getInstructor().getId().equals(instructorId)) {
            log.warn("Unauthorized access to course: {} by user: {}", courseId, instructorId);
            throw new AccessDeniedException("자신의 강의만 삭제할 수 있습니다");
        }
        
        // 2. 강의 삭제 (CASCADE: 섹션, 강의, 수강 정보도 함께 삭제)
        courseRepository.deleteById(courseId);
        log.info("Course deleted: {}", courseId);
    }
}

