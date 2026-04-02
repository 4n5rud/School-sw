# 🛠️ ChessMate JWT 인증 시스템 - 개발자 가이드

**작성일**: 2026년 4월 2일  
**대상**: 백엔드 개발팀

---

## 목차

1. [환경 설정](#환경-설정)
2. [프로젝트 구조](#프로젝트-구조)
3. [주요 파일 설명](#주요-파일-설명)
4. [사용 방법](#사용-방법)
5. [문제 해결](#문제-해결)
6. [체크리스트](#체크리스트)

---

## 환경 설정

### 1. 사전 요구사항

```
- Java 17 이상
- Gradle 9.4.0 이상
- MySQL 8.0+ (또는 H2 인메모리 DB)
- IDE: IntelliJ IDEA 또는 VS Code
```

### 2. 프로젝트 클론 및 빌드

```bash
# 프로젝트 디렉토리로 이동
cd BE

# 의존성 다운로드 및 빌드
./gradlew clean build

# 테스트 실행
./gradlew test

# 애플리케이션 실행
./gradlew bootRun
```

### 3. 데이터베이스 설정

#### H2 (개발 환경)
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: create-drop
```

#### MySQL (프로덕션)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/chessmate_db
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: root
    password: your_password
  jpa:
    database-platform: org.hibernate.dialect.MySQL8Dialect
    hibernate:
      ddl-auto: validate
```

### 4. JWT 설정

```yaml
# application.yml
jwt:
  secret: your-secret-key-must-be-at-least-32-characters-long-for-hs256-algorithm-12345678
  access-token-expiration: 3600000 # 1시간
  refresh-token-expiration: 604800000 # 7일
```

> ⚠️ **주의**: 프로덕션 환경에서는 환경 변수로 secret을 관리하세요
```bash
export JWT_SECRET="your-production-secret-key"
```

### 5. IDE 설정

#### IntelliJ IDEA
```
File > Project Structure > Project > SDK: Java 17
File > Settings > Build, Execution, Deployment > Gradle > Gradle JVM: Java 17
```

#### VS Code
```json
// .vscode/settings.json
{
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-17",
      "path": "/path/to/java17"
    }
  ]
}
```

---

## 프로젝트 구조

```
BE/
├── src/main/java/com/chessmate/be/
│   ├── BeApplication.java              # 메인 애플리케이션 진입점
│   ├── config/
│   │   └── SecurityConfig.java          # Spring Security 설정
│   ├── controller/
│   │   ├── AuthController.java          # 인증 관련 API
│   │   └── HealthController.java        # 헬스 체크
│   ├── dto/
│   │   ├── request/
│   │   │   ├── LoginRequest.java
│   │   │   └── SignupRequest.java
│   │   └── response/
│   │       ├── ApiResponse.java         # 공통 응답 래퍼
│   │       ├── MemberResponse.java
│   │       └── TokenResponse.java
│   ├── entity/
│   │   ├── Member.java                  # 사용자 엔티티
│   │   ├── Course.java                  # 강의 엔티티
│   │   ├── Section.java                 # 섹션 엔티티
│   │   ├── Lecture.java                 # 강의 영상 엔티티
│   │   ├── Enrollment.java              # 수강 엔티티
│   │   └── LectureProgress.java         # 시청 진도 엔티티
│   ├── exception/
│   │   ├── EntityNotFoundException.java
│   │   ├── DuplicateEmailException.java
│   │   └── GlobalExceptionHandler.java
│   ├── repository/
│   │   ├── MemberRepository.java
│   │   ├── CourseRepository.java
│   │   ├── SectionRepository.java
│   │   ├── LectureRepository.java
│   │   ├── EnrollmentRepository.java
│   │   └── LectureProgressRepository.java
│   ├── security/
│   │   ├── JwtTokenProvider.java        # JWT 토큰 생성/검증
│   │   ├── JwtAuthenticationFilter.java # 요청 필터
│   │   └── CustomUserDetailsService.java # 사용자 로드
│   └── service/
│       └── AuthService.java             # 인증 비즈니스 로직
├── src/main/resources/
│   ├── application.yml                  # 애플리케이션 설정
│   └── application-prod.yml             # 프로덕션 설정 (선택)
├── src/test/java/com/chessmate/be/
│   └── BeApplicationTests.java          # 통합 테스트
├── build.gradle                         # Gradle 설정
├── settings.gradle
└── JWT_AUTH_REPORT.md                   # 이 보고서
```

---

## 주요 파일 설명

### 1. JwtTokenProvider.java

**역할**: JWT 토큰 생성 및 검증

```java
// 토큰 생성
String accessToken = jwtTokenProvider.generateAccessToken(memberId, role);
String refreshToken = jwtTokenProvider.generateRefreshToken(memberId, role);

// 토큰 검증
boolean isValid = jwtTokenProvider.validateToken(token);

// 클레임 추출
Long memberId = jwtTokenProvider.getMemberIdFromToken(token);
String role = jwtTokenProvider.getRoleFromToken(token);
```

**핵심 메서드**:
- `generateAccessToken(Long, String)`: Access Token 생성
- `generateRefreshToken(Long, String)`: Refresh Token 생성
- `validateToken(String)`: 토큰 유효성 검증
- `getMemberIdFromToken(String)`: Member ID 추출
- `getRoleFromToken(String)`: Role 추출

### 2. JwtAuthenticationFilter.java

**역할**: 모든 HTTP 요청의 JWT 토큰 검증

```java
// 요청 헤더에서 토큰 추출
String jwt = getJwtFromRequest(request);

// 토큰 검증 및 SecurityContext 설정
if (tokenProvider.validateToken(jwt)) {
    Long memberId = tokenProvider.getMemberIdFromToken(jwt);
    UsernamePasswordAuthenticationToken auth = 
        new UsernamePasswordAuthenticationToken(memberId, null, null);
    SecurityContextHolder.getContext().setAuthentication(auth);
}
```

**흐름**:
1. Authorization 헤더에서 "Bearer <token>" 추출
2. JwtTokenProvider로 검증
3. 유효하면 SecurityContext에 저장
4. 필터 체인 계속 진행

### 3. CustomUserDetailsService.java

**역할**: Spring Security의 UserDetailsService 구현

```java
@Override
public UserDetails loadUserByUsername(String email) 
        throws UsernameNotFoundException {
    Member member = memberRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("사용자 없음"));
    
    return new User(
        member.getEmail(),
        member.getPassword(),
        getAuthorities(member.getRole())
    );
}
```

**사용 사례**:
- 로그인 시 사용자 정보 로드
- 인증 정보 생성

### 4. SecurityConfig.java

**역할**: Spring Security 전체 설정

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> 
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated()
        )
        .addFilterBefore(
            new JwtAuthenticationFilter(jwtTokenProvider, userDetailsService),
            UsernamePasswordAuthenticationFilter.class
        );
    
    return http.build();
}
```

**주요 설정**:
- CORS 활성화
- CSRF 비활성화 (JWT 사용)
- Stateless 세션 정책
- 접근 권한 설정
- 커스텀 필터 등록

### 5. AuthService.java

**역할**: 인증 관련 비즈니스 로직

```java
// 회원가입
public MemberResponse signup(SignupRequest request) {
    // 1. 이메일 중복 검사
    // 2. 비밀번호 암호화
    // 3. Member 저장
    // 4. 응답 반환
}

// 로그인
public TokenResponse login(LoginRequest request) {
    // 1. 사용자 조회
    // 2. 비밀번호 검증
    // 3. 토큰 생성
    // 4. 토큰 + 사용자 정보 반환
}
```

**주요 메서드**:
- `signup(SignupRequest)`: 회원가입
- `login(LoginRequest)`: 로그인
- `checkEmailExists(String)`: 이메일 중복 확인
- `refreshAccessToken(String)`: 토큰 재발급

### 6. AuthController.java

**역할**: REST API 엔드포인트 정의

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<MemberResponse>> signup(
            @RequestBody SignupRequest request) { ... }
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(
            @RequestBody LoginRequest request) { ... }
    
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmailExists(
            @RequestParam String email) { ... }
    
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refreshAccessToken(
            @RequestHeader("Authorization") String authHeader) { ... }
}
```

---

## 사용 방법

### 시나리오 1: 새로운 API 엔드포인트 추가

#### Step 1: 인증이 필요한 API 추가

```java
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {
    
    private final CourseService courseService;
    
    @GetMapping
    @PreAuthorize("authenticated()")  // 인증된 모든 사용자
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getCourses() {
        return ResponseEntity.ok(
            ApiResponse.success(courseService.getAllCourses())
        );
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")  // 강사 이상만
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @RequestBody CreateCourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.success(courseService.createCourse(request))
        );
    }
}
```

#### Step 2: 현재 사용자 정보 가져오기

```java
// SecurityContext에서 현재 사용자 ID 추출
@GetMapping("/me")
public ResponseEntity<ApiResponse<MemberResponse>> getCurrentUser() {
    Long memberId = (Long) SecurityContextHolder
        .getContext()
        .getAuthentication()
        .getPrincipal();
    
    Member member = memberService.getMemberById(memberId);
    return ResponseEntity.ok(ApiResponse.success(MemberResponse.from(member)));
}
```

### 시나리오 2: 로그아웃 구현

```java
// 프론트엔드에서 토큰 삭제
// 백엔드에서 Refresh Token 무효화 (선택)

@PostMapping("/logout")
@PreAuthorize("authenticated()")
public ResponseEntity<ApiResponse<Void>> logout(
        @RequestHeader("Authorization") String authHeader) {
    String refreshToken = authHeader.replace("Bearer ", "");
    
    // Redis에서 Refresh Token 삭제
    // refreshTokenRepository.deleteByToken(refreshToken);
    
    return ResponseEntity.ok(
        ApiResponse.success(null, "로그아웃이 완료되었습니다.")
    );
}
```

### 시나리오 3: 강사 강의 등록 시 강사 ID 자동 설정

```java
@Service
@RequiredArgsConstructor
public class CourseService {
    
    private final CourseRepository courseRepository;
    private final MemberRepository memberRepository;
    
    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request) {
        // 현재 사용자(강사) ID 가져오기
        Long instructorId = (Long) SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getPrincipal();
        
        // 강사 확인
        Member instructor = memberRepository.findById(instructorId)
            .orElseThrow(() -> new EntityNotFoundException("강사를 찾을 수 없습니다."));
        
        if (!instructor.getRole().equals("TEACHER")) {
            throw new IllegalArgumentException("강사 권한이 없습니다.");
        }
        
        // 강의 생성
        Course course = Course.builder()
                .instructor(instructor)  // 강사 자동 설정
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .price(request.getPrice())
                .thumbnailUrl(request.getThumbnailUrl())
                .build();
        
        Course savedCourse = courseRepository.save(course);
        return CourseResponse.from(savedCourse);
    }
}
```

---

## 문제 해결

### 1. 토큰 검증 실패

**증상**: 로그인 후 인증된 API 호출 시 401 에러

**해결 방법**:
```bash
# 1. 토큰 형식 확인
# Authorization: Bearer <token> (공백 포함)

# 2. 토큰 만료 확인
# jwt.io에서 토큰 디코딩하여 exp 확인

# 3. Secret Key 확인
# application.yml의 jwt.secret과 코드의 키가 동일한지 확인

# 4. 로그 확인
# JwtAuthenticationFilter의 예외 로그 확인
```

### 2. CORS 에러

**증상**: 
```
Access to XMLHttpRequest at 'http://localhost:8080/api/auth/login' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**해결 방법**:
```java
// SecurityConfig.java 확인
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:3000",   // 현재 URL
    "http://localhost:5173"
));

// 프리플라이트 요청 확인
// OPTIONS 메서드 허용 여부 확인
configuration.setAllowedMethods(Arrays.asList(
    "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
));
```

### 3. 비밀번호 검증 실패

**증상**: 올바른 비밀번호로 로그인해도 실패

**해결 방법**:
```java
// PasswordEncoder Bean 등록 확인
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}

// 회원가입 시 암호화 확인
String encryptedPassword = passwordEncoder.encode(rawPassword);

// 로그인 시 matches() 사용 확인
boolean isValid = passwordEncoder.matches(rawPassword, encryptedPassword);
```

### 4. "권한이 없습니다" 에러

**증상**: 관리자 API 호출 시 403 에러

**해결 방법**:
```java
// 1. 사용자의 role 확인
SELECT * FROM member WHERE id = 1;
// role = 'ADMIN' 인지 확인

// 2. CustomUserDetailsService의 role 처리 확인
String roleString = role.startsWith("ROLE_") ? role : "ROLE_" + role;

// 3. SecurityConfig의 권한 설정 확인
.requestMatchers("/api/admin/**").hasRole("ADMIN")
// 또는
.requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
```

### 5. 데이터베이스 연결 실패

**증상**: 
```
Unable to acquire a Connection from the DriverManager
```

**해결 방법**:
```yaml
# application.yml 확인
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/chessmate_db
    username: root
    password: your_password
  
  # MySQL이 실행 중인지 확인
  # mysql -u root -p
```

---

## 체크리스트

### 개발 환경 설정
- [ ] Java 17 설치 및 확인
- [ ] IDE에서 SDK 설정
- [ ] Gradle 최신 버전 다운로드
- [ ] MySQL 또는 H2 설정
- [ ] 포트 8080 사용 가능 확인

### 프로젝트 빌드
- [ ] `./gradlew clean build` 성공
- [ ] 테스트 통과: `./gradlew test`
- [ ] 애플리케이션 실행: `./gradlew bootRun`
- [ ] localhost:8080/api/health 접근 확인

### API 테스트
- [ ] 회원가입 (POST /api/auth/signup)
- [ ] 로그인 (POST /api/auth/login)
- [ ] 이메일 중복 확인 (GET /api/auth/check-email)
- [ ] 토큰 재발급 (POST /api/auth/refresh)
- [ ] 보호된 리소스 접근 (Header에 토큰 포함)

### 보안 검증
- [ ] JWT Secret Key는 환경 변수로 관리
- [ ] 비밀번호는 평문으로 저장되지 않음
- [ ] HTTPS/TLS 설정 (프로덕션)
- [ ] CORS 설정 확인
- [ ] 권한 검증 정상 작동

### 배포 준비
- [ ] application-prod.yml 설정
- [ ] 로깅 레벨 최적화
- [ ] 에러 메시지 숨김 (보안)
- [ ] 성능 테스트 완료
- [ ] 백업 전략 수립

---

## 기타

### 유용한 명령어

```bash
# 프로젝트 클린 빌드
./gradlew clean build

# 테스트만 실행
./gradlew test

# 특정 테스트 클래스만 실행
./gradlew test --tests AuthServiceTest

# 애플리케이션 실행
./gradlew bootRun

# Gradle wrapper 업데이트
./gradlew wrapper --gradle-version=9.4.0

# 의존성 트리 확인
./gradlew dependencies
```

### JWT 토큰 디코딩 (jwt.io)

1. [jwt.io](https://jwt.io) 방문
2. "Encoded" 섹션에 토큰 붙여넣기
3. "Decoded" 섹션에서 payload 확인

### 타사 API 테스트

```bash
# curl로 회원가입
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "nickname": "Test User",
    "role": "STUDENT"
  }'

# curl로 로그인
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 반환된 accessToken으로 보호된 API 호출
curl -X GET http://localhost:8080/api/health \
  -H "Authorization: Bearer <accessToken>"
```

---

## 추가 리소스

- **Spring Security**: https://spring.io/projects/spring-security
- **JWT 표준**: https://tools.ietf.org/html/rfc7519
- **BCrypt**: https://github.com/patrickfav/bcrypt
- **JJWT**: https://github.com/jwtk/jjwt

---

**문의**: 조수현 교수님 (chessmate-project@example.com)


