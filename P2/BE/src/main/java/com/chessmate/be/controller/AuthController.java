package com.chessmate.be.controller;

import com.chessmate.be.dto.request.LoginRequest;
import com.chessmate.be.dto.request.SignupRequest;
import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.MemberResponse;
import com.chessmate.be.dto.response.TokenResponse;
import com.chessmate.be.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 인증 API 컨트롤러
 * 회원가입, 로그인, 토큰 관리 엔드포인트 제공
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    /**
     * 회원가입
     * POST /api/auth/signup
     * 
     * @param request 회원가입 요청
     * @return 가입된 회원 정보
     */
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<MemberResponse>> signup(
            @Valid @RequestBody SignupRequest request) {
        log.info("Signup request for email: {}", request.getEmail());
        MemberResponse member = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(member, "회원가입이 완료되었습니다")
        );
    }

    /**
     * 로그인
     * POST /api/auth/login
     * 
     * @param request 로그인 요청
     * @return 토큰 및 회원 정보
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        log.info("Login request for email: {}", request.getEmail());
        TokenResponse tokenResponse = authService.login(request);
        return ResponseEntity.ok(
                ApiResponse.success(tokenResponse, "로그인이 완료되었습니다")
        );
    }

    /**
     * Refresh Token으로 Access Token 재발급
     * POST /api/auth/refresh
     * 
     * @param headerToken 헤더의 Refresh Token
     * @param bodyToken 요청 본문의 Refresh Token
     * @return 새로운 토큰 정보
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refreshToken(
            @RequestHeader(value = "X-Refresh-Token", required = false) String headerToken,
            @RequestBody(required = false) String bodyToken) {
        
        String refreshToken = headerToken != null ? headerToken : bodyToken;
        
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh Token이 필요합니다");
        }
        
        log.info("Refresh token request");
        TokenResponse tokenResponse = authService.refreshAccessToken(refreshToken);
        return ResponseEntity.ok(
                ApiResponse.success(tokenResponse, "토큰이 갱신되었습니다")
        );
    }

    /**
     * 이메일 중복 체크
     * GET /api/auth/check-email?email=user@example.com
     * 
     * @param email 확인할 이메일
     * @return 이메일 존재 여부
     */
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmailExists(
            @RequestParam String email) {
        log.info("Check email request: {}", email);
        boolean exists = authService.checkEmailExists(email);
        String message = exists ? "이미 사용 중인 이메일입니다" : "사용 가능한 이메일입니다";
        return ResponseEntity.ok(
                ApiResponse.success(exists, message)
        );
    }
}

