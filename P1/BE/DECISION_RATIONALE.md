# 🎯 ChessMate API 설계 의사결정 가이드

**버전**: 1.0  
**작성일**: 2026-04-02

---

## 목차

1. [설계 철학](#설계-철학)
2. [아키텍처 선택](#아키텍처-선택)
3. [보안 결정사항](#보안-결정사항)
4. [API 설계 결정사항](#api-설계-결정사항)
5. [데이터베이스 설계 결정사항](#데이터베이스-설계-결정사항)
6. [프레임워크 선택](#프레임워크-선택)
7. [트레이드오프 분석](#트레이드오프-분석)

---

## 설계 철학

### 1️⃣ **DTO 기반 응답 구조**

#### 결정사항
> **엔티티 직접 반환 금지, 항상 DTO를 통해 변환하여 응답**

#### 선택 이유

| 이유 | 설명 |
|------|------|
| **순환 참조 방지** | Member ↔ Course ↔ Enrollment 순환 참조 발생 가능성 제거 |
| **Lazy Loading 문제 회피** | `@ManyToOne` 관계에서 지연 로딩 시 직렬화 오류 방지 |
| **API 계약 보호** | 프론트엔드와의 계약을 엔티티 변경과 독립적으로 유지 |
| **보안** | 민감한 정보 (비밀번호, 내부 ID) 응답에서 제외 |
| **버전 관리** | API 응답 형식을 엔티티와 별개로 버전 관리 가능 |
| **테스트 용이성** | DTO를 Mock하여 단위 테스트 작성 용이 |

#### 예시

**❌ 나쁜 방식 (순환 참조 발생)**:
```java
// Controller
@GetMapping("/courses/{id}")
public Course getCourse(@PathVariable Long id) {
    return courseRepository.findById(id).orElse(null);
}
```

```json
// 순환 참조로 인한 오류
{
  "id": 1,
  "title": "주식 투자",
  "instructor": {
    "id": 1,
    "email": "teacher@example.com",
    "instructorCourses": [
      {
        "id": 1,
        "title": "주식 투자",
        "instructor": { ... 무한 루프 }
      }
    ]
  }
}
```

**✅ 좋은 방식 (DTO 사용)**:
```java
// Controller
@GetMapping("/courses/{id}")
public ResponseEntity<ApiResponse<CourseResponse>> getCourse(@PathVariable Long id) {
    Course course = courseRepository.findById(id).orElse(null);
    return ResponseEntity.ok(ApiResponse.success(CourseResponse.from(course)));
}
```

```json
// 안전한 응답
{
  "data": {
    "id": 1,
    "title": "주식 투자",
    "instructor": {
      "id": 1,
      "email": "teacher@example.com",
      "nickname": "Teacher",
      "role": "TEACHER"
    }
  },
  "message": "Success"
}
```

---

### 2️⃣ **3계층 아키텍처 (Layered Architecture)**

#### 결정사항
> **Controller → Service → Repository 계층으로 명확하게 분리**

#### 선택 이유

```
┌─────────────────────────────────────────┐
│         Controller Layer                 │
│   요청 검증, 응답 변환, 예외 처리        │
│                                         │
├─────────────────────────────────────────┤
│         Service Layer                    │
│   비즈니스 로직, 권한 검증, 트랜잭션    │
│                                         │
├─────────────────────────────────────────┤
│      Repository Layer                    │
│   데이터베이스 접근, 쿼리 실행           │
└─────────────────────────────────────────┘
```

| 계층 | 책임 | 예시 |
|------|------|------|
| **Controller** | HTTP 요청/응답 처리 | 유효성 검증, 예외 처리 |
| **Service** | 비즈니스 로직 구현 | 권한 검증, 도메인 규칙 적용 |
| **Repository** | 데이터 접근 | SQL 쿼리 실행 |

#### 장점

✅ **유지보수성**: 각 계층의 책임이 명확하여 유지보수 용이  
✅ **테스트 용이성**: 각 계층을 독립적으로 테스트 가능  
✅ **확장성**: 새로운 기능 추가 시 기존 코드 영향 최소화  
✅ **재사용성**: Service를 다양한 Controller에서 사용 가능

---

## 보안 결정사항

### 1️⃣ **JWT (JSON Web Token) 선택 이유**

#### 결정사항
> **Session 기반 인증 대신 JWT 기반 Stateless 인증 사용**

#### 선택 이유

| 기준 | JWT | Session |
|------|-----|--------|
| **상태 관리** | Stateless (서버가 상태 저장 안 함) | Stateful (서버가 상태 저장) |
| **확장성** | ⭐⭐⭐⭐⭐ 매우 우수 | ⭐⭐ 제한적 |
| **마이크로서비스** | ⭐⭐⭐⭐⭐ 적합 | ⭐⭐ 부적합 |
| **모바일앱** | ⭐⭐⭐⭐⭐ 최적 | ⭐⭐ 부적합 |
| **성능** | ⭐⭐⭐⭐ 빠름 | ⭐⭐⭐ 중간 |
| **메모리** | ⭐⭐⭐⭐⭐ 절약 | ⭐⭐ 많이 사용 |

#### JWT 토큰 구조

```
Header.Payload.Signature

Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "sub": "1",              // Member ID
  "role": "STUDENT",       // Role
  "iat": 1704067200,      // Issued At
  "exp": 1704070800       // Expiration Time
}

Signature:
HMACSHA256(base64(header) + "." + base64(payload), secret-key)
```

#### 보안 고려사항

```java
// ✅ 좋은 예: 짧은 유효시간 + Refresh Token
JWT {
  accessToken: "expires in 1 hour",      // 짧은 유효시간 → 탈취 피해 최소화
  refreshToken: "expires in 7 days"      // 긴 유효시간 → 사용자 편의성
}

// ❌ 나쁜 예: 긴 유효시간
JWT {
  accessToken: "expires in 30 days"      // 탈취 시 장시간 피해
}
```

---

### 2️⃣ **BCrypt 비밀번호 암호화**

#### 결정사항
> **평문 비밀번호 저장 금지, BCryptPasswordEncoder로 해싱**

#### 선택 이유

```java
// ❌ 절대 금지: 평문 저장
password = "MyPassword123"

// ❌ 위험: MD5 또는 SHA-256 (salt 없음)
password = SHA256("MyPassword123") = "a1b2c3d4..."  // 레인보우 테이블 공격 취약

// ✅ 권장: BCrypt (salt 포함)
password = BCrypt("MyPassword123") 
         = "$2a$10$N9qo8uLOickgx2ZMRZoMye...." // 매번 다름 (salt 때문)
```

#### BCrypt의 장점

| 특징 | 설명 |
|------|------|
| **자동 Salt 추가** | 무작위 salt를 자동으로 추가하여 레인보우 테이블 공격 방지 |
| **Adaptive Hash** | 컴퓨터 성능 향상에 따라 반복 횟수 조정 가능 |
| **느린 해싱** | 의도적으로 느려서 브루트포스 공격 어렵게 함 |
| **표준화** | OWASP에서 권장하는 업계 표준 |

---

### 3️⃣ **권한 기반 접근 제어 (RBAC)**

#### 결정사항
> **STUDENT, TEACHER, ADMIN 3가지 역할로 권한 관리**

#### 역할별 권한

```java
// ✅ 권한 분리 기준

// STUDENT (학생)
- 강의 조회: O
- 강의 등록: X
- 수강 등록: O
- 강의 수정/삭제: X

// TEACHER (강사)
- 강의 조회: O
- 강의 등록: O (자신의 강의)
- 강의 수정/삭제: O (자신의 강의만)
- 다른 강사 강의 수정: X

// ADMIN (관리자)
- 모든 기능: O
- 사용자 관리, 통계 조회 등

// 구현 방식

@PreAuthorize("hasRole('TEACHER')")  // 메서드 레벨
public ResponseEntity createCourse(...) { ... }

@PreAuthorize("hasRole('STUDENT')")
public ResponseEntity enrollCourse(...) { ... }
```

---

## API 설계 결정사항

### 1️⃣ **RESTful API 설계**

#### 결정사항
> **HTTP 메서드와 상태 코드를 표준에 따라 사용**

#### HTTP 메서드와 의미

| 메서드 | 목적 | 예시 |
|--------|------|------|
| **GET** | 조회 (부작용 없음) | `GET /courses` (모든 강의 조회) |
| **POST** | 생성 | `POST /courses` (강의 생성) |
| **PUT** | 전체 수정 (전체 필드 필요) | `PUT /courses/1` (강의 전체 수정) |
| **PATCH** | 부분 수정 (특정 필드만) | `PATCH /courses/1` (강의 일부 필드만 수정) |
| **DELETE** | 삭제 | `DELETE /courses/1` (강의 삭제) |

#### HTTP 상태 코드 사용

```javascript
// 성공 응답
200 OK              // GET, PUT, DELETE 성공
201 Created         // POST 성공 (새 리소스 생성)

// 클라이언트 오류
400 Bad Request     // 입력값 검증 실패
401 Unauthorized    // 인증 실패 (로그인 필요)
403 Forbidden       // 권한 부족 (강사 아님)
404 Not Found       // 리소스 없음

// 서버 오류
500 Internal Server Error  // 예상하지 못한 오류
```

#### URL 설계 원칙

```
// ✅ 좋은 설계
GET    /courses              // 모든 강의 조회
GET    /courses/1            // 특정 강의 조회
POST   /courses              // 강의 생성
PUT    /courses/1            // 강의 수정
DELETE /courses/1            // 강의 삭제

GET    /courses/category/STOCK       // 카테고리별 조회
GET    /courses/instructor/1         // 강사별 조회

GET    /enrollments/my               // 내 수강 목록

// ❌ 나쁜 설계
GET    /getCourse?id=1               // HTTP 메서드 무시
POST   /courses/update/1             // 동사 사용
GET    /courses/delete/1             // GET으로 삭제
GET    /get_all_courses              // 스네이크 케이스
```

---

### 2️⃣ **표준화된 응답 형식**

#### 결정사항
> **모든 API 응답을 `ApiResponse<T>` 래퍼로 감싸기**

#### 응답 형식

```java
@Data
public class ApiResponse<T> {
    private T data;           // 실제 데이터
    private String message;   // 사용자 메시지
}
```

#### 예시

```json
// ✅ 성공 응답
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "UserName",
    "role": "STUDENT"
  },
  "message": "회원가입이 완료되었습니다"
}

// ✅ 실패 응답
{
  "data": null,
  "message": "이미 사용 중인 이메일입니다"
}

// ✅ 리스트 응답
{
  "data": [
    { "id": 1, "title": "강의1" },
    { "id": 2, "title": "강의2" }
  ],
  "message": "Success"
}

// ✅ 페이지네이션 응답
{
  "data": {
    "content": [ ... ],
    "pageable": { ... },
    "totalPages": 5,
    "totalElements": 50
  },
  "message": "Success"
}
```

#### 선택 이유

| 이유 | 설명 |
|------|------|
| **일관성** | 모든 응답 형식이 동일하여 프론트엔드 처리 용이 |
| **메타데이터** | 데이터와 함께 메시지를 전달하여 사용자 경험 향상 |
| **확장성** | 향후 `code`, `timestamp` 등 필드 추가 가능 |
| **에러 처리** | 정상 응답과 오류 응답 형식을 통일 |

---

### 3️⃣ **페이지네이션 지원**

#### 결정사항
> **Spring Data의 `Pageable` 인터페이스 사용**

#### 구현

```java
// URL 예시
GET /courses?page=0&size=10&sort=id,desc

// Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    Page<Course> findAll(Pageable pageable);
    Page<Course> findByCategory(String category, Pageable pageable);
}

// Controller
@GetMapping
public ResponseEntity<ApiResponse<Page<CourseResponse>>> getAllCourses(
        @ParameterObject Pageable pageable) {  // Springdoc-OpenAPI
    Page<Course> courses = courseService.getAllCourses(pageable);
    return ResponseEntity.ok(ApiResponse.success(courses.map(CourseResponse::from)));
}
```

#### 쿼리 파라미터

| 파라미터 | 설명 | 예시 |
|---------|------|------|
| `page` | 페이지 번호 (0부터 시작) | `page=0` (첫 페이지) |
| `size` | 페이지당 항목 수 | `size=10` (10개 항목) |
| `sort` | 정렬 기준 | `sort=id,desc` (id 내림차순) |

#### 선택 이유

✅ **성능**: 대규모 데이터셋을 페이지 단위로 조회하여 메모리 절약  
✅ **표준**: Spring Data의 표준 기능으로 개발 시간 단축  
✅ **유연성**: 정렬 순서 동적 변경 가능

---

## 데이터베이스 설계 결정사항

### 1️⃣ **FK (Foreign Key) 및 관계 설정**

#### 결정사항
> **Course 엔티티에 `instructor_id` (FK) 추가**

#### 이유

```sql
-- ❌ 나쁜 설계 (강사 정보를 저장하지 않음)
CREATE TABLE course (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(20),
    price INT,
    thumbnail_url VARCHAR(255)
    -- instructor 정보 없음!
);

-- ✅ 좋은 설계 (강사 정보를 저장)
CREATE TABLE course (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(20),
    price INT,
    thumbnail_url VARCHAR(255),
    instructor_id BIGINT NOT NULL,
    FOREIGN KEY (instructor_id) REFERENCES member(id)
);
```

#### 목적

1. **강의 상세 페이지에서 강사명 표시**: 강사 ID로부터 Member 정보 조회
2. **강사 권한 검증**: 강의 수정/삭제 시 소유권 확인
3. **정산 기능**: P3 결제 단계에서 판매 수익을 강사에게 정산

#### 쿼리 예시

```java
// 강의와 강사 정보를 함께 조회
@Query("SELECT c FROM Course c JOIN FETCH c.instructor WHERE c.id = :id")
Optional<Course> findByIdWithInstructor(@Param("id") Long id);

// 특정 강사의 강의 목록
@Query("SELECT c FROM Course c WHERE c.instructor.id = :instructorId")
List<Course> findByInstructorId(@Param("instructorId") Long instructorId);
```

---

### 2️⃣ **JOIN FETCH vs N+1 쿼리 문제**

#### 문제 상황

```java
// ❌ N+1 쿼리 문제
List<Course> courses = courseRepository.findAll();

// SQL 쿼리
SELECT * FROM course;                    // 1번 쿼리

// 루프에서 강사 정보 접근
for (Course course : courses) {
    Member instructor = course.getInstructor();  // N번 쿼리 추가
    // SELECT * FROM member WHERE id = ?
}
// 총 N+1번 쿼리 실행
```

#### 해결 방법: JOIN FETCH

```java
// ✅ 해결: JOIN FETCH로 한 번에 조회
@Query("SELECT c FROM Course c JOIN FETCH c.instructor")
List<Course> findAllWithInstructor();

// SQL 쿼리
SELECT c.*, m.* FROM course c
INNER JOIN member m ON c.instructor_id = m.id;
// 1번의 쿼리로 모든 데이터 조회
```

---

## 프레임워크 선택

### 1️⃣ **Spring Boot 선택 이유**

| 기준 | Spring Boot | 기타 |
|------|-----------|------|
| **설정의 용이성** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **생태계** | ⭐⭐⭐⭐⭐ 매우 풍부 | ⭐⭐⭐ |
| **커뮤니티** | ⭐⭐⭐⭐⭐ 매우 활발 | ⭐⭐⭐ |
| **문서화** | ⭐⭐⭐⭐⭐ 매우 충실 | ⭐⭐⭐ |
| **성능** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

### 2️⃣ **Lombok 사용 이유**

```java
// ❌ Lombok 없이
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {
    // getter, setter, equals, hashCode, toString 등 자동 생성
}

// ✅ Lombok 사용으로 간단해짐
@Getter
@Setter
public class Member {
    private Long id;
    private String email;
    // 자동으로 getter, setter 생성
}
```

#### 선택 이유

✅ **보일러플레이트 코드 감소**: getter, setter, equals, hashCode, toString 자동 생성  
✅ **가독성 향상**: 코드 양 감소로 더 핵심적인 로직에 집중  
✅ **유지보수성**: 필드 추가 시 자동으로 getter/setter 생성

---

## 트레이드오프 분석

### 1️⃣ **Access Token 유효시간: 짧음 vs 긺**

#### 짧음 (1시간) vs 긺 (1일)

| 구분 | 짧음 (1시간) | 긺 (1일) |
|------|-----------|---------|
| **보안** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **사용자 편의** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **서버 부하** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **토큰 갱신 요청** | 많음 | 적음 |

#### 결정: **1시간 (짧음)**

**이유**:
- 보안이 가장 중요한 요소
- Refresh Token으로 사용자 편의성 보장
- 토큰 탈취 시 피해 최소화

```java
jwt:
  access-token-expiration: 3600000    # 1시간
  refresh-token-expiration: 604800000 # 7일
```

---

### 2️⃣ **Eager Loading vs Lazy Loading**

#### 비교

```java
// ❌ Eager Loading - 문제 발생 가능
@Entity
public class Course {
    @ManyToOne(fetch = FetchType.EAGER)  // 항상 로드
    private Member instructor;
}

// 쿼리
SELECT c.*, m.* FROM course c
LEFT JOIN member m ON c.instructor_id = m.id;

// 문제: 불필요한 경우에도 항상 JOIN

// ✅ Lazy Loading - 필요할 때만 로드
@Entity
public class Course {
    @ManyToOne(fetch = FetchType.LAZY)   // 필요할 때 로드
    private Member instructor;
}

// 기본 쿼리
SELECT * FROM course;

// instructor 접근 시에만
SELECT * FROM member WHERE id = ?;
```

#### 결정: **Lazy Loading (LAZY)**

**이유**:
- 필요한 경우에만 로드하여 성능 최적화
- N+1 문제는 JOIN FETCH로 해결
- 더 유연한 쿼리 작성 가능

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "instructor_id", nullable = false)
private Member instructor;
```

---

### 3️⃣ **DTO vs Entity 직접 반환**

#### 비교

| 기준 | DTO 사용 | Entity 직접 반환 |
|------|---------|-----------------|
| **순환 참조** | 안전 | 위험 |
| **지연 로딩 문제** | 없음 | 있음 |
| **보안** | 우수 | 취약 |
| **개발 시간** | 더 걸림 | 빠름 |
| **유지보수** | 쉬움 | 어려움 |
| **API 버전 관리** | 가능 | 어려움 |

#### 결정: **DTO 필수 사용**

**이유**:
- 엔티티를 직접 노출하면 실전에서 문제 발생
- 프론트엔드와의 계약을 안정적으로 유지

---

## 구현 우선순위

### Phase 1 (필수)
- [ ] AuthService 및 AuthController (회원가입, 로그인)
- [ ] 기본 예외 처리
- [ ] 토큰 검증 필터 테스트

### Phase 2 (주요)
- [ ] CourseService 및 CourseController
- [ ] 권한 기반 접근 제어 (RBAC)
- [ ] 강사별 강의 관리

### Phase 3 (부가)
- [ ] EnrollmentService (수강 등록)
- [ ] LectureProgressService (진행 추적)
- [ ] Admin 기능

### Phase 4 (선택)
- [ ] Refresh Token Rotation
- [ ] 비밀번호 재설정
- [ ] 이메일 인증
- [ ] 로그인 시도 제한

---

## 결론

본 문서에서 제시된 모든 결정사항은 다음 원칙을 바탕으로 합니다:

1. **보안 우선**: JWT + BCrypt + RBAC
2. **유지보수성**: 3계층 아키텍처 + DTO 분리
3. **확장성**: RESTful API + 페이지네이션
4. **사용자 경험**: 표준화된 응답 + 명확한 오류 메시지

이 원칙들을 따르면 **안전하고, 유지보수하기 쉽고, 확장 가능한** 백엔드를 구축할 수 있습니다.

---

**문의사항**: 의사결정에 대해 더 알고 싶으신 부분이 있으면 문의하세요.

