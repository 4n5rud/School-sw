# 🎯 P1 구현 계획 및 기능 명세서 (학생 중심)

**마지막 업데이트**: 2026-04-05  
**목표**: MVP 단계에서 학생이 강의를 조회하고 수강하는 핵심 기능 구현

---

## 📋 최우선 구현 순서 (체크리스트)

### Phase 1: 인증 & 기본 조회 (✅ 완료)
- [x] Member 엔티티 및 기본 Repository
- [x] AuthService (회원가입, 로그인, 토큰)
- [x] AuthController (signup, login, refresh, check-email)
- [x] JWT 기반 보안 설정

### Phase 2: 강의 조회 기능 (🔄 진행 중)
- [ ] Course 엔티티에 instructor_id FK 추가
- [ ] CourseService 강의 조회 로직 (전체, 상세, 카테고리별, 강사별)
- [ ] CourseController 강의 조회 API

### Phase 3: 수강 관리 기능 (⏳ 다음)
- [ ] Enrollment 엔티티 및 Repository
- [ ] EnrollmentService (수강 등록, 목록 조회, 완강 처리)
- [ ] EnrollmentController (POST, GET /enrollments/my)

### Phase 4: 강의 시청 진행 추적 (⏳ 다음)
- [ ] LectureProgress 엔티티 및 Repository
- [ ] LectureProgressService (진행 상황 저장, 조회)
- [ ] LectureProgressController (POST /lectures/{lectureId}/progress)

### Phase 5: 예외 처리 및 최적화 (⏳ 최종)
- [ ] GlobalExceptionHandler 보강
- [ ] N+1 쿼리 최적화 (fetch join)
- [ ] 입력값 검증 강화
- [ ] API 테스트 (Postman)

---

## 🔧 Phase 2: 강의 조회 기능 상세 명세

### 2.1 Database Schema 변경

**Course 테이블 수정 사항**:
```sql
ALTER TABLE course ADD COLUMN instructor_id BIGINT NOT NULL;
ALTER TABLE course ADD CONSTRAINT fk_course_instructor 
  FOREIGN KEY (instructor_id) REFERENCES member(id);
```

### 2.2 Course Entity 수정

**변경 사항**:
- `instructor_id` 필드 추가
- `@ManyToOne` 관계로 `Member` 엔티티 연관
- `studentCount` 필드 추가 (transient)

**수정 이유**:
1. 강의를 작성한 강사 정보를 DB에서 직접 조회 (성능)
2. 강사 권한 검증 시 ID 비교로 빠른 확인
3. P3 단계에서 강사 수익 정산에 필요

### 2.3 CourseService 메서드

```
1. findAllCourses(Pageable pageable)
   - 모든 강의 조회 (페이지네이션)
   - fetch join으로 instructor 정보 미리 로드
   - 각 강의의 학생 수 계산

2. findCourseById(Long courseId)
   - 특정 강의 상세 정보
   - 강사 정보 포함
   - 존재하지 않으면 EntityNotFoundException

3. findCoursesByCategory(String category, Pageable pageable)
   - 카테고리별 강의 조회
   - STOCK 또는 CRYPTO

4. findCoursesByInstructor(Long instructorId, Pageable pageable)
   - 특정 강사의 강의 목록
   - 강사 ID로 필터링
```

### 2.4 CourseController 엔드포인트

| Method | Endpoint | 설명 | 인증 | 응답 |
|--------|----------|------|------|------|
| GET | /api/courses | 전체 강의 조회 | 불필요 | Page<CourseResponse> |
| GET | /api/courses/{courseId} | 강의 상세 조회 | 불필요 | CourseResponse |
| GET | /api/courses/category/{category} | 카테고리별 조회 | 불필요 | Page<CourseResponse> |
| GET | /api/courses/instructor/{instructorId} | 강사별 조회 | 불필요 | Page<CourseResponse> |

---

## 🎓 Phase 3: 수강 관리 기능 상세 명세

### 3.1 Enrollment Entity

```java
@Entity
@Table(name = "enrollment")
public class Enrollment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime enrolledAt;
    
    @Column(nullable = false)
    private boolean isCompleted = false;
}
```

### 3.2 EnrollmentService 메서드

```
1. enrollCourse(Long memberId, Long courseId)
   - 학생이 강의에 수강 등록
   - 중복 등록 방지
   - 반환: EnrollmentResponse

2. getMyEnrollments(Long memberId, Pageable pageable)
   - 로그인한 학생의 수강 목록
   - 강의 정보 포함 (fetch join)
   - 반환: Page<EnrollmentResponse>

3. markAsCompleted(Long memberId, Long enrollmentId)
   - 수강 완료 처리
   - 사용자 검증 필수
   - 반환: EnrollmentResponse

4. isEnrolled(Long memberId, Long courseId)
   - 수강 여부 확인
   - 강의 상세 조회 시 사용
```

### 3.3 EnrollmentController 엔드포인트

| Method | Endpoint | 설명 | 인증 | 응답 |
|--------|----------|------|------|------|
| POST | /api/enrollments | 수강 등록 | 필수 | EnrollmentResponse |
| GET | /api/enrollments/my | 내 수강 목록 | 필수 | Page<EnrollmentResponse> |
| PUT | /api/enrollments/{enrollmentId}/complete | 완강 처리 | 필수 | EnrollmentResponse |
| GET | /api/enrollments/{enrollmentId} | 수강 상세 조회 | 필수 | EnrollmentResponse |

