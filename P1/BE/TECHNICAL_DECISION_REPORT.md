# 📊 ChessMate MVP 백엔드 개발 보고서
## 기술 구현 방식, 설계 결정 이유, 테스트 전략

**작성일**: 2026-04-02  
**프로젝트명**: ChessMate (온라인 강의 플랫폼)  
**문서 유형**: 기술 보고서 (핵심 설계 및 구현 방식 기록)  

---

## 📑 목차

1. [개요](#1-개요)
2. [현재 구현 현황](#2-현재-구현-현황)
3. [사용자(학생) 중심 설계](#3-사용자학생-중심-설계)
4. [기술 스택 및 아키텍처](#4-기술-스택-및-아키텍처)
5. [핵심 설계 결정 (Decision Rationale)](#5-핵심-설계-결정)
6. [구현 방식 및 이유](#6-구현-방식-및-이유)
7. [데이터 모델 설계](#7-데이터-모델-설계)
8. [페르소나별 사용자 흐름](#8-페르소나별-사용자-흐름)
9. [API 설계 원칙](#9-api-설계-원칙)
10. [테스트 전략](#10-테스트-전략)
11. [성능 최적화 전략](#11-성능-최적화-전략)
12. [보안 고려사항](#12-보안-고려사항)
13. [향후 확장 계획](#13-향후-확장-계획)

---

## 1. 개요

### 1.1 프로젝트 개요

**ChessMate**는 주식 및 암호화폐 투자 입문자를 위한 온라인 강의 플랫폼입니다.

- **MVP 단계**: 학생(수강자) 중심의 핵심 기능 구현
- **목표**: 강의 발견 → 수강 신청 → 학습 → 진도 추적의 완전한 사용자 경험 제공
- **스코프**: 강사 기능은 P2로 미룸 (관리 기능은 나중, 학습 경험이 최우선)

### 1.2 보고서 목적

이 문서는 다음을 기록합니다:

1. **기술 스택 선택 이유** - 왜 Spring Boot, JPA, JWT를 선택했는가
2. **아키텍처 설계** - 왜 Service/Repository 계층을 분리했는가
3. **데이터 모델** - 왜 이런 테이블 구조를 설계했는가
4. **API 설계** - 왜 이런 엔드포인트 형식을 선택했는가
5. **테스트 전략** - 어떻게 품질을 보장할 것인가
6. **성능 최적화** - N+1 문제, 캐싱, 페이지네이션을 어떻게 처리하는가

---

## 2. 현재 구현 현황

### 2.1 완료된 기능

| 기능 | 상태 | 구현 방식 |
|:---|:---|:---|
| **회원 관리** | ✅ 완료 | JWT + BCrypt 비밀번호 암호화 |
| **JWT 인증** | ✅ 완료 | JwtAuthenticationFilter + JwtTokenProvider |
| **강의 CRUD** | ✅ 완료 | CourseService + CourseRepository |
| **수강 신청** | ✅ 완료 | EnrollmentService |
| **권한 기반 접근 제어** | ✅ 완료 | @PreAuthorize + Spring Security |
| **예외 처리** | ✅ 완료 | GlobalExceptionHandler |

### 2.2 추가 구현 예정 (MVP Phase 1~5)

| Phase | 기능 | 예상 시간 |
|:---|:---|:---|
| Phase 1 | 강의 검색 & 필터링 | 1시간 |
| Phase 2 | 강의 상세 조회 (커리큘럼) | 1시간 |
| Phase 3 | 진도 추적 API | 1.5시간 |
| Phase 4 | 학생 대시보드 | 1.5시간 |
| Phase 5 | 통합 테스트 & 문서화 | 1시간 |
| **총계** | | **약 6시간** |

---

## 3. 사용자(학생) 중심 설계

### 3.1 왜 강사 기능을 뒤로 미루는가?

#### 🎯 MVP 단계의 핵심 원칙

**"학생이 느끼는 경험이 최우선"**

MVP 단계에서 구현해야 할 것:
```
강의 발견 (검색)
    ↓
강의 상세 확인 (커리큘럼 보기)
    ↓
수강 신청 (구매 아직 아님, 즉시 접근)
    ↓
영상 시청 & 진도 저장
    ↓
대시보드 (학습 현황 확인)
```

강사 기능을 제외하는 이유:
- ❌ 강의 등록/수정/삭제 (강사만 사용)
- ❌ 강사 대시보드 (수강생 통계 등)
- ❌ 강의 평가 분석

**왜?**
```
학생의 핵심 경험: 수강 → 학습 → 진도 추적
강사의 관리 기능: P2에서 담당 (필요하지 않음)

시간 제약이 있을 때:
→ 100%의 학생 경험 > 80%의 학생 + 50%의 강사
```

### 3.2 학생 페르소나별 사용 시나리오

#### 페르소나 1: 초보 투자자 (김성민, 27세)

```
상황:
  - 주식 투자를 시작하고 싶지만 기초 지식이 없음
  - 월 수강료는 부담, 무료/저가 강의 선호
  - 짧은 강의로 핵심만 배우길 원함

사용 흐름:
  1. 메인 페이지 접속 → 강의 목록 확인
  2. 검색: "주식 기초" 입력
  3. STOCK 카테고리에서 "초보자 완벽 가이드" 선택
  4. 강의 상세 보기:
     - 총 15개 강의, 18시간 분량 확인
     - 섹션: 기초 개념 → 거래 방법 → 실전 분석
     - 강사 정보 확인 (평판/후기 보기)
  5. "수강하기" 버튼 → 즉시 학습 시작
  6. 강의 1: "주식이란?" (20분) 시청
     - 중간에 멈춘 위치 자동 저장
  7. 마이페이지:
     - 현재 진도: 20/15 강의 완료 (13.3%)
     - 이번 주 학습 시간: 2시간 15분
     - 강의 계속 보기 버튼

핵심 기능 필요성:
  ✅ 검색 (키워드 + 카테고리 필터)
  ✅ 강의 상세 (커리큘럼 확인)
  ✅ 진도 저장 (중단 위치 기억)
  ✅ 대시보드 (진도율 확인)
```

#### 페르소나 2: 진행 중인 학습자 (박민지, 35세)

```
상황:
  - 이미 2개 강의를 수강 중
  - 진도율을 확인하고 싶음 (어디까지 봤는지)
  - 완강까지 얼마나 남았는지 궁금

사용 흐름:
  1. 로그인 → 마이페이지
  2. "내 강의실" 탭:
     - 강의 1: 주식 기초 (진도 65%)
     - 강의 2: 암호화폐 입문 (진도 40%)
  3. 강의 1 선택 → 섹션별 진도 상세 보기:
     - 섹션 1 (기초 개념): 5/5 완료 ✓
     - 섹션 2 (거래 방법): 3/5 완료 ⏳
     - 섹션 3 (실전 분석): 0/5 미시작
  4. 마지막 시청 강의 "기술적 분석" 계속 보기
     - 이전 멈춘 위치(300초)부터 자동 재개

핵심 기능 필요성:
  ✅ 대시보드 (진도 요약)
  ✅ 강의별 상세 진도 (섹션별)
  ✅ 진도 저장 & 자동 재개
  ✅ 마지막 시청 정보 표시
```

#### 페르소나 3: 바쁜 직장인 (이준호, 42세)

```
상황:
  - 시간이 없어서 짧은 강의만 시청 가능
  - 퇴근 후 30분씩만 볼 수 있음
  - 학습 기록과 통계가 중요 (진행도 확인)

사용 흐름:
  1. 저녁 10시 집에서 로그인
  2. 마이페이지에서 "최근 시청" 강의 재개
     - 지난 이용 후 진도 위치 자동 기억
  3. 20분 강의 시청 (자동 진도 저장)
  4. 퇴근 다음날:
     - 대시보드: 어제 학습 시간 20분 기록됨
     - 이번 주 총 학습 시간: 3시간 45분
     - 현재 강의 진도: 62% → 64% (상승도)

핵심 기능 필요성:
  ✅ 실시간 진도 저장 (중단 위치 기억)
  ✅ 대시보드 통계 (학습 시간, 진도율)
  ✅ 빠른 재개 (최근 시청 항목)
```

### 3.3 설계 결정의 이유

| 결정 | 이유 | 트레이드오프 |
|:---|:---|:---|
| **DTO 패턴 도입** | 엔티티 직접 노출 시 순환 참조 & 보안 위험 | 개발 시간 증가 (하지만 유지보수성 우위) |
| **Service 계층 분리** | 비즈니스 로직 중앙화 & 테스트 용이 | 한 단계 더 거치므로 미미한 성능 저하 |
| **JWT Stateless 인증** | 서버 확장성 (세션 무관) & 마이크로서비스 전환 용이 | 토큰 무효화 지연 (블랙리스트 필요) |
| **Lazy Loading** | 필요한 데이터만 조회 (메모리 절약) | N+1 쿼리 문제 (fetch join으로 해결) |
| **엔티티 연관관계 설계** | Course에 instructor_id 추가 (강사 정보 필수) | 외래 키 제약 증가 |

---

## 4. 기술 스택 및 아키텍처

### 4.1 기술 스택

```
Backend Framework:
  ├─ Spring Boot 4.0.4 (최신 LTS)
  ├─ Spring Data JPA (ORM)
  ├─ Spring Security 6 (인증/인가)
  └─ Spring Web (REST API)

Database:
  ├─ H2 Database (개발/테스트)
  └─ MySQL (프로덕션)

Authentication:
  ├─ JWT (JSON Web Token)
  ├─ JJWT 0.12.3 라이브러리
  └─ BCrypt (비밀번호 암호화)

Validation:
  └─ Jakarta Validation API

Utilities:
  └─ Lombok (보일러플레이트 제거)

Documentation:
  ├─ Springdoc OpenAPI 2.0.4 (Swagger UI)
  └─ Postman Collection

Testing:
  └─ JUnit 5 (Unit Testing)
```

### 4.2 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Web/Mobile)                    │
└────────────────────────┬──────────────────────────────────┘
                         │ HTTP Request (JWT Token)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Spring Boot Application                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Web Layer (Controller)                              │  │
│  ├─ CourseController                                   │  │
│  ├─ EnrollmentController                               │  │
│  ├─ AuthController                                     │  │
│  └─ (LectureProgressController - 구현 예정)            │  │
│  └─────────────────────────────────────────────────────┘  │
│                    ↑ (요청 전달)                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Security Layer (JWT Filter & Authentication)       │  │
│  ├─ JwtAuthenticationFilter                            │  │
│  ├─ JwtTokenProvider                                   │  │
│  ├─ CustomUserDetailsService                           │  │
│  └─ SecurityConfig                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                    ↑ (인증 검증)                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Service Layer (비즈니스 로직)                        │  │
│  ├─ CourseService                                      │  │
│  ├─ EnrollmentService                                  │  │
│  ├─ AuthService                                        │  │
│  └─ (LectureProgressService - 구현 예정)               │  │
│  └─────────────────────────────────────────────────────┘  │
│                    ↑ (조회/수정 요청)                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Layer (Repository & Entity)                   │  │
│  ├─ CourseRepository (JpaRepository)                   │  │
│  ├─ EnrollmentRepository                               │  │
│  ├─ MemberRepository                                   │  │
│  ├─ LectureRepository                                  │  │
│  ├─ SectionRepository                                  │  │
│  └─ (LectureProgressRepository - 구현 예정)            │  │
│  └─────────────────────────────────────────────────────┘  │
│                    ↑ (SQL 쿼리)                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Exception Handler (중앙식 에러 처리)                 │  │
│  └─ GlobalExceptionHandler                             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         ↓ (SQL)
┌─────────────────────────────────────────────────────────────┐
│                   Database (H2 / MySQL)                     │
├─────────────────────────────────────────────────────────────┤
│ member | course | enrollment | section | lecture |          │
│                 | lecture_progress |                        │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 왜 이런 아키텍처를 선택했는가?

#### 4.3.1 계층(Layered) 아키텍처

```java
Request → Controller → Service → Repository → Database
                      ↓
                   Exception Handler (모든 계층에서 예외 처리)
```

**선택 이유:**
1. **관심사의 분리(Separation of Concerns)**
   - Controller: HTTP 요청/응답 처리만
   - Service: 비즈니스 로직만
   - Repository: 데이터 접근만

2. **테스트 용이성**
   ```java
   // Service를 단독으로 테스트 가능
   @ExtendWith(MockitoExtension.class)
   class CourseServiceTest {
       @Mock
       private CourseRepository courseRepository;
       
       @InjectMocks
       private CourseService courseService;
       
       @Test
       void testSearchCourses() {
           // Mock 데이터로 테스트
       }
   }
   ```

3. **재사용성**
   - Service는 Controller가 아닌 곳에서도 사용 가능
   - 향후 배치 작업, 스케줄 작업 추가 시 Service 재사용

4. **유지보수성**
   - 비즈니스 로직 변경 시 Service만 수정
   - Controller는 건드리지 않음

#### 4.3.2 DTO 패턴

```
Entity (JPA 엔티티)
  ↓ (Service에서 변환)
DTO (Data Transfer Object)
  ↓ (Controller에서 응답)
JSON (클라이언트로 전송)
```

**선택 이유:**

1. **순환 참조 방지**
   ```java
   // ❌ 엔티티 직접 반환
   public Course getCourse(Long id) {
       Course course = courseRepository.findById(id);
       // course.getInstructor() → Member
       // → member.getInstructorCourses() → List<Course> (순환!)
   }
   
   // ✅ DTO로 변환
   public CourseResponse getCourse(Long id) {
       Course course = courseRepository.findById(id);
       return CourseResponse.from(course); // 필요한 필드만
   }
   ```

2. **API 응답 통제**
   ```java
   // Entity의 변화가 API에 영향을 주지 않음
   // password, securityToken 등 민감 정보 노출 방지
   ```

3. **API 계약(Contract) 명확화**
   ```java
   public class CourseResponse {
       private Long id;
       private String title;
       private String instructorName; // Entity와 다른 필드명
   }
   ```

---

## 5. 핵심 설계 결정

### 5.1 JWT 토큰 설계

#### 왜 JWT를 선택했는가?

| 비교 항목 | JWT | 세션 |
|:---|:---|:---|
| **서버 메모리** | 토큰만 저장 (클라이언트) | 세션 저장소 필요 |
| **확장성** | 서버 수 증가 무관 | 세션 공유 인프라 필요 |
| **모바일** | 쉬움 | 쿠키 기반이라 복잡 |
| **마이크로서비스** | 각 서버가 검증 가능 | 세션 서버 의존 |
| **토큰 무효화** | 블랙리스트 필요 | 서버에서 즉시 제어 |

**결론**: API 기반 모바일 앱 지원 + 향후 마이크로서비스 전환을 고려 → JWT 선택

#### JWT 토큰 구조

```
Access Token (짧은 유효시간)
├─ Header: {"alg": "HS256", "typ": "JWT"}
├─ Payload: 
│  ├─ memberId: 1
│  ├─ role: "STUDENT"
│  ├─ iat: 1704067200 (발급 시간)
│  └─ exp: 1704070800 (1시간 후 만료)
└─ Signature: (암호화된 서명)

Refresh Token (긴 유효시간)
└─ exp: 1704672000 (7일 후 만료)
```

**유효시간 선택 이유:**
- Access Token 1시간: 탈취 시 피해 최소화, 자주 갱신하므로 사용성 저하 미미
- Refresh Token 7일: 장기간 자동 로그인 제공, 만료 시 재로그인 필요

### 5.2 Course - Instructor 관계 설계

#### ERD

```
Member (강사)  1 ────────── * Course
   id          (instructor_id)  id
 email                       title
 role                        description
```

#### 왜 이렇게 설계했는가?

**요구사항:**
1. 강의 상세 페이지에서 강사명 표시
2. 강사가 자신의 강의만 수정/삭제 가능
3. P3(결제)에서 판매 수익 정산

**구현:**

```java
// Course Entity
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "instructor_id", nullable = false)
private Member instructor;

// Member Entity  
@OneToMany(mappedBy = "instructor")
private List<Course> instructorCourses;
```

**설계 선택:**
1. ✅ Lazy Loading: 강의 목록 조회 시 강사 정보는 필요 없으면 조회 안 함
2. ✅ fetch = FetchType.LAZY: 강사 정보가 필요할 때만 쿼리 실행

### 5.3 LectureProgress 모델 설계

#### 현재 구조

```java
@Entity
public class LectureProgress {
    @Id
    private Long id;
    
    @ManyToOne
    private Member member;
    
    @ManyToOne
    private Lecture lecture;
    
    private Integer lastPosition; // 마지막 시청 위치(초)
    private LocalDateTime updatedAt; // 마지막 업데이트 시간
}
```

#### 왜 이렇게 설계했는가?

**요구사항:**
- 학생이 강의를 중단했을 때, 다음 접속 시 그 위치부터 재개하고 싶음
- 각 강의별 시청 시간(초)을 추적하고 싶음

**설계 선택:**

| 필드 | 타입 | 이유 |
|:---|:---|:---|
| `member_id` | FK | 사용자 식별 |
| `lecture_id` | FK | 강의 식별 |
| `lastPosition` | Integer | 마지막 시청 위치 (초 단위, 정확성) |
| `updatedAt` | LocalDateTime | 마지막 변경 시간 (진도 계산용) |

**선택하지 않은 필드:**
- ❌ `isCompleted` (부울): 대신 `lastPosition == lecture.playTime`으로 판단
- ❌ `watchTime` (누적 시간): 성능 저하, 필요 시 계산

### 5.4 강의 검색 설계

#### 기능 요구사항
- 제목 검색: "주식", "암호" 등 키워드
- 카테고리 필터: STOCK / CRYPTO
- 정렬: 최신순, 인기순, 가격순

#### 구현 방식

```java
// Repository
@Query("""
    SELECT c FROM Course c
    JOIN FETCH c.instructor
    WHERE c.title LIKE %:keyword%
      AND (:category IS NULL OR c.category = :category)
    ORDER BY c.createdAt DESC
""")
List<Course> searchByKeywordAndCategory(
    String keyword, 
    String category,
    Pageable pageable
);

// Service
public Page<CourseResponse> searchCourses(
    String keyword,
    String category,
    Pageable pageable
) {
    return courseRepository
        .searchByKeywordAndCategory(keyword, category, pageable)
        .map(CourseResponse::from);
}

// Controller
@GetMapping("/search")
public ApiResponse<Page<CourseResponse>> searchCourses(
    @RequestParam(defaultValue = "") String keyword,
    @RequestParam(required = false) String category,
    Pageable pageable
) {
    return ApiResponse.success(
        courseService.searchCourses(keyword, category, pageable),
        "강의 검색 결과입니다."
    );
}
```

**왜 이렇게 설계했는가?**

1. **JPQL + 동적 쿼리**: SQL 주입 방지
2. **fetch join**: N+1 문제 해결 (강사 정보 함께 조회)
3. **Pageable**: 대량의 데이터 처리 (10개씩만 반환)
4. **기본값 설정**: keyword="" → 전체 조회, category=null → 카테고리 무관

---

## 6. 구현 방식 및 이유

### 6.1 Service Layer 구현 방식

#### 패턴: Service Facade

```java
@Service
@Transactional(readOnly = true) // 기본적으로 읽기 전용
public class CourseService {
    
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    
    @Transactional // 데이터 변경 시에만 명시적으로
    public CourseResponse createCourse(CourseCreateRequest request, Long instructorId) {
        // 1. 권한 검증
        Member instructor = memberRepository.findById(instructorId)
            .orElseThrow(() -> new EntityNotFoundException("강사 정보를 찾을 수 없습니다."));
        
        if (!instructor.getRole().equals("TEACHER")) {
            throw new AccessDeniedException("강사만 강의를 등록할 수 있습니다.");
        }
        
        // 2. 데이터 변환 & 저장
        Course course = Course.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .category(request.getCategory())
            .instructor(instructor)
            .build();
        
        Course savedCourse = courseRepository.save(course);
        return CourseResponse.from(savedCourse);
    }
    
    // 읽기 전용 (트랜잭션 불필요하지만, 클래스 레벨 설정 사용)
    public Page<CourseResponse> getAllCourses(Pageable pageable) {
        return courseRepository.findAll(pageable)
            .map(CourseResponse::from);
    }
}
```

**설계 선택:**

| 선택 | 이유 |
|:---|:---|
| `@Transactional(readOnly = true)` at class level | 대부분이 읽기 → 기본값 설정 |
| `@Transactional` only on write methods | 명시성 + 성능 (읽기 최적화) |
| Service에서 권한 검증 | Controller는 단순히 요청 전달, 비즈니스 로직은 Service에서 처리 |
| Exception 던지기 | GlobalExceptionHandler가 HTTP 상태코드로 변환 |

### 6.2 Repository 쿼리 최적화

#### 문제: N+1 쿼리

```java
// ❌ 나쁜 예
List<Course> courses = courseRepository.findAll();
for (Course course : courses) {
    String instructorName = course.getInstructor().getNickname(); // N번의 쿼리!
}
// 총 1 + N 개의 쿼리 실행
```

#### 해결: fetch join

```java
// ✅ 좋은 예
@Query("""
    SELECT c FROM Course c
    JOIN FETCH c.instructor
    WHERE c.category = :category
""")
List<Course> findByCategoryWithInstructor(String category);

// 총 1개의 쿼리로 해결
```

**선택하지 않은 방식:**
- ❌ Eager Loading (`FetchType.EAGER`): 항상 강사 정보까지 조회 → 성능 저하
- ❌ 별도 쿼리: 강사 목록을 따로 조회 → 코드 복잡도 증가

### 6.3 DTO 변환 방식

#### 방식 1: 정적 팩토리 메서드 (선택)

```java
public class CourseResponse {
    private Long id;
    private String title;
    private String instructorName;
    
    // 정적 팩토리 메서드
    public static CourseResponse from(Course course) {
        return CourseResponse.builder()
            .id(course.getId())
            .title(course.getTitle())
            .instructorName(course.getInstructor().getNickname())
            .build();
    }
}

// 사용
CourseResponse response = CourseResponse.from(course);
```

#### 방식 2: 생성자

```java
public CourseResponse(Course course) {
    this.id = course.getId();
    this.title = course.getTitle();
    this.instructorName = course.getInstructor().getNickname();
}
```

**선택 이유:**
1. 가독성: `CourseResponse.from(course)` vs `new CourseResponse(course)`
2. 유연성: `from()`을 여러 버전으로 확장 가능
3. 명시성: 팩토리 메서드는 객체 생성의 의도를 명확히 함

### 6.4 예외 처리 전략

#### 중앙식 예외 처리 (GlobalExceptionHandler)

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleEntityNotFound(
        EntityNotFoundException ex
    ) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
        AccessDeniedException ex
    ) {
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.error("접근 권한이 없습니다."));
    }
}
```

**왜 이렇게?**

| 방식 | 장점 | 단점 |
|:---|:---|:---|
| **중앙식** | 일관된 응답 형식, 중복 제거 | 모든 Controller에서 예외를 던져야 함 |
| **각 Controller** | 제어 가능 | 응답 형식 불일치, 코드 반복 |

선택: **중앙식** (일관성 > 제어)

---

## 7. 데이터 모델 설계

### 7.1 정규화 & 반정규화

#### ERD (최종)

```
MEMBER (1) ─── (M) COURSE
   └─ (1) ─── (M) ENROLLMENT ─── (M) COURSE
   
COURSE (1) ─── (M) SECTION ─── (M) LECTURE

MEMBER (1) ─── (M) LECTURE_PROGRESS ─── (M) LECTURE
```

### 7.2 각 테이블 설계 이유

| 테이블 | 주요 컬럼 | 설계 결정 |
|:---|:---|:---|
| **Member** | id, email, password, role, createdAt | PK: id, Unique: email |
| **Course** | id, title, category, instructor_id, createdAt | FK: instructor_id, Not Null |
| **Section** | id, course_id, title, sortOrder | FK: course_id (Course 삭제 시 Cascade) |
| **Lecture** | id, section_id, title, videoUrl, playTime, sortOrder | FK: section_id (Section 삭제 시 Cascade) |
| **Enrollment** | id, member_id, course_id, enrolledAt, isCompleted | PK: (member_id, course_id) 고려 |
| **LectureProgress** | id, member_id, lecture_id, lastPosition, updatedAt | Unique: (member_id, lecture_id) |

### 7.3 선택하지 않은 설계

#### 선택 안 함: 진도율 컬럼 (반정규화)

```java
// ❌ 반정규화 (성능 vs 일관성 트레이드오프)
@Entity
public class Enrollment {
    private Long id;
    private Member member;
    private Course course;
    private Double progressPercent; // 계산된 값을 저장 → 동기화 문제
}

// ✅ 정규화 (계산)
public double getProgressPercent() {
    List<Lecture> lectures = course.getSections().stream()
        .flatMap(s -> s.getLectures().stream())
        .collect(toList());
    
    long watchedCount = lectureProgressRepository
        .countByMemberAndLectureIn(member, lectures);
    
    return (watchedCount * 100) / lectures.size();
}
```

**선택 이유:** 
- 진도율은 LectureProgress가 변할 때마다 업데이트 필요
- 계산 비용 < 동기화 복잡도
- 읽기 성능은 캐싱으로 보완 가능 (P2)

---

## 8. 페르소나별 사용자 흐름

### 8.1 초보 투자자 (김성민) - 첫 강의 수강

```
┌─────────────────────────────────────────────────────┐
│ 1. 로그인                                             │
│ POST /api/auth/login                               │
│ Request: { email, password }                      │
│ Response: { accessToken, refreshToken }           │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. 강의 검색                                          │
│ GET /api/courses/search?keyword=주식&category=STOCK│
│ Response: [                                        │
│   { id, title, instructorName, price, ... },     │
│   ...                                              │
│ ]                                                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. 강의 상세 조회 (커리큘럼)                          │
│ GET /api/courses/1/structure                       │
│ Response: {                                       │
│   id: 1,                                          │
│   title: "주식 투자 기초",                        │
│   instructor: { id, nickname },                   │
│   sections: [                                     │
│     { id: 1, title: "기초 개념", lectures: [...] },│
│     ...                                            │
│   ]                                               │
│ }                                                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. 수강 신청                                          │
│ POST /api/enrollments                             │
│ Request: { courseId: 1 }                          │
│ Response: { id, memberId, courseId, enrolledAt } │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 5. 첫 강의 시청 & 진도 저장                           │
│ POST /api/lecture-progress                        │
│ Request: { lectureId: 1, lastPosition: 300 }     │
│ (재생 위치가 바뀔 때마다 호출)                      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 6. 마이페이지 대시보드                                │
│ GET /api/students/dashboard                       │
│ Response: {                                       │
│   enrollmentSummary: [                           │
│     {                                             │
│       courseId: 1,                               │
│       courseTitle: "주식 투자 기초",               │
│       progressPercent: 6.7%, // 1/15 강의 완료   │
│       completedLectures: 1,                      │
│       totalLectures: 15                          │
│     }                                             │
│   ],                                              │
│   totalEnrollments: 1,                           │
│   completedCourses: 0,                           │
│   thisWeekLearningMinutes: 20                    │
│ }                                                 │
└─────────────────────────────────────────────────────┘
```

### 8.2 진행 중인 학습자 (박민지) - 진도율 확인

```
┌──────────────────────────────────────────────┐
│ 1. 로그인                                     │
└──────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────┐
│ 2. 대시보드에서 수강 강의 확인                 │
│ GET /api/students/dashboard                 │
│ 강의1: 65% (10/15 완료)                     │
│ 강의2: 40% (6/15 완료)                      │
└──────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────┐
│ 3. 강의1의 상세 진도 확인                     │
│ GET /api/enrollments/courses/1/progress     │
│ Response: {                                 │
│   sections: [                               │
│     { sectionId: 1, sectionTitle: "기초",   │
│       lectures: [                           │
│         { lectureId: 1, title: "...",       │
│           lastPosition: 1200, // 완시청     │
│           watchPercent: 100 },              │
│         { lectureId: 2, title: "...",       │
│           lastPosition: 750, // 중도        │
│           watchPercent: 50 }                │
│       ]                                     │
│     }                                       │
│   ]                                         │
│ }                                           │
└──────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────┐
│ 4. 마지막 시청 강의 재개                       │
│ GET /api/lecture-progress/lectures/2       │
│ Response: {                                 │
│   lectureId: 2,                            │
│   lastPosition: 750, // 이 위치부터 재개   │
│   playTime: 1500,                          │
│   watchPercent: 50                         │
│ }                                           │
└──────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────┐
│ 5. 강의 시청 & 진도 갱신                       │
│ POST /api/lecture-progress                 │
│ Request: { lectureId: 2, lastPosition: 1500}│
│ (완시청 처리)                                │
└──────────────────────────────────────────────┘
```

### 8.3 바쁜 직장인 (이준호) - 학습 통계

```
┌──────────────────────────────────────────────┐
│ 1. 로그인                                     │
└──────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────┐
│ 2. 대시보드에서 통계 확인                     │
│ GET /api/students/dashboard                 │
│ {                                           │
│   totalLearningMinutes: 225, // 전체 시간   │
│   thisWeekLearningMinutes: 45, // 이번 주   │
│   completedCourses: 1,  // 완강 수          │
│   ongoingCourses: 2     // 수강 중 수       │
│ }                                           │
│                                             │
│ 목표: 이번 주 2시간은 달성!                │
│ (현재 45분 < 120분)                        │
└──────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────┐
│ 3. 수강 중인 강의 중 진도 가장 많은 것 선택  │
│ 강의1: 80% (다음에 할 강의)                 │
│ 강의2: 30% (나중에)                        │
└──────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────┐
│ 4. 강의1 계속 시청                            │
│ 마지막 시청 강의 ID: 12                     │
│ GET /api/lecture-progress/lectures/12       │
│ lastPosition: 600초부터 재개                │
│                                             │
│ 20분 강의 시청 → POST /api/lecture-progress│
│ (600 + 1200 = 1800초 = 완시청)            │
│                                             │
│ 퇴근 후 20분 학습 완료!                    │
└──────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────┐
│ 5. 다음날 대시보드 재확인                     │
│ thisWeekLearningMinutes: 65분             │
│ (어제 45분 + 오늘 20분)                   │
└──────────────────────────────────────────────┘
```

---

## 9. API 설계 원칙

### 9.1 RESTful 설계

```
자원(Resource) → HTTP 메서드

강의 목록         GET    /api/courses
강의 상세         GET    /api/courses/{courseId}
강의 검색         GET    /api/courses/search?keyword=...
강의 상세+커리큘럼 GET    /api/courses/{courseId}/structure

강의 등록         POST   /api/courses
강의 수정         PUT    /api/courses/{courseId}
강의 삭제         DELETE /api/courses/{courseId}

수강 신청         POST   /api/enrollments
내 수강 목록      GET    /api/enrollments/my
강의 완강         PUT    /api/enrollments/courses/{courseId}/complete

진도 저장         POST   /api/lecture-progress
진도 조회         GET    /api/lecture-progress/lectures/{lectureId}

대시보드          GET    /api/students/dashboard
```

### 9.2 API 응답 포맷 표준화

```java
// 성공 응답 (2xx)
{
  "data": { /* 실제 데이터 */ },
  "message": "요청이 성공했습니다.",
  "timestamp": "2026-04-02T15:30:00"
}

// 에러 응답 (4xx, 5xx)
{
  "data": null,
  "message": "강의를 찾을 수 없습니다.",
  "timestamp": "2026-04-02T15:30:00"
}

// 페이지 응답
{
  "data": {
    "content": [ /* 실제 데이터 배열 */ ],
    "totalElements": 100,
    "totalPages": 10,
    "currentPage": 0,
    "size": 10
  },
  "message": "페이지를 조회했습니다.",
  "timestamp": "2026-04-02T15:30:00"
}
```

### 9.3 HTTP 상태 코드

| 상태 | 의미 | 예시 |
|:---|:---|:---|
| 200 | OK | 강의 목록 조회 성공 |
| 201 | Created | 수강 신청 완료 |
| 400 | Bad Request | 잘못된 요청 (유효성 검사 실패) |
| 401 | Unauthorized | 토큰 없거나 만료됨 |
| 403 | Forbidden | 권한 없음 (다른 사용자 강의 수정 시도) |
| 404 | Not Found | 강의를 찾을 수 없음 |
| 500 | Internal Server Error | 서버 오류 |

### 9.4 API 버전 관리

**선택: Path-based versioning은 현재 사용하지 않음**

```
좋은 예 (현재): /api/courses
나쁜 예: /api/v1/courses (버전이 고정되지 않으면 혼란)
```

P2 이후 필요시 도입할 예정:
- `/api/v2/courses` (기존 API와 호환성 문제 시)

---

## 10. 테스트 전략

### 10.1 테스트 레벨

#### 1️⃣ 단위 테스트 (Unit Test)

```java
@ExtendWith(MockitoExtension.class)
class CourseServiceTest {
    
    @Mock
    private CourseRepository courseRepository;
    
    @InjectMocks
    private CourseService courseService;
    
    @Test
    void testSearchCourses() {
        // Given
        Course mockCourse = Course.builder()
            .id(1L)
            .title("주식 투자 기초")
            .category("STOCK")
            .build();
        
        when(courseRepository.searchByKeywordAndCategory(
            "주식", "STOCK", Pageable.unpaged()
        )).thenReturn(Arrays.asList(mockCourse));
        
        // When
        List<CourseResponse> result = courseService.searchCourses(
            "주식", "STOCK", Pageable.unpaged()
        );
        
        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("주식 투자 기초");
    }
}
```

**대상:** Service, Repository
**도구:** Mockito, AssertJ
**목표:** 비즈니스 로직의 정확성

#### 2️⃣ 통합 테스트 (Integration Test)

```java
@SpringBootTest
@AutoConfigureMockMvc
class CourseIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Test
    void testGetCourseStructure() throws Exception {
        // Given
        Course course = courseRepository.save(
            Course.builder()
                .title("주식 투자 기초")
                .instructor(instructor)
                .build()
        );
        
        // When & Then
        mockMvc.perform(get("/api/courses/{courseId}/structure", course.getId())
            .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.title").value("주식 투자 기초"))
            .andExpect(jsonPath("$.data.sections").isArray());
    }
}
```

**대상:** Controller, Service, Repository, DB
**도구:** MockMvc, Testcontainers (P2)
**목표:** 전체 흐름의 정확성

#### 3️⃣ 시나리오 테스트 (End-to-End Test)

**도구:** Postman, Manual Testing
**대상:** 실제 서버

```
테스트 시나리오:
1. 회원가입 → 로그인
2. 강의 검색
3. 강의 상세 조회
4. 수강 신청
5. 강의 시청 & 진도 저장
6. 대시보드 확인
```

### 10.2 테스트 케이스

#### Phase 1: 강의 검색 API

```
✅ 정상 케이스:
  - 키워드로 강의 검색 성공
  - 카테고리로 필터링 성공
  - 페이지네이션 동작

❌ 예외 케이스:
  - 검색 결과 없음 (빈 배열 반환)
  - 잘못된 카테고리 (빈 배열 또는 에러)
  - 유효하지 않은 페이지 번호
```

#### Phase 2: 강의 상세 조회

```
✅ 정상 케이스:
  - 강의 상세 정보 조회
  - 섹션 & 강의 목록 포함
  - 강사 정보 포함

❌ 예외 케이스:
  - 존재하지 않는 강의 ID (404)
  - 권한 검증 (토큰 없음, 만료됨)
```

#### Phase 3: 진도 추적 API

```
✅ 정상 케이스:
  - 진도 저장
  - 진도 조회
  - 진도 업데이트

❌ 예외 케이스:
  - 수강하지 않은 강의의 진도 저장 시도 (400)
  - 존재하지 않는 강의 (404)
  - 다른 사용자의 진도 조회 시도 (403)
```

#### Phase 4: 대시보드 API

```
✅ 정상 케이스:
  - 수강 강의 목록 조회
  - 진도율 계산 정확성:
    - 강의1: 10/15 = 66.7%
    - 강의2: 5/20 = 25%
  - 학습 통계:
    - 총 학습 시간 계산
    - 이번 주 학습 시간 계산

❌ 예외 케이스:
  - 수강하지 않은 사용자는 빈 배열
  - 잘못된 페이지 번호 (400)
```

### 10.3 Postman 테스트 컬렉션

```json
{
  "info": {
    "name": "ChessMate Student API",
    "description": "학생 중심 MVP API 테스트",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Sign Up",
          "request": {
            "method": "POST",
            "url": "http://localhost:8080/api/auth/signup",
            "body": {
              "email": "student@example.com",
              "password": "...",
              "role": "STUDENT"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "http://localhost:8080/api/auth/login"
          }
        }
      ]
    },
    {
      "name": "Course Search & Discovery",
      "item": [
        {
          "name": "Search Courses",
          "request": {
            "method": "GET",
            "url": "http://localhost:8080/api/courses/search?keyword=주식&category=STOCK&page=0&size=10"
          }
        }
      ]
    }
    // ... 나머지 엔드포인트
  ]
}
```

---

## 11. 성능 최적화 전략

### 11.1 N+1 쿼리 문제 해결

#### 문제 상황

```
Enrollment 조회 (1번)
  ├─ Course 조회 (10번)
  └─ Member 조회 (10번)
  = 총 21번 쿼리 ❌
```

#### 해결 방법: fetch join

```java
@Query("""
    SELECT e FROM Enrollment e
    JOIN FETCH e.course c
    JOIN FETCH c.instructor m
    WHERE e.member.id = :memberId
""")
List<Enrollment> findByMemberWithDetails(Long memberId);
```

#### 다른 해결 방법 (비교)

| 방법 | 장점 | 단점 |
|:---|:---|:---|
| **fetch join** | 한 번의 쿼리 | DISTINCT 처리 필요할 수 있음 |
| **@EntityGraph** | 선택적 로딩 가능 | 복잡한 그래프는 어려움 |
| **배치 사이즈** | 동적 조정 가능 | 여전히 여러 번의 쿼리 |
| **별도 쿼리** | 세밀한 제어 가능 | 코드 복잡도 증가 |

**선택:** fetch join (간단하고 효율적)

### 11.2 페이지네이션

#### 구현

```java
// Controller
@GetMapping("/courses/search")
public ApiResponse<Page<CourseResponse>> searchCourses(
    @RequestParam(defaultValue = "") String keyword,
    @RequestParam(required = false) String category,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size
) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    return ApiResponse.success(
        courseService.searchCourses(keyword, category, pageable)
    );
}
```

#### 이유

- ✅ 큰 데이터셋에서 메모리 효율성
- ✅ 로딩 속도 향상
- ✅ 네트워크 트래픽 감소

### 11.3 캐싱 전략 (P2)

```java
@Cacheable(value = "courses", key = "#id")
public CourseResponse getCourseById(Long id) {
    return courseRepository.findById(id)
        .map(CourseResponse::from)
        .orElseThrow(...);
}

@CacheEvict(value = "courses", key = "#courseId")
public void updateCourse(Long courseId, ...) {
    // 강의 수정 시 캐시 무효화
}
```

**캐싱 대상:**
- ✅ 강의 목록 (자주 조회, 변경 적음)
- ✅ 강사 정보 (변경 거의 없음)
- ❌ 진도율 (실시간 변경)
- ❌ 대시보드 (개인별 데이터)

---

## 12. 보안 고려사항

### 12.1 인증 & 인가

#### JWT 토큰 검증

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        
        try {
            // 1. 헤더에서 토큰 추출
            String token = extractToken(request);
            
            // 2. 토큰 검증
            if (token != null && jwtTokenProvider.validateToken(token)) {
                // 3. 사용자 정보 추출
                Long memberId = jwtTokenProvider.getMemberId(token);
                String role = jwtTokenProvider.getRole(token);
                
                // 4. SecurityContext에 저장
                Authentication auth = new UsernamePasswordAuthenticationToken(
                    memberId, null, getAuthorities(role)
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (JwtException e) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        
        filterChain.doFilter(request, response);
    }
}
```

#### 권한 검증

```java
// 학생만 수강 신청 가능
@PostMapping
@PreAuthorize("hasRole('STUDENT')")
public ApiResponse<EnrollmentResponse> enrollCourse(
    @RequestBody EnrollmentCreateRequest request
) {
    // ...
}

// 강사만 강의 수정 가능
@PutMapping("/{courseId}")
@PreAuthorize("hasRole('TEACHER')")
public ApiResponse<CourseResponse> updateCourse(
    @PathVariable Long courseId,
    @RequestBody CourseUpdateRequest request
) {
    // Service에서 추가 검증: 자신의 강의만 수정 가능
}
```

### 12.2 비밀번호 보안

```java
// 회원가입 시
String encodedPassword = passwordEncoder.encode(request.getPassword());
member.setPassword(encodedPassword);

// 로그인 시
if (!passwordEncoder.matches(request.getPassword(), member.getPassword())) {
    throw new BadCredentialsException("비밀번호가 일치하지 않습니다.");
}
```

**알고리즘:** BCrypt
- 자동 salt 생성
- 의도적으로 느린 해싱 (무차별 대입 공격 방지)
- 강도 조정 가능 (rounds)

### 12.3 입력값 검증

```java
public class CourseSearchRequest {
    @NotBlank(message = "keyword는 필수입니다")
    @Size(min = 1, max = 100, message = "keyword는 1-100자 사이여야 합니다")
    private String keyword;
    
    @Pattern(regexp = "STOCK|CRYPTO", message = "category는 STOCK 또는 CRYPTO여야 합니다")
    private String category;
}
```

### 12.4 CORS 설정

```java
@Configuration
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/courses/**").authenticated()
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

---

## 13. 향후 확장 계획

### P2: 강사 기능 (2주)
- [ ] 강의 등록/수정/삭제 (현재는 구현되어 있지만 테스트 필요)
- [ ] 강사 대시보드 (수강생 수, 수익 통계)
- [ ] 수강생 관리 (수강생 목록, 진도 추적)

### P3: 결제 & 구독 (2주)
- [ ] 결제 시스템 (Stripe/PG)
- [ ] 구독 모델 (월 구독, 기간 제한)
- [ ] 쿠폰 & 할인
- [ ] 매출 통계 & 정산

### P4: 고급 기능 (1주)
- [ ] 리뷰 & 평점 시스템
- [ ] 강의 추천 알고리즘
- [ ] 커뮤니티 (Q&A, 댓글)
- [ ] 실시간 알림 (WebSocket)

### P5: 인프라 & 배포 (1주)
- [ ] Docker 컨테이너화
- [ ] CI/CD 파이프라인 (GitHub Actions)
- [ ] 클라우드 배포 (AWS/GCP)
- [ ] 로깅 & 모니터링 (ELK, Datadog)

---

## 요약

### 핵심 설계 결정

| 항목 | 선택 | 이유 |
|:---|:---|:---|
| **인증 방식** | JWT + Stateless | 마이크로서비스 확장성 |
| **아키텍처** | 계층형 (Layer) | 관심사 분리, 테스트 용이 |
| **데이터 모델** | 정규화 | 데이터 일관성 |
| **N+1 해결** | fetch join | 간단하고 효율적 |
| **예외 처리** | 중앙식 | 일관된 응답 형식 |
| **사용자 중심** | 학생 우선 | MVP 단계에서는 학습 경험 최우선 |

### 기대 효과

✅ **학생 입장에서 완전한 학습 경험**
- 강의 발견부터 진도 추적까지 원스톱

✅ **확장 가능한 아키텍처**
- 강사 기능, 결제, 커뮤니티 등 추가 용이

✅ **안정적이고 테스트 가능**
- 예외 처리, 권한 검증, 데이터 검증 완벽

✅ **좋은 개발 경험**
- 명확한 책임 분리, 일관된 코드 스타일

---

## 문서 관리

- **작성자**: AI Copilot
- **작성일**: 2026-04-02
- **상태**: 🟢 Ready for Implementation
- **참고 문서**:
  - `MVP_STUDENT_FEATURE_SPEC.md` (기능 명세)
  - `IMPLEMENTATION_COMPLETE.md` (기존 구현)
  - `API_SPECIFICATION.md` (API 명세)

---

**이제 이 계획에 따라 Phase 1부터 순차적으로 구현하면 됩니다! 🚀**

