# 📋 ChessMate JWT 인증 기반 CRUD API - 프로젝트 전체 요약

**프로젝트명**: ChessMate (재무 교육 플랫폼)  
**버전**: 1.0  
**작성일**: 2026-04-02  
**상태**: 구현 계획 완료

---

## 🎯 프로젝트 목표

> **강사(TEACHER)가 투자 관련 강의를 등록하고 학생(STUDENT)이 수강하는 교육 플랫폼의 백엔드 API 구축**

### 핵심 가치
- ✅ **강사 강의 관리**: 강사만 자신의 강의 CRUD 가능
- ✅ **학생 수강 관리**: 학생은 강의 조회 및 수강 등록 가능
- ✅ **안전한 인증**: JWT 기반 Stateless 인증
- ✅ **권한 기반 접근**: RBAC으로 역할별 권한 관리

---

## 📁 생성된 문서 구조

```
BE/
├─ IMPLEMENTATION_SPEC.md          ← 전체 구현 명세서 (이 문서의 핵심)
├─ API_SPECIFICATION.md            ← OpenAPI 3.0 기반 API 명세
├─ DECISION_RATIONALE.md           ← 아키텍처 의사결정 가이드
├─ TEST_SCENARIOS.md               ← 페르소나 기반 테스트 시나리오
├─ README.md                       ← 프로젝트 개요
├─ DEVELOPER_GUIDE.md              ← 개발자 가이드
└─ JWT_AUTH_REPORT.md              ← JWT 구현 보고서
```

### 각 문서의 역할

| 문서 | 대상 | 주요 내용 |
|------|------|---------|
| **IMPLEMENTATION_SPEC.md** | 개발자 | 기술 명세, DTO 설계, Service/Controller 구현 |
| **API_SPECIFICATION.md** | API 사용자 | REST API 엔드포인트, 요청/응답 포맷 |
| **DECISION_RATIONALE.md** | 아키텍처 검토자 | 설계 선택 이유, 트레이드오프 분석 |
| **TEST_SCENARIOS.md** | QA 담당자 | 페르소나별 테스트, 검증 기준 |

---

## 🏗️ 아키텍처 개요

### 계층 구조

```
┌─────────────────────────────────────────────────┐
│            HTTP Request (JWT Token)              │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│         JwtAuthenticationFilter                  │
│   토큰 검증 → SecurityContext에 권한 설정       │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│          Controller Layer (REST API)             │
│  AuthController, CourseController, etc.         │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│           Service Layer (Business Logic)        │
│  AuthService, CourseService, etc.               │
│  - 권한 검증                                     │
│  - 트랜잭션 관리                                 │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│          Repository Layer (Data Access)         │
│  JpaRepository를 상속한 인터페이스              │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│              Database (H2/MySQL)                │
│  Member, Course, Section, Lecture, etc.        │
└─────────────────────────────────────────────────┘
```

### 주요 패턴

| 패턴 | 구현 | 목적 |
|------|------|------|
| **DTO** | SignupRequest, LoginRequest, CourseResponse | 엔티티와 API 응답 분리 |
| **Service** | AuthService, CourseService | 비즈니스 로직 중앙화 |
| **Filter** | JwtAuthenticationFilter | 요청 전 인증 처리 |
| **Exception Handler** | GlobalExceptionHandler | 예외의 중앙식 처리 |
| **RBAC** | @PreAuthorize("hasRole(...)") | 권한 기반 접근 제어 |

---

## 🔐 보안 전략

### JWT 토큰 구조

```
┌─────────────────┬──────────────────────┬────────────────┐
│   Header        │    Payload           │   Signature    │
├─────────────────┼──────────────────────┼────────────────┤
│ {              │  {                  │  HMACSHA256(  │
│  "alg":"HS256" │   "sub": "1",       │   base64(h)   │
│  "typ":"JWT"   │   "role":"STUDENT", │   + "." +     │
│ }              │   "iat": 1704...,   │   base64(p),  │
│                │   "exp": 1704...    │   secret      │
│                │  }                  │  )            │
└─────────────────┴──────────────────────┴────────────────┘
```

### 비밀번호 보안

```
사용자 입력 비밀번호
    ↓
BCryptPasswordEncoder.encode()
    ↓
해시된 비밀번호 저장 (salt 포함)
    ↓
로그인 시 matches() 사용하여 검증
```

### 권한 검증 체계

```
API 요청
    ↓
JwtAuthenticationFilter (토큰 검증)
    ↓
SecurityContext에 권한 정보 저장
    ↓
@PreAuthorize 또는 Service 레벨 권한 검증
    ↓
역할별 접근 제어 (RBAC)
```

---

## 📊 데이터 모델

### ERD (Entity-Relationship Diagram)