---

## 📊 Phase 4: 강의 시청 진행 추적 상세 명세

### 4.1 LectureProgress Entity

```java
@Entity
@Table(name = "lecture_progress")
public class LectureProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecture_id")
    private Lecture lecture;
    
    @Column(nullable = false)
    private Integer lastPosition = 0; // 초 단위
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
```

### 4.2 LectureProgressService 메서드

```
1. saveProgress(Long memberId, Long lectureId, Integer lastPosition)
   - 강의 시청 위치 저장
   - 없으면 생성, 있으면 업데이트
   - 반환: LectureProgressResponse

2. getProgress(Long memberId, Long lectureId)
   - 학생의 강의 시청 진행 상황 조회
   - 반환: LectureProgressResponse

3. getProgressByMember(Long memberId)
   - 학생이 시청한 모든 강의의 진행 상황
   - 반환: List<LectureProgressResponse>
```

---

## 🔄 DTO 설계

### CourseResponse
```json
{
  "id": 1,
  "title": "주식 투자 기초",
  "description": "...",
  "category": "STOCK",
  "price": 29900,
  "thumbnailUrl": "...",
  "instructor": {
    "id": 1,
    "email": "teacher@example.com",
    "nickname": "ChessTrainer",
    "role": "TEACHER"
  },
  "studentCount": 5,
  "createdAt": "2026-04-02T10:30:00"
}
```

### EnrollmentResponse
```json
{
  "id": 1,
  "member": {
    "id": 2,
    "email": "student@example.com",
    "nickname": "StudentName",
    "role": "STUDENT"
  },
  "course": {
    "id": 1,
    "title": "주식 투자 기초",
    "thumbnailUrl": "...",
    "category": "STOCK",
    "price": 29900
  },
  "enrolledAt": "2026-04-02T12:00:00",
  "isCompleted": false
}
```

### LectureProgressResponse
```json
{
  "id": 1,
  "member": {
    "id": 2
  },
  "lecture": {
    "id": 1,
    "title": "강의 1",
    "playTime": 3600
  },
  "lastPosition": 1800,
  "updatedAt": "2026-04-02T12:30:00"
}
```

---

## 🛡️ 예외 처리 전략

| 예외 | HTTP | 메시지 |
|------|------|--------|
| DuplicateEnrollmentException | 400 | 이미 등록된 강의입니다 |
| CourseNotFoundException | 404 | 강의를 찾을 수 없습니다 |
| MemberNotFoundException | 404 | 사용자를 찾을 수 없습니다 |
| UnauthorizedException | 403 | 접근 권한이 없습니다 |

---

## ⚡ 성능 최적화 전략

### N+1 쿼리 문제 해결
- CourseService에서 `fetch join` 사용
- `@EntityGraph` 고려 (복잡한 쿼리의 경우)

### 쿼리 예시
```java
// 강의 목록 조회 - fetch join으로 instructor 미리 로드
@Query("SELECT c FROM Course c LEFT JOIN FETCH c.instructor ORDER BY c.id DESC")
List<Course> findAllWithInstructor();
```

---

## 📝 커밋 계획

각 Phase마다 3-4개 커밋으로 분할:

1. **Entity & Repository** - 데이터 모델 정의
2. **Service** - 비즈니스 로직 구현
3. **Controller & DTO** - API 엔드포인트
4. **Exception & Validation** - 예외 처리 추가

---

## ✅ 테스트 전략

### 테스트 페르소나 흐름

**학생(Student) 페르소나**:
1. 회원가입 (STUDENT 역할)
2. 로그인 → Access Token 획득
3. 전체 강의 조회
4. 특정 강의 상세 조회
5. 강의 수강 등록 (POST /enrollments)
6. 내 수강 목록 조회 (GET /enrollments/my)
7. 강의 시청 진행 상황 저장 (POST /lectures/{lectureId}/progress)
8. 강의 완강 처리 (PUT /enrollments/{enrollmentId}/complete)

**강사(Teacher) 페르소나** (참고용, MVP에선 최소한):
1. 회원가입 (TEACHER 역할)
2. 로그인
3. 강의 등록 (POST /courses)
4. 자신의 강의 조회 (GET /courses/instructor/{instructorId})

---

## 🎬 구현 시작

아래 순서대로 진행:

### Step 1: Course Entity 수정 (instructor_id 추가)
### Step 2: CourseRepository 강화
### Step 3: CourseService 및 CourseController 강의 조회
### Step 4: Enrollment Entity 및 Repository
### Step 5: EnrollmentService 및 Controller
### Step 6: LectureProgress Entity 및 Service
### Step 7: 전체 통합 테스트

---

## 📌 주의사항

1. **트랜잭션 관리**: 수강 등록 시 중복 체크와 저장이 원자적이어야 함
2. **권한 검증**: EnrollmentController에서 로그인 사용자만 접근 가능하도록
3. **N+1 문제**: 모든 리스트 조회에서 fetch join 사용
4. **Null 처리**: Optional 활용하여 안전한 처리
5. **작은 단위 커밋**: 각 기능 구현 후 즉시 커밋

---

이 문서에 따라 구현을 진행합니다.

