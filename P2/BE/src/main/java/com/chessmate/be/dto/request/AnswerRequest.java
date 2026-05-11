package com.chessmate.be.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerRequest {

    @NotBlank(message = "답변을 입력해주세요")
    @Size(max = 2000, message = "답변은 2000자 이내로 입력해주세요")
    private String answer;
}
