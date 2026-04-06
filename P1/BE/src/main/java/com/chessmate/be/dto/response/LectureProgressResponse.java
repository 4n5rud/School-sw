package com.chessmate.be.dto.response;

import com.chessmate.be.entity.LectureProgress;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LectureProgressResponse {
    private Long id;
    private Long memberId;
    private Long lectureId;
    private String lectureTitle;
    private Integer playTime; // 전체 강의 길이 (초)
    private Integer lastPosition; // 마지막 시청 위치 (초)
    private Integer watchPercentage; // 시청 비율 (%)
    private LocalDateTime updatedAt;

    public static LectureProgressResponse from(LectureProgress progress) {
        Integer playTime = progress.getLecture().getPlayTime();
        Integer lastPosition = progress.getLastPosition() != null ? progress.getLastPosition() : 0;
        Integer watchPercentage = playTime > 0 ? (lastPosition * 100) / playTime : 0;

        return LectureProgressResponse.builder()
                .id(progress.getId())
                .memberId(progress.getMember().getId())
                .lectureId(progress.getLecture().getId())
                .lectureTitle(progress.getLecture().getTitle())
                .playTime(playTime)
                .lastPosition(lastPosition)
                .watchPercentage(watchPercentage)
                .updatedAt(progress.getUpdatedAt())
                .build();
    }
}

