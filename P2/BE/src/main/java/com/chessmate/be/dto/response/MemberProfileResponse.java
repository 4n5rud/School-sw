package com.chessmate.be.dto.response;

import com.chessmate.be.entity.Member;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberProfileResponse {

    private Long id;
    private String email;
    private String nickname;
    private String role;
    private String bio;
    private String profileImageUrl;
    private String createdAt;

    public static MemberProfileResponse from(Member member) {
        return MemberProfileResponse.builder()
                .id(member.getId())
                .email(member.getEmail())
                .nickname(member.getNickname())
                .role(member.getRole().name())
                .bio(member.getBio())
                .profileImageUrl(member.getProfileImageUrl())
                .createdAt(member.getCreatedAt() != null ? member.getCreatedAt().toString() : null)
                .build();
    }
}
