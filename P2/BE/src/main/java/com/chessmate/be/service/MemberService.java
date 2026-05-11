package com.chessmate.be.service;

import com.chessmate.be.dto.request.UpdatePasswordRequest;
import com.chessmate.be.dto.request.UpdateProfileRequest;
import com.chessmate.be.dto.response.MemberProfileResponse;
import com.chessmate.be.entity.Member;
import com.chessmate.be.exception.EntityNotFoundException;
import com.chessmate.be.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원 프로필 서비스
 * 프로필 조회, 수정, 비밀번호 변경, 탈퇴 기능 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 내 프로필 조회
     *
     * @param memberId 회원 ID
     * @return 회원 프로필 정보
     */
    public MemberProfileResponse getMyProfile(Long memberId) {
        log.debug("Get profile for member: {}", memberId);

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        return MemberProfileResponse.from(member);
    }

    /**
     * 프로필 수정 (닉네임, 자기소개)
     *
     * @param memberId 회원 ID
     * @param request  수정 요청 (nickname, bio)
     * @return 수정된 프로필 정보
     */
    @Transactional
    public MemberProfileResponse updateProfile(Long memberId, UpdateProfileRequest request) {
        log.info("Update profile for member: {}", memberId);

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        member.setNickname(request.getNickname());
        member.setBio(request.getBio());

        Member saved = memberRepository.save(member);
        log.info("Profile updated for member: {}", memberId);

        return MemberProfileResponse.from(saved);
    }

    /**
     * 비밀번호 변경
     *
     * @param memberId 회원 ID
     * @param request  비밀번호 변경 요청 (currentPassword, newPassword)
     * @throws IllegalArgumentException 현재 비밀번호가 일치하지 않는 경우
     */
    @Transactional
    public void updatePassword(Long memberId, UpdatePasswordRequest request) {
        log.info("Update password for member: {}", memberId);

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), member.getPassword())) {
            log.warn("Password mismatch for member: {}", memberId);
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다");
        }

        member.setPassword(passwordEncoder.encode(request.getNewPassword()));
        memberRepository.save(member);
        log.info("Password updated for member: {}", memberId);
    }

    /**
     * 회원 탈퇴
     *
     * @param memberId 회원 ID
     */
    @Transactional
    public void deleteAccount(Long memberId) {
        log.info("Delete account for member: {}", memberId);

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        memberRepository.delete(member);
        log.info("Account deleted for member: {}", memberId);
    }
}
