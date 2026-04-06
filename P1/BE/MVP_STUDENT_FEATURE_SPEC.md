# 📋 ChessMate MVP - 학생(User) 중심 기능 명세서

**작성일**: 2026-04-02  
**프로젝트명**: ChessMate (온라인 강의 플랫폼)  
**대상 사용자**: 강의 수강자(학생)  
**개발 기간**: 5 Phase (약 4-5시간)  

---

## 1️⃣ 프로젝트 개요

### 1.1 프로젝트 목표

**P1 MVP 단계에서 구현할 학생의 핵심 경험 흐름:**

```
강의 발견(검색/조회)
    ↓
강의 상세 확인(커리큘럼 포함)
    ↓
수강 신청
    ↓
강의 재생 & 진도 추적
    ↓
마이페이지(수강 현황 대시보드)
```

### 1.2 핵심 원칙

- ✅ **학생 중심**: 학생이 느끼는 학습 경험에 집중
- ✅ **단순화**: MVP 단계에서는 강사 기능 제외 (강사 관리는 P2로 미루기)
- ✅ **점진적 구현**: 작은 단위로 자주 커밋하며 기능별 완결성 확보
- ✅ **테스트 가능**: 각 API는 Postman으로 즉시 테스트 가능하도록 설계

---

## 2️⃣ 사용자 페르소나 & 사용 시나리오

### 2.1 학생 페르소나

| 페르소나 | 특징 | 목표 |
|:---:|:---:|:---|
| **초보 투자자** | 주식/암호화폐 초심자 | 기초 지식 습득 및 투자 시작 |
| **중급 학습자** | 기초는 알지만 심화 학습 원함 | 고급 기법 습득 및 포트폴리오 개선 |
| **바쁜 직장인** | 짧은 시간에 핵심만 배우고 싶음 | 효율적인 학습 및 진도 관리 |

### 2.2 사용 시나리오 (User Journey)

**Scenario 1: 새로운 강의 발견하기**
```
1. 학생이 로그인 후 메인 페이지 접속
2. 강의 검색창에서 "주식 기초" 검색
3. STOCK 카테고리의 관련 강의 목록 확인
4. 강의 상세 페이지에서 커리큘럼(Section/Lecture) 확인
5. "수강 신청" 버튼 클릭 → 즉시 수강 시작
```

**Scenario 2: 강의 시청 & 진도 추적**
```
1. 마이페이지에서 수강 중인 강의 목록 확인
2. 특정 강의 선택 → 섹션/강의 목록 로드
3. 강의 영상 재생 → 시청 위치 자동 저장
4. 이전 시청 중단 위치부터 자동 재개
5. 강의 완료 시 진도율 자동 업데이트
```

**Scenario 3: 학습 현황 확인**
```
1. 마이페이지 접속
2. "대시보드" 탭에서:
   - 수강 중인 강의 목록
   - 각 강의별 진도율(%)
   - 이번 주 학습 시간
   - 완강한 강의 통계
```

---

## 3️⃣ 현재 구현 상태 분석 & 필요 기능

### 3.1 ✅ 이미 구현된 기능

| 기능 | 구현 상태 | 엔드포인트 |
|:---|:---|:---|
| 회원가입 | ✅ 완료 | `POST /api/auth/signup` |
| 로그인 | ✅ 완료 | `POST /api/auth/login` |
| JWT 인증 | ✅ 완료 | `JwtAuthenticationFilter` |
| 강의 목록 조회 | ✅ 완료 | `GET /api/courses` |
| 강의 상세 조회 | ✅ 완료 | `GET /api/courses/{courseId}` |
| 카테고리별 조회 | ✅ 완료 | `GET /api/courses/category/{category}` |
| 수강 신청 | ✅ 완료 | `POST /api/enrollments` |
| 내 수강 목록 | ✅ 완료 | `GET /api/enrollments/my` |
| 강의 완강 처리 | ✅ 완료 | `PUT /api/enrollments/courses/{courseId}/complete` |

