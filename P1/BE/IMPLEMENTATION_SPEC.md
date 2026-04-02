# 📋 ChessMate JWT 인증 기반 CRUD API 구현 명세서

**작성일**: 2026-04-02  
**버전**: 1.0  
**상태**: 구현 계획 & 가이드

---

## 📌 문서 개요

본 명세서는 **ChessMate 프로젝트**의 JWT 인증 시스템을 기반으로 회원 관리, 강의 CRUD, 수강 관리 API를 구현하기 위한 **상세한 기술 명세 및 의사결정 이유**를 담고 있습니다.

### 핵심 원칙
- ✅ **DTO 기반 응답**: 엔티티 직접 반환 금지 → 순환 참조 방지
- ✅ **권한 기반 접근 제어 (RBAC)**: STUDENT, TEACHER, ADMIN 역할별 권한 관리
- ✅ **표준화된 응답**: 모든 API 응답은 `ApiResponse<T>` 래퍼로 감싸기
- ✅ **예외 처리 통합**: GlobalExceptionHandler를 통한 중앙식 예외 관리

---

## 🏗️ 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Frontend/Mobile)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Request + JWT Token
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   JwtAuthenticationFilter                     │
│          (토큰 검증 → SecurityContext에 권한 설정)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Controller Layer                         │
│  (AuthController, CourseController, EnrollmentController)   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                            │
│      (AuthService, CourseService, EnrollmentService)        │
│              비즈니스 로직 & 권한 검증)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Repository Layer                           │
│    (MemberRepository, CourseRepository, EnrollmentRepository)│
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (H2/MySQL)                        │
│     (Member, Course, Section, Lecture, Enrollment 등)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 데이터 모델 (ERD)

```mermaid
erDiagram
    MEMBER ||--o{ ENROLLMENT : "has"
    MEMBER ||--o{ LECTURE_PROGRESS : "records"
    MEMBER ||--o{ COURSE : "teaches (instructor_id)"
    COURSE ||--o{ ENROLLMENT : "registered"
    COURSE ||--o{ SECTION : "contains"
    SECTION ||--o{ LECTURE : "contains"
    LECTURE ||--o{ LECTURE_PROGRESS : "tracks"

    MEMBER {
        bigint id PK
        string email UK
        string password "BCrypt 암호화"
        string nickname
        string role "STUDENT/TEACHER/ADMIN"
        datetime created_at
    }

    COURSE {
        bigint id PK
        bigint instructor_id FK "강사 (Member)"
        string title
        text description
        string category "STOCK/CRYPTO"
        int price
        string thumbnail_url
    }

    SECTION {
        bigint id PK
        bigint course_id FK
        string title
        int sort_order
    }

    LECTURE {
        bigint id PK
        bigint section_id FK
        string title
        string video_url
        int play_time "초 단위"
        int sort_order
    }

    ENROLLMENT {
        bigint id PK
        bigint member_id FK
        bigint course_id FK
        datetime enrolled_at
        boolean is_completed
    }

    LECTURE_PROGRESS {
        bigint id PK
        bigint member_id FK
        bigint lecture_id FK
        int last_position "초 단위"
        datetime updated_at
    }
```

---

## 🔐 인증 흐름 (JWT Authentication Flow)

### 1️⃣ 회원가입 프로세스

```
Client Request (POST /api/auth/signup)
    ├─ email: "user@example.com"
    ├─ password: "plainPassword123"
    ├─ nickname: "ChessPlayer"
    └─ role: "STUDENT"
    
    ▼
AuthController.signup()
    ▼
AuthService.signup()
    ├─ 1. 이메일 중복 체크 (MemberRepository.findByEmail)
    ├─ 2. 비밀번호 BCrypt 암호화 (passwordEncoder.encode)
    ├─ 3. Member 엔티티 생성 및 저장
    └─ 4. MemberResponse 반환
    
    ▼
HTTP Response (200 OK)
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "ChessPlayer",
    "role": "STUDENT"
  },
  "message": "회원가입 성공"
}
```

**의사결정 이유**:
- 비밀번호는 평문으로 저장되지 않음 (BCryptPasswordEncoder 사용)
- 응답에는 비밀번호를 포함하지 않음 (보안)
- 이메일을 unique 제약으로 관리하여 중복 가입 방지

---

### 2️⃣ 로그인 프로세스

```
Client Request (POST /api/auth/login)
    ├─ email: "user@example.com"
    └─ password: "plainPassword123"
    
    ▼
AuthController.login()
    ▼
AuthService.login()
    ├─ 1. CustomUserDetailsService로 사용자 조회
    ├─ 2. BCryptPasswordEncoder로 비밀번호 일치 여부 검증
    ├─ 3. 일치하면 JwtTokenProvider.generateAccessToken() 호출
    ├─ 4. JwtTokenProvider.generateRefreshToken() 호출
    └─ 5. TokenResponse 반환 (accessToken + refreshToken + memberInfo)
    
    ▼
HTTP Response (200 OK)
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "member": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "ChessPlayer",
      "role": "STUDENT"
    }
  },
  "message": "로그인 성공"
}
```

**토큰 구조** (JWT Payload):
```json
// Access Token (유효시간: 1시간)
{
  "sub": "1",           // Member ID
  "role": "STUDENT",
  "iat": 1704067200,   // 발급 시간
  "exp": 1704070800    // 만료 시간
}

// Refresh Token (유효시간: 7일)
{
  "sub": "1",
  "role": "STUDENT",
  "iat": 1704067200,
  "exp": 1704672000
}
```

