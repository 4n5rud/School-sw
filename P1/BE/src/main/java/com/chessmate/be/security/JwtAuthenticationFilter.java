package com.chessmate.be.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;

/**
 * JWT 인증 필터
 * 요청 헤더에서 JWT 토큰을 추출하고 검증한 후 SecurityContext에 인증 정보를 저장
 */
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);
            String requestPath = request.getRequestURI();
            String requestMethod = request.getMethod();

            log.debug("🔍 [JWT Filter] {} {} - Token Present: {}", requestMethod, requestPath, jwt != null);

            if (StringUtils.hasText(jwt)) {
                // 토큰 검증
                if (tokenProvider.validateToken(jwt)) {
                    // 토큰에서 정보 추출
                    Long memberId = tokenProvider.getMemberIdFromToken(jwt);
                    String role = tokenProvider.getRoleFromToken(jwt);

                    // 권한 설정
                    Collection<GrantedAuthority> authorities = new ArrayList<>();
                    String roleString = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                    authorities.add(new SimpleGrantedAuthority(roleString));

                    // 인증 객체 생성 및 SecurityContext에 저장
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    memberId,
                                    null,
                                    authorities
                            );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.info("✅ [JWT Filter] 인증 성공 - Member ID: {}, Role: {}, Authority: {}",
                            memberId, role, roleString);
                }
            } else {
                log.debug("⚠️ [JWT Filter] Token 없음 - {}", requestPath);
            }
        } catch (IllegalArgumentException e) {
            log.warn("❌ [JWT Filter] 유효하지 않은 토큰: {}", e.getMessage());
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.warn("⏰ [JWT Filter] 토큰 만료: {}", e.getMessage());
        } catch (Exception ex) {
            log.error("🔥 [JWT Filter] 검증 중 오류 발생: ", ex);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * HTTP 요청 헤더에서 JWT 토큰 추출
     * Authorization: Bearer {token} 형식에서 token 추출
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}



