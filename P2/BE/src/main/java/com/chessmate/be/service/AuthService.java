package com.chessmate.be.service;

import com.chessmate.be.dto.request.LoginRequest;
import com.chessmate.be.dto.request.SignupRequest;
import com.chessmate.be.dto.response.MemberResponse;
import com.chessmate.be.dto.response.TokenResponse;
import com.chessmate.be.entity.Member;
import com.chessmate.be.exception.DuplicateEmailException;
import com.chessmate.be.exception.EntityNotFoundException;
import com.chessmate.be.repository.MemberRepository;
import com.chessmate.be.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 인증 서비스
 * 회원가입, 로그인, 토큰 관리 기능 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 회원가입
     *
     * @param request 회원가입 요청 (email, password, nickname, role)
     * @return 가입된 회원 정보
     * @throws DuplicateEmailException 이메일이 이미 존재하는 경우
     */
    @Transactional
    public MemberResponse signup(SignupRequest request) {
        log.info("Signup request for email: {}", request.getEmail());

        // 1. 이메일 중복 체크
        if (memberRepository.existsByEmail(request.getEmail())) {
            log.warn("Email already exists: {}", request.getEmail());
            throw new DuplicateEmailException("이미 사용 중인 이메일입니다: " + request.getEmail());
        }

        // 2. 비밀번호 암호화
        String encryptedPassword = passwordEncoder.encode(request.getPassword());

        // 3. Member 엔티티 생성 및 저장
        Member member = Member.builder()
                .email(request.getEmail())
                .password(encryptedPassword)
                .nickname(request.getNickname())
                .role(Member.Role.valueOf(request.getRole().toUpperCase()))
                .build();

        Member savedMember = memberRepository.save(member);
        log.info("Member signup completed: {}", savedMember.getId());

        // 4. DTO 변환 및 반환
        return MemberResponse.from(savedMember);
    }

    /**
     * 로그인
     *
     * @param request 로그인 요청 (email, password)
     * @return 토큰 정보 (accessToken, refreshToken, memberInfo)
     * @throws UsernameNotFoundException 사용자를 찾을 수 없는 경우
     * @throws BadCredentialsException 비밀번호가 일치하지 않는 경우
     */
    @Transactional
    public TokenResponse login(LoginRequest request) {
        log.info("Login request for email: {}", request.getEmail());

        // 1. 사용자 조회
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("User not found: {}", request.getEmail());
                    return new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + request.getEmail());
                });

        // 2. 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), member.getPassword())) {
            log.warn("Password mismatch for user: {}", request.getEmail());
            throw new BadCredentialsException("비밀번호가 일치하지 않습니다");
        }

        // 3. 토큰 생성
        String accessToken = jwtTokenProvider.generateAccessToken(member.getId(), member.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(member.getId(), member.getRole().name());

        log.info("Login successful for user: {} (id: {})", request.getEmail(), member.getId());

        // 4. TokenResponse 생성 및 반환
        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .member(MemberResponse.from(member))
                .build();
    }

    /**
     * Refresh Token으로 Access Token 재발급
     *
     * @param refreshToken 현재의 Refresh Token
     * @return 새로운 토큰 정보
     * @throws IllegalArgumentException 유효하지 않은 토큰
     * @throws EntityNotFoundException 사용자를 찾을 수 없는 경우
     */
    @Transactional
    public TokenResponse refreshAccessToken(String refreshToken) {
        log.info("Refresh token request");

        // 1. Refresh Token 검증
        jwtTokenProvider.validateToken(refreshToken);

        // 2. Refresh Token에서 Member ID 추출
        Long memberId = jwtTokenProvider.getMemberIdFromToken(refreshToken);
        String role = jwtTokenProvider.getRoleFromToken(refreshToken);

        // 3. 새로운 토큰 생성
        String newAccessToken = jwtTokenProvider.generateAccessToken(memberId, role);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(memberId, role);

        // 4. 회원 정보 조회 및 반환
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> {
                    log.warn("User not found for refresh: {}", memberId);
                    return new EntityNotFoundException("사용자를 찾을 수 없습니다");
                });

        log.info("Token refreshed for user: {}", memberId);

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .member(MemberResponse.from(member))
                .build();
    }

    /**
     * 이메일 중복 체크
     *
     * @param email 확인할 이메일
     * @return true: 이미 존재, false: 사용 가능
     */
    public boolean checkEmailExists(String email) {
        boolean exists = memberRepository.existsByEmail(email);
        log.debug("Email exists check: {} - {}", email, exists);
        return exists;
    }
}

