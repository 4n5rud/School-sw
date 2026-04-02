package com.chessmate.be.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.URL;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseCreateRequest {
    @NotBlank(message = "제목은 필수입니다")
    @Size(min = 3, max = 100, message = "제목은 3자 이상 100자 이하여야 합니다")
    private String title;

    @NotBlank(message = "설명은 필수입니다")
    @Size(min = 10, max = 1000, message = "설명은 10자 이상 1000자 이하여야 합니다")
    private String description;

    @NotBlank(message = "카테고리는 필수입니다")
    @Pattern(regexp = "^(STOCK|CRYPTO)$", message = "카테고리는 STOCK 또는 CRYPTO여야 합니다")
    private String category;

    @NotNull(message = "가격은 필수입니다")
    @Min(value = 0, message = "가격은 0 이상이어야 합니다")
    @Max(value = 10000000, message = "가격은 10,000,000 이하여야 합니다")
    private Integer price;

    @URL(message = "유효한 URL 형식이 아닙니다")
    private String thumbnailUrl;
}