**의사결정 이유**:
- Access Token은 짧은 유효시간 (1시간) → 토큰 탈취 시 피해 최소화
- Refresh Token은 긴 유효시간 (7일) → 사용자 편의성
- JWT에 Role 정보 포함 → 매 요청마다 DB 조회 없이 권한 확인 가능
- Refresh Token도 함께 반환 → Token Rotation 구현 준비

---

### 3️⃣ API 호출 시 토큰 검증 프로세스

```
Client Request (GET /api/courses)
    └─ Header: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
    
    ▼
JwtAuthenticationFilter.doFilterInternal()
    ├─ 1. Authorization 헤더에서 토큰 추출
    ├─ 2. 토큰이 "Bearer " 로 시작하는지 확인
    ├─ 3. JwtTokenProvider.validateToken() 호출
    │   ├─ 서명 검증 (HMAC-SHA256)
    │   ├─ 만료 시간 확인
    │   └─ Claims 파싱 가능 여부 확인
    ├─ 4. 유효한 경우:
    │   ├─ JwtTokenProvider.getMemberIdFromToken() → 1 추출
    │   ├─ JwtTokenProvider.getRoleFromToken() → "STUDENT" 추출
    │   ├─ UsernamePasswordAuthenticationToken 생성
    │   └─ SecurityContextHolder.setContext()로 저장
    └─ 5. 유효하지 않은 경우: 예외 발생 → GlobalExceptionHandler 처리
    
    ▼
Controller 실행 (권한 확인 완료)
    ├─ @PreAuthorize("hasRole('STUDENT')") 체크
    └─ 메소드 실행
    
    ▼
HTTP Response
```

**의사결정 이유**:
- `OncePerRequestFilter` 상속 → 요청당 정확히 한 번만 필터 실행
- 토큰 검증 실패 시 SecurityContext에 인증정보를 설정하지 않음 → Stateless 유지
- 필터 체인에서 조기 종료 가능 → 불필요한 처리 방지

---

## 📝 DTO 설계 및 구현

### Request DTO 설계

#### 1. 회원가입 요청 (SignupRequest)

```java
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
```

**선택 이유**:
- `@NotBlank`: null, 빈 문자열, 공백만 있는 경우 모두 검증
- `@Email`: RFC 5322 표준 이메일 형식 검증
- `@Size`: 비밀번호 및 닉네임 길이 제한 (보안 & 사용자경험)
- `@Pattern`: 역할 값을 사전에 정의된 값으로만 제한

---

#### 2. 로그인 요청 (LoginRequest)

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {
    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "유효한 이메일 형식이 아닙니다")
    private String email;
    
    @NotBlank(message = "비밀번호는 필수입니다")
    private String password;
}
```

**선택 이유**:
- 로그인은 이메일과 비밀번호만 필요 (간결함)
- 비밀번호 길이는 검증하지 않음 (사용자가 입력한 값 그대로 검증)

---

#### 3. 강의 등록 요청 (CourseCreateRequest)

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseCreateRequest {
    @NotBlank(message = "제목은 필수입니다")
    @Size(min = 3, max = 100, message = "제목은 3자 이상 100자 이하여야 합니다")
    private String title;
    
    @NotBlank(message = "설명은 필수입니다")
    @Size(min = 10, max = 1000, message = "설명은 10자 이상 1000자 이하여야 합니다")
    private String description;
    
    @NotBlank(message = "카테고리는 필수입니다")
    @Pattern(regexp = "^(STOCK|CRYPTO)$", message = "카테고리는 STOCK 또는 CRYPTO여야 합니다")
    private String category;
    
    @NotNull(message = "가격은 필수입니다")
    @Min(value = 0, message = "가격은 0 이상이어야 합니다")
    @Max(value = 10000000, message = "가격은 10,000,000 이하여야 합니다")
    private Integer price;
    
    @URL(message = "유효한 URL 형식이 아닙니다")
    private String thumbnailUrl;
}
```

**선택 이유**:
- 강사만 강의 등록 가능 (Controller에서 `@PreAuthorize("hasRole('TEACHER')")`)
- 카테고리는 STOCK과 CRYPTO로 제한 (enum 사용 대신 @Pattern으로 단순화)
- 썸네일 URL은 선택사항이지만, URL 형식 검증

---

#### 4. 강의 수정 요청 (CourseUpdateRequest)

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseUpdateRequest {
    @NotBlank(message = "제목은 필수입니다")
    @Size(min = 3, max = 100, message = "제목은 3자 이상 100자 이하여야 합니다")
    private String title;
    
    @NotBlank(message = "설명은 필수입니다")
    @Size(min = 10, max = 1000, message = "설명은 10자 이상 1000자 이하여야 합니다")
    private String description;
    
    @NotNull(message = "가격은 필수입니다")
    @Min(value = 0, message = "가격은 0 이상이어야 합니다")
    @Max(value = 10000000, message = "가격은 10,000,000 이하여야 합니다")
    private Integer price;
    
    @URL(message = "유효한 URL 형식이 아닙니다")
    private String thumbnailUrl;
}
```

**선택 이유**:
- CourseCreateRequest와 다르게 `category`는 수정 불가 (강의 등록 후 카테고리 변경 방지)
- 나머지 필드는 모두 수정 가능

---

#### 5. 수강 등록 요청 (EnrollmentCreateRequest)

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentCreateRequest {
    @NotNull(message = "강의 ID는 필수입니다")
    @Positive(message = "강의 ID는 양수여야 합니다")
    private Long courseId;
}
```

