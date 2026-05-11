package com.chessmate.be.dto.request.teacher;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ThumbnailPresignedRequest {
    @NotNull(message = "강의 ID는 필수입니다")
    private Long courseId;

    @NotBlank(message = "파일명은 필수입니다")
    private String filename;

    @NotBlank(message = "Content-Type은 필수입니다")
    private String contentType;
}