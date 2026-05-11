package com.chessmate.be.service.teacher;

import com.chessmate.be.dto.response.teacher.CourseStatsResponse;
import com.chessmate.be.dto.response.teacher.CourseStudentsResponse;
import com.chessmate.be.dto.response.teacher.DashboardResponse;
import com.chessmate.be.dto.response.teacher.TeacherCourseResponse;
import com.chessmate.be.entity.Course;
import com.chessmate.be.entity.Enrollment;
import com.chessmate.be.entity.Lecture;
import com.chessmate.be.entity.LectureProgress;
import com.chessmate.be.repository.CourseRepository;
import com.chessmate.be.repository.EnrollmentRepository;
import com.chessmate.be.repository.LectureProgressRepository;
import com.chessmate.be.repository.LectureRepository;
import com.chessmate.be.security.TeacherOwnershipValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TeacherAnalyticsService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LectureRepository lectureRepository;
    private final LectureProgressRepository progressRepository;
    private final TeacherOwnershipValidator ownershipValidator;

    public DashboardResponse getDashboard(Long instructorId) {
        List<Course> courses = courseRepository.findAllByInstructorId(instructorId);
        List<Long> courseIds = courses.stream().map(Course::getId).toList();

        long totalStudents = 0;
        long completedStudents = 0;
        List<TeacherCourseResponse> courseResponses = new ArrayList<>();

        if (!courseIds.isEmpty()) {
            List<Map<String, Object>> counts = enrollmentRepository.countEnrollmentsByCourseIds(courseIds);
            Map<Long, Long> enrollmentCounts = counts.stream().collect(Collectors.toMap(
                    r -> ((Number) r.get("courseId")).longValue(),
                    r -> ((Number) r.get("count")).longValue()
            ));

            for (Course course : courses) {
                long count = enrollmentCounts.getOrDefault(course.getId(), 0L);
                totalStudents += count;
                completedStudents += enrollmentRepository.countByCourseIdAndIsCompletedTrue(course.getId());
                courseResponses.add(TeacherCourseResponse.from(course, (int) count));
            }
        }

        return DashboardResponse.builder()
                .totalCourses(courses.size())
                .totalStudents(totalStudents)
                .completedStudents(completedStudents)
                .courses(courseResponses)
                .build();
    }

    public CourseStudentsResponse getCourseStudents(Long courseId, Long instructorId) {
        Course course = ownershipValidator.validateCourseOwner(courseId, instructorId);

        List<Enrollment> enrollments = enrollmentRepository.findByCourseIdWithMember(courseId);
        List<Lecture> allLectures = lectureRepository.findByCourseId(courseId);
        int totalLectures = allLectures.size();
        List<Long> lectureIds = allLectures.stream().map(Lecture::getId).toList();

        long completedStudents = enrollments.stream()
                .filter(e -> Boolean.TRUE.equals(e.getIsCompleted()))
                .count();

        List<CourseStudentsResponse.StudentProgressDto> studentDtos = enrollments.stream()
                .map(enrollment -> buildStudentDto(enrollment, lectureIds, totalLectures))
                .collect(Collectors.toList());

        return CourseStudentsResponse.builder()
                .courseId(courseId)
                .courseTitle(course.getTitle())
                .totalStudents(enrollments.size())
                .completedStudents((int) completedStudents)
                .students(studentDtos)
                .build();
    }

    public CourseStatsResponse getCourseStats(Long courseId, Long instructorId) {
        Course course = ownershipValidator.validateCourseOwner(courseId, instructorId);

        int totalStudents = enrollmentRepository.countByCourseId(courseId);
        List<Lecture> lectures = lectureRepository.findByCourseId(courseId);
        List<Long> lectureIds = lectures.stream().map(Lecture::getId).toList();

        List<LectureProgress> allProgress = progressRepository.findByLectureIdIn(lectureIds);
        Map<Long, List<LectureProgress>> progressByLecture = allProgress.stream()
                .collect(Collectors.groupingBy(lp -> lp.getLecture().getId()));

        List<CourseStatsResponse.LectureStatDto> stats = lectures.stream().map(lecture -> {
            List<LectureProgress> lps = progressByLecture.getOrDefault(lecture.getId(), List.of());
            int viewCount = lps.size();
            int completionCount = (int) lps.stream().filter(lp -> Boolean.TRUE.equals(lp.getIsCompleted())).count();
            double completionRate = totalStudents > 0 ? (completionCount * 100.0 / totalStudents) : 0;

            double avgWatchPosition = 0;
            if (viewCount > 0 && lecture.getPlayTime() != null && lecture.getPlayTime() > 0) {
                double avgPos = lps.stream()
                        .mapToInt(lp -> lp.getLastPosition() != null ? lp.getLastPosition() : 0)
                        .average()
                        .orElse(0);
                avgWatchPosition = avgPos / lecture.getPlayTime() * 100;
            }

            return CourseStatsResponse.LectureStatDto.builder()
                    .lectureId(lecture.getId())
                    .lectureTitle(lecture.getTitle())
                    .viewCount(viewCount)
                    .completionCount(completionCount)
                    .completionRate(Math.round(completionRate * 10.0) / 10.0)
                    .avgWatchPosition(Math.round(avgWatchPosition * 10.0) / 10.0)
                    .build();
        }).collect(Collectors.toList());

        return CourseStatsResponse.builder()
                .courseId(courseId)
                .courseTitle(course.getTitle())
                .totalStudents(totalStudents)
                .lectureStats(stats)
                .build();
    }

    private CourseStudentsResponse.StudentProgressDto buildStudentDto(
            Enrollment enrollment, List<Long> lectureIds, int totalLectures) {

        List<LectureProgress> progresses = progressRepository
                .findByMemberAndLectures(enrollment.getMember().getId(), lectureIds);

        long completedCount = progresses.stream()
                .filter(lp -> Boolean.TRUE.equals(lp.getIsCompleted()))
                .count();

        double overallProgress = totalLectures > 0 ? (completedCount * 100.0 / totalLectures) : 0;

        LocalDateTime lastActivity = progresses.stream()
                .map(LectureProgress::getUpdatedAt)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        return CourseStudentsResponse.StudentProgressDto.builder()
                .memberId(enrollment.getMember().getId())
                .nickname(enrollment.getMember().getNickname())
                .enrolledAt(enrollment.getEnrolledAt())
                .overallProgress(Math.round(overallProgress * 10.0) / 10.0)
                .lastActivityAt(lastActivity)
                .isCompleted(enrollment.getIsCompleted())
                .build();
    }
}