**선택 이유**:
- 학생이 강의에 수강 등록할 때 필요한 최소 정보
- 학생의 ID는 JWT 토큰에서 추출 (요청 본문에 포함하지 않음)
- 강의 ID만 필요

---

### Response DTO 설계

#### 1. API 응답 래퍼 (ApiResponse<T>)

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {
    private T data;
    private String message;

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .data(data)
                .message(message)
                .build();
    }

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .data(data)
                .message("Success")
                .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .data(null)
                .message(message)
                .build();
    }
}
```

**선택 이유**:
- 모든 API 응답을 표준화 (일관성)
- 제네릭 타입 `<T>` 사용 → 다양한 데이터 타입 지원
- `success()` / `error()` 팩토리 메서드 → 사용 편의성
- 프론트엔드가 `data` 필드와 `message` 필드를 명확하게 구분 가능

---

#### 2. 회원 응답 (MemberResponse)

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberResponse {
    private Long id;
    private String email;
    private String nickname;
    private String role;

    public static MemberResponse from(Member member) {
        return MemberResponse.builder()
                .id(member.getId())
                .email(member.getEmail())
                .nickname(member.getNickname())
                .role(member.getRole())
                .build();
    }
}
```

**선택 이유**:
- 엔티티를 직접 반환하지 않음 (순환 참조 방지, 지연 로딩 문제 회피)
- 민감한 정보 (비밀번호, 생성 시간) 제외
- `from()` static 메서드로 엔티티 → DTO 변환 표준화

---

#### 3. 토큰 응답 (TokenResponse)

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
    private MemberResponse member;
}
```

**선택 이유**:
- 로그인 성공 시 Access Token, Refresh Token, 회원 정보를 함께 반환
- 클라이언트가 로그인 직후 필요한 모든 정보를 획득
- Refresh Token 관리 가능 (Token Rotation 구현 시 활용)

---

#### 4. 강의 응답 (CourseResponse)

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Integer price;
    private String thumbnailUrl;
    private MemberResponse instructor;  // 강사 정보 포함
    private Integer studentCount;       // 수강 인원
    private LocalDateTime createdAt;

    public static CourseResponse from(Course course, Integer studentCount) {
        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .category(course.getCategory())
                .price(course.getPrice())
                .thumbnailUrl(course.getThumbnailUrl())
                .instructor(MemberResponse.from(course.getInstructor()))
                .studentCount(studentCount)
                .createdAt(course.getCreatedAt())  // 강의 생성 시간 (엔티티에 추가 필요)
                .build();
    }
}
```

**선택 이유**:
- 강사 정보 포함 (강의 상세 페이지에서 "강사명" 표시용)
- 수강 인원 포함 (통계용)
- 엔티티의 모든 필드를 포함하지 않음 (불필요한 정보 제외)

---

#### 5. 수강 응답 (EnrollmentResponse)

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentResponse {
    private Long id;
    private Long memberId;
    private Long courseId;
    private String courseTitle;
    private LocalDateTime enrolledAt;
    private Boolean isCompleted;

    public static EnrollmentResponse from(Enrollment enrollment) {
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .memberId(enrollment.getMember().getId())
                .courseId(enrollment.getCourse().getId())
                .courseTitle(enrollment.getCourse().getTitle())
                .enrolledAt(enrollment.getEnrolledAt())
                .isCompleted(enrollment.getIsCompleted())
                .build();
    }
}
```

**선택 이유**:
- 수강 정보와 강의 제목을 함께 제공 (프론트엔드 편의성)
- Member와 Course 전체 정보를 포함하지 않음 (필요한 정보만 추출)

---

## 🛠️ Service 계층 구현

### 1. AuthService (회원 인증 관리)

**책임**:
- 회원가입 로직 (이메일 중복 체크, 비밀번호 암호화, 저장)
- 로그인 로직 (비밀번호 검증, 토큰 생성)
- 토큰 검증 및 갱신 (Refresh Token → Access Token 재발급)

**메서드**:

```java
@Service
@RequiredArgsConstructor
public class AuthService {
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 회원가입
     * @param request 회원가입 요청 (email, password, nickname, role)
     * @return MemberResponse
     * @throws DuplicateEmailException 이메일이 이미 존재하는 경우
     */
    public MemberResponse signup(SignupRequest request) {
        // 1. 이메일 중복 체크
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("이미 사용 중인 이메일입니다: " + request.getEmail());
        }
        
        // 2. 비밀번호 암호화
        String encryptedPassword = passwordEncoder.encode(request.getPassword());
        
        // 3. Member 엔티티 생성 및 저장
        Member member = Member.builder()
                .email(request.getEmail())
                .password(encryptedPassword)
                .nickname(request.getNickname())
                .role(request.getRole())
                .build();
        
        Member savedMember = memberRepository.save(member);
        
