package com.chessmate.be.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    /**
     * Access Token 생성
     */
    public String generateAccessToken(Long memberId, String role) {
        return createToken(memberId, role, accessTokenExpiration);
    }

    /**
     * Refresh Token 생성
     */
    public String generateRefreshToken(Long memberId, String role) {
        return createToken(memberId, role, refreshTokenExpiration);
    }

    /**
     * 토큰 생성 (공통 로직)
     */
    private String createToken(Long memberId, String role, long expirationTime) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationTime);

        return Jwts.builder()
                .subject(memberId.toString())
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 토큰에서 Member ID 추출
     */
    public Long getMemberIdFromToken(String token) {
        try {
            Claims claims = parseToken(token);
            return Long.parseLong(claims.getSubject());
        } catch (JwtException e) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.", e);
        }
    }

    /**
     * 토큰에서 Role 추출
     */
    public String getRoleFromToken(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.get("role", String.class);
        } catch (JwtException e) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.", e);
        }
    }

    /**
     * 토큰 유효성 검증
     */
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (ExpiredJwtException e) {
            throw new ExpiredJwtException(e.getHeader(), e.getClaims(), "토큰이 만료되었습니다.");
        } catch (JwtException | IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.", e);
        }
    }

    /**
     * 토큰 파싱 (공통 로직)
     */
    private Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

