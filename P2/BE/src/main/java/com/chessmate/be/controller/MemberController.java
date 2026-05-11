package com.chessmate.be.controller;

import com.chessmate.be.dto.request.UpdatePasswordRequest;
import com.chessmate.be.dto.request.UpdateProfileRequest;
import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.MemberProfileResponse;
import com.chessmate.be.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 회원 프로필 API 컨트롤러
 * 프로필 조회, 수정, 비밀번호 변경, 탈퇴 엔드포인트 제공
 */
@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
@Slf4j
public class MemberController {

    private final MemberService memberService;

    /**
     * 내 프로필 조회
     * GET /api/members/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MemberProfileResponse>> getMyProfile() {
        Long memberId = currentMemberId();
        log.debug("Get profile for member: {}", memberId);

        MemberProfileResponse profile = memberService.getMyProfile(memberId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * 프로필 수정
     * PUT /api/members/me
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<MemberProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        Long memberId = currentMemberId();
        log.info("Update profile for member: {}", memberId);

        MemberProfileResponse profile = memberService.updateProfile(memberId, request);
        return ResponseEntity.ok(ApiResponse.success(profile, "프로필이 수정되었습니다"));
    }

    /**
     * 비밀번호 변경
     * PUT /api/members/me/password
     */
    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> updatePassword(
            @Valid @RequestBody UpdatePasswordRequest request) {
        Long memberId = currentMemberId();
        log.info("Update password for member: {}", memberId);

        memberService.updatePassword(memberId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "비밀번호가 변경되었습니다"));
    }

    /**
     * 회원 탈퇴
     * DELETE /api/members/me
     */
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteAccount() {
        Long memberId = currentMemberId();
        log.info("Delete account for member: {}", memberId);

        memberService.deleteAccount(memberId);
        return ResponseEntity.ok(ApiResponse.success(null, "회원 탈퇴가 완료되었습니다"));
    }

    /**
     * SecurityContext에서 Member ID 추출
     */
    private Long currentMemberId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();

        if (principal instanceof Long) {
            return (Long) principal;
        }

        return Long.parseLong(principal.toString());
    }
}
