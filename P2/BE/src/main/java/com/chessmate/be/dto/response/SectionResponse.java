package com.chessmate.be.dto.response;

import com.chessmate.be.entity.Section;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 섹션(Section) 응답 DTO
 * 섹션별 강의 목록 포함
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionResponse {
    private Long id;
    private String title;
    private Integer sortOrder;
    private List<LectureResponse> lectures;

    public static SectionResponse from(Section section) {
        return SectionResponse.builder()
                .id(section.getId())
                .title(section.getTitle())
                .sortOrder(section.getSortOrder())
                .lectures(
                        section.getLectures() != null
                                ? section.getLectures().stream()
                                        .map(LectureResponse::from)
                                        .collect(Collectors.toList())
                                : List.of()
                )
                .build();
    }
}
