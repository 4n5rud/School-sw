# 🧪 ChessMate P1 테스트 전략

**작성일**: 2026-04-02  
**상태**: 📋 테스트 계획 완료

---

## 📑 목차

1. [테스트 전략 개요](#1-테스트-전략-개요)
2. [테스트 유형별 계획](#2-테스트-유형별-계획)
3. [API별 테스트 케이스](#3-api별-테스트-케이스)
4. [통합 테스트 시나리오](#4-통합-테스트-시나리오)
5. [Postman 테스트 가이드](#5-postman-테스트-가이드)
6. [성능 테스트](#6-성능-테스트)
7. [보안 테스트](#7-보안-테스트)

---

## 1. 테스트 전략 개요

### 1.1 테스트 계층 구조

```
┌─────────────────────────────────────────────┐
│         E2E 테스트 (End-to-End)              │
│     (Postman, 실제 시나리오 검증)            │
├─────────────────────────────────────────────┤
│       API 테스트 (Integration Test)         │
│   (MockMvc를 이용한 Controller 테스트)       │
├─────────────────────────────────────────────┤
│      Unit Test (Service, Repository)        │
│  (Mock을 이용한 단위 테스트)                 │
└─────────────────────────────────────────────┘
```

### 1.2 테스트 기준

| 테스트 유형 | 도구 | 대상 | 커버리지 |
|:---|:---|:---|:---|
| **Unit Test** | JUnit 5, Mockito | Service, Repository | 80%+ |
| **Integration Test** | MockMvc | Controller | 90%+ |
| **E2E Test** | Postman | 전체 API 흐름 | 100% |
| **Performance Test** | JMeter (선택사항) | 성능 병목 | TBD |

---

## 2. 테스트 유형별 계획

### 2.1 Unit Test (Service Layer)

**목표**: 비즈니스 로직의 정확성 검증

**Test Class: `CourseServiceTest`**

```java
@ExtendWith(MockitoExtension.class)
class CourseServiceTest {
    
    @Mock
    private CourseRepository courseRepository;
    
    @InjectMocks
    private CourseService courseService;
    
    // ===== searchCourses 테스트 =====
    
    @DisplayName("강의 검색 - 정상 케이스")
    @Test
    void testSearchCourses_Success() {
        // Given
        String keyword = "주식";
        String category = "STOCK";
        int page = 0;
        int size = 10;
        
        List<Course> mockCourses = Arrays.asList(
            Course.builder()
                .id(1L)
                .title("주식 투자 기초")
                .category("STOCK")
                .instructor(Member.builder().id(2L).nickname("김강사").build())
                .sections(Arrays.asList(
                    Section.builder().id(1L).lectures(Arrays.asList(
                        Lecture.builder().id(1L).playTime(600).build()
                    )).build()
                ))
                .build()
        );
        
        Page<Course> mockPage = new PageImpl<>(mockCourses, 
            PageRequest.of(page, size), 1L);
        
        when(courseRepository.searchByKeywordAndCategory(
            keyword, category, PageRequest.of(page, size, Sort.by("createdAt").descending())
        )).thenReturn(mockPage);
        
        // When
        PageResponse<CourseSearchResponse> result = courseService.searchCourses(
            keyword, category, page, size
        );
        
        // Then
        assertEquals(1, result.getContent().size());
        assertEquals("주식 투자 기초", result.getContent().get(0).getTitle());
        assertEquals(0, result.getPage());
        assertEquals(1L, result.getTotalElements());
    }
    
    @DisplayName("강의 검색 - keyword 누락 시 예외")
    @Test
    void testSearchCourses_MissingKeyword() {
        // When & Then
        assertThrows(IllegalArgumentException.class, 
            () -> courseService.searchCourses("", "STOCK", 0, 10));
    }
    
    @DisplayName("강의 검색 - 유효하지 않은 category")
    @Test
    void testSearchCourses_InvalidCategory() {
        // When & Then
        assertThrows(IllegalArgumentException.class,
            () -> courseService.searchCourses("주식", "INVALID", 0, 10));
    }
}
```

**Test Class: `LectureProgressServiceTest`**

```java
@ExtendWith(MockitoExtension.class)
class LectureProgressServiceTest {
    
    @Mock
    private LectureProgressRepository lectureProgressRepository;
    
    @Mock
    private EnrollmentRepository enrollmentRepository;
    
    @Mock
    private LectureRepository lectureRepository;
    
    @Mock
    private SecurityUtils securityUtils;
    
    @InjectMocks
    private LectureProgressService lectureProgressService;
    
    @DisplayName("진도 저장 - 정상 케이스")
    @Test
    void testSaveLectureProgress_Success() {
        // Given
        Long enrollmentId = 1L;
        Long lectureId = 5L;
        Integer lastPosition = 450;
        Long memberId = 1L;
        
        Enrollment enrollment = Enrollment.builder()
            .id(enrollmentId)
            .memberId(memberId)
            .build();
        
        Lecture lecture = Lecture.builder()
            .id(lectureId)
            .title("강의 5")
            .playTime(1200)
            .build();
        
        when(securityUtils.getCurrentMemberId()).thenReturn(memberId);
        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(lectureRepository.findById(lectureId)).thenReturn(Optional.of(lecture));
        when(lectureProgressRepository.findByEnrollmentIdAndLectureId(enrollmentId, lectureId))
            .thenReturn(Optional.empty());
        
        LectureProgress saved = LectureProgress.builder()
            .id(1L)
            .enrollmentId(enrollmentId)
            .lectureId(lectureId)
            .lastPosition(lastPosition)
            .updatedAt(LocalDateTime.now())
            .build();
        
        when(lectureProgressRepository.save(any())).thenReturn(saved);
        
        // When
        LectureProgressResponse result = lectureProgressService.saveLectureProgress(
            enrollmentId, lectureId, lastPosition
        );
        
        // Then
        assertEquals(enrollmentId, result.getEnrollmentId());
        assertEquals(lectureId, result.getLectureId());
        assertEquals(lastPosition, result.getLastPosition());
        assertEquals(37, result.getProgressPercent());  // (450/1200)*100 = 37
    }
    
    @DisplayName("진도 저장 - 권한 없음 (다른 사용자)")
    @Test
    void testSaveLectureProgress_AccessDenied() {
        // Given
        Long enrollmentId = 1L;
        Long currentMemberId = 1L;
        Long enrollmentOwner = 2L;
        
        Enrollment enrollment = Enrollment.builder()
            .id(enrollmentId)
            .memberId(enrollmentOwner)
            .build();
        
        when(securityUtils.getCurrentMemberId()).thenReturn(currentMemberId);
        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        
        // When & Then
        assertThrows(AccessDeniedException.class,
            () -> lectureProgressService.saveLectureProgress(enrollmentId, 1L, 300));
    }
}
```

---

### 2.2 Integration Test (Controller Layer)

**목표**: API 엔드포인트의 전체 흐름 검증

**Test Class: `CourseControllerTest`**

```java
@SpringBootTest
@AutoConfigureMockMvc
class CourseControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private CourseService courseService;
    
    @DisplayName("GET /api/courses/search - 정상 응답")
    @Test
    void testSearchCourses_Success() throws Exception {
        // Given
        CourseSearchResponse course = CourseSearchResponse.builder()
            .id(1L)
            .title("주식 투자 기초")
            .category("STOCK")
            .instructorName("김강사")
            .build();
        
        PageResponse<CourseSearchResponse> pageResponse = PageResponse.<CourseSearchResponse>builder()
            .content(Arrays.asList(course))
            .page(0)
            .size(10)
            .totalElements(1L)
            .totalPages(1)
            .hasNext(false)
            .build();
        
        when(courseService.searchCourses("주식", "STOCK", 0, 10))
            .thenReturn(pageResponse);
        
        // When & Then
        mockMvc.perform(get("/api/courses/search")
                .param("keyword", "주식")
                .param("category", "STOCK")
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", "Bearer {token}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].title").value("주식 투자 기초"))
            .andExpect(jsonPath("$.message").value("강의 목록을 조회했습니다."));
    }
    
    @DisplayName("GET /api/courses/search - keyword 누락 시 400")
    @Test
    void testSearchCourses_MissingKeyword() throws Exception {
        mockMvc.perform(get("/api/courses/search")
                .param("category", "STOCK")
                .header("Authorization", "Bearer {token}"))
            .andExpect(status().isBadRequest());
    }
    
    @DisplayName("GET /api/courses/{courseId}/with-sections - 정상 응답")
    @Test
    void testGetCourseDetailWithSections_Success() throws Exception {
        // Given
        CourseDetailResponse detail = CourseDetailResponse.builder()
            .id(1L)
            .title("주식 투자 기초")
            .totalSections(2)
            .totalLectures(5)
            .sections(new ArrayList<>())
            .build();
        
        when(courseService.getCourseDetailWithSections(1L)).thenReturn(detail);
        
        // When & Then
        mockMvc.perform(get("/api/courses/1/with-sections")
                .header("Authorization", "Bearer {token}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalSections").value(2))
            .andExpect(jsonPath("$.data.totalLectures").value(5));
    }
}
```

---

## 3. API별 테스트 케이스

### 3.1 Phase 1: 강의 검색 API

**API**: `GET /api/courses/search?keyword=...&category=...&page=...&size=...`

#### 정상 케이스

| 테스트 ID | 입력 | 예상 결과 | 검증 항목 |
|:---|:---|:---|:---|
| TC-1.1.1 | keyword="주식", category="STOCK" | 200 OK, STOCK 강의 목록 | content size > 0, category 확인 |
| TC-1.1.2 | keyword="암호", category="CRYPTO" | 200 OK, CRYPTO 강의 목록 | content size > 0, category 확인 |
| TC-1.1.3 | keyword="투자", category=null | 200 OK, 모든 강의 | 다양한 category 포함 |
| TC-1.1.4 | 동일 요청, page=0, size=5 | 200 OK, 5개 항목 | totalPages, hasNext 확인 |
| TC-1.1.5 | 결과 없는 keyword | 200 OK, 빈 list | totalElements=0 |

#### 예외 케이스

| 테스트 ID | 입력 | 예상 결과 | 에러 메시지 |
|:---|:---|:---|:---|
| TC-1.2.1 | keyword 누락 | 400 Bad Request | "keyword는 필수입니다." |
| TC-1.2.2 | keyword="" | 400 Bad Request | "keyword는 필수입니다." |
| TC-1.2.3 | category="INVALID" | 400 Bad Request | "유효하지 않은 category" |
| TC-1.2.4 | page=-1 | 400 Bad Request | "page는 0 이상이어야 합니다." |
| TC-1.2.5 | size=100 | 400 Bad Request | "size는 50 이하여야 합니다." |
| TC-1.2.6 | 토큰 없음 | 401 Unauthorized | "인증 정보가 없습니다." |
| TC-1.2.7 | 토큰 만료 | 401 Unauthorized | "토큰이 만료되었습니다." |

---

### 3.2 Phase 2: 강의 상세 조회 API

**API**: `GET /api/courses/{courseId}/with-sections`

#### 정상 케이스

| 테스트 ID | 입력 | 예상 결과 |
|:---|:---|:---|
| TC-2.1.1 | courseId=1 | 200 OK, 강의 + 섹션 + 강의 정보 |
| TC-2.1.2 | 섹션 정렬 확인 | Section.sortOrder 오름차순 |
| TC-2.1.3 | 강의 정렬 확인 | Lecture.sortOrder 오름차순 |
| TC-2.1.4 | 통계 계산 | totalSections, totalLectures, totalPlayTime 정확성 |

#### 예외 케이스

| 테스트 ID | 입력 | 예상 결과 |
|:---|:---|:---|
| TC-2.2.1 | courseId=999 (존재 없음) | 404 Not Found |
| TC-2.2.2 | courseId 유효하지 않음 | 400 Bad Request |

---

### 3.3 Phase 3: 진도 추적 API

**API 1**: `POST /api/lecture-progress`

#### 정상 케이스

| 테스트 ID | 입력 | 예상 결과 |
|:---|:---|:---|
| TC-3.1.1 | 신규 진도 저장 | 201 Created, LectureProgress 생성 |
| TC-3.1.2 | 기존 진도 업데이트 | 201 Created, lastPosition 업데이트 |
| TC-3.1.3 | 진도율 계산 | progressPercent = (lastPosition/playTime)*100 |

#### 예외 케이스

| 테스트 ID | 입력 | 예상 결과 |
|:---|:---|:---|
| TC-3.2.1 | enrollmentId 누락 | 400 Bad Request |
| TC-3.2.2 | lectureId 누락 | 400 Bad Request |
| TC-3.2.3 | lastPosition < 0 | 400 Bad Request |
| TC-3.2.4 | 타인의 enrollment | 403 Forbidden |
| TC-3.2.5 | 존재하지 않는 enrollment | 404 Not Found |

**API 2**: `GET /api/lecture-progress/lectures/{lectureId}?enrollmentId=...`

#### 테스트 케이스

| 테스트 ID | 입력 | 예상 결과 |
|:---|:---|:---|
| TC-3.3.1 | 저장된 진도 조회 | 200 OK, 진도 정보 |
| TC-3.3.2 | 저장되지 않은 진도 | 200 OK, lastPosition=0 |
| TC-3.3.3 | 타인의 enrollment | 403 Forbidden |

**API 3**: `GET /api/enrollments/{enrollmentId}/progress`

#### 테스트 케이스

| 테스트 ID | 입력 | 예상 결과 |
|:---|:---|:---|
| TC-3.4.1 | 유효한 enrollmentId | 200 OK, 전체 진도 정보 |
| TC-3.4.2 | 진도율 계산 | overallProgressPercent 정확성 |
| TC-3.4.3 | 타인의 enrollment | 403 Forbidden |

---

### 3.4 Phase 4: 대시보드 API

**API 1**: `GET /api/students/dashboard`

#### 테스트 케이스

| 테스트 ID | 입력 | 예상 결과 |
|:---|:---|:---|
| TC-4.1.1 | 정상 요청 | 200 OK, 대시보드 정보 |
| TC-4.1.2 | 통계 계산 | totalStudyHours, completedCourses, ongoingCourses |
| TC-4.1.3 | 수강 강의 목록 | enrollmentSummaries 정확성 |

**API 2**: `GET /api/students/study-stats`

#### 테스트 케이스

| 테스트 ID | 입력 | 예상 결과 |
|:---|:---|:---|
| TC-4.2.1 | 정상 요청 | 200 OK, 상세 통계 |
| TC-4.2.2 | 카테고리별 통계 | categoryStats 정확성 |
| TC-4.2.3 | 일별 학습 로그 | dailyStudyStats 정확성 |

---

## 4. 통합 테스트 시나리오

### 4.1 시나리오: 사용자의 완전한 학습 경험

```
사전 조건:
- 테스트 DB에 강의 데이터 준비됨 (Course, Section, Lecture)
- 테스트 사용자가 생성됨 (회원가입 완료)

시나리오 흐름:
```

#### Step 1: 로그인 및 토큰 획득

```
POST /api/auth/login
{
  "email": "student@example.com",
  "password": "password123"
}

기대 응답:
{
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "memberId": 1,
    "nickname": "학생"
  },
  "message": "로그인에 성공했습니다."
}
```

#### Step 2: 강의 검색

```
GET /api/courses/search?keyword=주식&category=STOCK&page=0&size=10
Authorization: Bearer {accessToken}

검증 항목:
- 강의 목록 반환됨
- totalElements > 0
- category = STOCK
```

#### Step 3: 강의 상세 조회

```
GET /api/courses/1/with-sections
Authorization: Bearer {accessToken}

검증 항목:
- 강의 상세 정보 + 섹션/강의 리스트
- totalSections > 0
- totalLectures > 0
```

#### Step 4: 수강 신청

```
POST /api/enrollments
{
  "courseId": 1
}
Authorization: Bearer {accessToken}

기대 응답:
{
  "data": {
    "enrollmentId": 1,
    "courseId": 1,
    "enrolledAt": "2026-04-02T10:00:00"
  }
}

후속: enrollmentId 저장
```

#### Step 5: 강의 진도 저장 (여러 번)

```
POST /api/lecture-progress
Authorization: Bearer {accessToken}

요청 1: lectureId=1, lastPosition=600
요청 2: lectureId=2, lastPosition=450
요청 3: lectureId=3, lastPosition=0

검증 항목:
- 각 요청에서 201 Created
- progressPercent 정확성
```

#### Step 6: 진도 조회

```
GET /api/enrollments/1/progress
Authorization: Bearer {accessToken}

검증 항목:
- 모든 강의의 진도 정보 반환
- overallProgressPercent = (2/3) * 100 ≈ 66%
```

#### Step 7: 대시보드 조회

```
GET /api/students/dashboard
Authorization: Bearer {accessToken}

검증 항목:
- totalEnrollments = 1
- ongoingCourses = 1
- enrollmentSummaries[0].progressPercent = 66
```

#### Step 8: 상세 통계 조회

```
GET /api/students/study-stats
Authorization: Bearer {accessToken}

검증 항목:
- categoryStats[0].category = "STOCK"
- totalStudyHours 계산 정확성
```

---

## 5. Postman 테스트 가이드

### 5.1 Postman 컬렉션 구조

```
ChessMate_P1_API
├── Authentication
│   ├── Signup
│   └── Login
├── Phase 1: Search
│   ├── Search Courses
│   └── Search - Error Cases
├── Phase 2: Course Detail
│   ├── Get Course Detail
│   └── Get Course Detail - Error Cases
├── Phase 3: Lecture Progress
│   ├── Save Progress
│   ├── Get Lecture Progress
│   ├── Get Enrollment Progress
│   └── Error Cases
├── Phase 4: Dashboard
│   ├── Get Dashboard
│   ├── Get Study Stats
│   └── Error Cases
└── Integration Scenarios
    ├── Complete Learning Flow
    └── Multiple Users Flow
```

### 5.2 환경 변수 설정

**Environment: Local**

```json
{
  "baseUrl": "http://localhost:8080",
  "accessToken": "{{Bearer Token}}",
  "memberId": 1,
  "enrollmentId": 1,
  "courseId": 1,
  "lectureId": 1
}
```

### 5.3 테스트 실행 방법

```bash
# 1. Postman UI에서 컬렉션 실행
- ChessMate_P1_API 선택
- Environment: Local 선택
- Run 클릭
- 결과 확인

# 2. Command Line에서 실행 (Newman)
newman run ChessMate_P1_API.postman_collection.json \
  -e ChessMate_Local.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export test-results.json
```

---

## 6. 성능 테스트

### 6.1 테스트 항목

| 테스트 | 조건 | 목표 |
|:---|:---|:---|
| 강의 검색 | 1000개 강의, 동시 100 사용자 | 응답 시간 < 500ms |
| 강의 상세 조회 | fetch join 활용 | N+1 문제 없음 |
| 진도 저장 | 동시 50 요청 | 응답 시간 < 200ms |
| 대시보드 조회 | 복잡한 쿼리 | 응답 시간 < 1초 |

### 6.2 JMeter 설정 (선택사항)

```
# 강의 검색 부하 테스트
Thread Group: 100 users, 10 second ramp-up, 5 minute duration
HTTP Request: GET /api/courses/search?keyword=주식&category=STOCK

Listeners:
- Summary Report
- Response Time Graph
- Aggregate Report

Success Criteria:
- 95% response time < 500ms
- Error rate < 1%
```

---

## 7. 보안 테스트

### 7.1 인증 테스트

| 테스트 | 입력 | 예상 결과 |
|:---|:---|:---|
| 토큰 없음 | Authorization 헤더 없음 | 401 Unauthorized |
| 유효하지 않은 토큰 | 잘못된 서명 | 401 Unauthorized |
| 만료된 토큰 | 만료 시간 초과 | 401 Unauthorized |
| 타사용자 토큰 | 다른 사용자의 토큰 | 200 OK (자신의 데이터만) |

### 7.2 권한 테스트

| 테스트 | 시나리오 | 예상 결과 |
|:---|:---|:---|
| 타인의 enrollment 접근 | 사용자 1이 사용자 2의 enrollment 조회 | 403 Forbidden |
| 타인의 진도 저장 | 사용자 1이 사용자 2의 enrollment에 진도 저장 | 403 Forbidden |
| 타인의 대시보드 | URL 조작으로 다른 사용자 대시보드 접근 | 고유 memberId 기반으로만 자신의 정보 제공 |

---

## ✅ 최종 체크리스트

### 테스트 완료 항목

- [ ] Unit Test: CourseServiceTest 작성 및 실행 (80%+ 통과)
- [ ] Unit Test: LectureProgressServiceTest 작성 및 실행 (80%+ 통과)
- [ ] Integration Test: CourseControllerTest 작성 및 실행 (90%+ 통과)
- [ ] Integration Test: LectureProgressControllerTest 작성 및 실행 (90%+ 통과)
- [ ] Postman: 모든 API 정상 케이스 테스트 완료
- [ ] Postman: 모든 API 예외 케이스 테스트 완료
- [ ] 통합 테스트: 전체 시나리오 5회 이상 성공
- [ ] 성능 테스트: 목표 응답 시간 달성
- [ ] 보안 테스트: 권한 검증 및 토큰 검증 통과

---

**작성자**: GitHub Copilot  
**최종 수정**: 2026-04-02

