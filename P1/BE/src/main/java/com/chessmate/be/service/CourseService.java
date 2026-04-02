package com.chessmate.be.service;

import com.chessmate.be.dto.request.CourseCreateRequest;
import com.chessmate.be.dto.request.CourseUpdateRequest;
import com.chessmate.be.dto.response.CourseResponse;
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
        if (!instructor.getRole().equals("TEACHER")) {
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
     * 
     * @param pageable Spring Data의 Pageable (page, size, sort)
     * @return 강의 페이지 정보
     */
    public Page<CourseResponse> getAllCourses(Pageable pageable) {
        log.debug("Get all courses - page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        
        Page<Course> courses = courseRepository.findAll(pageable);
        
        return courses.map(course -> {
            Integer studentCount = enrollmentRepository.countByCourseId(course.getId());
            return CourseResponse.from(course, studentCount);
        });
    }

    /**
     * 카테고리별 강의 목록 조회
     * 
     * @param category STOCK 또는 CRYPTO
     * @param pageable 페이지네이션 정보
     * @return 강의 페이지 정보
     */
    public Page<CourseResponse> getCoursesByCategory(String category, Pageable pageable) {
        log.debug("Get courses by category: {}", category);
        
        Page<Course> courses = courseRepository.findByCategory(category, pageable);
        
        return courses.map(course -> {
            Integer studentCount = enrollmentRepository.countByCourseId(course.getId());
            return CourseResponse.from(course, studentCount);
        });
    }

    /**
     * 강사별 강의 목록 조회
     * 
     * @param instructorId 강사 ID
     * @param pageable 페이지네이션 정보
     * @return 강의 페이지 정보
     */
    public Page<CourseResponse> getCoursesByInstructor(Long instructorId, Pageable pageable) {
        log.debug("Get courses by instructor: {}", instructorId);
        
        Page<Course> courses = courseRepository.findByInstructorId(instructorId, pageable);
        
        return courses.map(course -> {
            Integer studentCount = enrollmentRepository.countByCourseId(course.getId());
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

