package com.chessmate.be.dto.request.teacher;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LectureUpdateRequest {
    @Size(max = 200, message = "강의 제목은 200자 이하여야 합니다")
    private String title;

    private Integer sortOrder;

    private String videoUrl;

    private Integer playTime;
}