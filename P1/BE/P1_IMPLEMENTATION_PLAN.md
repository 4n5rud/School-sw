# 🛠️ ChessMate P1 구현 계획서

**작성일**: 2026-04-02  
**상태**: 📋 구현 준비 완료

---

## 📑 목차

1. [Phase 1: 검색 & 필터링 API](#phase-1-검색--필터링-api)
2. [Phase 2: 강의 상세 조회 개선](#phase-2-강의-상세-조회-개선)
3. [Phase 3: 진도 추적 API](#phase-3-진도-추적-api)
4. [Phase 4: 학생 대시보드](#phase-4-학생-대시보드)
5. [Phase 5: 통합 테스트 & 문서화](#phase-5-통합-테스트--문서화)

---

## Phase 1: 검색 & 필터링 API

**예상 시간**: 1.5시간  
**커밋 개수**: 5개

### Step 1.1: DTO 정의 (15분)

**파일 생성:**
- `src/main/java/com/chessmate/be/dto/request/CourseSearchRequest.java`
- `src/main/java/com/chessmate/be/dto/response/CourseSearchResponse.java`
- `src/main/java/com/chessmate/be/dto/response/PageResponse.java`

**내용:**
```java
// CourseSearchRequest.java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSearchRequest {
    @NotBlank(message = "keyword는 필수입니다.")
    private String keyword;
    
    private String category;
    
    @Min(value = 0)
    private Integer page = 0;
    
    @Min(value = 1)
    @Max(value = 50)
    private Integer size = 10;
}

// CourseSearchResponse.java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSearchResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Integer price;
    private String thumbnailUrl;
    private Long instructorId;
    private String instructorName;
    private Integer totalLectures;
    private Integer totalPlayTime;
    private LocalDateTime createdAt;
}

// PageResponse.java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageResponse<T> {
    private List<T> content;
    private Integer page;
    private Integer size;
    private Long totalElements;
    private Integer totalPages;
    private Boolean hasNext;
}
```

**커밋:**
```
[Phase1-Step1] DTO 정의: CourseSearchRequest, CourseSearchResponse, PageResponse
```

---

### Step 1.2: Repository 쿼리 추가 (20분)

**파일 수정:**
- `src/main/java/com/chessmate/be/repository/CourseRepository.java`

**추가 메서드:**
```java
@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    // 기존 메서드들...
    
    // 새로운 메서드
    Page<Course> findByKeywordAndCategory(
        String keyword, 
        String category, 
        Pageable pageable
    );
    
    // JPQL 쿼리 (fetch join)
    @Query("""
        SELECT DISTINCT c
        FROM Course c
        LEFT JOIN FETCH c.instructor i
        LEFT JOIN FETCH c.sections s
        LEFT JOIN FETCH s.lectures l
        WHERE (LOWER(c.title) LIKE CONCAT('%', LOWER(:keyword), '%')
            OR LOWER(c.description) LIKE CONCAT('%', LOWER(:keyword), '%'))
          AND (:category IS NULL OR c.category = :category)
        ORDER BY c.createdAt DESC
        """)
    Page<Course> searchByKeywordAndCategory(
        @Param("keyword") String keyword,
        @Param("category") String category,
        Pageable pageable
    );
}
```

**주의사항:**
- DISTINCT 사용 (fetch join으로 인한 중복 제거)
- Pageable과 fetch join 함께 사용 시 주의 (메모리 페이징 가능)
- N+1 문제 해결을 위해 fetch join 필수

**커밋:**
```
[Phase1-Step2] Repository: 강의 검색 쿼리 추가 (searchByKeywordAndCategory)
```

---

### Step 1.3: Service 로직 구현 (30분)

**파일 수정/생성:**
- `src/main/java/com/chessmate/be/service/CourseService.java`

**추가 메서드:**
```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseService {
    
    private final CourseRepository courseRepository;
    private final ModelMapper modelMapper;
    
    /**
     * 강의 검색
     * 
     * @param keyword 검색 키워드 (제목, 설명)
     * @param category 카테고리 필터 (STOCK, CRYPTO)
     * @param page 페이지 번호 (0-based)
     * @param size 페이지 크기
     * @return 검색 결과 + 페이징 정보
     */
    public PageResponse<CourseSearchResponse> searchCourses(
        String keyword,
        String category,
        Integer page,
        Integer size
    ) {
        // 입력값 검증
        if (keyword == null || keyword.isBlank()) {
            throw new IllegalArgumentException("keyword는 필수입니다.");
        }
        
        // category 검증
        if (category != null && !isValidCategory(category)) {
            throw new IllegalArgumentException("유효하지 않은 category입니다.");
        }
        
        // 페이지네이션 설정
        Pageable pageable = PageRequest.of(
            page, 
            size, 
            Sort.by("createdAt").descending()
        );
        
        // Repository에서 데이터 조회
        Page<Course> courses = courseRepository.searchByKeywordAndCategory(
            keyword.trim(),
            category,
            pageable
        );
        
        // DTO 변환
        List<CourseSearchResponse> content = courses.getContent().stream()
            .map(this::convertToCourseSearchResponse)
            .collect(Collectors.toList());
        
        // PageResponse 생성
        return PageResponse.<CourseSearchResponse>builder()
            .content(content)
            .page(page)
            .size(size)
            .totalElements(courses.getTotalElements())
            .totalPages(courses.getTotalPages())
            .hasNext(courses.hasNext())
            .build();
    }
    
    /**
     * Course → CourseSearchResponse 변환
     */
    private CourseSearchResponse convertToCourseSearchResponse(Course course) {
        int totalLectures = course.getSections().stream()
            .mapToInt(s -> s.getLectures().size())
            .sum();
        
        int totalPlayTime = course.getSections().stream()
            .flatMap(s -> s.getLectures().stream())
            .mapToInt(Lecture::getPlayTime)
            .sum();
        
        return CourseSearchResponse.builder()
            .id(course.getId())
            .title(course.getTitle())
            .description(course.getDescription())
            .category(course.getCategory())
            .price(course.getPrice())
            .thumbnailUrl(course.getThumbnailUrl())
            .instructorId(course.getInstructor().getId())
            .instructorName(course.getInstructor().getNickname())
            .totalLectures(totalLectures)
            .totalPlayTime(totalPlayTime)
            .createdAt(course.getCreatedAt())
            .build();
    }
    
    /**
     * category 유효성 검증
     */
    private boolean isValidCategory(String category) {
        return category.equals("STOCK") || category.equals("CRYPTO");
    }
}
```

**커밋:**
```
[Phase1-Step3] Service: CourseService.searchCourses 메서드 구현
```

---

### Step 1.4: Controller 엔드포인트 구현 (20분)

**파일 수정:**
- `src/main/java/com/chessmate/be/controller/CourseController.java`

**추가 메서드:**
```java
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {
    
    private final CourseService courseService;
    
    /**
     * 강의 검색
     * 
     * GET /api/courses/search?keyword=주식&category=STOCK&page=0&size=10
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchCourses(
        @RequestParam(required = true) String keyword,
        @RequestParam(required = false) String category,
        @RequestParam(defaultValue = "0") Integer page,
        @RequestParam(defaultValue = "10") Integer size
    ) {
        try {
            PageResponse<CourseSearchResponse> result = courseService.searchCourses(
                keyword,
                category,
                page,
                size
            );
            
            return ResponseEntity.ok(
                ApiResponse.success("강의 목록을 조회했습니다.", result)
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("INVALID_REQUEST", e.getMessage()));
        }
    }
}
```

**커밋:**
```
[Phase1-Step4] Controller: GET /api/courses/search 엔드포인트 구현
```

---

### Step 1.5: 테스트 및 검증 (15분)

**테스트 항목:**
1. 정상 케이스
   - 검색어 "주식" + 카테고리 "STOCK" → 결과 확인
   - 페이지네이션 (page=0, size=5) → 결과 확인
   - category 없이 검색 → 모든 카테고리 결과

2. 예외 케이스
   - keyword 누락 → 400 Bad Request
   - 유효하지 않은 category → 400 Bad Request
   - page < 0 → 400 Bad Request
   - 검색 결과 없음 → 200 OK + empty list

**Postman 테스트:**
```
GET /api/courses/search?keyword=주식&category=STOCK&page=0&size=10
Authorization: Bearer {accessToken}
```

**기대 응답:**
```json
{
  "data": {
    "content": [...],
    "page": 0,
    "size": 10,
    "totalElements": 5,
    "totalPages": 1,
    "hasNext": false
  },
  "message": "강의 목록을 조회했습니다."
}
```

**커밋:**
```
[Phase1-Step5] Test: 강의 검색 API 테스트 및 검증 완료
```

---

## Phase 2: 강의 상세 조회 개선

**예상 시간**: 1.5시간  
**커밋 개수**: 4개

### Step 2.1: DTO 정의 (15분)

**파일 생성:**
- `src/main/java/com/chessmate/be/dto/response/CourseDetailResponse.java`
- `src/main/java/com/chessmate/be/dto/response/SectionResponse.java`
- `src/main/java/com/chessmate/be/dto/response/LectureBasicResponse.java`

**내용:**
```java
// CourseDetailResponse.java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseDetailResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Integer price;
    private String thumbnailUrl;
    private Long instructorId;
    private String instructorName;
    private Integer totalSections;
    private Integer totalLectures;
    private Integer totalPlayTime;
    private LocalDateTime createdAt;
    private List<SectionResponse> sections;
}

// SectionResponse.java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionResponse {
    private Long id;
    private String title;
    private Integer sortOrder;
    private List<LectureBasicResponse> lectures;
}

// LectureBasicResponse.java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LectureBasicResponse {
    private Long id;
    private String title;
    private String videoUrl;
    private Integer playTime;
    private Integer sortOrder;
}
```

**커밋:**
```
[Phase2-Step1] DTO 정의: CourseDetailResponse, SectionResponse, LectureBasicResponse
```

---

### Step 2.2: Service 메서드 구현 (30분)

**파일 수정:**
- `src/main/java/com/chessmate/be/service/CourseService.java`

**추가 메서드:**
```java
public CourseDetailResponse getCourseDetailWithSections(Long courseId) {
    Course course = courseRepository.findByIdWithSectionsAndLectures(courseId)
        .orElseThrow(() -> new EntityNotFoundException("해당 강의를 찾을 수 없습니다."));
    
    // 섹션 및 강의 변환
    List<SectionResponse> sectionResponses = course.getSections().stream()
        .sorted(Comparator.comparingInt(Section::getSortOrder))
        .map(section -> {
            List<LectureBasicResponse> lectureResponses = section.getLectures().stream()
                .sorted(Comparator.comparingInt(Lecture::getSortOrder))
                .map(lecture -> LectureBasicResponse.builder()
                    .id(lecture.getId())
                    .title(lecture.getTitle())
                    .videoUrl(lecture.getVideoUrl())
                    .playTime(lecture.getPlayTime())
                    .sortOrder(lecture.getSortOrder())
                    .build())
                .collect(Collectors.toList());
            
            return SectionResponse.builder()
                .id(section.getId())
                .title(section.getTitle())
                .sortOrder(section.getSortOrder())
                .lectures(lectureResponses)
                .build();
        })
        .collect(Collectors.toList());
    
    // 통계 계산
    int totalLectures = course.getSections().stream()
        .mapToInt(s -> s.getLectures().size())
        .sum();
    
    int totalPlayTime = course.getSections().stream()
        .flatMap(s -> s.getLectures().stream())
        .mapToInt(Lecture::getPlayTime)
        .sum();
    
    return CourseDetailResponse.builder()
        .id(course.getId())
        .title(course.getTitle())
        .description(course.getDescription())
        .category(course.getCategory())
        .price(course.getPrice())
        .thumbnailUrl(course.getThumbnailUrl())
        .instructorId(course.getInstructor().getId())
        .instructorName(course.getInstructor().getNickname())
        .totalSections(course.getSections().size())
        .totalLectures(totalLectures)
        .totalPlayTime(totalPlayTime)
        .createdAt(course.getCreatedAt())
        .sections(sectionResponses)
        .build();
}
```

**Repository에 추가할 쿼리:**
```java
@Query("""
    SELECT c
    FROM Course c
    LEFT JOIN FETCH c.instructor i
    LEFT JOIN FETCH c.sections s
    LEFT JOIN FETCH s.lectures l
    WHERE c.id = :courseId
    ORDER BY s.sortOrder ASC, l.sortOrder ASC
    """)
Optional<Course> findByIdWithSectionsAndLectures(@Param("courseId") Long courseId);
```

**커밋:**
```
[Phase2-Step2] Service: CourseService.getCourseDetailWithSections 메서드 구현
```

---

### Step 2.3: Controller 엔드포인트 구현 (20분)

**파일 수정:**
- `src/main/java/com/chessmate/be/controller/CourseController.java`

**추가 메서드:**
```java
/**
 * 강의 상세 조회 (섹션/강의 포함)
 * 
 * GET /api/courses/{courseId}/with-sections
 */
@GetMapping("/{courseId}/with-sections")
public ResponseEntity<?> getCourseDetailWithSections(
    @PathVariable Long courseId
) {
    try {
        CourseDetailResponse result = courseService.getCourseDetailWithSections(courseId);
        return ResponseEntity.ok(
            ApiResponse.success("강의 상세 정보를 조회했습니다.", result)
        );
    } catch (EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error("ENTITY_NOT_FOUND", e.getMessage()));
    }
}
```

**커밋:**
```
[Phase2-Step3] Controller: GET /api/courses/{courseId}/with-sections 엔드포인트 구현
```

---

### Step 2.4: 테스트 및 검증 (15분)

**테스트 항목:**
1. 정상 케이스
   - 존재하는 courseId → 상세 정보 + 섹션/강의 반환
   - 섹션/강의 sortOrder 정렬 확인

2. 예외 케이스
   - 존재하지 않는 courseId → 404 Not Found

**Postman 테스트:**
```
GET /api/courses/1/with-sections
Authorization: Bearer {accessToken}
```

**커밋:**
```
[Phase2-Step4] Test: 강의 상세 조회 API 테스트 및 검증 완료
```

---

## Phase 3: 진도 추적 API

**예상 시간**: 2.5시간  
**커밋 개수**: 6개

### Step 3.1: DTO 정의 (15분)

**파일 생성:**
- `src/main/java/com/chessmate/be/dto/request/LectureProgressRequest.java`
- `src/main/java/com/chessmate/be/dto/response/LectureProgressResponse.java`
- `src/main/java/com/chessmate/be/dto/response/EnrollmentProgressResponse.java`
- `src/main/java/com/chessmate/be/dto/response/LectureProgressDetail.java`

**내용:**
```java
// LectureProgressRequest.java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LectureProgressRequest {
    @NotNull(message = "enrollmentId는 필수입니다.")
    private Long enrollmentId;
    
    @NotNull(message = "lectureId는 필수입니다.")
    private Long lectureId;
    
    @NotNull(message = "lastPosition은 필수입니다.")
    @Min(value = 0, message = "lastPosition은 0 이상이어야 합니다.")
    private Integer lastPosition;
}

// LectureProgressResponse.java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LectureProgressResponse {
    private Long id;
    private Long enrollmentId;
    private Long lectureId;
    private String lectureName;
    private Integer lastPosition;
    private Integer lecturePlayTime;
    private Integer progressPercent;
    private LocalDateTime updatedAt;
}

// LectureProgressDetail.java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LectureProgressDetail {
    private Long lectureId;
    private String lectureName;
    private Integer lastPosition;
    private Integer lecturePlayTime;
    private Integer progressPercent;
    private Boolean isCompleted;
    private LocalDateTime updatedAt;
}

// EnrollmentProgressResponse.java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentProgressResponse {
    private Long enrollmentId;
    private Long courseId;
    private String courseName;
    private Boolean isCompleted;
    private LocalDateTime enrolledAt;
    private Integer totalLectures;
    private Integer completedLectures;
    private Integer overallProgressPercent;
    private List<LectureProgressDetail> lectureProgress;
}
```

**커밋:**
```
[Phase3-Step1] DTO 정의: LectureProgressRequest, LectureProgressResponse, EnrollmentProgressResponse
```

---

### Step 3.2: Repository 메서드 추가 (15분)

**파일 수정:**
- `src/main/java/com/chessmate/be/repository/LectureProgressRepository.java`

**추가 메서드:**
```java
@Repository
public interface LectureProgressRepository extends JpaRepository<LectureProgress, Long> {
    
    Optional<LectureProgress> findByEnrollmentIdAndLectureId(
        Long enrollmentId,
        Long lectureId
    );
    
    List<LectureProgress> findByEnrollmentIdOrderByUpdatedAtDesc(Long enrollmentId);
    
    List<LectureProgress> findByMemberIdAndUpdatedAtAfter(
        Long memberId,
        LocalDateTime from
    );
}
```

**커밋:**
```
[Phase3-Step2] Repository: LectureProgressRepository 메서드 추가
```

---

### Step 3.3: Service 메서드 구현 (1시간)

**파일 수정:**
- `src/main/java/com/chessmate/be/service/LectureProgressService.java` (신규)

**내용:**
```java
@Service
@RequiredArgsConstructor
@Transactional
public class LectureProgressService {
    
    private final LectureProgressRepository lectureProgressRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LectureRepository lectureRepository;
    private final SecurityUtils securityUtils;  // 현재 사용자 정보
    
    /**
     * 강의 진도 저장
     */
    public LectureProgressResponse saveLectureProgress(
        Long enrollmentId,
        Long lectureId,
        Integer lastPosition
    ) {
        // 1. Enrollment 존재 여부 + 소유자 검증
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
            .orElseThrow(() -> new EntityNotFoundException("해당 수강 기록을 찾을 수 없습니다."));
        
        Long currentMemberId = securityUtils.getCurrentMemberId();
        if (!enrollment.getMemberId().equals(currentMemberId)) {
            throw new AccessDeniedException("이 수강 기록에 접근할 권한이 없습니다.");
        }
        
        // 2. Lecture 존재 여부 확인
        Lecture lecture = lectureRepository.findById(lectureId)
            .orElseThrow(() -> new EntityNotFoundException("해당 강의를 찾을 수 없습니다."));
        
        // 3. LectureProgress 생성 또는 업데이트
        LectureProgress progress = lectureProgressRepository
            .findByEnrollmentIdAndLectureId(enrollmentId, lectureId)
            .orElseGet(() -> LectureProgress.builder()
                .enrollmentId(enrollmentId)
                .memberId(currentMemberId)
                .lectureId(lectureId)
                .lastPosition(lastPosition)
                .updatedAt(LocalDateTime.now())
                .build());
        
        progress.setLastPosition(lastPosition);
        progress.setUpdatedAt(LocalDateTime.now());
        
        LectureProgress saved = lectureProgressRepository.save(progress);
        
        // 4. 진도율 계산
        int progressPercent = (lastPosition * 100) / lecture.getPlayTime();
        
        // 5. DTO 변환
        return LectureProgressResponse.builder()
            .id(saved.getId())
            .enrollmentId(saved.getEnrollmentId())
            .lectureId(saved.getLectureId())
            .lectureName(lecture.getTitle())
            .lastPosition(saved.getLastPosition())
            .lecturePlayTime(lecture.getPlayTime())
            .progressPercent(Math.min(progressPercent, 100))
            .updatedAt(saved.getUpdatedAt())
            .build();
    }
    
    /**
     * 특정 강의 진도 조회
     */
    @Transactional(readOnly = true)
    public LectureProgressResponse getLectureProgress(
        Long lectureId,
        Long enrollmentId
    ) {
        // Enrollment 소유자 검증
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
            .orElseThrow(() -> new EntityNotFoundException("해당 수강 기록을 찾을 수 없습니다."));
        
        Long currentMemberId = securityUtils.getCurrentMemberId();
        if (!enrollment.getMemberId().equals(currentMemberId)) {
            throw new AccessDeniedException("이 수강 기록에 접근할 권한이 없습니다.");
        }
        
        // LectureProgress 조회
        Lecture lecture = lectureRepository.findById(lectureId)
            .orElseThrow(() -> new EntityNotFoundException("해당 강의를 찾을 수 없습니다."));
        
        LectureProgress progress = lectureProgressRepository
            .findByEnrollmentIdAndLectureId(enrollmentId, lectureId)
            .orElse(LectureProgress.builder()
                .enrollmentId(enrollmentId)
                .lectureId(lectureId)
                .lastPosition(0)
                .build());
        
        int progressPercent = (progress.getLastPosition() * 100) / lecture.getPlayTime();
        
        return LectureProgressResponse.builder()
            .id(progress.getId())
            .enrollmentId(progress.getEnrollmentId())
            .lectureId(progress.getLectureId())
            .lectureName(lecture.getTitle())
            .lastPosition(progress.getLastPosition())
            .lecturePlayTime(lecture.getPlayTime())
            .progressPercent(Math.min(progressPercent, 100))
            .updatedAt(progress.getUpdatedAt())
            .build();
    }
    
    /**
     * 수강 강의 전체 진도 조회
     */
    @Transactional(readOnly = true)
    public EnrollmentProgressResponse getEnrollmentProgress(Long enrollmentId) {
        // Enrollment 조회
        Enrollment enrollment = enrollmentRepository.findByIdWithCourse(enrollmentId)
            .orElseThrow(() -> new EntityNotFoundException("해당 수강 기록을 찾을 수 없습니다."));
        
        Long currentMemberId = securityUtils.getCurrentMemberId();
        if (!enrollment.getMemberId().equals(currentMemberId)) {
            throw new AccessDeniedException("이 수강 기록에 접근할 권한이 없습니다.");
        }
        
        // 모든 강의 진도 조회
        List<Lecture> allLectures = getAllLecturesForCourse(enrollment.getCourse());
        List<LectureProgress> progressList = lectureProgressRepository
            .findByEnrollmentIdOrderByUpdatedAtDesc(enrollmentId);
        
        // 강의별 진도 정보 구성
        Map<Long, LectureProgress> progressMap = progressList.stream()
            .collect(Collectors.toMap(LectureProgress::getLectureId, p -> p));
        
        List<LectureProgressDetail> lectureProgressDetails = allLectures.stream()
            .map(lecture -> {
                LectureProgress progress = progressMap.getOrDefault(
                    lecture.getId(),
                    LectureProgress.builder()
                        .lectureId(lecture.getId())
                        .lastPosition(0)
                        .build()
                );
                
                int percent = (progress.getLastPosition() * 100) / lecture.getPlayTime();
                boolean isCompleted = percent >= 95;  // 95% 이상 시청하면 완료
                
                return LectureProgressDetail.builder()
                    .lectureId(lecture.getId())
                    .lectureName(lecture.getTitle())
                    .lastPosition(progress.getLastPosition())
                    .lecturePlayTime(lecture.getPlayTime())
                    .progressPercent(Math.min(percent, 100))
                    .isCompleted(isCompleted)
                    .updatedAt(progress.getUpdatedAt())
                    .build();
            })
            .collect(Collectors.toList());
        
        // 전체 진도율 계산
        int completedCount = (int) lectureProgressDetails.stream()
            .filter(LectureProgressDetail::getIsCompleted)
            .count();
        
        int overallProgress = (completedCount * 100) / allLectures.size();
        
        return EnrollmentProgressResponse.builder()
            .enrollmentId(enrollment.getId())
            .courseId(enrollment.getCourse().getId())
            .courseName(enrollment.getCourse().getTitle())
            .isCompleted(enrollment.getIsCompleted())
            .enrolledAt(enrollment.getEnrolledAt())
            .totalLectures(allLectures.size())
            .completedLectures(completedCount)
            .overallProgressPercent(overallProgress)
            .lectureProgress(lectureProgressDetails)
            .build();
    }
    
    /**
     * 강의의 모든 Lecture 조회
     */
    private List<Lecture> getAllLecturesForCourse(Course course) {
        return course.getSections().stream()
            .flatMap(s -> s.getLectures().stream())
            .sorted(Comparator.comparingInt(Lecture::getSortOrder))
            .collect(Collectors.toList());
    }
}
```

**커밋:**
```
[Phase3-Step3] Service: LectureProgressService 구현 (저장, 조회 로직)
```

---

### Step 3.4: Controller 엔드포인트 구현 (20분)

**파일 생성/수정:**
- `src/main/java/com/chessmate/be/controller/LectureProgressController.java` (신규)

**내용:**
```java
@RestController
@RequestMapping("/api/lecture-progress")
@RequiredArgsConstructor
public class LectureProgressController {
    
    private final LectureProgressService lectureProgressService;
    
    /**
     * 강의 진도 저장
     * 
     * POST /api/lecture-progress
     */
    @PostMapping
    public ResponseEntity<?> saveLectureProgress(
        @Valid @RequestBody LectureProgressRequest request
    ) {
        try {
            LectureProgressResponse result = lectureProgressService.saveLectureProgress(
                request.getEnrollmentId(),
                request.getLectureId(),
                request.getLastPosition()
            );
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("강의 진도를 저장했습니다.", result));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("ENTITY_NOT_FOUND", e.getMessage()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("ACCESS_DENIED", e.getMessage()));
        }
    }
    
    /**
     * 특정 강의 진도 조회
     * 
     * GET /api/lecture-progress/lectures/{lectureId}?enrollmentId=1
     */
    @GetMapping("/lectures/{lectureId}")
    public ResponseEntity<?> getLectureProgress(
        @PathVariable Long lectureId,
        @RequestParam Long enrollmentId
    ) {
        try {
            LectureProgressResponse result = lectureProgressService.getLectureProgress(
                lectureId,
                enrollmentId
            );
            
            return ResponseEntity.ok(
                ApiResponse.success("강의 진도를 조회했습니다.", result)
            );
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("ENTITY_NOT_FOUND", e.getMessage()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("ACCESS_DENIED", e.getMessage()));
        }
    }
    
    /**
     * 수강 강의 전체 진도 조회
     * 
     * GET /api/enrollments/{enrollmentId}/progress
     */
    @GetMapping("/enrollments/{enrollmentId}/progress")
    public ResponseEntity<?> getEnrollmentProgress(
        @PathVariable Long enrollmentId
    ) {
        try {
            EnrollmentProgressResponse result = lectureProgressService
                .getEnrollmentProgress(enrollmentId);
            
            return ResponseEntity.ok(
                ApiResponse.success("수강 진도 정보를 조회했습니다.", result)
            );
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("ENTITY_NOT_FOUND", e.getMessage()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("ACCESS_DENIED", e.getMessage()));
        }
    }
}
```

**주의사항:**
- `@Valid` 검증 필수
- 모든 메서드에서 권한 검증 필수

**커밋:**
```
[Phase3-Step4] Controller: LectureProgressController 엔드포인트 구현
```

---

### Step 3.5: 엔티티 수정 (선택사항) (15분)

만약 `LectureProgress` 엔티티에 `enrollmentId` 필드가 없다면 추가:

```java
@Entity
@Table(name = "lecture_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LectureProgress {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long memberId;           // 사용자 ID
    
    @Column(nullable = false)
    private Long enrollmentId;       // 수강 ID (신규 추가)
    
    @Column(nullable = false)
    private Long lectureId;          // 강의 ID
    
    @Column(nullable = false)
    private Integer lastPosition;    // 마지막 시청 시간(초)
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

**커밋:**
```
[Phase3-Step5] Entity: LectureProgress에 enrollmentId 필드 추가 (필요시)
```

---

### Step 3.6: 테스트 및 검증 (15분)

**테스트 항목:**
1. 진도 저장 (POST)
   - 정상 케이스: enrollmentId, lectureId, lastPosition 포함
   - 예외: 누락된 필드, 권한 없음, 리소스 없음

2. 진도 조회 (GET)
   - 정상 케이스: 저장된 진도 확인
   - 예외: 권한 없음

3. 전체 진도 조회 (GET)
   - 정상 케이스: 모든 강의의 진도 확인
   - 전체 진도율 계산 확인

**Postman 테스트:**
```
# 진도 저장
POST /api/lecture-progress
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "enrollmentId": 1,
  "lectureId": 5,
  "lastPosition": 450
}

# 진도 조회
GET /api/lecture-progress/lectures/5?enrollmentId=1
Authorization: Bearer {accessToken}

# 전체 진도 조회
GET /api/enrollments/1/progress
Authorization: Bearer {accessToken}
```

**커밋:**
```
[Phase3-Step6] Test: 진도 추적 API 테스트 및 검증 완료
```

---

## Phase 4: 학생 대시보드

**예상 시간**: 2.5시간  
**커밋 개수**: 4개

### Step 4.1: DTO 정의 (15분)

**파일 생성:**
- `src/main/java/com/chessmate/be/dto/response/StudentDashboardResponse.java`
- `src/main/java/com/chessmate/be/dto/response/EnrollmentProgressSummary.java`
- `src/main/java/com/chessmate/be/dto/response/StudyStatisticsResponse.java`
- `src/main/java/com/chessmate/be/dto/response/CategoryStatistics.java`
- `src/main/java/com/chessmate/be/dto/response/DailyStudyLog.java`

**내용:** (생략 - 상세 API 명세서 참조)

**커밋:**
```
[Phase4-Step1] DTO 정의: StudentDashboardResponse, StudyStatisticsResponse 등
```

---

### Step 4.2: Service 메서드 구현 (1시간)

**파일 생성:**
- `src/main/java/com/chessmate/be/service/StudentDashboardService.java`

**주요 로직:**
- 학생의 모든 Enrollment 조회
- 각 Enrollment의 LectureProgress 계산
- 통계 계산 (완강, 진행중, 학습 시간 등)
- 카테고리별 통계
- 일별 학습 통계

**커밋:**
```
[Phase4-Step2] Service: StudentDashboardService 구현
```

---

### Step 4.3: Controller 엔드포인트 구현 (20분)

**파일 생성:**
- `src/main/java/com/chessmate/be/controller/StudentDashboardController.java`

**엔드포인트:**
- `GET /api/students/dashboard` - 대시보드
- `GET /api/students/study-stats` - 상세 통계

**커밋:**
```
[Phase4-Step3] Controller: StudentDashboardController 엔드포인트 구현
```

---

### Step 4.4: 테스트 및 검증 (30분)

**테스트 항목:**
- 대시보드 조회
- 통계 계산 검증
- 카테고리별 집계
- 일별 학습 시간 계산

**커밋:**
```
[Phase4-Step4] Test: 대시보드 API 테스트 및 검증 완료
```

---

## Phase 5: 통합 테스트 & 문서화

**예상 시간**: 2시간  
**커밋 개수**: 2개

### Step 5.1: Postman 컬렉션 생성 (30분)

**포함 사항:**
- Phase 1-4의 모든 API
- 정상 케이스 + 예외 케이스
- 통합 시나리오 (회원가입 → 로그인 → 검색 → 수강신청 → 진도 추적 → 대시보드)

**파일:**
- `ChessMate_P1_API.postman_collection.json`

**커밋:**
```
[Phase5-Step1] Postman: P1 전체 API 컬렉션 작성
```

---

### Step 5.2: API 문서 최종 정리 (30분)

**포함 사항:**
- README.md 업데이트
- API 명세서 최종 검증
- 변경 로그 (CHANGELOG.md)

**커밋:**
```
[Phase5-Step2] Docs: API 문서 최종 완성 및 검증
```

---

### Step 5.3: 예외 처리 재검증 (30분)

**검증 사항:**
- 모든 API에서 예외 처리 확인
- HTTP 상태 코드 정확성
- 에러 메시지 명확성

**커밋:**
```
[Phase5-Step3] Refactor: 예외 처리 재검증 및 통일
```

---

### Step 5.4: 통합 테스트 시나리오 실행 (30분)

**시나리오:**
```
1. 사용자 1: 회원가입 → 로그인
2. 사용자 1: 강의 검색 (keyword="주식", category="STOCK")
3. 사용자 1: 강의 상세 조회 (courseId=1)
4. 사용자 1: 수강 신청 (enrollmentId 획득)
5. 사용자 1: 진도 저장 (lectureId=1, lastPosition=300)
6. 사용자 1: 진도 조회
7. 사용자 1: 대시보드 조회
8. 사용자 1: 통계 조회
```

**커밋:**
```
[Phase5-Step4] Test: 전체 통합 테스트 완료 및 검증
```

---

## ✅ 최종 체크리스트

### 코드 품질
- [ ] 모든 메서드에 주석 작성
- [ ] Exception handling 완료
- [ ] DTO validation 완료
- [ ] Service/Repository/Controller 계층 분리 명확함

### 기능 완성도
- [ ] Phase 1: 검색 API ✅
- [ ] Phase 2: 강의 상세 조회 ✅
- [ ] Phase 3: 진도 추적 ✅
- [ ] Phase 4: 대시보드 ✅
- [ ] Phase 5: 문서화 ✅

### 테스트 완료
- [ ] 각 API 정상 케이스 테스트
- [ ] 각 API 예외 케이스 테스트
- [ ] 통합 테스트 시나리오 완료
- [ ] Postman 컬렉션 검증

### 문서화
- [ ] API 명세서 완성
- [ ] README 업데이트
- [ ] 변경 로그 작성

---

**작성자**: GitHub Copilot  
**최종 수정**: 2026-04-02

