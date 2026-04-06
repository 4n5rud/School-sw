package com.chessmate.be.dto.response;

import com.chessmate.be.entity.Course;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 강의 검색 응답 DTO
 *
 * 강의 목록 조회 및 검색 시 반환되는 강의 정보입니다.
 * 강사 정보와 강의 통계 정보를 함께 포함합니다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSearchResponse {
    private Long id;
    private String title;
    private String description;
    private Course.CourseCategory category;
    private String categoryDisplayName;
    private Integer price;
    private String thumbnailUrl;
    private Long instructorId;
    private String instructorName;

    /** 전체 강의(영상) 개수 */
    private Integer totalLectures;

    /** 전체 강의의 총 재생 시간(초) */
    private Integer totalPlayTime;

    private LocalDateTime createdAt;

    public static CourseSearchResponse from(Course course) {
        // 섹션의 강의 개수 합계
        int totalLectures = course.getSections().stream()
            .mapToInt(s -> s.getLectures().size())
            .sum();

        // 모든 강의의 재생 시간 합계
        int totalPlayTime = course.getSections().stream()
            .flatMap(s -> s.getLectures().stream())
            .mapToInt(l -> l.getPlayTime())
            .sum();

        return CourseSearchResponse.builder()
            .id(course.getId())
            .title(course.getTitle())
            .description(course.getDescription())
            .category(course.getCategory())
            .categoryDisplayName(course.getCategory().getDisplayName())
            .price(course.getPrice())
            .thumbnailUrl(course.getThumbnailUrl())
            .instructorId(course.getInstructor().getId())
            .instructorName(course.getInstructor().getNickname())
            .totalLectures(totalLectures)
            .totalPlayTime(totalPlayTime)
            .createdAt(course.getCreatedAt())
            .build();
    }
}

