package com.chessmate.be.dto.response.teacher;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private long totalCourses;
    private long totalStudents;
    private long completedStudents;
    private List<TeacherCourseResponse> courses;
}