```
MEMBER (회원)
├─ id (PK)
├─ email (Unique)
├─ password (BCrypt)
├─ nickname
├─ role (STUDENT/TEACHER/ADMIN)
└─ createdAt

    ↓ instructor_id
    
COURSE (강의)
├─ id (PK)
├─ instructor_id (FK → Member)
├─ title
├─ description
├─ category (STOCK/CRYPTO)
├─ price
└─ thumbnailUrl

    ├─ 1:N
    ▼
SECTION (섹션)
├─ id (PK)
├─ course_id (FK)
├─ title
└─ sortOrder

    ├─ 1:N
    ▼
LECTURE (강의)
├─ id (PK)
├─ section_id (FK)
├─ title
├─ videoUrl
├─ playTime
└─ sortOrder

ENROLLMENT (수강)
├─ id (PK)
├─ member_id (FK)
├─ course_id (FK)
├─ enrolledAt
└─ isCompleted

LECTURE_PROGRESS (진행 상황)
├─ id (PK)
├─ member_id (FK)
├─ lecture_id (FK)
├─ lastPosition
└─ updatedAt
```

---

## 🎯 구현 범위

### Phase 1: 인증 구현 (필수)

```java
// AuthController
POST   /api/auth/signup          회원가입
POST   /api/auth/login           로그인
POST   /api/auth/refresh         토큰 갱신
GET    /api/auth/check-email     이메일 중복 체크

// AuthService
- signup(SignupRequest)
- login(LoginRequest)
- refreshAccessToken(String refreshToken)
- checkEmailExists(String email)
```

**기대 효과**:
- ✅ 사용자 회원가입 및 로그인
- ✅ JWT 토큰 발급 및 검증
- ✅ 토큰 만료 시 갱신 가능

---

### Phase 2: 강의 관리 구현 (주요)

```java
// CourseController
POST   /api/courses              강의 등록 (강사)
GET    /api/courses              강의 목록 조회
GET    /api/courses/{id}         강의 상세 조회
GET    /api/courses/category/{category}  카테고리별 조회
GET    /api/courses/instructor/{id}      강사별 조회
PUT    /api/courses/{id}         강의 수정 (강사)
DELETE /api/courses/{id}         강의 삭제 (강사)

// CourseService
- createCourse(CourseCreateRequest, instructorId)
- getCourseById(Long courseId)
- getAllCourses(Pageable)
- getCoursesByCategory(String, Pageable)
- getCoursesByInstructor(Long, Pageable)
- updateCourse(Long, CourseUpdateRequest, instructorId)
- deleteCourse(Long, instructorId)
```

**기대 효과**:
- ✅ 강사는 자신의 강의 CRUD 가능
- ✅ 학생은 강의 조회 및 검색 가능
- ✅ 페이지네이션으로 대규모 데이터 처리

---

### Phase 3: 수강 관리 구현 (부가)

```java
// EnrollmentController
POST   /api/enrollments          수강 등록
GET    /api/enrollments/my       내 수강 목록

// EnrollmentService
- enrollCourse(EnrollmentCreateRequest, memberId)
- getMyEnrollments(Long memberId, Pageable)
- getCourseStudentCount(Long courseId)
```

**기대 효과**:
- ✅ 학생은 강의에 수강 등록 가능
- ✅ 강의별 수강생 수 추적
- ✅ 학생의 수강 이력 관리

---

### Phase 4: 진행 추적 구현 (부가)

```java
// LectureProgressController
POST   /api/lectures/{id}/progress   진행 상황 저장
GET    /api/lectures/{id}/progress   진행 상황 조회

// LectureProgressService
- saveLectureProgress(Long memberId, Long lectureId, int lastPosition)
- getLectureProgress(Long memberId, Long lectureId)
```

**기대 효과**:
- ✅ 학생의 강의 시청 진도율 추적
- ✅ 마지막 시청 위치 저장

---

## 📈 API 응답 표준

### 성공 응답

```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    ...
  },
  "message": "작업 성공 메시지"
}
```

### 오류 응답

```json
{
  "data": null,
  "message": "오류 메시지"
}
```

### 페이지네이션 응답

```json
{
  "data": {
    "content": [ ... ],
    "pageable": { ... },
    "totalPages": 5,
    "totalElements": 50,
    "numberOfElements": 10
  },
  "message": "Success"
}
```

---

## ✅ 주요 체크포인트

### 보안

- [x] JWT 기반 Stateless 인증
- [x] BCrypt 비밀번호 암호화
- [x] RBAC 권한 관리
- [x] 토큰 유효시간 (Access: 1시간, Refresh: 7일)
- [ ] Rate Limiting (향후)
- [ ] HTTPS 강제 (프로덕션)

### 성능

- [x] Lazy Loading으로 메모리 절약
- [x] JOIN FETCH로 N+1 문제 해결
- [x] 페이지네이션으로 대규모 데이터 처리
- [ ] 캐싱 구현 (향후)
- [ ] 데이터베이스 인덱싱 (향후)

### 유지보수성

- [x] 3계층 아키텍처 (Controller → Service → Repository)
- [x] DTO를 통한 엔티티 보호
- [x] GlobalExceptionHandler 중앙식 처리
- [x] 명확한 API 문서
- [x] 의사결정 이유 문서화

