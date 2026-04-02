package com.chessmate.be.service;

import com.chessmate.be.dto.request.EnrollmentCreateRequest;
import com.chessmate.be.dto.response.EnrollmentResponse;
import com.chessmate.be.entity.Course;
import com.chessmate.be.entity.Enrollment;
import com.chessmate.be.entity.Member;
import com.chessmate.be.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.chessmate.be.repository.CourseRepository;
import com.chessmate.be.repository.EnrollmentRepository;
import com.chessmate.be.repository.MemberRepository;

import java.time.LocalDateTime;

/**
 * 수강 서비스
 * 수강 등록, 조회, 관리 기능 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final MemberRepository memberRepository;
    private final CourseRepository courseRepository;

    /**
     * 수강 등록
     * 
     * @param request 수강 등록 요청 (courseId)
     * @param memberId 학생 ID (JWT에서 추출)
     * @return 수강 정보
     * @throws EntityNotFoundException 학생 또는 강의를 찾을 수 없는 경우
     */
    @Transactional
    public EnrollmentResponse enrollCourse(EnrollmentCreateRequest request, Long memberId) {
        log.info("Enroll course: {} by member: {}", request.getCourseId(), memberId);
        
        // 1. 학생 정보 조회
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> {
                    log.warn("Member not found: {}", memberId);
                    return new EntityNotFoundException("학생을 찾을 수 없습니다");
                });
        
        // 2. 강의 정보 조회
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> {
                    log.warn("Course not found: {}", request.getCourseId());
                    return new EntityNotFoundException("강의를 찾을 수 없습니다");
                });
        
        // 3. 이미 수강 등록했는지 확인
        enrollmentRepository.findByMemberIdAndCourseId(memberId, request.getCourseId())
                .ifPresent(enrollment -> {
                    log.warn("Already enrolled: member {} in course {}", memberId, request.getCourseId());
                    throw new IllegalArgumentException("이미 수강 등록한 강의입니다");
                });
        
        // 4. Enrollment 엔티티 생성 및 저장
        Enrollment enrollment = Enrollment.builder()
                .member(member)
                .course(course)
                .enrolledAt(LocalDateTime.now())
                .isCompleted(false)
                .build();
        
        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);
        log.info("Enrollment created: {} for member: {}", savedEnrollment.getId(), memberId);
        
        // 5. EnrollmentResponse 반환
        return EnrollmentResponse.from(savedEnrollment);
    }

    /**
     * 내 수강 목록 조회
     * 
     * @param memberId 학생 ID
     * @param pageable 페이지네이션 정보
     * @return 수강 페이지 정보
     */
    public Page<EnrollmentResponse> getMyEnrollments(Long memberId, Pageable pageable) {
        log.debug("Get enrollments for member: {}", memberId);
        
        Page<Enrollment> enrollments = enrollmentRepository.findByMemberIdWithCourse(memberId, pageable);
        
        return enrollments.map(EnrollmentResponse::from);
    }

    /**
     * 강의별 수강생 수 조회
     * 
     * @param courseId 강의 ID
     * @return 수강생 수
     */
    public Integer getCourseStudentCount(Long courseId) {
        return enrollmentRepository.countByCourseId(courseId);
    }

    /**
     * 수강 여부 확인
     * 
     * @param memberId 학생 ID
     * @param courseId 강의 ID
     * @return 수강 중인지 여부
     */
    public boolean isEnrolled(Long memberId, Long courseId) {
        return enrollmentRepository.findByMemberIdAndCourseId(memberId, courseId).isPresent();
    }

    /**
     * 강의 완강 처리
     * 
     * @param memberId 학생 ID
     * @param courseId 강의 ID
     */
    @Transactional
    public void completeCourse(Long memberId, Long courseId) {
        log.info("Complete course: {} for member: {}", courseId, memberId);
        
        Enrollment enrollment = enrollmentRepository.findByMemberIdAndCourseId(memberId, courseId)
                .orElseThrow(() -> {
                    log.warn("Enrollment not found: member {} in course {}", memberId, courseId);
                    return new EntityNotFoundException("수강 정보를 찾을 수 없습니다");
                });
        
        enrollment.setIsCompleted(true);
        enrollmentRepository.save(enrollment);
        
        log.info("Course completed: {} for member: {}", courseId, memberId);
    }
}

