package com.chessmate.be.controller.teacher;

import com.chessmate.be.dto.request.CourseCreateRequest;
import com.chessmate.be.dto.request.CourseUpdateRequest;
import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.teacher.TeacherCourseResponse;
import com.chessmate.be.service.teacher.TeacherCourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teacher/courses")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('TEACHER')")
public class TeacherCourseController {

    private final TeacherCourseService teacherCourseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeacherCourseResponse>>> getMyCourses() {
        Long memberId = currentMemberId();
        List<TeacherCourseResponse> courses = teacherCourseService.getMyCourses(memberId);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TeacherCourseResponse>> createCourse(
            @Valid @RequestBody CourseCreateRequest request) {
        Long memberId = currentMemberId();
        TeacherCourseResponse course = teacherCourseService.createCourse(request, memberId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(course, "강의가 생성되었습니다."));
    }

    @PutMapping("/{courseId}")
    public ResponseEntity<ApiResponse<TeacherCourseResponse>> updateCourse(
            @PathVariable Long courseId,
            @Valid @RequestBody CourseUpdateRequest request) {
        Long memberId = currentMemberId();
        TeacherCourseResponse course = teacherCourseService.updateCourse(courseId, request, memberId);
        return ResponseEntity.ok(ApiResponse.success(course, "강의가 수정되었습니다."));
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Long courseId) {
        Long memberId = currentMemberId();
        teacherCourseService.deleteCourse(courseId, memberId);
        return ResponseEntity.ok(ApiResponse.success(null, "강의가 삭제되었습니다."));
    }

    @PatchMapping("/{courseId}/publish")
    public ResponseEntity<ApiResponse<TeacherCourseResponse>> togglePublish(@PathVariable Long courseId) {
        Long memberId = currentMemberId();
        TeacherCourseResponse course = teacherCourseService.togglePublish(courseId, memberId);
        String msg = Boolean.TRUE.equals(course.getIsPublished()) ? "강의가 공개되었습니다." : "강의가 비공개되었습니다.";
        return ResponseEntity.ok(ApiResponse.success(course, msg));
    }

    private Long currentMemberId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth.getPrincipal();
        if (principal instanceof Long) return (Long) principal;
        return Long.parseLong(principal.toString());
    }
}