### 3.2 🔄 추가로 필요한 기능 (MVP - Phase 1 ~ 5)

**Phase 1: 검색 & 필터링 API**
- [ ] 강의 검색 (키워드 검색)
- [ ] 강의 정렬 (최신순, 인기순, 가격순)
- [ ] 페이지네이션 개선

**Phase 2: 강의 상세 조회 개선**
- [ ] Section & Lecture 구조 조회 (섹션별 강의 목록)
- [ ] 강사 정보 포함 조회
- [ ] 강의 통계 (총 강의 시간, 섹션 개수 등)

**Phase 3: 진도 추적 API**
- [ ] 강의 진도 저장 (`POST /api/lecture-progress`)
- [ ] 강의 진도 조회 (`GET /api/lecture-progress/lectures/{lectureId}`)
- [ ] 강의별 진도율 계산

**Phase 4: 학생 대시보드 API**
- [ ] 수강 강의 진도 요약 (`GET /api/students/dashboard`)
- [ ] 강의별 진도율(%)
- [ ] 학습 통계 (이번 주 학습 시간, 총 학습 시간)
- [ ] 완강 강의 통계

**Phase 5: 통합 테스트 & 문서화**
- [ ] Postman 컬렉션 업데이트
- [ ] API 명세서 최종 검증
- [ ] 예외 처리 테스트

---

## 4️⃣ 상세 API 명세서

### 4.1 Phase 1: 검색 & 필터링 API

#### 1.1 강의 검색
```
요청:
  GET /api/courses/search?keyword=주식&category=STOCK&page=0&size=10

응답:
  200 OK
  {
    "data": [
      {
        "id": 1,
        "title": "주식 투자 기초",
        "description": "초보자를 위한 강의",
        "category": "STOCK",
        "price": 29900,
        "thumbnailUrl": "https://...",
        "instructorName": "김강사",
        "totalLectures": 15,
        "totalPlayTime": 3600
      },
      ...
    ],
    "message": "강의 목록을 조회했습니다."
  }

목적:
  - 키워드(제목, 설명)로 강의 검색
  - 카테고리 필터링 (STOCK/CRYPTO)
  - 페이지네이션 적용
  - 강사 정보 함께 반환
```

**구현 체크리스트:**
- [ ] `CourseRepository`에 `searchByKeywordAndCategory()` 메서드 추가
- [ ] `CourseService.searchCourses()` 구현
- [ ] `CourseController`에 `/api/courses/search` 엔드포인트 추가
- [ ] Request/Response DTO 정의
- [ ] 예외 처리 (검색 결과 없음)

---

### 4.2 Phase 2: 강의 상세 조회 개선

#### 2.1 강의 상세 정보 & 커리큘럼 조회
```
요청:
  GET /api/courses/{courseId}/structure

응답:
  200 OK
  {
    "data": {
      "courseId": 1,
      "title": "주식 투자 기초",
      "description": "...",
      "category": "STOCK",
      "price": 29900,
      "thumbnailUrl": "...",
      "instructor": {
        "id": 1,
        "nickname": "김강사",
        "email": "teacher@example.com"
      },
      "totalLectures": 15,
      "totalPlayTime": 3600,
      "sections": [
        {
          "id": 1,
          "title": "섹션 1: 기초 개념",
          "sortOrder": 1,
          "lectures": [
            {
              "id": 1,
              "title": "주식이란?",
              "videoUrl": "https://...",
              "playTime": 1200,
              "sortOrder": 1
            },
            {
              "id": 2,
              "title": "주식 거래 방법",
              "videoUrl": "https://...",
              "playTime": 1500,
              "sortOrder": 2
            }
          ]
        }
      ]
    },
    "message": "강의 상세 정보를 조회했습니다."
  }

목적:
  - 강의 전체 커리큘럼 구조 확인
  - 섹션별 강의 목록
  - 강사 정보 포함
  - 학생이 수강 신청 전 전체 구조 파악
```

