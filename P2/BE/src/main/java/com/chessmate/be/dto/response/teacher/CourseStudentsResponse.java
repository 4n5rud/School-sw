package com.chessmate.be.dto.response.teacher;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseStudentsResponse {
    private Long courseId;
    private String courseTitle;
    private int totalStudents;
    private int completedStudents;
    private List<StudentProgressDto> students;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentProgressDto {
        private Long memberId;
        private String nickname;
        private LocalDateTime enrolledAt;
        private double overallProgress;
        private LocalDateTime lastActivityAt;
        private Boolean isCompleted;
    }
}