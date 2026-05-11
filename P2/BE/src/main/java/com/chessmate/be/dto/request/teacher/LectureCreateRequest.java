package com.chessmate.be.dto.request.teacher;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LectureCreateRequest {
    @NotBlank(message = "강의 제목은 필수입니다")
    @Size(max = 200, message = "강의 제목은 200자 이하여야 합니다")
    private String title;

    @NotNull(message = "정렬 순서는 필수입니다")
    private Integer sortOrder;
}