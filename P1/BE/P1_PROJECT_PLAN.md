# 📋 ChessMate P1 프로젝트 기획 문서

**작성일**: 2026-04-02  
**프로젝트명**: ChessMate - 온라인 투자 강의 플랫폼  
**단계**: P1 MVP (학생 중심 기능)  
**목표 완료일**: 2026-04-15  
**상태**: 🔄 구현 진행 중

---

## 1️⃣ 프로젝트 개요

### 1.1 프로젝트 목표

ChessMate는 **주식/암호화폐 투자 교육을 제공하는 온라인 강의 플랫폼**입니다.

**P1 MVP의 핵심 목표:**
```
학생(수강자) 입장에서 강의를 발견하고, 수강하고, 학습 진도를 추적할 수 있는 
완전한 학습 경험을 제공하기
```

### 1.2 핵심 페르소나 & 사용 시나리오

#### 주요 사용자
1. **초보 투자자** - 기초 지식을 배우고 싶은 사람
2. **중급 학습자** - 심화 과정으로 실력을 높이고 싶은 사람  
3. **바쁜 직장인** - 효율적으로 단시간에 학습하려는 사람

#### 핵심 사용 경로 (User Journey)
```
1. 로그인 → 메인 페이지
2. 강의 검색/조회 → 강의 상세 정보 확인
3. 수강 신청 (Enrollment) → 강의 재생
4. 진도 추적 (LectureProgress 기록)
5. 마이페이지 대시보드에서 학습 현황 확인
```

---

## 2️⃣ 현재 상태 분석

### 2.1 ✅ 이미 구현된 기능

| 계층 | 구현 내용 |
|:---|:---|
| **엔티티** | Member, Course, Section, Lecture, Enrollment, LectureProgress |
| **인증** | JWT 기반 인증/인가, Spring Security 6 설정 |
| **API** | 회원가입, 로그인, 강의 조회(목록/상세), 수강 신청, 수강 목록 조회 |
| **예외 처리** | GlobalExceptionHandler로 중앙식 처리 |
| **보안** | BCrypt 암호화, CORS 설정, 권한 검증 |

### 2.2 🔄 추가로 구현할 기능

| Phase | 기능 | API 개수 | 예상 시간 |
|:---|:---|:---:|:---:|
| **Phase 1** | 검색 & 필터링 API | 2 | 1.5h |
| **Phase 2** | 강의 상세 조회 개선 | 1 | 1.5h |
| **Phase 3** | 진도 추적 API | 3 | 2.5h |
| **Phase 4** | 학생 대시보드 | 2 | 2.5h |
| **Phase 5** | 통합 테스트 & 문서화 | 0 | 2h |
| **총계** | | **8개 API** | **~10시간** |

---

## 3️⃣ 기술 스택 & 아키텍처

### 3.1 백엔드 기술 스택

```
Language:     Java 17
Framework:    Spring Boot 3.2.x
ORM:          JPA/Hibernate
Auth:         JWT + Spring Security 6
Validation:   Jakarta Validation
Database:     H2 (개발), MySQL (프로덕션)
Build:        Gradle
Testing:      JUnit 5, MockMvc
```

### 3.2 API 계층 구조

```
HTTP Request (JWT Token in Authorization Header)
    ↓
JwtAuthenticationFilter
  ├─ 헤더에서 토큰 추출
  ├─ 토큰 검증 (JwtTokenProvider)
  ├─ Member ID & Role 추출
  └─ SecurityContext에 저장
    ↓
@RestController (요청 검증)
    ↓
@Service (비즈니스 로직)
    ↓
@Repository (데이터 접근)
    ↓
Database
```

---

## 4️⃣ 5 Phase 상세 계획

### Phase 1: 검색 & 필터링 API (1.5시간)

**목표**: 사용자가 키워드와 카테고리로 강의를 검색할 수 있도록 구현

**구현 내용:**
- `GET /api/courses/search?keyword=...&category=...&page=...` - 강의 검색 (페이지네이션 포함)
- 강의 제목, 설명에서 키워드 검색
- 카테고리(STOCK, CRYPTO) 필터링
- 페이지네이션(0-based)

