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
public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Integer price;
    private String thumbnailUrl;
    private MemberResponse instructor;
    private Integer studentCount;
    private LocalDateTime createdAt;

    public static CourseResponse from(Course course, Integer studentCount) {
        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .category(course.getCategory())
                .price(course.getPrice())
                .thumbnailUrl(course.getThumbnailUrl())
                .instructor(MemberResponse.from(course.getInstructor()))
                .studentCount(studentCount)
                .createdAt(course.getCreatedAt())
                .build();
    }
}

