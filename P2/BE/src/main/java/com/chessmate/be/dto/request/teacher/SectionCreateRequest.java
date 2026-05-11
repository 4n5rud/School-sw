package com.chessmate.be.dto.request.teacher;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SectionCreateRequest {
    @NotBlank(message = "섹션 제목은 필수입니다")
    @Size(max = 100, message = "섹션 제목은 100자 이하여야 합니다")
    private String title;
}