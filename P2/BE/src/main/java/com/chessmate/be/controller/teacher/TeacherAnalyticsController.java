package com.chessmate.be.controller.teacher;

import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.teacher.CourseStatsResponse;
import com.chessmate.be.dto.response.teacher.CourseStudentsResponse;
import com.chessmate.be.dto.response.teacher.DashboardResponse;
import com.chessmate.be.service.teacher.TeacherAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/teacher")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('TEACHER')")
public class TeacherAnalyticsController {

    private final TeacherAnalyticsService teacherAnalyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        DashboardResponse dashboard = teacherAnalyticsService.getDashboard(currentMemberId());
        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }

    @GetMapping("/courses/{courseId}/students")
    public ResponseEntity<ApiResponse<CourseStudentsResponse>> getCourseStudents(@PathVariable Long courseId) {
        CourseStudentsResponse response = teacherAnalyticsService.getCourseStudents(courseId, currentMemberId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/courses/{courseId}/stats")
    public ResponseEntity<ApiResponse<CourseStatsResponse>> getCourseStats(@PathVariable Long courseId) {
        CourseStatsResponse response = teacherAnalyticsService.getCourseStats(courseId, currentMemberId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private Long currentMemberId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth.getPrincipal();
        if (principal instanceof Long) return (Long) principal;
        return Long.parseLong(principal.toString());
    }
}