**구현 체크리스트:**
- [ ] `CourseDetailResponse` DTO 정의 (Section/Lecture 포함)
- [ ] `SectionResponse`, `LectureResponse` DTO 정의
- [ ] `CourseRepository`에 fetch join 쿼리 추가
- [ ] `CourseService.getCourseStructure()` 구현
- [ ] `CourseController`에 `/api/courses/{courseId}/structure` 엔드포인트 추가

---

### 4.3 Phase 3: 진도 추적 API

#### 3.1 강의 진도 저장
```
요청:
  POST /api/lecture-progress

  {
    "lectureId": 1,
    "lastPosition": 300  // 현재 재생 위치(초)
  }

응답:
  201 Created
  {
    "data": {
      "id": 1,
      "lectureId": 1,
      "lastPosition": 300,
      "updatedAt": "2026-04-02T15:30:00"
    },
    "message": "강의 진도를 저장했습니다."
  }

목적:
  - 사용자 시청 위치 실시간 저장
  - 다음 접속 시 이전 위치부터 자동 재개
  - 학습 진도 추적
```

**구현 체크리스트:**
- [ ] `LectureProgressCreateRequest` DTO 정의
- [ ] `LectureProgressResponse` DTO 정의
- [ ] `LectureProgressRepository` 구현
- [ ] `LectureProgressService` 구현
- [ ] `LectureProgressController` 구현 (또는 기존 컨트롤러에 추가)
- [ ] 권한 검증 (@PreAuthorize)

#### 3.2 강의 진도 조회
```
요청:
  GET /api/lecture-progress/lectures/{lectureId}

응답:
  200 OK
  {
    "data": {
      "lectureId": 1,
      "lastPosition": 300,
      "playTime": 1200,
      "watchPercent": 25,  // 시청률(%)
      "updatedAt": "2026-04-02T15:30:00"
    },
    "message": "강의 진도를 조회했습니다."
  }

목적:
  - 현재 사용자의 해당 강의 진도 확인
  - 마지막 시청 위치 반환
  - 시청률(%) 계산
```

**구현 체크리스트:**
- [ ] `LectureProgressResponse` 에 watchPercent 필드 추가
- [ ] 시청률 계산 로직 (lastPosition / playTime * 100)
- [ ] `LectureProgressRepository.findByMemberAndLecture()` 메서드 추가
- [ ] `LectureProgressService.getProgressByLecture()` 구현
- [ ] 예외 처리 (진도 기록이 없는 경우)

---

### 4.4 Phase 4: 학생 대시보드 API

#### 4.1 학생 대시보드 (수강 강의 + 진도 요약)
```
요청:
  GET /api/students/dashboard?page=0&size=10

응답:
  200 OK
  {
    "data": {
      "totalEnrollments": 5,
      "completedCourses": 1,
      "ongoingCourses": 4,
      "totalLearningMinutes": 450,
      "thisWeekLearningMinutes": 120,
      "enrollmentSummary": [
        {
          "courseId": 1,
          "courseTitle": "주식 투자 기초",
          "instructorName": "김강사",
          "enrolledAt": "2026-03-15",
          "progressPercent": 65,  // 전체 강의 대비 시청 완료율
          "completedLectures": 10,
          "totalLectures": 15,
          "isCompleted": false,
          "lastWatchedLectureTitle": "기술적 분석",
          "lastWatchedAt": "2026-04-02T14:30:00"
        },
        ...
      ]
    },
    "message": "대시보드 정보를 조회했습니다."
  }

목적:
  - 학생의 전체 학습 현황 한눈에 파악
  - 수강 중인 강의별 진도율
  - 학습 통계 (시간, 완강 수 등)
  - 마이페이지에서 표시
```

**구현 체크리스트:**
- [ ] `StudentDashboardResponse` DTO 정의
- [ ] `EnrollmentSummaryResponse` DTO 정의
- [ ] 진도율 계산 로직:
  ```
  progressPercent = (완료한 강의 수 / 전체 강의 수) * 100
  ```
  또는 재생 시간 기반:
  ```
  progressPercent = (시청 완료한 강의의 playTime 합 / 전체 playTime 합) * 100
  ```
