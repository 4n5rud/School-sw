package com.chessmate.be.dto.request.teacher;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ThumbnailConfirmRequest {
    @NotNull(message = "강의 ID는 필수입니다")
    private Long courseId;

    @NotBlank(message = "오브젝트 키는 필수입니다")
    private String objectKey;
}