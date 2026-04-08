package com.chessmate.be.config;

import com.chessmate.be.security.CustomUserDetailsService;
import com.chessmate.be.security.JwtAuthenticationFilter;
import com.chessmate.be.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    /**
     * Password Encoder 빈 등록
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * AuthenticationManager 빈 등록
     */
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder authenticationManagerBuilder =
                http.getSharedObject(AuthenticationManagerBuilder.class);
        authenticationManagerBuilder
                .userDetailsService(customUserDetailsService)
                .passwordEncoder(passwordEncoder());
        return authenticationManagerBuilder.build();
    }

    /**
     * CORS 설정
     * Frontend(localhost:3000, localhost:5173)와의 크로스 도메인 요청을 허용
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ✅ localhost:3000 (Vue.js 개발 서버) 추가
        // ✅ localhost:5173 (Vite 개발 서버) 추가
        // 프로덕션 환경에서는 실제 도메인으로 변경 필요
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",    // Vue.js 개발 서버
            "http://localhost:5173",    // Vite 개발 서버
            "http://127.0.0.1:3000",    // 127.0.0.1 localhost 별칭
            "http://127.0.0.1:5173"     // Vite 개발 서버 별칭
        ));

        // 허용하는 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList(
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "OPTIONS"
        ));

        // 허용하는 헤더 (모든 헤더 허용)
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Authorization 헤더 포함 가능
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With"
        ));

        // 쿠키 및 자격증명 포함 가능
        configuration.setAllowCredentials(true);

        // 프리플라이트 요청 캐시 시간 (1시간)
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // 모든 경로에 대해 CORS 설정 적용
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Spring Security Filter Chain 설정
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CORS 설정
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // CSRF 비활성화 (JWT 사용)
                .csrf(csrf -> csrf.disable())
                // 세션 비활성화 (Stateless)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 요청 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // 🟢 인증 관련 엔드포인트 (공개)
                        .requestMatchers("/api/auth/**").permitAll()

                        // 🟢 강의 조회 (공개)
                        .requestMatchers(HttpMethod.GET, "/api/v1/courses").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/courses/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/courses").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/courses/**").permitAll()

                        // 🟢 섹션/강의 조회 (공개)
                        .requestMatchers(HttpMethod.GET, "/api/sections/**").permitAll()

                        // 🟢 헬스 체크 (공개)
                        .requestMatchers("/health").permitAll()
                        .requestMatchers("/api/health").permitAll()

                        // 🔴 관리자 엔드포인트 (ADMIN만)
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // 🔴 나머지 API는 인증 필수
                        .anyRequest().authenticated()
                )
                // JWT 필터 등록
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}

