package com.chessmate.be.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupRequest {
    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "유효한 이메일 형식이 아닙니다")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 8, max = 50, message = "비밀번호는 8자 이상 50자 이하여야 합니다")
    private String password;

    @NotBlank(message = "닉네임은 필수입니다")
    @Size(min = 2, max = 30, message = "닉네임은 2자 이상 30자 이하여야 합니다")
    private String nickname;

    @NotBlank(message = "역할은 필수입니다")
    @Pattern(regexp = "^(STUDENT|TEACHER|ADMIN)$", message = "역할은 STUDENT, TEACHER, ADMIN 중 하나여야 합니다")
    private String role;
}