        // 4. DTO 변환 및 반환
        return MemberResponse.from(savedMember);
    }

    /**
     * 로그인
     * @param request 로그인 요청 (email, password)
     * @return TokenResponse (accessToken, refreshToken, memberInfo)
     * @throws UsernameNotFoundException 사용자를 찾을 수 없는 경우
     * @throws BadCredentialsException 비밀번호가 일치하지 않는 경우
     */
    public TokenResponse login(LoginRequest request) {
        // 1. 사용자 조회
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException(
                    "사용자를 찾을 수 없습니다: " + request.getEmail()
                ));
        
        // 2. 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), member.getPassword())) {
            throw new BadCredentialsException("비밀번호가 일치하지 않습니다");
        }
        
        // 3. 토큰 생성
        String accessToken = jwtTokenProvider.generateAccessToken(member.getId(), member.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(member.getId(), member.getRole());
        
        // 4. TokenResponse 생성 및 반환
        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .member(MemberResponse.from(member))
                .build();
    }

    /**
     * Refresh Token으로 Access Token 재발급
     * @param refreshToken 현재의 Refresh Token
     * @return TokenResponse (새로운 accessToken, refreshToken)
     * @throws IllegalArgumentException 유효하지 않은 토큰
     */
    public TokenResponse refreshAccessToken(String refreshToken) {
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
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));
        
        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .member(MemberResponse.from(member))
                .build();
    }

    /**
     * 이메일 중복 체크
     * @param email 확인할 이메일
     * @return true: 이미 존재, false: 사용 가능
     */
    public boolean checkEmailExists(String email) {
        return memberRepository.existsByEmail(email);
    }
}
```

**의사결정 이유**:
1. **비밀번호 암호화**: `passwordEncoder.encode()`를 사용하여 평문 저장 방지
2. **이메일 중복 체크**: 데이터베이스 제약 조건과 함께 애플리케이션 레벨에서도 체크
3. **Refresh Token 지원**: Token Rotation 구현 (보안 강화)
4. **예외 처리**: 명확한 예외 메시지로 클라이언트에게 정보 제공

---

### 2. CourseService (강의 관리)

**책임**:
- 강의 CRUD (Create, Read, Update, Delete)
- 강사 권한 검증 (강사만 자신의 강의 수정/삭제 가능)
- 강의 목록 조회 (필터링, 페이지네이션)

**메서드**:

```java
@Service
@RequiredArgsConstructor
public class CourseService {
    private final CourseRepository courseRepository;
    private final MemberRepository memberRepository;
    private final EnrollmentRepository enrollmentRepository;

    /**
     * 강의 등록 (강사만 가능)
     * @param request 강의 등록 요청
     * @param instructorId 강사 ID (JWT에서 추출)
     * @return CourseResponse
     */
    public CourseResponse createCourse(CourseCreateRequest request, Long instructorId) {
        // 1. 강사 정보 조회
        Member instructor = memberRepository.findById(instructorId)
                .orElseThrow(() -> new EntityNotFoundException("강사를 찾을 수 없습니다"));
        
        // 2. 강사 역할 확인
        if (!instructor.getRole().equals("TEACHER")) {
            throw new AccessDeniedException("강사만 강의를 등록할 수 있습니다");
        }
        
        // 3. Course 엔티티 생성 및 저장
        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .price(request.getPrice())
                .thumbnailUrl(request.getThumbnailUrl())
                .instructor(instructor)
                .build();
        
        Course savedCourse = courseRepository.save(course);
        
        // 4. CourseResponse 반환 (수강 인원: 0)
        return CourseResponse.from(savedCourse, 0);
    }

    /**
     * 강의 상세 조회
     * @param courseId 강의 ID
     * @return CourseResponse
     */
    public CourseResponse getCourseById(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new EntityNotFoundException("강의를 찾을 수 없습니다"));
        
        // 수강 인원 조회
        Integer studentCount = enrollmentRepository.countByCourseId(courseId);
        