**핵심 DTO:**
- `CourseSearchRequest` - 검색 조건 (keyword, category, page, size)
- `CourseSearchResponse` - 검색 결과 (강의 기본 정보 + 강사 정보)

---

### Phase 2: 강의 상세 조회 개선 (1.5시간)

**목표**: 강의 커리큘럼(섹션/강의)을 포함한 상세 정보 제공

**구현 내용:**
- `GET /api/courses/{courseId}/with-sections` - 강의 상세 + 모든 섹션/강의 조회
- Section & Lecture 구조를 함께 조회
- 강사 정보 포함
- 총 강의 시간, 섹션 개수 등 통계 정보 포함

**핵심 DTO:**
- `CourseDetailResponse` - 강의 상세 정보 (제목, 설명, 가격, 강사, 섹션 목록)
- `SectionResponse` - 섹션 정보 (섹션명, 강의 목록)
- `LectureBasicResponse` - 강의 기본 정보 (제목, 영상 길이)

---

### Phase 3: 진도 추적 API (2.5시간)

**목표**: 사용자가 강의 시청 위치를 저장하고 조회할 수 있도록 구현

**구현 내용:**
- `POST /api/lecture-progress` - 강의 진도 저장 (영상 시청 위치 기록)
- `GET /api/lecture-progress/lectures/{lectureId}` - 특정 강의의 진도 조회
- `GET /api/enrollments/{enrollmentId}/progress` - 수강 강의의 전체 진도 조회
- 시청 중단 위치(`last_position`)를 자동으로 저장
- 강의 완료 여부 자동 판단 (진도 100%)

**핵심 DTO:**
- `LectureProgressRequest` - 진도 저장 요청 (enrollmentId, lectureId, lastPosition)
- `LectureProgressResponse` - 진도 정보 (강의명, 진도율, 마지막 시청 위치)
- `EnrollmentProgressResponse` - 수강 강의 전체 진도 (강의명, 강의별 진도율)

---

### Phase 4: 학생 대시보드 API (2.5시간)

**목표**: 학생이 자신의 학습 현황을 한 눈에 볼 수 있는 대시보드 제공

**구현 내용:**
- `GET /api/students/dashboard` - 대시보드 (종합 통계)
  - 수강 중인 강의 목록 (진도율 포함)
  - 완강한 강의 통계
  - 총 학습 시간
  - 이번 주 학습 시간
  
- `GET /api/students/study-stats` - 상세 학습 통계
  - 강의별 진도율
  - 강의별 총 시청 시간
  - 카테고리별 완강 개수

**핵심 DTO:**
- `StudentDashboardResponse` - 대시보드 정보
- `EnrollmentProgressSummary` - 수강 강의 진도 요약
- `StudyStatisticsResponse` - 학습 통계

---

### Phase 5: 통합 테스트 & 문서화 (2시간)

**목표**: 모든 기능을 통합적으로 테스트하고 API 문서 완성

**구현 내용:**
- Postman 컬렉션 업데이트 (모든 API 포함)
- API 명세서 최종 검증
- 예외 상황 테스트 (잘못된 토큰, 존재하지 않는 리소스 등)
- 통합 테스트 시나리오 (회원가입 → 로그인 → 강의 검색 → 수강 신청 → 진도 추적 → 대시보드 확인)

---

## 5️⃣ 데이터베이스 스키마

### 5.1 핵심 테이블 (이미 구현됨)

```sql
-- 사용자
MEMBER (id, email, password, nickname, role, created_at)

-- 강의
COURSE (id, title, description, category, price, thumbnail_url, instructor_id, created_at)

-- 섹션
SECTION (id, course_id, title, sort_order)

-- 강의(영상)
LECTURE (id, section_id, title, video_url, play_time, sort_order)

-- 수강
ENROLLMENT (id, member_id, course_id, enrolled_at, is_completed)

-- 진도 추적
LECTURE_PROGRESS (id, member_id, lecture_id, last_position, updated_at)
```

