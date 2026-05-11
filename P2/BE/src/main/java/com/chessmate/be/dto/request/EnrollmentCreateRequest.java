package com.chessmate.be.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentCreateRequest {
    @NotNull(message = "강의 ID는 필수입니다")
    @Positive(message = "강의 ID는 양수여야 합니다")
    private Long courseId;
}

