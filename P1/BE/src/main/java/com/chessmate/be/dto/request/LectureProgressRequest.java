package com.chessmate.be.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LectureProgressRequest {

    @NotNull(message = "강의 ID는 필수입니다")
    private Long lectureId;

    @NotNull(message = "마지막 시청 위치는 필수입니다")
    @Min(value = 0, message = "시청 위치는 0 이상이어야 합니다")
    private Integer lastPosition; // 초 단위
}