- [ ] `EnrollmentRepository`에 `findByMemberWithDetails()` 쿼리 추가 (N+1 최적화)
- [ ] `EnrollmentService.getStudentDashboard()` 구현
- [ ] `CourseController` 또는 새로운 `StudentDashboardController` 구현
- [ ] 페이지네이션 적용

#### 4.2 강의별 진도 상세 조회 (Optional)
```
요청:
  GET /api/enrollments/courses/{courseId}/progress

응답:
  200 OK
  {
    "data": {
      "courseId": 1,
      "courseTitle": "주식 투자 기초",
      "sections": [
        {
          "sectionId": 1,
          "sectionTitle": "섹션 1: 기초 개념",
          "lectureProgressList": [
            {
              "lectureId": 1,
              "lectureTitle": "주식이란?",
              "playTime": 1200,
              "lastPosition": 1200,  // 완시청 표시
              "watchPercent": 100,
              "watchedAt": "2026-04-02T10:00:00"
            },
            {
              "lectureId": 2,
              "lectureTitle": "주식 거래 방법",
              "playTime": 1500,
              "lastPosition": 750,  // 중도에 시청 중
              "watchPercent": 50,
              "watchedAt": "2026-04-02T14:30:00"
            }
          ]
        }
      ],
      "totalProgressPercent": 65,
      "completedAt": null  // 완강 시간 또는 null
    },
    "message": "강의 진도 상세를 조회했습니다."
  }

목적:
  - 강의 내 섹션별 진도 상세 확인
  - 각 강의별 시청 상태 한눈에 파악
  - 학생이 어디까지 학습했는지 확인
```

**구현 체크리스트:**
- [ ] `EnrollmentProgressDetailResponse` DTO 정의
- [ ] `SectionProgressResponse`, `LectureProgressDetailResponse` DTO 정의
- [ ] `LectureProgressRepository.findBySectionAndMember()` 메서드 추가
- [ ] `EnrollmentService.getCourseProgressDetail()` 구현
- [ ] `EnrollmentController`에 엔드포인트 추가

---

## 5️⃣ 데이터 모델 (기존 엔티티 확인 & 필요시 수정)

### 5.1 기존 엔티티 구조 (이미 구현됨)

```
Member (사용자)
  ├─ id (PK)
  ├─ email (unique)
  ├─ password (encrypted)
  ├─ nickname
  ├─ role (STUDENT/TEACHER/ADMIN)
  └─ createdAt

Course (강의)
  ├─ id (PK)
  ├─ title
  ├─ description
  ├─ category (STOCK/CRYPTO)
  ├─ price
  ├─ thumbnailUrl
  ├─ instructor_id (FK → Member)
  └─ createdAt

Section (섹션)
  ├─ id (PK)
  ├─ course_id (FK → Course)
  ├─ title
  └─ sortOrder

Lecture (강의 영상)
  ├─ id (PK)
  ├─ section_id (FK → Section)
  ├─ title
  ├─ videoUrl
  ├─ playTime (영상 길이, 초)
  └─ sortOrder

Enrollment (수강 등록)
  ├─ id (PK)
  ├─ member_id (FK → Member)
  ├─ course_id (FK → Course)
  ├─ enrolledAt
  └─ isCompleted (완강 여부)

LectureProgress (진도 추적)
  ├─ id (PK)
  ├─ member_id (FK → Member)
  ├─ lecture_id (FK → Lecture)
  ├─ lastPosition (마지막 시청 시간, 초)
  └─ updatedAt
```

### 5.2 필요한 수정사항

✅ **LectureProgress 엔티티 확인**
- 기존 구조 (member + lecture + lastPosition)는 MVP에 적합
- 추가 필드 고려: 
  - `isCompleted` (해당 강의 시청 완료 여부) - **선택사항**
  - `completedAt` (시청 완료 시간) - **선택사항**