        return CourseResponse.from(course, studentCount);
    }

    /**
     * 강의 목록 조회 (페이지네이션)
     * @param pageable Spring Data의 Pageable (page, size, sort)
     * @return Page<CourseResponse>
     */
    public Page<CourseResponse> getAllCourses(Pageable pageable) {
        Page<Course> courses = courseRepository.findAll(pageable);
        
        return courses.map(course -> {
            Integer studentCount = enrollmentRepository.countByCourseId(course.getId());
            return CourseResponse.from(course, studentCount);
        });
    }

    /**
     * 카테고리별 강의 목록 조회
     * @param category STOCK 또는 CRYPTO
     * @param pageable 페이지네이션 정보
     * @return Page<CourseResponse>
     */
    public Page<CourseResponse> getCoursesByCategory(String category, Pageable pageable) {
        Page<Course> courses = courseRepository.findByCategory(category, pageable);
        
        return courses.map(course -> {
            Integer studentCount = enrollmentRepository.countByCourseId(course.getId());
            return CourseResponse.from(course, studentCount);
        });
    }

    /**
     * 강사의 강의 목록 조회
     * @param instructorId 강사 ID
     * @param pageable 페이지네이션 정보
     * @return Page<CourseResponse>
     */
    public Page<CourseResponse> getCoursesByInstructor(Long instructorId, Pageable pageable) {
        Page<Course> courses = courseRepository.findByInstructorId(instructorId, pageable);
        
        return courses.map(course -> {
            Integer studentCount = enrollmentRepository.countByCourseId(course.getId());
            return CourseResponse.from(course, studentCount);
        });
    }

    /**
     * 강의 수정 (강사만 자신의 강의 수정 가능)
     * @param courseId 강의 ID
     * @param request 강의 수정 요청
     * @param instructorId 강사 ID (JWT에서 추출)
     * @return CourseResponse
     */
    public CourseResponse updateCourse(Long courseId, CourseUpdateRequest request, Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new EntityNotFoundException("강의를 찾을 수 없습니다"));
        
        // 1. 강의 강사와 현재 사용자가 동일한지 확인
        if (!course.getInstructor().getId().equals(instructorId)) {
            throw new AccessDeniedException("자신의 강의만 수정할 수 있습니다");
        }
        
        // 2. 강의 정보 수정
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setPrice(request.getPrice());
        course.setThumbnailUrl(request.getThumbnailUrl());
        
        Course updatedCourse = courseRepository.save(course);
        
        // 3. CourseResponse 반환
        Integer studentCount = enrollmentRepository.countByCourseId(courseId);
        return CourseResponse.from(updatedCourse, studentCount);
    }

    /**
     * 강의 삭제 (강사만 자신의 강의 삭제 가능)
     * @param courseId 강의 ID
     * @param instructorId 강사 ID (JWT에서 추출)
     */
    public void deleteCourse(Long courseId, Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new EntityNotFoundException("강의를 찾을 수 없습니다"));
        
        // 1. 강의 강사와 현재 사용자가 동일한지 확인
        if (!course.getInstructor().getId().equals(instructorId)) {
            throw new AccessDeniedException("자신의 강의만 삭제할 수 있습니다");
        }
        
        // 2. 강의 삭제 (CASCADE: 섹션, 강의, 수강 정보도 함께 삭제)
        courseRepository.deleteById(courseId);
    }
}
```

**의사결정 이유**:
1. **권한 검증**: 강사 역할 확인 + 강의 소유권 확인 (이중 검증)
2. **페이지네이션**: Spring Data의 `Pageable` 사용으로 대규모 데이터 처리
3. **수강 인원 조회**: 강의 상세 정보에 수강 인원 포함
4. **예외 처리**: 명확한 예외 메시지로 문제 원인 파악 용이

---

## 🎮 Controller 계층 구현

### 1. AuthController (인증 엔드포인트)

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    /**
     * 회원가입
     * POST /api/auth/signup
     * @param request 회원가입 요청 (email, password, nickname, role)
     * @return ApiResponse<MemberResponse>
     */
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<MemberResponse>> signup(
            @Valid @RequestBody SignupRequest request) {
        MemberResponse member = authService.signup(request);
        return ResponseEntity.ok(
            ApiResponse.success(member, "회원가입이 완료되었습니다")
        );
    }

    /**
     * 로그인
     * POST /api/auth/login
     * @param request 로그인 요청 (email, password)
     * @return ApiResponse<TokenResponse>
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        TokenResponse tokenResponse = authService.login(request);
        return ResponseEntity.ok(
            ApiResponse.success(tokenResponse, "로그인이 완료되었습니다")
        );
    }

    /**
     * Refresh Token으로 Access Token 재발급
     * POST /api/auth/refresh
     * @param token 현재의 Refresh Token (헤더 또는 바디에서 전달)
     * @return ApiResponse<TokenResponse>
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refreshToken(
            @RequestHeader(value = "X-Refresh-Token", required = false) String headerToken,
            @RequestBody(required = false) String bodyToken) {
        String refreshToken = headerToken != null ? headerToken : bodyToken;
        
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh Token이 필요합니다");
        }
        
        TokenResponse tokenResponse = authService.refreshAccessToken(refreshToken);
        return ResponseEntity.ok(
            ApiResponse.success(tokenResponse, "토큰이 갱신되었습니다")
        );
    }

    /**
     * 이메일 중복 체크
     * GET /api/auth/check-email?email=user@example.com
     * @param email 확인할 이메일
     * @return ApiResponse<Boolean>
     */
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmailExists(
            @RequestParam @Email String email) {
        boolean exists = authService.checkEmailExists(email);
        return ResponseEntity.ok(
            ApiResponse.success(exists, exists ? "이미 사용 중인 이메일입니다" : "사용 가능한 이메일입니다")
        );
    }
}
```

**주요 특징**:
- `@Valid` 어노테이션으로 요청 데이터 검증
- 모든 응답을 `ApiResponse<T>` 래퍼로 감싸기
- HTTP 상태 코드: 성공 시 200, 실패 시 예외 처리

---

### 2. CourseController (강의 엔드포인트)

```java
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {
    private final CourseService courseService;

    /**
     * 강의 등록 (강사만)
     * POST /api/courses
     * @param request 강의 등록 요청
     * @return ApiResponse<CourseResponse>
     */
    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CourseCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long instructorId = extractMemberIdFromUserDetails(userDetails);
        CourseResponse course = courseService.createCourse(request, instructorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.success(course, "강의가 등록되었습니다")
        );
    }

    /**
     * 강의 상세 조회
     * GET /api/courses/{courseId}
     * @param courseId 강의 ID
     * @return ApiResponse<CourseResponse>
     */
    @GetMapping("/{courseId}")
    @PreAuthorize("permitAll()")  // 누구나 조회 가능
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(
            @PathVariable Long courseId) {
        CourseResponse course = courseService.getCourseById(courseId);
        return ResponseEntity.ok(ApiResponse.success(course));
    }

    /**
     * 강의 목록 조회 (페이지네이션)
     * GET /api/courses?page=0&size=10&sort=id,desc
     * @param pageable 페이지네이션 정보
     * @return ApiResponse<Page<CourseResponse>>
     */
    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> getAllCourses(
            @ParameterObject Pageable pageable) {
        Page<CourseResponse> courses = courseService.getAllCourses(pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * 카테고리별 강의 조회
     * GET /api/courses/category/{category}?page=0&size=10
     * @param category STOCK 또는 CRYPTO
     * @param pageable 페이지네이션 정보
     * @return ApiResponse<Page<CourseResponse>>
     */
    @GetMapping("/category/{category}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> getCoursesByCategory(
            @PathVariable String category,
            @ParameterObject Pageable pageable) {
        Page<CourseResponse> courses = courseService.getCoursesByCategory(category, pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * 강사의 강의 조회
     * GET /api/courses/instructor/{instructorId}?page=0&size=10
     * @param instructorId 강사 ID
     * @param pageable 페이지네이션 정보
     * @return ApiResponse<Page<CourseResponse>>
     */
    @GetMapping("/instructor/{instructorId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> getCoursesByInstructor(
            @PathVariable Long instructorId,
            @ParameterObject Pageable pageable) {
        Page<CourseResponse> courses = courseService.getCoursesByInstructor(instructorId, pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * 강의 수정 (강사만 자신의 강의 수정 가능)
     * PUT /api/courses/{courseId}
     * @param courseId 강의 ID
     * @param request 강의 수정 요청
     * @return ApiResponse<CourseResponse>
     */
    @PutMapping("/{courseId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable Long courseId,
            @Valid @RequestBody CourseUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long instructorId = extractMemberIdFromUserDetails(userDetails);
        CourseResponse course = courseService.updateCourse(courseId, request, instructorId);
        return ResponseEntity.ok(
            ApiResponse.success(course, "강의가 수정되었습니다")
        );
    }

    /**
     * 강의 삭제 (강사만 자신의 강의 삭제 가능)
     * DELETE /api/courses/{courseId}
     * @param courseId 강의 ID
     * @return ApiResponse<Void>
     */
    @DeleteMapping("/{courseId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long instructorId = extractMemberIdFromUserDetails(userDetails);
        courseService.deleteCourse(courseId, instructorId);
        return ResponseEntity.ok(
            ApiResponse.success(null, "강의가 삭제되었습니다")
        );
    }

    /**
     * UserDetails에서 Member ID 추출 (JWT 토큰에서 추출된 정보)
     * @param userDetails Spring Security의 UserDetails
     * @return Member ID
     */
    private Long extractMemberIdFromUserDetails(UserDetails userDetails) {
        // JwtAuthenticationFilter에서 설정한 Authentication의 Principal에서 추출
        // 실제 구현은 JwtAuthenticationFilter에서 Member ID를 저장하는 방식에 따라 달라짐
        // 예: new UsernamePasswordAuthenticationToken(memberId, null, authorities)
        return Long.parseLong(userDetails.getUsername());
    }
}
```

