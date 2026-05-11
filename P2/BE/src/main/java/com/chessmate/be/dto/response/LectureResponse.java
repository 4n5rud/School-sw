package com.chessmate.be.dto.response;

import com.chessmate.be.entity.Lecture;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 강의(Lecture) 응답 DTO
 * 동영상 스트리밍 정보 포함
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LectureResponse {
    private Long id;
    private String title;
    private String videoUrl;
    private Integer playTime;
    private Integer sortOrder;
    private Lecture.UploadStatus uploadStatus;

    public static LectureResponse from(Lecture lecture) {
        return LectureResponse.builder()
                .id(lecture.getId())
                .title(lecture.getTitle())
                .videoUrl(lecture.getVideoUrl())
                .playTime(lecture.getPlayTime())
                .sortOrder(lecture.getSortOrder())
                .uploadStatus(lecture.getUploadStatus())
                .build();
    }
}