⚠️ **선택사항 (P2 이후)**
- 강의 조회 시 강사명 정보 - **이미 구현됨** (instructor 필드)
- 강의별 평점/리뷰 - **P2 이후**

---

## 6️⃣ 구현 순서 & 커밋 계획

### Phase 1: 검색 & 필터링 API (1시간)
```bash
# Commit 1
git commit -m "[Phase1-1] 강의 검색 API 구현 - Repository & Service"
- CourseRepository.searchByKeywordAndCategory() 메서드 추가
- CourseService.searchCourses() 구현

# Commit 2
git commit -m "[Phase1-2] 강의 검색 API 구현 - Controller & DTO"
- CourseController에 /api/courses/search 엔드포인트 추가
- CourseSearchRequest, CourseSearchResponse DTO 정의
- 테스트 (Postman)
```

### Phase 2: 강의 상세 조회 개선 (1시간)
```bash
# Commit 1
git commit -m "[Phase2-1] 강의 상세 조회 API - 커리큘럼 포함"
- CourseDetailResponse, SectionResponse, LectureResponse DTO 정의
- CourseRepository fetch join 쿼리 추가

# Commit 2
git commit -m "[Phase2-2] 강의 상세 조회 API - Controller 엔드포인트"
- CourseController에 /api/courses/{courseId}/structure 엔드포인트 추가
- 강사 정보 포함 조회
- 테스트 (Postman)
```

### Phase 3: 진도 추적 API (1.5시간)
```bash
# Commit 1
git commit -m "[Phase3-1] 진도 추적 API - Repository & Service"
- LectureProgressRepository 메서드 추가
- LectureProgressService 구현

# Commit 2
git commit -m "[Phase3-2] 진도 추적 API - POST 엔드포인트"
- POST /api/lecture-progress 엔드포인트 구현
- LectureProgressCreateRequest, LectureProgressResponse DTO 정의
- 권한 검증 추가

# Commit 3
git commit -m "[Phase3-3] 진도 조회 API - GET 엔드포인트"
- GET /api/lecture-progress/lectures/{lectureId} 엔드포인트 구현
- 시청률 계산 로직 추가
- 테스트 (Postman)
```

### Phase 4: 학생 대시보드 API (1.5시간)
```bash
# Commit 1
git commit -m "[Phase4-1] 대시보드 API - 기본 구조"
- StudentDashboardResponse, EnrollmentSummaryResponse DTO 정의
- EnrollmentService.getStudentDashboard() 구현

# Commit 2
git commit -m "[Phase4-2] 대시보드 API - 진도율 계산"
- 진도율 계산 로직 (완료 강의 수 / 전체 강의 수)
- 학습 통계 계산 (시간 기반)

# Commit 3
git commit -m "[Phase4-3] 대시보드 API - Controller & 최적화"
- GET /api/students/dashboard 엔드포인트 구현
- N+1 문제 해결 (fetch join)
- 페이지네이션 적용
- 테스트 (Postman)

# Commit 4 (Optional)
git commit -m "[Phase4-4] 강의별 진도 상세 조회 API"
- GET /api/enrollments/courses/{courseId}/progress 엔드포인트
- 섹션별 진도 상세 조회
```

### Phase 5: 통합 테스트 & 문서화 (1시간)
```bash
# Commit 1
git commit -m "[Phase5-1] Postman 컬렉션 업데이트"
- 새로운 엔드포인트 추가
- 테스트 시나리오 작성

# Commit 2
git commit -m "[Phase5-2] API 명세서 & README 업데이트"
- API_SPECIFICATION.md 업데이트
- MVP 완성 문서작성
```

---

## 7️⃣ 예외 처리 & 유효성 검증

### 7.1 예외 상황

