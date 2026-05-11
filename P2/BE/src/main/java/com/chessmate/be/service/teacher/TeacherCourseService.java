package com.chessmate.be.service.teacher;

import com.chessmate.be.dto.request.CourseCreateRequest;
import com.chessmate.be.dto.request.CourseUpdateRequest;
import com.chessmate.be.dto.response.teacher.TeacherCourseResponse;
import com.chessmate.be.entity.Course;
import com.chessmate.be.entity.Member;
import com.chessmate.be.exception.AccessDeniedException;
import com.chessmate.be.exception.EntityNotFoundException;
import com.chessmate.be.repository.CourseRepository;
import com.chessmate.be.repository.EnrollmentRepository;
import com.chessmate.be.repository.MemberRepository;
import com.chessmate.be.security.TeacherOwnershipValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TeacherCourseService {

    private final CourseRepository courseRepository;
    private final MemberRepository memberRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TeacherOwnershipValidator ownershipValidator;

    public List<TeacherCourseResponse> getMyCourses(Long instructorId) {
        List<Course> courses = courseRepository.findAllByInstructorId(instructorId);

        List<Long> courseIds = courses.stream().map(Course::getId).toList();
        Map<Long, Long> enrollmentCounts = fetchEnrollmentCounts(courseIds);

        return courses.stream()
                .map(c -> TeacherCourseResponse.from(c, enrollmentCounts.getOrDefault(c.getId(), 0L).intValue()))
                .collect(Collectors.toList());
    }

    @Transactional
    public TeacherCourseResponse createCourse(CourseCreateRequest request, Long instructorId) {
        Member instructor = memberRepository.findById(instructorId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .price(request.getPrice())
                .thumbnailUrl(request.getThumbnailUrl())
                .instructor(instructor)
                .isPublished(true)
                .build();

        Course saved = courseRepository.save(course);
        return TeacherCourseResponse.from(saved, 0);
    }

    @Transactional
    public TeacherCourseResponse updateCourse(Long courseId, CourseUpdateRequest request, Long instructorId) {
        Course course = ownershipValidator.validateCourseOwner(courseId, instructorId);

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setPrice(request.getPrice());
        course.setThumbnailUrl(request.getThumbnailUrl());

        Course updated = courseRepository.save(course);
        int studentCount = enrollmentRepository.countByCourseId(courseId);
        return TeacherCourseResponse.from(updated, studentCount);
    }

    @Transactional
    public void deleteCourse(Long courseId, Long instructorId) {
        Course course = ownershipValidator.validateCourseOwner(courseId, instructorId);

        int studentCount = enrollmentRepository.countByCourseId(courseId);
        if (studentCount > 0) {
            throw new AccessDeniedException("수강생이 있는 강의는 삭제할 수 없습니다.");
        }

        courseRepository.delete(course);
        log.info("Course deleted: {} by instructor: {}", courseId, instructorId);
    }

    @Transactional
    public TeacherCourseResponse togglePublish(Long courseId, Long instructorId) {
        Course course = ownershipValidator.validateCourseOwner(courseId, instructorId);
        course.setIsPublished(!Boolean.TRUE.equals(course.getIsPublished()));
        Course updated = courseRepository.save(course);
        int studentCount = enrollmentRepository.countByCourseId(courseId);
        return TeacherCourseResponse.from(updated, studentCount);
    }

    private Map<Long, Long> fetchEnrollmentCounts(List<Long> courseIds) {
        if (courseIds.isEmpty()) return Map.of();
        List<Map<String, Object>> results = enrollmentRepository.countEnrollmentsByCourseIds(courseIds);
        return results.stream().collect(Collectors.toMap(
                r -> ((Number) r.get("courseId")).longValue(),
                r -> ((Number) r.get("count")).longValue()
        ));
    }
}