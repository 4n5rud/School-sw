package com.chessmate.be.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewCreateRequest {

    @NotNull(message = "평점은 필수입니다")
    @Min(value = 1, message = "평점은 최소 1점입니다")
    @Max(value = 5, message = "평점은 최대 5점입니다")
    private Integer rating;

    @NotBlank(message = "리뷰 내용은 필수입니다")
    @Size(max = 1000, message = "리뷰 내용은 최대 1000자입니다")
    private String content;
}
