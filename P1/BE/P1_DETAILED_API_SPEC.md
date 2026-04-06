# 📘 ChessMate P1 상세 API 명세서

**작성일**: 2026-04-02  
**최종 수정**: 2026-04-02  
**상태**: 📋 작성 완료

---

## 📑 목차

1. [API 설계 원칙](#1-api-설계-원칙)
2. [공통 응답 형식](#2-공통-응답-형식)
3. [Phase 1: 검색 & 필터링 API](#3-phase-1-검색--필터링-api)
4. [Phase 2: 강의 상세 조회 개선](#4-phase-2-강의-상세-조회-개선)
5. [Phase 3: 진도 추적 API](#5-phase-3-진도-추적-api)
6. [Phase 4: 학생 대시보드 API](#6-phase-4-학생-대시보드-api)
7. [예외 처리](#7-예외-처리)
8. [보안 & 권한](#8-보안--권한)

---

## 1. API 설계 원칙

### 1.1 설계 철학

```
RESTful 원칙 준수
├─ GET: 조회 (안전, 멱등성)
├─ POST: 생성 (새로운 리소스)
├─ PUT: 전체 수정
└─ DELETE: 삭제

JWT 기반 인증
├─ Authorization 헤더에 Bearer 토큰
└─ 모든 API는 인증 필수 (공개 API 제외)

DTO 기반 요청/응답
├─ 엔티티 직접 노출 금지
└─ 필요한 정보만 응답
```

### 1.2 URL 설계 규칙

```
/api/courses/search         - 강의 검색
/api/courses/{id}/...       - 강의 상세 조회
/api/lecture-progress/...   - 진도 추적
/api/students/dashboard     - 학생 대시보드
/api/enrollments/...        - 수강 관련
```

---

## 2. 공통 응답 형식

### 2.1 성공 응답 (2xx)

```json
{
  "data": {
    // 실제 데이터
  },
  "message": "요청이 성공했습니다."
}
```

**HTTP 상태 코드:**
- `200 OK` - 일반적인 성공
- `201 Created` - 리소스 생성 성공
- `204 No Content` - 응답 본문 없음

### 2.2 실패 응답 (4xx, 5xx)

```json
{
  "data": null,
  "message": "에러 설명",
  "error": {
    "code": "ERROR_CODE",
    "details": "상세 설명"
  }
}
```

**HTTP 상태 코드:**
- `400 Bad Request` - 잘못된 요청 (검증 실패)
- `401 Unauthorized` - 인증 실패
- `403 Forbidden` - 권한 없음
- `404 Not Found` - 리소스 없음
- `409 Conflict` - 중복 데이터
- `500 Internal Server Error` - 서버 오류

---

## 3. Phase 1: 검색 & 필터링 API

**목표**: 사용자가 키워드 + 카테고리로 강의를 검색할 수 있도록 구현

### 3.1 강의 검색 API

#### 요청

```
GET /api/courses/search?keyword=주식&category=STOCK&page=0&size=10
Authorization: Bearer {accessToken}
```

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|:---|:---|:---:|:---|:---|
| `keyword` | String | X | 검색 키워드 (제목, 설명) | "주식" |
| `category` | String | X | 카테고리 필터 (STOCK, CRYPTO) | "STOCK" |
| `page` | Integer | X | 페이지 번호 (기본값: 0) | 0 |
| `size` | Integer | X | 페이지 크기 (기본값: 10, 최대: 50) | 10 |

**요청 DTO:**
```java
@Data
public class CourseSearchRequest {
    @NotBlank(message = "keyword는 필수입니다.")
    private String keyword;           // 검색 키워드
    
    private String category;          // 카테고리 (STOCK, CRYPTO)
    
    @Min(value = 0, message = "page는 0 이상이어야 합니다.")
    private Integer page = 0;         // 페이지 번호
    
    @Min(value = 1, message = "size는 1 이상이어야 합니다.")
    @Max(value = 50, message = "size는 50 이하여야 합니다.")
    private Integer size = 10;        // 페이지 크기
}
```

#### 응답

```json
{
  "data": {
    "content": [
      {
        "id": 1,
        "title": "주식 투자 기초 - 완벽 가이드",
        "description": "초보자를 위한 주식 투자 기초 강의입니다. ...",
        "category": "STOCK",
        "price": 29900,
        "thumbnailUrl": "https://chessmate.com/images/course-1.jpg",
        "instructorId": 2,
        "instructorName": "김강사",
        "totalLectures": 15,
        "totalPlayTime": 3600,
        "createdAt": "2026-04-01T10:00:00"
      },
      {
        "id": 2,
        "title": "암호화폐 기초 학습",
        "description": "비트코인, 이더리움 등 주요 암호화폐 학습...",
        "category": "CRYPTO",
        "price": 39900,
        "thumbnailUrl": "https://chessmate.com/images/course-2.jpg",
        "instructorId": 3,
        "instructorName": "이강사",
        "totalLectures": 20,
        "totalPlayTime": 5400,
        "createdAt": "2026-03-28T14:30:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 25,
    "totalPages": 3,
    "hasNext": true
  },
  "message": "강의 목록을 조회했습니다."
}
```

**응답 DTO:**
```java
@Data
public class CourseSearchResponse {
    private Long id;
    private String title;
    private String description;
    private String category;           // STOCK, CRYPTO
    private Integer price;
    private String thumbnailUrl;
    private Long instructorId;
    private String instructorName;     // 강사 닉네임
    private Integer totalLectures;     // 섹션의 강의 개수 합
    private Integer totalPlayTime;     // 모든 강의의 재생 시간 합(초)
    private LocalDateTime createdAt;
}

@Data
public class PageResponse<T> {
    private List<T> content;           // 데이터 목록
    private Integer page;              // 현재 페이지 번호
    private Integer size;              // 페이지 크기
    private Long totalElements;        // 전체 데이터 개수
    private Integer totalPages;        // 전체 페이지 개수
    private Boolean hasNext;           // 다음 페이지 존재 여부
}
```

**데이터 흐름:**
```
Controller (쿼리 파라미터 수신)
    ↓
Service.searchCourses(keyword, category, page, size)
    ↓
Repository.searchByKeywordAndCategory(keyword, category, Pageable)
    ↓
JPQL Query with fetch join
    ├─ Course fetch join Instructor (강사 정보)
    └─ Course fetch join Section & Lecture (통계 계산용)
    ↓
List<Course> → List<CourseSearchResponse> 변환
    ↓
PageResponse<CourseSearchResponse> 생성
    ↓
200 OK + JSON 응답
```

**Repository 쿼리:**
```sql
SELECT DISTINCT c
FROM Course c
LEFT JOIN FETCH c.instructor i
LEFT JOIN FETCH c.sections s
LEFT JOIN FETCH s.lectures l
WHERE (LOWER(c.title) LIKE CONCAT('%', LOWER(:keyword), '%')
    OR LOWER(c.description) LIKE CONCAT('%', LOWER(:keyword), '%'))
  AND (:category IS NULL OR c.category = :category)
ORDER BY c.createdAt DESC
```

**예외 처리:**

| 상황 | HTTP 상태 | 에러 메시지 |
|:---|:---|:---|
| keyword 누락 | 400 | "keyword는 필수입니다." |
| category 잘못됨 | 400 | "category는 STOCK 또는 CRYPTO여야 합니다." |
| page < 0 | 400 | "page는 0 이상이어야 합니다." |
| size > 50 | 400 | "size는 50 이하여야 합니다." |
| 토큰 만료 | 401 | "토큰이 만료되었습니다." |
| 인증 정보 없음 | 401 | "인증 정보가 없습니다." |

---

## 4. Phase 2: 강의 상세 조회 개선

**목표**: 강의 커리큘럼(섹션/강의)을 포함한 상세 정보 제공

### 4.1 강의 상세 조회 (섹션/강의 포함) API

#### 요청

```
GET /api/courses/{courseId}/with-sections
Authorization: Bearer {accessToken}
```

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|:---|:---|:---|
| `courseId` | Long | 강의 ID |

#### 응답

```json
{
  "data": {
    "id": 1,
    "title": "주식 투자 기초 - 완벽 가이드",
    "description": "초보자를 위한 주식 투자 기초 강의입니다.",
    "category": "STOCK",
    "price": 29900,
    "thumbnailUrl": "https://chessmate.com/images/course-1.jpg",
    "instructorId": 2,
    "instructorName": "김강사",
    "totalSections": 5,
    "totalLectures": 15,
    "totalPlayTime": 3600,
    "createdAt": "2026-04-01T10:00:00",
    "sections": [
      {
        "id": 1,
        "title": "섹션 1: 주식의 기초",
        "sortOrder": 1,
        "lectures": [
          {
            "id": 1,
            "title": "강의 1: 주식이란 무엇인가?",
            "videoUrl": "https://video.chessmate.com/course-1-lecture-1.mp4",
            "playTime": 600,
            "sortOrder": 1
          },
          {
            "id": 2,
            "title": "강의 2: 주식 시장 이해하기",
            "videoUrl": "https://video.chessmate.com/course-1-lecture-2.mp4",
            "playTime": 720,
            "sortOrder": 2
          }
        ]
      },
      {
        "id": 2,
        "title": "섹션 2: 투자 전략",
        "sortOrder": 2,
        "lectures": [
          {
            "id": 3,
            "title": "강의 3: 가치 투자 전략",
            "videoUrl": "https://video.chessmate.com/course-1-lecture-3.mp4",
            "playTime": 900,
            "sortOrder": 1
          }
        ]
      }
    ]
  },
  "message": "강의 상세 정보를 조회했습니다."
}
```

**응답 DTO:**
```java
@Data
public class CourseDetailResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Integer price;
    private String thumbnailUrl;
    private Long instructorId;
    private String instructorName;
    private Integer totalSections;     // 섹션 개수
    private Integer totalLectures;     // 강의 개수
    private Integer totalPlayTime;     // 총 재생 시간(초)
    private LocalDateTime createdAt;
    private List<SectionResponse> sections;
}

@Data
public class SectionResponse {
    private Long id;
    private String title;
    private Integer sortOrder;
    private List<LectureBasicResponse> lectures;
}

@Data
public class LectureBasicResponse {
    private Long id;
    private String title;
    private String videoUrl;
    private Integer playTime;         // 재생 시간(초)
    private Integer sortOrder;
}
```

**데이터 흐름:**
```
Controller (courseId 수신)
    ↓
Service.getCourseDetailWithSections(courseId)
    ├─ Course 엔티티 조회 (fetch join Instructor, Sections, Lectures)
    └─ 통계 계산 (totalSections, totalLectures, totalPlayTime)
    ↓
Course → CourseDetailResponse 변환
    ├─ Section 리스트 → SectionResponse 리스트 변환
    └─ Lecture 리스트 → LectureBasicResponse 리스트 변환
    ↓
200 OK + JSON 응답
```

**Repository 쿼리:**
```sql
SELECT c
FROM Course c
LEFT JOIN FETCH c.instructor i
LEFT JOIN FETCH c.sections s
LEFT JOIN FETCH s.lectures l
WHERE c.id = :courseId
ORDER BY s.sortOrder ASC, l.sortOrder ASC
```

**예외 처리:**

| 상황 | HTTP 상태 | 에러 메시지 |
|:---|:---|:---|
| 강의 없음 (courseId 잘못됨) | 404 | "해당 강의를 찾을 수 없습니다." |
| 강사 정보 없음 | 500 | "강사 정보를 조회할 수 없습니다." |
| 토큰 만료 | 401 | "토큰이 만료되었습니다." |

---

## 5. Phase 3: 진도 추적 API

**목표**: 사용자가 강의 시청 위치를 저장하고 조회할 수 있도록 구현

### 5.1 강의 진도 저장 API

#### 요청

```
POST /api/lecture-progress
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "enrollmentId": 1,
  "lectureId": 5,
  "lastPosition": 450
}
```

**요청 DTO:**
```java
@Data
public class LectureProgressRequest {
    @NotNull(message = "enrollmentId는 필수입니다.")
    private Long enrollmentId;         // 수강 ID
    
    @NotNull(message = "lectureId는 필수입니다.")
    private Long lectureId;            // 강의 ID
    
    @NotNull(message = "lastPosition은 필수입니다.")
    @Min(value = 0, message = "lastPosition은 0 이상이어야 합니다.")
    private Integer lastPosition;      // 마지막 시청 시간(초)
}
```

#### 응답

```json
{
  "data": {
    "id": 15,
    "enrollmentId": 1,
    "lectureId": 5,
    "lectureName": "강의 5: 고급 투자 기법",
    "lastPosition": 450,
    "lecturePlayTime": 1200,
    "progressPercent": 37,
    "updatedAt": "2026-04-02T15:30:00"
  },
  "message": "강의 진도를 저장했습니다."
}
```

**응답 DTO:**
```java
@Data
public class LectureProgressResponse {
    private Long id;
    private Long enrollmentId;
    private Long lectureId;
    private String lectureName;        // 강의 제목
    private Integer lastPosition;      // 마지막 시청 위치(초)
    private Integer lecturePlayTime;   // 강의 총 길이(초)
    private Integer progressPercent;   // 진도율(%)
    private LocalDateTime updatedAt;
}
```

**데이터 흐름:**
```
Controller (요청 DTO 수신)
    ↓
Service.saveLectureProgress(enrollmentId, lectureId, lastPosition)
    ├─ Enrollment 존재 여부 확인
    ├─ Lecture 존재 여부 확인
    ├─ 사용자 권한 확인 (해당 Enrollment의 소유자인지)
    └─ LectureProgress 엔티티 생성 또는 업데이트
    ↓
Repository.save(lectureProgress)
    ↓
LectureProgress → LectureProgressResponse 변환
    ├─ 진도율(%) = (lastPosition / playTime) * 100
    └─ updatedAt 자동 설정
    ↓
201 Created + JSON 응답
```

**비즈니스 로직:**
```java
// Service에서 다음 로직 수행:
1. enrollmentId 소유자 검증 (SecurityContext의 memberId와 비교)
2. Enrollment의 is_completed 자동 업데이트
   - lastPosition >= lecturePlayTime * 0.95 이면 완료로 처리
3. 진도율 계산 및 응답
```

**예외 처리:**

| 상황 | HTTP 상태 | 에러 메시지 |
|:---|:---|:---|
| enrollmentId 누락 | 400 | "enrollmentId는 필수입니다." |
| lectureId 누락 | 400 | "lectureId는 필수입니다." |
| lastPosition < 0 | 400 | "lastPosition은 0 이상이어야 합니다." |
| 수강 기록 없음 | 404 | "해당 수강 기록을 찾을 수 없습니다." |
| 강의 없음 | 404 | "해당 강의를 찾을 수 없습니다." |
| 권한 없음 (다른 사용자 수강) | 403 | "이 수강 기록에 접근할 권한이 없습니다." |
| 토큰 만료 | 401 | "토큰이 만료되었습니다." |

---

### 5.2 특정 강의 진도 조회 API

#### 요청

```
GET /api/lecture-progress/lectures/{lectureId}?enrollmentId=1
Authorization: Bearer {accessToken}
```

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|:---|:---|:---:|:---|
| `enrollmentId` | Long | O | 수강 ID |

#### 응답

```json
{
  "data": {
    "id": 15,
    "enrollmentId": 1,
    "lectureId": 5,
    "lectureName": "강의 5: 고급 투자 기법",
    "lastPosition": 450,
    "lecturePlayTime": 1200,
    "progressPercent": 37,
    "updatedAt": "2026-04-02T15:30:00"
  },
  "message": "강의 진도를 조회했습니다."
}
```

**데이터 흐름:**
```
Controller (lectureId, enrollmentId 수신)
    ↓
Service.getLectureProgress(lectureId, enrollmentId)
    ├─ Enrollment 소유자 검증
    └─ LectureProgress 조회
    ↓
LectureProgress → LectureProgressResponse 변환
    ↓
200 OK + JSON 응답
```

**Repository 쿼리:**
```sql
SELECT lp
FROM LectureProgress lp
WHERE lp.lectureId = :lectureId
  AND lp.enrollmentId = :enrollmentId
```

---

### 5.3 수강 강의 전체 진도 조회 API

#### 요청

```
GET /api/enrollments/{enrollmentId}/progress
Authorization: Bearer {accessToken}
```

**경로 파라미터:**

| 파라미터 | 타입 | 설명 |
|:---|:---|:---|
| `enrollmentId` | Long | 수강 ID |

#### 응답

```json
{
  "data": {
    "enrollmentId": 1,
    "courseId": 1,
    "courseName": "주식 투자 기초 - 완벽 가이드",
    "isCompleted": false,
    "enrolledAt": "2026-04-01T12:00:00",
    "totalLectures": 15,
    "completedLectures": 3,
    "overallProgressPercent": 20,
    "lectureProgress": [
      {
        "lectureId": 1,
        "lectureName": "강의 1: 주식이란 무엇인가?",
        "lastPosition": 600,
        "lecturePlayTime": 600,
        "progressPercent": 100,
        "isCompleted": true,
        "updatedAt": "2026-04-01T15:00:00"
      },
      {
        "lectureId": 2,
        "lectureName": "강의 2: 주식 시장 이해하기",
        "lastPosition": 450,
        "lecturePlayTime": 720,
        "progressPercent": 62,
        "isCompleted": false,
        "updatedAt": "2026-04-02T10:30:00"
      },
      {
        "lectureId": 3,
        "lectureName": "강의 3: 가치 투자 전략",
        "lastPosition": 0,
        "lecturePlayTime": 900,
        "progressPercent": 0,
        "isCompleted": false,
        "updatedAt": null
      }
    ]
  },
  "message": "수강 진도 정보를 조회했습니다."
}
```

**응답 DTO:**
```java
@Data
public class EnrollmentProgressResponse {
    private Long enrollmentId;
    private Long courseId;
    private String courseName;
    private Boolean isCompleted;
    private LocalDateTime enrolledAt;
    private Integer totalLectures;         // 전체 강의 개수
    private Integer completedLectures;     // 완료된 강의 개수
    private Integer overallProgressPercent; // 전체 진도율(%)
    private List<LectureProgressDetail> lectureProgress;
}

@Data
public class LectureProgressDetail {
    private Long lectureId;
    private String lectureName;
    private Integer lastPosition;
    private Integer lecturePlayTime;
    private Integer progressPercent;
    private Boolean isCompleted;           // lastPosition >= playTime * 0.95
    private LocalDateTime updatedAt;
}
```

---

## 6. Phase 4: 학생 대시보드 API

**목표**: 학생이 자신의 학습 현황을 한 눈에 볼 수 있는 대시보드 제공

### 6.1 대시보드 조회 API

#### 요청

```
GET /api/students/dashboard
Authorization: Bearer {accessToken}
```

#### 응답

```json
{
  "data": {
    "memberId": 1,
    "memberName": "김학생",
    "totalStudyHours": 25,
    "thisWeekStudyHours": 5,
    "totalEnrollments": 3,
    "completedCourses": 1,
    "ongoingCourses": 2,
    "enrollmentSummaries": [
      {
        "enrollmentId": 1,
        "courseId": 1,
        "courseName": "주식 투자 기초 - 완벽 가이드",
        "courseThumbnailUrl": "https://...",
        "category": "STOCK",
        "progressPercent": 20,
        "totalLectures": 15,
        "completedLectures": 3,
        "isCompleted": false,
        "enrolledAt": "2026-04-01T12:00:00"
      },
      {
        "enrollmentId": 2,
        "courseId": 2,
        "courseName": "암호화폐 기초 학습",
        "courseThumbnailUrl": "https://...",
        "category": "CRYPTO",
        "progressPercent": 100,
        "totalLectures": 20,
        "completedLectures": 20,
        "isCompleted": true,
        "enrolledAt": "2026-03-20T10:00:00"
      }
    ]
  },
  "message": "대시보드 정보를 조회했습니다."
}
```

**응답 DTO:**
```java
@Data
public class StudentDashboardResponse {
    private Long memberId;
    private String memberName;
    private Integer totalStudyHours;       // 총 학습 시간(시간)
    private Integer thisWeekStudyHours;    // 이번 주 학습 시간(시간)
    private Integer totalEnrollments;      // 수강 강의 개수
    private Integer completedCourses;      // 완강 강의 개수
    private Integer ongoingCourses;        // 수강 중인 강의 개수
    private List<EnrollmentProgressSummary> enrollmentSummaries;
}

@Data
public class EnrollmentProgressSummary {
    private Long enrollmentId;
    private Long courseId;
    private String courseName;
    private String courseThumbnailUrl;
    private String category;
    private Integer progressPercent;       // 진도율(%)
    private Integer totalLectures;
    private Integer completedLectures;
    private Boolean isCompleted;
    private LocalDateTime enrolledAt;
}
```

**데이터 흐름:**
```
Controller (토큰에서 memberId 추출)
    ↓
Service.getStudentDashboard(memberId)
    ├─ Member 조회
    ├─ Enrollment 목록 조회 (fetch join Course)
    ├─ LectureProgress 조회 (각 Enrollment별)
    ├─ 통계 계산:
    │  ├─ totalStudyHours (모든 진도의 시청 시간 합)
    │  ├─ thisWeekStudyHours (최근 7일 시청 시간 합)
    │  ├─ completedCourses (is_completed = true 개수)
    │  └─ ongoingCourses (is_completed = false 개수)
    └─ 각 Enrollment별 진도율 계산
    ↓
StudentDashboardResponse 생성
    ↓
200 OK + JSON 응답
```

**Repository 쿼리:**
```sql
-- Enrollment 목록 (진행 중, 완료 모두)
SELECT e
FROM Enrollment e
LEFT JOIN FETCH e.course c
WHERE e.memberId = :memberId
ORDER BY e.enrolledAt DESC

-- LectureProgress 조회
SELECT lp
FROM LectureProgress lp
WHERE lp.memberId = :memberId
  AND lp.updatedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
```

**예외 처리:**

| 상황 | HTTP 상태 | 에러 메시지 |
|:---|:---|:---|
| 사용자 없음 | 404 | "사용자를 찾을 수 없습니다." |
| 토큰 만료 | 401 | "토큰이 만료되었습니다." |

---

### 6.2 상세 학습 통계 API

#### 요청

```
GET /api/students/study-stats
Authorization: Bearer {accessToken}
```

#### 응답

```json
{
  "data": {
    "memberId": 1,
    "totalStudyHours": 25,
    "totalCompletedCourses": 1,
    "categoryStats": [
      {
        "category": "STOCK",
        "completedCourses": 1,
        "ongoingCourses": 1,
        "totalHours": 15
      },
      {
        "category": "CRYPTO",
        "completedCourses": 0,
        "ongoingCourses": 1,
        "totalHours": 10
      }
    ],
    "dailyStudyStats": [
      {
        "date": "2026-04-02",
        "studyMinutes": 120
      },
      {
        "date": "2026-04-01",
        "studyMinutes": 150
      }
    ]
  },
  "message": "학습 통계를 조회했습니다."
}
```

**응답 DTO:**
```java
@Data
public class StudyStatisticsResponse {
    private Long memberId;
    private Integer totalStudyHours;
    private Integer totalCompletedCourses;
    private List<CategoryStatistics> categoryStats;
    private List<DailyStudyLog> dailyStudyStats;
}

@Data
public class CategoryStatistics {
    private String category;
    private Integer completedCourses;
    private Integer ongoingCourses;
    private Integer totalHours;
}

@Data
public class DailyStudyLog {
    private LocalDate date;
    private Integer studyMinutes;
}
```

---

## 7. 예외 처리

### 7.1 글로벌 예외 처리

**이미 구현된 예외:**
- `DuplicateEmailException` - 중복 이메일
- `EntityNotFoundException` - 리소스 없음
- `AccessDeniedException` - 권한 없음
- `BadCredentialsException` - 인증 실패

**추가로 구현할 예외:**

```java
// 404: 리소스 없음
throw new EntityNotFoundException("해당 강의를 찾을 수 없습니다.");

// 403: 권한 없음 (다른 사용자의 데이터 접근)
throw new AccessDeniedException("이 수강 기록에 접근할 권한이 없습니다.");

// 400: 검증 실패
@Validated 어노테이션 + @Valid 파라미터 검증
```

### 7.2 GlobalExceptionHandler 설정

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<?> handleEntityNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(404)
            .body(ApiResponse.error("ENTITY_NOT_FOUND", e.getMessage()));
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException e) {
        return ResponseEntity.status(403)
            .body(ApiResponse.error("ACCESS_DENIED", e.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException e) {
        return ResponseEntity.status(400)
            .body(ApiResponse.error("INVALID_REQUEST", "검증 실패"));
    }
}
```

---

## 8. 보안 & 권한

### 8.1 인증 필수 API

모든 API는 유효한 JWT 토큰 필수:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 8.2 권한 검증

**자신의 데이터만 접근 가능:**

```java
// Service 레이어에서 검증:
@PreAuthorize("hasRole('STUDENT')")
public void saveLectureProgress(Long enrollmentId, ...) {
    // enrollmentId의 소유자 == 현재 사용자 검증
    Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
        .orElseThrow(() -> new EntityNotFoundException("..."));
    
    if (!enrollment.getMemberId().equals(getCurrentMemberId())) {
        throw new AccessDeniedException("...");
    }
}
```

### 8.3 CORS 설정 (이미 구현됨)

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http.cors(cors -> cors.configurationSource(...))
            .csrf(csrf -> csrf.disable())
            ...
    }
}
```

---

## ✅ 검증 체크리스트

### API별 구현 체크리스트

- [ ] Phase 1: 강의 검색 API
  - [ ] CourseSearchRequest DTO
  - [ ] CourseSearchResponse DTO
  - [ ] Repository 쿼리 (fetch join)
  - [ ] Service 메서드
  - [ ] Controller 엔드포인트
  - [ ] 테스트 (정상 + 예외)

- [ ] Phase 2: 강의 상세 조회 개선
  - [ ] CourseDetailResponse DTO
  - [ ] SectionResponse, LectureBasicResponse DTO
  - [ ] Service 메서드
  - [ ] Controller 엔드포인트
  - [ ] 테스트

- [ ] Phase 3: 진도 추적 API
  - [ ] LectureProgressRequest DTO
  - [ ] LectureProgressResponse DTO
  - [ ] Service 메서드 (저장 + 조회)
  - [ ] Controller 엔드포인트
  - [ ] 테스트

- [ ] Phase 4: 대시보드 API
  - [ ] StudentDashboardResponse DTO
  - [ ] StudyStatisticsResponse DTO
  - [ ] Service 메서드
  - [ ] Controller 엔드포인트
  - [ ] 테스트

---

**작성자**: GitHub Copilot  
**최종 수정**: 2026-04-02