### 5.2 필요한 DB 쿼리 최적화

- **N+1 문제 해결**: JPQL `fetch join` 사용
- **인덱스 추가**: course(category), lecture_progress(member_id, lecture_id)
- **쿼리 성능**: 검색 시 페이지네이션 필수

---

## 6️⃣ 개발 프로세스

### 6.1 커밋 전략 (작은 단위로 자주 커밋)

```
[Phase1-Step1] DTO 정의: CourseSearchRequest, CourseSearchResponse
[Phase1-Step2] Repository 쿼리 추가: searchCoursesByKeywordAndCategory
[Phase1-Step3] Service 로직: searchCourses 메서드
[Phase1-Step4] Controller 엔드포인트: GET /api/courses/search
[Phase1-Step5] 예외 처리 및 테스트

[Phase2-Step1] ...
```

### 6.2 테스트 전략

**Unit Test**
- Service 레이어 테스트 (MockRepository 사용)
- DTO 검증 테스트

**Integration Test**
- Controller 엔드포인트 테스트 (MockMvc 사용)
- 실제 DB와의 통합 테스트

**API Test (Postman)**
- 각 엔드포인트 수동 테스트
- 예외 상황 검증

---

## 7️⃣ 성공 기준

### 7.1 기능 완성도

- [x] Phase 1: 검색 API 완성 및 테스트
- [x] Phase 2: 강의 상세 조회 완성 및 테스트
- [x] Phase 3: 진도 추적 API 완성 및 테스트
- [x] Phase 4: 대시보드 API 완성 및 테스트
- [x] Phase 5: 통합 테스트 및 문서화 완성

### 7.2 코드 품질

- [ ] 모든 API에 예외 처리 포함
- [ ] Service/Repository 계층 분리 명확함
- [ ] DTO를 통한 요청/응답 분리
- [ ] 코드 리뷰 완료

### 7.3 테스트 커버리지

- [ ] 모든 엔드포인트 테스트 완료 (Postman)
- [ ] 정상 케이스 + 예외 케이스 테스트
- [ ] 권한 검증 테스트

---

## 8️⃣ 리스크 및 대응 방안

| 리스크 | 영향 | 대응 방안 |
|:---|:---|:---|
| N+1 쿼리 문제 | 성능 저하 | Fetch Join 사용, 쿼리 최적화 |
| 토큰 만료 시 재발급 | 사용성 저하 | Refresh Token 로직 추가 |
| 대량 데이터 검색 시 성능 | 속도 저하 | 페이지네이션, 인덱스 활용 |
| 강사 정보 없을 때 NPE | 시스템 오류 | Null 체크, Optional 사용 |

---

## 9️⃣ 예상 타임라인

```
Day 1 (4월 2일)
  - 09:00 ~ 10:00: P1 기획 + API 명세서 작성
  - 10:00 ~ 11:30: Phase 1 구현 (검색 API)
  - 11:30 ~ 12:30: Phase 1 테스트 및 커밋

Day 2 (4월 3일)
  - 09:00 ~ 10:30: Phase 2 구현 (강의 상세 조회)
  - 10:30 ~ 12:00: Phase 3 구현 (진도 추적)

Day 3 (4월 4일)
  - 09:00 ~ 11:00: Phase 4 구현 (대시보드)
  - 11:00 ~ 13:00: Phase 5 통합 테스트 & 문서화

→ 예상 완료: 2026-04-04 (약 10시간)
```

---

## 🔟 문서 참조

- 📄 `P1_DETAILED_API_SPEC.md` - API 요청/응답 상세 명세
- 📄 `P1_IMPLEMENTATION_PLAN.md` - 단계별 구현 체크리스트
- 📄 `P1_TEST_STRATEGY.md` - 테스트 시나리오 및 검증 기준
- 📄 `P1_DEVELOPMENT_GUIDE.md` - 개발 규칙 및 커밋 가이드

---

**작성자**: GitHub Copilot  
**최종 수정**: 2026-04-02

