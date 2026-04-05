package com.chessmate.be.dto.response;

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
public class CourseSearchResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Integer price;
    private String thumbnailUrl;
    private Long instructorId;
    private String instructorName;
    private LocalDateTime createdAt;

    public static CourseSearchResponse from(Course course) {
        return CourseSearchResponse.builder()
            .id(course.getId())
            .title(course.getTitle())
            .description(course.getDescription())
            .category(course.getCategory())
            .price(course.getPrice())
            .thumbnailUrl(course.getThumbnailUrl())
            .instructorId(course.getInstructor().getId())
            .instructorName(course.getInstructor().getNickname())
            .createdAt(course.getCreatedAt())
            .build();
    }
}

