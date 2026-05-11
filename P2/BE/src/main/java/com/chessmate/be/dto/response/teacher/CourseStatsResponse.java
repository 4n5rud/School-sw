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
public class CourseStatsResponse {
    private Long courseId;
    private String courseTitle;
    private int totalStudents;
    private List<LectureStatDto> lectureStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LectureStatDto {
        private Long lectureId;
        private String lectureTitle;
        private int viewCount;
        private int completionCount;
        private double completionRate;
        private double avgWatchPosition;
    }
}