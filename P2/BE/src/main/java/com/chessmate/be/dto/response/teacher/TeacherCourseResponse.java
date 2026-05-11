package com.chessmate.be.dto.response.teacher;

import com.chessmate.be.entity.Course;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherCourseResponse {
    private Long id;
    private String title;
    private String description;
    private Course.CourseCategory category;
    private String categoryDisplayName;
    private Integer price;
    private String thumbnailUrl;
    private Boolean isPublished;
    private Integer studentCount;
    private LocalDateTime createdAt;

    public static TeacherCourseResponse from(Course course, int studentCount) {
        return TeacherCourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .category(course.getCategory())
                .categoryDisplayName(course.getCategory().getDisplayName())
                .price(course.getPrice())
                .thumbnailUrl(course.getThumbnailUrl())
                .isPublished(course.getIsPublished())
                .studentCount(studentCount)
                .createdAt(course.getCreatedAt())
                .build();
    }
}