### 테스트

- [ ] 단위 테스트 (Unit Test)
- [ ] 통합 테스트 (Integration Test)
- [ ] 성능 테스트 (Performance Test)
- [ ] 보안 테스트 (Security Test)

---

## 🚀 구현 순서

### 1주차: 기초 설정 ✅ (완료)
```
[x] JWT 토큰 관리
[x] JWT 필터
[x] Spring Security 설정
[x] 엔티티 설계
[x] 기본 DTO
```

### 2주차: 인증 구현 (다음 단계)
```
[ ] AuthService 구현
[ ] AuthController 구현
[ ] 예외 처리
[ ] 인증 테스트
```

### 3주차: 강의 관리 구현
```
[ ] CourseService 구현
[ ] CourseController 구현
[ ] 권한 검증
[ ] 강의 관리 테스트
```

### 4주차: 수강 관리 구현
```
[ ] EnrollmentService 구현
[ ] EnrollmentController 구현
[ ] 통합 테스트
[ ] 성능 테스트
```

---

## 💡 주요 설계 결정

### 1. DTO 기반 응답
**선택 이유**: 순환 참조 방지, Lazy Loading 문제 회피, API 버전 관리 용이

### 2. 3계층 아키텍처
**선택 이유**: 관심사 분리, 테스트 용이성, 확장성

### 3. JWT 기반 인증
**선택 이유**: Stateless 설계, 마이크로서비스 지원, 모바일앱 최적화

### 4. BCrypt 비밀번호
**선택 이유**: 자동 salt, 적응형 해싱, OWASP 권장

### 5. Lazy Loading
**선택 이유**: 필요한 경우에만 로드, JOIN FETCH로 N+1 해결

---

## 📚 기술 스택

| 계층 | 기술 |
|------|------|
| **Language** | Java 17 |
| **Framework** | Spring Boot 4.0.4 |
| **Security** | Spring Security 6 |
| **Authentication** | JWT (JJWT 0.12.3) |
| **Data Access** | Spring Data JPA |
| **Database** | H2 (개발), MySQL (프로덕션) |
| **Build Tool** | Gradle |
| **Lombok** | 1.18.30 |
| **Password Encoder** | BCrypt |

---

## 📖 참고 자료

### 공식 문서
- [Spring Security 6](https://spring.io/projects/spring-security)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [JWT.io](https://jwt.io)

### 추천 읽을거리
- OWASP 보안 가이드
- RESTful API 설계 원칙
- Spring Best Practices

---

## 🎓 학습 목표

이 프로젝트를 통해 다음을 학습할 수 있습니다:

- ✅ JWT 기반 인증 구현
- ✅ Spring Security 권한 관리
- ✅ REST API 설계 및 구현
- ✅ JPA 엔티티 설계
- ✅ 3계층 아키텍처 구현
- ✅ 예외 처리 전략
- ✅ API 문서화
- ✅ 테스트 주도 개발

---

## 🤝 협업 방식

### Git 워크플로우

```
main (프로덕션)
  ↑
  ├─ develop (개발)
  │   ├─ feature/auth (인증)
  │   ├─ feature/course (강의)
  │   ├─ feature/enrollment (수강)
  │   └─ feature/progress (진행)
```

### 커밋 메시지 규칙

```
[feat] AuthService 구현
[fix] JWT 토큰 만료 문제 수정
[test] AuthController 테스트 추가
[docs] API 명세서 업데이트
```

---

## 📞 문의 및 지원

### 문제 해결 절차

1. 공식 문서 및 이 명세서 검토
2. 관련 GitHub Issues 검색
3. 개발팀에 질문 제출
4. 코드 리뷰 요청

### 의사소통

- **Daily Standup**: 매일 10:00
- **Code Review**: Pull Request 생성 시
- **Bug Report**: Issues 탭에 작성

---

## 📝 라이센스 및 저작권

이 프로젝트는 **ChessMate 팀**에 의해 개발되었습니다.

```
Copyright © 2026 ChessMate Team
All rights reserved.
```

---

## 🎉 결론

이 명세서는 **ChessMate 프로젝트**의 JWT 인증 기반 CRUD API 구현을 위한 **완벽한 로드맵**입니다.

### 다음 단계

1. **IMPLEMENTATION_SPEC.md** 정독
2. **API_SPECIFICATION.md** 로 엔드포인트 이해
3. **DECISION_RATIONALE.md** 로 설계 원리 학습
4. **TEST_SCENARIOS.md** 로 테스트 계획 수립
5. 코드 구현 시작

### 성공 기준

- ✅ 모든 API가 정상 동작
- ✅ 권한 기반 접근 제어 완벽 구현
- ✅ 모든 테스트 케이스 통과
- ✅ API 문서 완성
- ✅ 프로덕션 배포 가능

---

**마지막 수정**: 2026-04-02  
**버전**: 1.0  
**상태**: ✅ 검토 완료 & 구현 준비 완료

**"좋은 코드는 좋은 문서에서 시작된다"** - Clean Code