| 상황 | HTTP 상태 | 응답 |
|:---|:---|:---|
| 강의를 찾을 수 없음 | 404 NOT_FOUND | `EntityNotFoundException` |
| 진도 기록이 없음 | 404 NOT_FOUND | `EntityNotFoundException` 또는 빈 객체 반환 |
| 인증 없이 요청 | 401 UNAUTHORIZED | 토큰 없음 또는 만료됨 |
| 다른 사용자의 진도 조회 시도 | 403 FORBIDDEN | 권한 없음 |
| 수강하지 않은 강의의 진도 저장 시도 | 400 BAD_REQUEST | 수강 등록 필요 |

### 7.2 유효성 검증

```java
// SearchRequest
@NotNull(message = "keyword는 필수입니다")
@NotBlank(message = "keyword는 빈 문자열일 수 없습니다")
private String keyword;

// LectureProgressCreateRequest
@NotNull(message = "lectureId는 필수입니다")
private Long lectureId;

@NotNull(message = "lastPosition은 필수입니다")
@PositiveOrZero(message = "lastPosition은 0 이상이어야 합니다")
private Integer lastPosition;
```

---

## 8️⃣ 성능 고려사항

### 8.1 N+1 문제 해결

**문제 상황:**
```
EnrollmentRepository.findByMember(memberId)
  → Enrollment 10개 조회 (1번 쿼리)
  → 각 Enrollment의 Course 조회 (10번 쿼리)
  → 각 Course의 Instructor 조회 (10번 쿼리)
  = 총 21번 쿼리 발생 ❌
```

**해결 방법:**
```java
// JPQL + fetch join
@Query("""
  SELECT e FROM Enrollment e
  JOIN FETCH e.course c
  JOIN FETCH c.instructor
  WHERE e.member.id = :memberId
""")
List<Enrollment> findByMemberWithDetails(Long memberId);
```

### 8.2 캐싱 전략 (P2 이후)
- 강의 목록: 5분 캐시 (자주 조회, 변경 적음)
- 강사 정보: 1시간 캐시
- 학생 대시보드: 캐시 X (실시간 업데이트 필요)

### 8.3 페이지네이션
- 기본 페이지 크기: 10개
- 최대 페이지 크기: 50개

---

## 9️⃣ 테스트 전략

### 9.1 테스트 시나리오 (Postman)

**테스트 1: 강의 검색**
```
1. 로그인 (JWT 토큰 획득)
2. GET /api/courses/search?keyword=주식&category=STOCK
3. 결과 확인 (강사 정보 포함)
```

**테스트 2: 강의 상세 조회**
```
1. GET /api/courses/{courseId}/structure
2. 섹션 & 강의 목록 확인
3. 강사 정보 확인
```

**테스트 3: 진도 저장 & 조회**
```
1. POST /api/lecture-progress (lastPosition = 300)
2. GET /api/lecture-progress/lectures/{lectureId}
3. 시청률 확인 (lastPosition / playTime * 100)
4. POST /api/lecture-progress (lastPosition = 600)
5. 재조회하여 업데이트 확인
```

**테스트 4: 대시보드 조회**
```
1. 학생 A로 로그인
2. 3개 강의 수강 신청
3. 각 강의에서 진도 기록
4. GET /api/students/dashboard
5. 진도율 계산 확인
   - 강의1: 10개 강의 중 5개 완료 = 50%
   - 강의2: 15개 강의 중 10개 완료 = 66.7%
   - 강의3: 20개 강의 중 8개 완료 = 40%
```

### 9.2 단위 테스트 (선택사항)
- `CourseServiceTest`: 검색 메서드
- `EnrollmentServiceTest`: 대시보드 계산 로직
- `LectureProgressServiceTest`: 진도 저장/조회

---

## 🔟 API 응답 포맷 (일관성)

### 10.1 공통 응답 구조

모든 API는 `ApiResponse<T>` 형식으로 응답:

```java
@Data
@Builder
public class ApiResponse<T> {
    private T data;           // 실제 데이터
    private String message;   // 사용자 메시지
    private LocalDateTime timestamp = LocalDateTime.now();
}
```

