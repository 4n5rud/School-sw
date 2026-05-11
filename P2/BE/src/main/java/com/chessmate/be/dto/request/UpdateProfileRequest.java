package com.chessmate.be.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "닉네임은 필수입니다")
    @Size(max = 20, message = "닉네임은 최대 20자입니다")
    private String nickname;

    @Size(max = 500, message = "자기소개는 최대 500자입니다")
    private String bio;
}