**주요 특징**:
- `@PreAuthorize`: 메서드 레벨 권한 검증
- `@AuthenticationPrincipal`: JWT에서 추출한 사용자 정보 주입
- `@ParameterObject`: Pageable 파라미터를 쿼리스트링으로 처리 (Springdoc-OpenAPI 호환)
- HTTP 상태 코드: 생성 201, 조회 200, 수정 200, 삭제 200

---

## 📡 API 명세서 (OpenAPI 3.0)

### 1. 회원가입 API

**요청**:
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "SecurePassword123",
  "nickname": "ChessTrainer",
  "role": "TEACHER"
}
```

**응답 (200 OK)**:
```json
{
  "data": {
    "id": 1,
    "email": "teacher@example.com",
    "nickname": "ChessTrainer",
    "role": "TEACHER"
  },
  "message": "회원가입이 완료되었습니다"
}
```

**응답 (400 Bad Request - 이메일 중복)**:
```json
{
  "data": null,
  "message": "이미 사용 중인 이메일입니다: teacher@example.com"
}
```

---

### 2. 로그인 API

**요청**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "SecurePassword123"
}
```

**응답 (200 OK)**:
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6IlRFQUNIRVIiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDA3MDgwMH0.signature",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6IlRFQUNIRVIiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDY3MjAwMH0.signature",
    "member": {
      "id": 1,
      "email": "teacher@example.com",
      "nickname": "ChessTrainer",
      "role": "TEACHER"
    }
  },
  "message": "로그인이 완료되었습니다"
}
```

---

### 3. 강의 등록 API

**요청**:
```http
POST /api/courses
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "주식 투자 기초",
  "description": "초보자를 위한 주식 투자 완벽 가이드입니다",
  "category": "STOCK",
  "price": 29900,
  "thumbnailUrl": "https://example.com/thumbnail.jpg"
}
```

**응답 (201 Created)**:
```json
{
  "data": {
    "id": 1,
    "title": "주식 투자 기초",
    "description": "초보자를 위한 주식 투자 완벽 가이드입니다",
    "category": "STOCK",
    "price": 29900,
    "thumbnailUrl": "https://example.com/thumbnail.jpg",
    "instructor": {
      "id": 1,
      "email": "teacher@example.com",
      "nickname": "ChessTrainer",
      "role": "TEACHER"
    },
    "studentCount": 0,
    "createdAt": "2026-04-02T10:30:00"
  },
  "message": "강의가 등록되었습니다"
}
```

---

### 4. 강의 목록 조회 API

**요청**:
```http
GET /api/courses?page=0&size=10&sort=id,desc
```

**응답 (200 OK)**:
```json
{
  "data": {
    "content": [
      {
        "id": 2,
        "title": "암호화폐 투자 전략",
        "description": "비트코인과 이더리움 투자 전략",
        "category": "CRYPTO",
        "price": 39900,
        "thumbnailUrl": "https://example.com/crypto.jpg",
        "instructor": {
          "id": 2,
          "email": "expert@example.com",
          "nickname": "CryptoExpert",
          "role": "TEACHER"
        },
        "studentCount": 5,
        "createdAt": "2026-04-01T14:20:00"
      },
      {
        "id": 1,
        "title": "주식 투자 기초",
        "description": "초보자를 위한 주식 투자 완벽 가이드입니다",
        "category": "STOCK",
        "price": 29900,
        "thumbnailUrl": "https://example.com/thumbnail.jpg",
        "instructor": {
          "id": 1,
          "email": "teacher@example.com",
          "nickname": "ChessTrainer",
          "role": "TEACHER"
        },
        "studentCount": 0,
        "createdAt": "2026-04-02T10:30:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": {
        "empty": false,
        "sorted": true,
        "unsorted": false
      },
      "offset": 0,
      "paged": true,
      "unpaged": false
    },
    "totalPages": 1,
    "totalElements": 2,
    "last": true,
    "size": 10,
    "number": 0,
    "sort": {
      "empty": false,
      "sorted": true,
      "unsorted": false
    },
    "numberOfElements": 2,
    "first": true,
    "empty": false
  },
  "message": "Success"
}
```

---

## 🧪 페르소나 기반 테스트 시나리오

### 페르소나 1: 강사 (TEACHER) - "김선생"

**배경**:
- 역할: 주식 투자 강사
- 목표: 자신의 강의를 플랫폼에 등록하고 학생들에게 가르치기

**테스트 시나리오**:

| # | 단계 | 요청 | 기대 결과 | 검증 항목 |
|----|------|------|---------|---------|
| 1 | 회원가입 | POST /api/auth/signup (role: TEACHER) | 201 Created, MemberResponse 반환 | ID 생성, 비밀번호 암호화됨 |
| 2 | 로그인 | POST /api/auth/login | 200 OK, accessToken + refreshToken 반환 | 토큰 유효성, Role 포함 |
| 3 | 강의 등록 | POST /api/courses (Authorization: Bearer token) | 201 Created, CourseResponse 반환 | instructor_id = 1, studentCount = 0 |
| 4 | 자신의 강의 조회 | GET /api/courses/instructor/1 | 200 OK, 강사의 강의만 포함 | studentCount, thumbnail 정상 로드 |
| 5 | 강의 수정 | PUT /api/courses/1 (수정된 제목) | 200 OK, 수정된 정보 반환 | 제목 변경 확인 |
| 6 | 다른 강사 강의 수정 시도 | PUT /api/courses/2 (다른 강사 ID의 강의) | 403 Forbidden | 접근 거부 메시지 |
| 7 | 강의 삭제 | DELETE /api/courses/1 | 200 OK | 강의 완전 삭제 |
| 8 | 토큰 만료 후 갱신 | POST /api/auth/refresh (refreshToken) | 200 OK, 새 accessToken 반환 | 새 토큰으로 API 호출 가능 |

**성공 기준**:
- ✅ 강사만 강의 등록/수정/삭제 가능
- ✅ 학생이 강의 등록/수정/삭제 시도 시 403 Forbidden
- ✅ 자신의 강의만 수정/삭제 가능

---

### 페르소나 2: 학생 (STUDENT) - "이학생"

**배경**:
- 역할: 주식과 암호화폐 투자에 관심있는 학생
- 목표: 강의를 구독하고 수강하기

**테스트 시나리오**:

| # | 단계 | 요청 | 기대 결과 | 검증 항목 |
|----|------|------|---------|---------|
| 1 | 회원가입 | POST /api/auth/signup (role: STUDENT) | 201 Created, MemberResponse 반환 | ID 생성, role = STUDENT |
| 2 | 로그인 | POST /api/auth/login | 200 OK, accessToken + refreshToken 반환 | 토큰 유효성 |
| 3 | 전체 강의 조회 | GET /api/courses?page=0&size=10 | 200 OK, 모든 강의 반환 | studentCount 포함 |
| 4 | 특정 강의 조회 | GET /api/courses/1 | 200 OK, 강의 상세 정보 + 강사 정보 | instructor 필드 정상 로드 |
| 5 | STOCK 카테고리 강의 조회 | GET /api/courses/category/STOCK | 200 OK, STOCK 강의만 반환 | 카테고리 필터링 정상 |
| 6 | 강의 등록 시도 | POST /api/courses | 403 Forbidden | 학생은 강의 등록 불가 |
| 7 | 수강 등록 | POST /api/enrollments (courseId: 1) | 201 Created, EnrollmentResponse 반환 | enrolled_at 타임스탬프 생성 |
| 8 | 내 수강 목록 조회 | GET /api/enrollments/my | 200 OK, 등록한 강의 목록 | 강의 제목 포함 |
| 9 | 강의 진행률 추적 | POST /api/lectures/1/progress (position: 300) | 200 OK, LectureProgressResponse | last_position = 300 |
| 10 | 토큰 없이 API 호출 | GET /api/courses (Authorization 헤더 없음) | 401 Unauthorized | 인증 필요 메시지 |

**성공 기준**:
- ✅ 학생은 강의 조회만 가능 (등록/수정/삭제 불가)
- ✅ 학생은 수강 등록 가능
- ✅ 학생은 자신의 수강 강의 목록 조회 가능
- ✅ 토큰 없이 보호된 API 호출 시 401 반환

---

### 페르소나 3: 관리자 (ADMIN) - "관리자"

**배경**:
- 역할: 플랫폼 운영 관리자
- 목표: 전체 사용자 및 강의 관리

**테스트 시나리오** (향후 구현):

| # | 단계 | 요청 | 기대 결과 |
|----|------|------|---------|
| 1 | 전체 사용자 조회 | GET /api/admin/members | 200 OK, 모든 사용자 반환 |
| 2 | 강의 통계 조회 | GET /api/admin/statistics | 200 OK, 통계 정보 반환 |
| 3 | 사용자 정지 | PUT /api/admin/members/1/suspend | 200 OK, 사용자 정지 |

---

## 🚨 예외 처리 (GlobalExceptionHandler)

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * 중복된 이메일로 가입하려는 경우
     */
    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiResponse<Void>> handleDuplicateEmailException(
            DuplicateEmailException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
    }

    /**
     * 사용자/강의 등 엔티티를 찾을 수 없는 경우
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleEntityNotFoundException(
            EntityNotFoundException e) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
    }

    /**
     * 사용자의 권한이 없는 경우
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(
            AccessDeniedException e) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(e.getMessage()));
    }

    /**
     * 로그인 정보가 일치하지 않는 경우
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentialsException(
            BadCredentialsException e) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("로그인 정보가 일치하지 않습니다"));
    }

    /**
     * 사용자를 찾을 수 없는 경우
     */
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleUsernameNotFoundException(
            UsernameNotFoundException e) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("사용자를 찾을 수 없습니다"));
    }

    /**
     * 토큰이 만료된 경우
     */
    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<ApiResponse<Void>> handleExpiredJwtException(
            ExpiredJwtException e) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("토큰이 만료되었습니다. 다시 로그인해주세요"));
    }

    /**
     * 유효하지 않은 토큰
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(
            IllegalArgumentException e) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("유효하지 않은 토큰입니다"));
    }

    /**
     * DTO 필드 검증 실패
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(
            MethodArgumentNotValidException e) {
        String message = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("입력값 검증 실패: " + message));
    }

    /**
     * 기타 예상하지 못한 예외
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(Exception e) {
        log.error("Unexpected exception occurred", e);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("서버 오류가 발생했습니다"));
    }
}
```

---

## 🔄 구현 순서 및 체크리스트

```markdown
### Phase 1: 기초 설정 (완료)
- [x] JWT 토큰 관리 (JwtTokenProvider)
- [x] JWT 필터 (JwtAuthenticationFilter)
- [x] Spring Security 설정
- [x] 엔티티 설계 (Member, Course, Section, Lecture, Enrollment, LectureProgress)
- [x] 기본 DTO (ApiResponse, MemberResponse, TokenResponse)

### Phase 2: 인증 구현 (다음 단계)
- [ ] AuthService 구현 (signup, login, refreshToken)
- [ ] AuthController 구현
- [ ] CustomUserDetailsService 개선
- [ ] 예외 처리 (GlobalExceptionHandler)
- [ ] 테스트: 회원가입, 로그인, 토큰 검증

### Phase 3: 강의 관리 구현
- [ ] CourseCreateRequest, CourseUpdateRequest DTO 구현
- [ ] CourseResponse DTO 구현
- [ ] CourseService 구현 (CRUD + 권한 검증)
- [ ] CourseController 구현
- [ ] Repository 쿼리 메서드 추가 (findByCategory, findByInstructorId 등)
- [ ] 테스트: 강의 등록, 조회, 수정, 삭제

### Phase 4: 수강 관리 구현
- [ ] EnrollmentCreateRequest DTO 구현
- [ ] EnrollmentResponse DTO 구현
- [ ] EnrollmentService 구현
- [ ] EnrollmentController 구현
- [ ] 테스트: 수강 등록, 조회, 진행률 추적

### Phase 5: 통합 및 문서화
- [ ] Postman Collection 작성
- [ ] API 문서 (Swagger/Springdoc-OpenAPI)
- [ ] 통합 테스트 작성
- [ ] 성능 테스트 (대규모 데이터)
- [ ] 배포 가이드 작성
```

---

## 📚 추가 고려 사항

### 1. Token Rotation 구현
현재 구현은 Refresh Token 지원만 하고 있습니다. 보안을 더욱 강화하려면:

```
1. 로그인 시 발급한 Refresh Token을 데이터베이스에 저장
2. Refresh Token으로 새 Access Token을 발급할 때, Refresh Token도 함께 갱신
3. 이전 Refresh Token은 무효화 (Revoke)
```

### 2. 비밀번호 재설정 (Forgot Password)
향후 추가할 기능:

```
1. POST /api/auth/forgot-password (email) → 임시 토큰 생성 및 이메일 전송
2. POST /api/auth/reset-password (token, newPassword) → 비밀번호 변경
```

### 3. 이메일 인증 (Email Verification)
향후 추가할 기능:

```
1. 회원가입 후 확인 이메일 전송
2. 이메일의 링크 클릭하여 인증 완료
3. 인증 완료 후만 로그인 가능
```

### 4. Audit Logging
향후 추가할 기능:

```
1. 모든 API 호출 로깅 (요청 시간, 사용자, 결과)
2. 강의 수정/삭제 이력 저장
3. 관리자 대시보드에서 조회 가능
```

---

## 📖 참고 자료

- [Spring Security 6 공식 문서](https://spring.io/projects/spring-security)
- [JWT.io - JWT 토큰 검증 및 디버깅](https://jwt.io)
- [JJWT Library - Java JWT 구현](https://github.com/jwtk/jjwt)
- [Lombok 어노테이션 가이드](https://projectlombok.org/)
- [Spring Data JPA 페이지네이션](https://spring.io/projects/spring-data-jpa)

---

## ✅ 결론

본 명세서는 **ChessMate 프로젝트**의 JWT 인증 기반 CRUD API 구현을 위한 **상세한 기술 지침**을 제공합니다.

**핵심 원칙**:
1. DTO를 통한 엔티티 보호 (순환 참조 방지)
2. 권한 기반 접근 제어 (RBAC) 구현
3. 표준화된 API 응답 형식
4. 중앙식 예외 처리
5. 단계별 구현 및 테스트

이 명세서를 따라 구현하면 **보안성 높고, 유지보수하기 쉬운** 백엔드 API를 구축할 수 있습니다.

**문의사항**: 구현 중 불명확한 부분이나 추가 질문이 있으면 언제든 문의하세요.