**성공 응답 예시:**
```json
{
  "data": {...},
  "message": "강의 목록을 조회했습니다.",
  "timestamp": "2026-04-02T15:30:00"
}
```

**에러 응답 예시:**
```json
{
  "data": null,
  "message": "강의를 찾을 수 없습니다.",
  "timestamp": "2026-04-02T15:30:00"
}
```

---

## 1️⃣1️⃣ 구현 체크리스트

### DTO 정의
- [ ] `CourseSearchRequest` / `CourseSearchResponse`
- [ ] `CourseDetailResponse` / `SectionResponse` / `LectureResponse`
- [ ] `LectureProgressCreateRequest` / `LectureProgressResponse`
- [ ] `StudentDashboardResponse` / `EnrollmentSummaryResponse`
- [ ] `EnrollmentProgressDetailResponse` (Optional)

### Repository
- [ ] `CourseRepository.searchByKeywordAndCategory()`
- [ ] `CourseRepository.findByIdWithDetails()` (fetch join)
- [ ] `LectureProgressRepository.findByMemberAndLecture()`
- [ ] `LectureProgressRepository.findByLecture()`
- [ ] `EnrollmentRepository.findByMemberWithDetails()` (fetch join)
- [ ] `EnrollmentRepository.findByMemberAndCourse()`
- [ ] `LectureRepository.findBySection()`

### Service
- [ ] `CourseService.searchCourses()`
- [ ] `CourseService.getCourseStructure()`
- [ ] `LectureProgressService.saveLectureProgress()`
- [ ] `LectureProgressService.getLectureProgress()`
- [ ] `EnrollmentService.getStudentDashboard()`
- [ ] `EnrollmentService.getCourseProgressDetail()`

### Controller
- [ ] `CourseController.searchCourses()`
- [ ] `CourseController.getCourseStructure()`
- [ ] `LectureProgressController` 생성 (또는 기존 컨트롤러에 추가)
- [ ] `StudentDashboardController` (또는 기존 컨트롤러에 추가)

### 예외 처리
- [ ] `GlobalExceptionHandler`에 필요한 예외 추가
- [ ] 입력값 검증 (@NotNull, @NotBlank 등)

### 테스트 & 문서화
- [ ] Postman 컬렉션 생성/업데이트
- [ ] API_SPECIFICATION.md 업데이트
- [ ] 각 API 테스트 완료

---

## 1️⃣2️⃣ 참고: 강사 기능 (P2로 미루기)

현재 MVP 단계에서는 **강사 기능 제외**:
- ❌ 강의 등록 (강사 수정, 삭제도 이미 구현되어 있지만 사용하지 않음)
- ❌ 강사 대시보드
- ❌ 수강생 관리

이 기능들은 **P2에서 구현**할 예정.

---

## 1️⃣3️⃣ 다음 단계 (P2 이후)

- [ ] 강사 기능 추가 (강의 관리, 수강생 통계)
- [ ] 결제/구독 시스템 (P3)
- [ ] 리뷰/평점 시스템
- [ ] 검색 최적화 (Elasticsearch)
- [ ] 캐싱 시스템 (Redis)
- [ ] 실시간 알림 (WebSocket)
- [ ] 모바일 앱 개발

---

## 문서 관리

- **작성자**: AI Copilot
- **최종 수정**: 2026-04-02
- **상태**: 🟢 Ready for Implementation
- **참고 문서**: 
  - `IMPLEMENTATION_COMPLETE.md` (기존 구현 현황)
  - `API_SPECIFICATION.md` (기존 API 명세)
  - `P1 기획문서.md` (프로젝트 기획)

---

## 시작하기

이 명세서를 바탕으로 Phase 1부터 순차적으로 구현하면 됩니다.

**다음 단계:**
1. Phase 1 구현 시작 (검색 API)
2. 각 커밋마다 Postman으로 테스트
3. 기능별로 완결성 확보

💡 **팁**: 각 Phase가 완료되면 바로 커밋하고, 다음 Phase로 진행하세요.

🚀 **시작!**

