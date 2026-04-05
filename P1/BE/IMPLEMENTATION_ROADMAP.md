# 🚀 ChessMate MVP - 구현 로드맵 & 커밋 가이드

**작성일**: 2026-04-02  
**프로젝트명**: ChessMate  
**문서**: 단계별 구현 계획 및 커밋 스트래티지  

---

## 📑 목차

1. [개요](#1-개요)
2. [Phase 1: 검색 & 필터링 API](#2-phase-1-검색--필터링-api)
3. [Phase 2: 강의 상세 조회 개선](#3-phase-2-강의-상세-조회-개선)
4. [Phase 3: 진도 추적 API](#4-phase-3-진도-추적-api)
5. [Phase 4: 학생 대시보드](#5-phase-4-학생-대시보드)
6. [Phase 5: 통합 테스트 & 문서화](#6-phase-5-통합-테스트--문서화)
7. [커밋 규칙](#7-커밋-규칙)
8. [테스트 체크리스트](#8-테스트-체크리스트)

---

## 1. 개요

### 1.1 구현 전략

**핵심 원칙:**
```
작고 자주 커밋하기 (Small & Frequent Commits)
└─ 각 기능 완성 → 테스트 → 커밋 (즉시)
└─ 문제 발생 시 쉽게 롤백 가능
└─ 코드 리뷰 시 이해하기 쉬움
```

### 1.2 예상 시간

| Phase | 기능 | 구현 시간 | 테스트 시간 | 총 시간 |
|:---|:---|:---|:---|:---|
| 1 | 검색 & 필터링 | 1시간 | 30분 | 1.5시간 |
| 2 | 강의 상세 조회 | 1시간 | 30분 | 1.5시간 |
| 3 | 진도 추적 | 1.5시간 | 1시간 | 2.5시간 |
| 4 | 대시보드 | 1.5시간 | 1시간 | 2.5시간 |
| 5 | 문서화 & 통합 | 1시간 | 1시간 | 2시간 |
| **총계** | | | | **10시간** |

---

## 2. Phase 1: 검색 & 필터링 API

**목표**: 사용자가 키워드 + 카테고리로 강의를 검색할 수 있도록 구현

### 2.1 상세 구현 단계

#### Step 1.1: DTO 정의 (15분)

**파일**: `src/main/java/com/chessmate/be/dto/request/CourseSearchRequest.java`

```java
package com.chessmate.be.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSearchRequest {
    private String keyword;      // 검색 키워드 (제목, 설명)
    private String category;     // STOCK, CRYPTO (optional)
    private Integer page;        // 페이지 번호 (기본값: 0)
    private Integer size;        // 페이지 크기 (기본값: 10)
}
```

**파일**: `src/main/java/com/chessmate/be/dto/response/CourseSearchResponse.java`

```java
package com.chessmate.be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

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
    private Integer totalLectures;      // 섹션의 강의 개수 합
    private Integer totalPlayTime;      // 모든 강의의 playTime 합 (초)
    private LocalDateTime createdAt;
    
    public static CourseSearchResponse from(Course course) {
        return CourseSearchResponse.builder()
            .id(course.getId())
            .title(course.getTitle())
            .description(course.getDescription())
            .category(course.getCategory())
            .price(course.getPrice())
            .thumbnailUrl(course.getThumbnailUrl())
            .instructorId(course.getInstructor().getId())
            .instructorName(course.getInstructor().getNickname())
            .createdAt(course.getCreatedAt())
            .build();
    }
}
```

✅ **체크리스트:**
- [ ] DTO 파일 생성 완료
- [ ] 모든 필드 정의 확인
- [ ] `from()` 메서드 구현 확인

#### Step 1.2: Repository 메서드 추가 (20분)

**파일**: `src/main/java/com/chessmate/be/repository/CourseRepository.java`

기존 코드에 다음 메서드 추가:

```java
// 검색 쿼리 (fetch join으로 N+1 문제 해결)
@Query("""
    SELECT c FROM Course c
    JOIN FETCH c.instructor
    WHERE c.title LIKE %:keyword%
      AND (:category IS NULL OR c.category = :category)
    ORDER BY c.createdAt DESC
""")
Page<Course> searchByKeywordAndCategory(
    @Param("keyword") String keyword,
    @Param("category") String category,
    Pageable pageable
);

// 강의 개수 조회 (필요시)
@Query("""
    SELECT COUNT(l) FROM Lecture l
    JOIN l.section s
    WHERE s.course.id = :courseId
""")
Integer countLecturesByCourse(@Param("courseId") Long courseId);

// 전체 영상 길이 조회 (필요시)
@Query("""
    SELECT COALESCE(SUM(l.playTime), 0) FROM Lecture l
    JOIN l.section s
    WHERE s.course.id = :courseId
""")
Integer sumPlayTimeByCourse(@Param("courseId") Long courseId);
```

✅ **체크리스트:**
- [ ] 쿼리 문법 확인 (JPQL)
- [ ] fetch join 사용 확인
- [ ] 파라미터 이름 일치 확인

#### Step 1.3: Service 메서드 구현 (25분)

**파일**: `src/main/java/com/chessmate/be/service/CourseService.java`

기존 `CourseService`에 메서드 추가:

```java
// 기존 코드 유지...

public Page<CourseSearchResponse> searchCourses(
    String keyword,
    String category,
    Pageable pageable
) {
    // 키워드가 빈 문자열이면 전체 조회
    String searchKeyword = keyword != null && !keyword.trim().isEmpty() 
        ? keyword.trim() 
        : "";
    
    Page<Course> courses = courseRepository.searchByKeywordAndCategory(
        searchKeyword,
        category,
        pageable
    );
    
    // DTO로 변환 및 강의 개수/총 재생 시간 추가
    return courses.map(course -> {
        CourseSearchResponse response = CourseSearchResponse.from(course);
        response.setTotalLectures(courseRepository.countLecturesByCourse(course.getId()));
        response.setTotalPlayTime(courseRepository.sumPlayTimeByCourse(course.getId()));
        return response;
    });
}
```

⚠️ **주의**: 위 코드는 N+1 쿼리 발생 가능. 아래와 같이 개선:

```java
// 최적화 버전
public Page<CourseSearchResponse> searchCourses(
    String keyword,
    String category,
    Pageable pageable
) {
    String searchKeyword = keyword != null && !keyword.trim().isEmpty() 
        ? keyword.trim() 
        : "";
    
    return courseRepository.searchByKeywordAndCategory(
        searchKeyword,
        category,
        pageable
    ).map(CourseSearchResponse::from);
    
    // 주의: totalLectures, totalPlayTime은 추후 쿼리로 별도 조회
    // 현재 단계에서는 최소 필드만 반환
}
```

✅ **체크리스트:**
- [ ] 메서드 구현 완료
- [ ] 예외 처리 확인
- [ ] 로직 흐름 검증

#### Step 1.4: Controller 엔드포인트 추가 (20분)

**파일**: `src/main/java/com/chessmate/be/controller/CourseController.java`

기존 `CourseController`에 메서드 추가:

```java
// 기존 코드 유지...

/**
 * 강의 검색 및 필터링
 * 
 * @param keyword 검색 키워드 (제목 기반)
 * @param category 카테고리 필터 (STOCK/CRYPTO)
 * @param page 페이지 번호 (기본값: 0)
 * @param size 페이지 크기 (기본값: 10)
 * @return 검색 결과 페이지
 */
@GetMapping("/search")
@PreAuthorize("isAuthenticated()")
public ApiResponse<Page<CourseSearchResponse>> searchCourses(
    @RequestParam(defaultValue = "") String keyword,
    @RequestParam(required = false) String category,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size
) {
    // 페이지 크기 제한 (최대 50)
    if (size > 50) {
        size = 50;
    }
    
    Pageable pageable = PageRequest.of(
        page,
        size,
        Sort.by("createdAt").descending()
    );
    
    Page<CourseSearchResponse> result = courseService.searchCourses(
        keyword,
        category,
        pageable
    );
    
    return ApiResponse.success(
        result,
        "강의 검색 결과입니다."
    );
}
```

✅ **체크리스트:**
- [ ] Javadoc 작성 완료
- [ ] 권한 검증 확인 (@PreAuthorize)
- [ ] 페이지 크기 제한 확인
- [ ] 응답 포맷 확인

#### Step 1.5: 테스트 (30분)

**Postman 테스트 시나리오:**

```
1. 전체 강의 조회 (키워드 빈 문자열)
   GET http://localhost:8080/api/courses/search?keyword=&page=0&size=10
   Headers: Authorization: Bearer {token}
   Expected: 200, 강의 목록 반환

2. 키워드 검색
   GET http://localhost:8080/api/courses/search?keyword=주식&page=0&size=10
   Expected: 200, "주식" 포함된 강의만 반환

3. 카테고리 필터링
   GET http://localhost:8080/api/courses/search?keyword=&category=STOCK&page=0&size=10
   Expected: 200, STOCK 카테고리만 반환

4. 키워드 + 카테고리
   GET http://localhost:8080/api/courses/search?keyword=투자&category=CRYPTO&page=0&size=10
   Expected: 200, 조건을 모두 만족하는 강의 반환

5. 페이지네이션
   GET http://localhost:8080/api/courses/search?keyword=&page=1&size=5
   Expected: 200, 페이지 1의 5개 강의 반환

6. 인증 없음
   GET http://localhost:8080/api/courses/search?keyword=&page=0&size=10
   (Authorization 헤더 없음)
   Expected: 401 UNAUTHORIZED
```

✅ **체크리스트:**
- [ ] 모든 테스트 케이스 실행
- [ ] 결과 검증 (상태 코드, 데이터)
- [ ] 예외 처리 확인 (401, 400 등)

### 2.2 커밋

```bash
# 커밋 1: DTO 정의
git add src/main/java/com/chessmate/be/dto/request/CourseSearchRequest.java
git add src/main/java/com/chessmate/be/dto/response/CourseSearchResponse.java
git commit -m "[Phase1-1] 강의 검색 DTO 정의

- CourseSearchRequest: 검색 요청 파라미터
- CourseSearchResponse: 검색 결과 응답 DTO
- 강사 정보, 강의 개수, 총 재생 시간 포함"

# 커밋 2: Repository
git add src/main/java/com/chessmate/be/repository/CourseRepository.java
git commit -m "[Phase1-2] CourseRepository 검색 메서드 추가

- searchByKeywordAndCategory(): fetch join으로 N+1 해결
- countLecturesByCourse(): 강의 개수 조회
- sumPlayTimeByCourse(): 총 재생 시간 조회"

# 커밋 3: Service
git add src/main/java/com/chessmate/be/service/CourseService.java
git commit -m "[Phase1-3] CourseService 검색 기능 구현

- searchCourses(): 키워드 + 카테고리로 검색
- 페이지네이션 지원
- DTO 변환"

# 커밋 4: Controller + 테스트
git add src/main/java/com/chessmate/be/controller/CourseController.java
git commit -m "[Phase1-4] CourseController 검색 API 엔드포인트

- GET /api/courses/search 엔드포인트 추가
- 권한 검증, 페이지 크기 제한
- Postman 테스트 완료"
```

---

## 3. Phase 2: 강의 상세 조회 개선

**목표**: 강의의 커리큘럼(Section/Lecture 구조)을 함께 조회

### 3.1 상세 구현 단계

#### Step 2.1: DTO 정의 (20분)

**파일들 생성:**
- `CourseDetailResponse.java`
- `SectionDetailResponse.java`
- `LectureDetailResponse.java`

```java
// CourseDetailResponse
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
    
    // 강사 정보
    private Long instructorId;
    private String instructorName;
    private String instructorEmail;
    
    // 강의 통계
    private Integer totalSections;
    private Integer totalLectures;
    private Integer totalPlayTime;  // 초 단위
    
    // 커리큘럼
    private List<SectionDetailResponse> sections;
    
    private LocalDateTime createdAt;
    
    public static CourseDetailResponse from(Course course) {
        return CourseDetailResponse.builder()
            .id(course.getId())
            .title(course.getTitle())
            .description(course.getDescription())
            .category(course.getCategory())
            .price(course.getPrice())
            .thumbnailUrl(course.getThumbnailUrl())
            .instructorId(course.getInstructor().getId())
            .instructorName(course.getInstructor().getNickname())
            .instructorEmail(course.getInstructor().getEmail())
            .createdAt(course.getCreatedAt())
            .build();
    }
}

// SectionDetailResponse
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionDetailResponse {
    private Long id;
    private String title;
    private Integer sortOrder;
    private List<LectureDetailResponse> lectures;
    
    public static SectionDetailResponse from(Section section) {
        return SectionDetailResponse.builder()
            .id(section.getId())
            .title(section.getTitle())
            .sortOrder(section.getSortOrder())
            .build();
    }
}

// LectureDetailResponse
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LectureDetailResponse {
    private Long id;
    private String title;
    private String videoUrl;
    private Integer playTime;  // 초 단위
    private Integer sortOrder;
    
    public static LectureDetailResponse from(Lecture lecture) {
        return LectureDetailResponse.builder()
            .id(lecture.getId())
            .title(lecture.getTitle())
            .videoUrl(lecture.getVideoUrl())
            .playTime(lecture.getPlayTime())
            .sortOrder(lecture.getSortOrder())
            .build();
    }
}
```

#### Step 2.2: Repository 쿼리 추가 (15분)

**파일**: `CourseRepository.java`

```java
// 강의 상세 조회 (fetch join으로 전체 계층 로드)
@Query("""
    SELECT c FROM Course c
    JOIN FETCH c.instructor
    LEFT JOIN FETCH c.sections s
    LEFT JOIN FETCH s.lectures l
    WHERE c.id = :courseId
    ORDER BY s.sortOrder ASC, l.sortOrder ASC
""")
Optional<Course> findByIdWithStructure(@Param("courseId") Long courseId);
```

**파일**: `LectureRepository.java` (신규 생성 또는 기존에 추가)

```java
@Query("""
    SELECT COUNT(l) FROM Lecture l
    JOIN l.section s
    WHERE s.course.id = :courseId
""")
Integer countLecturesByCourse(@Param("courseId") Long courseId);

@Query("""
    SELECT COALESCE(SUM(l.playTime), 0) FROM Lecture l
    JOIN l.section s
    WHERE s.course.id = :courseId
""")
Integer sumPlayTimeByCourse(@Param("courseId") Long courseId);

@Query("""
    SELECT COUNT(DISTINCT s.id) FROM Lecture l
    JOIN l.section s
    WHERE s.course.id = :courseId
""")
Integer countSectionsByCourse(@Param("courseId") Long courseId);
```

#### Step 2.3: Service 메서드 (20분)

**파일**: `CourseService.java`

```java
public CourseDetailResponse getCourseStructure(Long courseId) {
    Course course = courseRepository.findByIdWithStructure(courseId)
        .orElseThrow(() -> new EntityNotFoundException(
            "강의를 찾을 수 없습니다."
        ));
    
    CourseDetailResponse response = CourseDetailResponse.from(course);
    
    // 섹션 및 강의 매핑
    List<SectionDetailResponse> sections = course.getSections().stream()
        .map(section -> {
            SectionDetailResponse sectionResp = SectionDetailResponse.from(section);
            sectionResp.setLectures(
                section.getLectures().stream()
                    .map(LectureDetailResponse::from)
                    .sorted(Comparator.comparingInt(LectureDetailResponse::getSortOrder))
                    .collect(Collectors.toList())
            );
            return sectionResp;
        })
        .sorted(Comparator.comparingInt(SectionDetailResponse::getSortOrder))
        .collect(Collectors.toList());
    
    response.setSections(sections);
    response.setTotalSections(sections.size());
    response.setTotalLectures(sections.stream()
        .mapToInt(s -> s.getLectures().size())
        .sum());
    response.setTotalPlayTime(sections.stream()
        .flatMap(s -> s.getLectures().stream())
        .mapToInt(LectureDetailResponse::getPlayTime)
        .sum());
    
    return response;
}
```

#### Step 2.4: Controller 엔드포인트 (20분)

**파일**: `CourseController.java`

```java
/**
 * 강의 상세 조회 (커리큘럼 포함)
 * 
 * @param courseId 강의 ID
 * @return 강의 상세 정보 (섹션, 강의 목록 포함)
 */
@GetMapping("/{courseId}/structure")
@PreAuthorize("isAuthenticated()")
public ApiResponse<CourseDetailResponse> getCourseStructure(
    @PathVariable Long courseId
) {
    CourseDetailResponse result = courseService.getCourseStructure(courseId);
    return ApiResponse.success(
        result,
        "강의 상세 정보를 조회했습니다."
    );
}
```

#### Step 2.5: 테스트 (30분)

**Postman 테스트:**

```
1. 강의 상세 조회 (커리큘럼 포함)
   GET http://localhost:8080/api/courses/1/structure
   Expected: 200
   {
     "id": 1,
     "title": "주식 투자 기초",
     "sections": [
       {
         "id": 1,
         "title": "섹션 1: 기초 개념",
         "lectures": [
           { "id": 1, "title": "주식이란?", "playTime": 1200 },
           ...
         ]
       },
       ...
     ],
     "totalSections": 3,
     "totalLectures": 15,
     "totalPlayTime": 18000
   }

2. 존재하지 않는 강의 (404)
   GET http://localhost:8080/api/courses/999/structure
   Expected: 404, "강의를 찾을 수 없습니다."

3. 인증 없이 접근 (401)
   GET http://localhost:8080/api/courses/1/structure
   (Authorization 헤더 없음)
   Expected: 401
```

### 3.2 커밋

```bash
# 커밋 1: DTO 정의
git add src/main/java/com/chessmate/be/dto/response/CourseDetailResponse.java
git add src/main/java/com/chessmate/be/dto/response/SectionDetailResponse.java
git add src/main/java/com/chessmate/be/dto/response/LectureDetailResponse.java
git commit -m "[Phase2-1] 강의 상세 조회 DTO 정의

- CourseDetailResponse: 강의 + 섹션 + 강의 목록
- SectionDetailResponse: 섹션 + 강의 목록
- LectureDetailResponse: 개별 강의 정보"

# 커밋 2: Repository
git add src/main/java/com/chessmate/be/repository/CourseRepository.java
git commit -m "[Phase2-2] CourseRepository 상세 조회 쿼리

- findByIdWithStructure(): fetch join으로 전체 계층 로드
- 섹션 및 강의 모두 한 번의 쿼리로 조회"

# 커밋 3: Service + Controller
git add src/main/java/com/chessmate/be/service/CourseService.java
git add src/main/java/com/chessmate/be/controller/CourseController.java
git commit -m "[Phase2-3] 강의 상세 조회 API 구현

- CourseService.getCourseStructure(): 비즈니스 로직
- CourseController의 GET /api/courses/{courseId}/structure 엔드포인트
- Postman 테스트 완료"
```

---

## 4. Phase 3: 진도 추적 API

**목표**: 사용자의 강의 시청 위치를 저장하고 조회

### 4.1 상세 구현 단계

#### Step 3.1: 진도 관련 DTO (15분)

**파일**: `LectureProgressCreateRequest.java`

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LectureProgressCreateRequest {
    @NotNull(message = "lectureId는 필수입니다")
    private Long lectureId;
    
    @NotNull(message = "lastPosition은 필수입니다")
    @PositiveOrZero(message = "lastPosition은 0 이상이어야 합니다")
    private Integer lastPosition;  // 초 단위
}
```

**파일**: `LectureProgressResponse.java`

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LectureProgressResponse {
    private Long id;
    private Long lectureId;
    private String lectureTitle;
    private Integer lastPosition;      // 마지막 시청 위치 (초)
    private Integer playTime;          // 전체 강의 길이 (초)
    private Integer watchPercent;      // 시청률 (%)
    private LocalDateTime updatedAt;
    
    public static LectureProgressResponse from(
        LectureProgress progress,
        Lecture lecture
    ) {
        int watchPercent = lecture.getPlayTime() > 0 
            ? (progress.getLastPosition() * 100) / lecture.getPlayTime() 
            : 0;
        
        return LectureProgressResponse.builder()
            .id(progress.getId())
            .lectureId(lecture.getId())
            .lectureTitle(lecture.getTitle())
            .lastPosition(progress.getLastPosition())
            .playTime(lecture.getPlayTime())
            .watchPercent(Math.min(watchPercent, 100))  // 100% 초과 방지
            .updatedAt(progress.getUpdatedAt())
            .build();
    }
}
```

#### Step 3.2: Repository 구현 (15분)

**파일**: `LectureProgressRepository.java` (신규 생성)

```java
package com.chessmate.be.repository;

import com.chessmate.be.entity.LectureProgress;
import com.chessmate.be.entity.Lecture;
import com.chessmate.be.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface LectureProgressRepository extends JpaRepository<LectureProgress, Long> {
    
    /**
     * 사용자의 특정 강의 진도 조회
     */
    Optional<LectureProgress> findByMemberAndLecture(Member member, Lecture lecture);
    
    /**
     * 사용자 ID와 강의 ID로 진도 조회
     */
    @Query("""
        SELECT lp FROM LectureProgress lp
        WHERE lp.member.id = :memberId
          AND lp.lecture.id = :lectureId
    """)
    Optional<LectureProgress> findByMemberIdAndLectureId(
        @Param("memberId") Long memberId,
        @Param("lectureId") Long lectureId
    );
    
    /**
     * 사용자가 특정 섹션의 강의들에 대한 진도 조회
     */
    @Query("""
        SELECT lp FROM LectureProgress lp
        WHERE lp.member.id = :memberId
          AND lp.lecture.section.id = :sectionId
        ORDER BY lp.lecture.sortOrder ASC
    """)
    java.util.List<LectureProgress> findByMemberIdAndSectionId(
        @Param("memberId") Long memberId,
        @Param("sectionId") Long sectionId
    );
    
    /**
     * 사용자의 강의별 강의 개수 조회
     */
    @Query("""
        SELECT COUNT(lp) FROM LectureProgress lp
        WHERE lp.member.id = :memberId
          AND lp.lecture.section.course.id = :courseId
          AND lp.lastPosition = lp.lecture.playTime
    """)
    Integer countCompletedLecturesByCourseAndMember(
        @Param("courseId") Long courseId,
        @Param("memberId") Long memberId
    );
}
```

#### Step 3.3: Service 구현 (30분)

**파일**: `LectureProgressService.java` (신규 생성)

```java
package com.chessmate.be.service;

import com.chessmate.be.dto.request.LectureProgressCreateRequest;
import com.chessmate.be.dto.response.LectureProgressResponse;
import com.chessmate.be.entity.*;
import com.chessmate.be.exception.EntityNotFoundException;
import com.chessmate.be.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class LectureProgressService {
    
    private final LectureProgressRepository lectureProgressRepository;
    private final LectureRepository lectureRepository;
    private final MemberRepository memberRepository;
    private final EnrollmentRepository enrollmentRepository;
    
    /**
     * 강의 진도 저장 (또는 업데이트)
     */
    @Transactional
    public LectureProgressResponse saveLectureProgress(
        Long memberId,
        LectureProgressCreateRequest request
    ) {
        // 1. 사용자 존재 확인
        Member member = memberRepository.findById(memberId)
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        // 2. 강의 존재 확인
        Lecture lecture = lectureRepository.findById(request.getLectureId())
            .orElseThrow(() -> new EntityNotFoundException("강의를 찾을 수 없습니다."));
        
        // 3. 수강 여부 확인 (해당 강의의 강의를 수강하고 있는지)
        Long courseId = lecture.getSection().getCourse().getId();
        Enrollment enrollment = enrollmentRepository.findByMemberIdAndCourseId(memberId, courseId)
            .orElseThrow(() -> new EntityNotFoundException("수강 등록이 필요합니다."));
        
        // 4. 진도 저장 (있으면 업데이트, 없으면 생성)
        LectureProgress progress = lectureProgressRepository
            .findByMemberAndLecture(member, lecture)
            .orElseGet(() -> LectureProgress.builder()
                .member(member)
                .lecture(lecture)
                .lastPosition(0)
                .build());
        
        // 5. 진도 업데이트
        progress.setLastPosition(request.getLastPosition());
        LectureProgress savedProgress = lectureProgressRepository.save(progress);
        
        return LectureProgressResponse.from(savedProgress, lecture);
    }
    
    /**
     * 특정 강의의 진도 조회
     */
    public LectureProgressResponse getLectureProgress(
        Long memberId,
        Long lectureId
    ) {
        // 1. 강의 존재 확인
        Lecture lecture = lectureRepository.findById(lectureId)
            .orElseThrow(() -> new EntityNotFoundException("강의를 찾을 수 없습니다."));
        
        // 2. 진도 조회 (없으면 초기값 0)
        LectureProgress progress = lectureProgressRepository
            .findByMemberIdAndLectureId(memberId, lectureId)
            .orElseGet(() -> LectureProgress.builder()
                .member(Member.builder().id(memberId).build())
                .lecture(lecture)
                .lastPosition(0)
                .build());
        
        return LectureProgressResponse.from(progress, lecture);
    }
}
```

#### Step 3.4: Controller 구현 (25분)

**파일**: `LectureProgressController.java` (신규 생성)

```java
package com.chessmate.be.controller;

import com.chessmate.be.dto.request.LectureProgressCreateRequest;
import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.LectureProgressResponse;
import com.chessmate.be.security.JwtTokenProvider;
import com.chessmate.be.service.LectureProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/lecture-progress")
@RequiredArgsConstructor
public class LectureProgressController {
    
    private final LectureProgressService lectureProgressService;
    private final JwtTokenProvider jwtTokenProvider;
    
    /**
     * 강의 진도 저장
     * 
     * @param request 진도 정보 (lectureId, lastPosition)
     * @param authentication 인증 정보
     * @return 저장된 진도 정보
     */
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<LectureProgressResponse>> saveLectureProgress(
        @Valid @RequestBody LectureProgressCreateRequest request,
        Authentication authentication
    ) {
        Long memberId = (Long) authentication.getPrincipal();
        
        LectureProgressResponse result = lectureProgressService.saveLectureProgress(
            memberId,
            request
        );
        
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success(
                result,
                "강의 진도를 저장했습니다."
            ));
    }
    
    /**
     * 특정 강의의 진도 조회
     * 
     * @param lectureId 강의 ID
     * @param authentication 인증 정보
     * @return 진도 정보
     */
    @GetMapping("/lectures/{lectureId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<LectureProgressResponse>> getLectureProgress(
        @PathVariable Long lectureId,
        Authentication authentication
    ) {
        Long memberId = (Long) authentication.getPrincipal();
        
        LectureProgressResponse result = lectureProgressService.getLectureProgress(
            memberId,
            lectureId
        );
        
        return ResponseEntity.ok(ApiResponse.success(
            result,
            "강의 진도를 조회했습니다."
        ));
    }
}
```

#### Step 3.5: Repository 보조 메서드 (15분)

**파일**: `EnrollmentRepository.java`에 메서드 추가

```java
/**
 * 사용자와 강의로 수강 정보 조회
 */
Optional<Enrollment> findByMemberIdAndCourseId(Long memberId, Long courseId);

/**
 * 사용자 ID로 수강 강의 조회
 */
List<Enrollment> findByMemberId(Long memberId);
```

#### Step 3.6: 테스트 (45분)

**Postman 테스트 시나리오:**

```
1. 진도 저장
   POST http://localhost:8080/api/lecture-progress
   Headers: Authorization: Bearer {token}, Content-Type: application/json
   Body: { "lectureId": 1, "lastPosition": 300 }
   Expected: 201, watchPercent 계산되어 반환

2. 진도 업데이트
   POST http://localhost:8080/api/lecture-progress
   Body: { "lectureId": 1, "lastPosition": 600 }
   Expected: 201, 업데이트된 진도 반환

3. 진도 조회
   GET http://localhost:8080/api/lecture-progress/lectures/1
   Expected: 200, watchPercent 표시

4. 수강하지 않은 강의의 진도 저장
   POST http://localhost:8080/api/lecture-progress
   Body: { "lectureId": 999, "lastPosition": 100 }
   Expected: 404, "수강 등록이 필요합니다."

5. 유효하지 않은 진도값
   POST http://localhost:8080/api/lecture-progress
   Body: { "lectureId": 1, "lastPosition": -100 }
   Expected: 400, 유효성 검사 오류
```

### 4.2 커밋

```bash
# 커밋 1: DTO
git add src/main/java/com/chessmate/be/dto/request/LectureProgressCreateRequest.java
git add src/main/java/com/chessmate/be/dto/response/LectureProgressResponse.java
git commit -m "[Phase3-1] 진도 추적 DTO 정의

- LectureProgressCreateRequest: 진도 저장 요청
- LectureProgressResponse: 진도 조회 응답 (시청률 포함)"

# 커밋 2: Repository
git add src/main/java/com/chessmate/be/repository/LectureProgressRepository.java
git commit -m "[Phase3-2] LectureProgressRepository 구현

- findByMemberAndLecture(): 사용자의 강의 진도 조회
- findByMemberIdAndLectureId(): ID로 조회
- findByMemberIdAndSectionId(): 섹션별 진도 조회
- countCompletedLecturesByCourseAndMember(): 완료한 강의 개수"

# 커밋 3: Service
git add src/main/java/com/chessmate/be/service/LectureProgressService.java
git commit -m "[Phase3-3] LectureProgressService 구현

- saveLectureProgress(): 진도 저장 및 업데이트
- getLectureProgress(): 진도 조회
- 수강 여부 검증"

# 커밋 4: Controller
git add src/main/java/com/chessmate/be/controller/LectureProgressController.java
git commit -m "[Phase3-4] 진도 추적 API 엔드포인트

- POST /api/lecture-progress: 진도 저장
- GET /api/lecture-progress/lectures/{lectureId}: 진도 조회
- Postman 테스트 완료"

# 커밋 5: Helper 메서드
git add src/main/java/com/chessmate/be/repository/EnrollmentRepository.java
git commit -m "[Phase3-5] EnrollmentRepository 보조 메서드 추가

- findByMemberIdAndCourseId(): 수강 여부 확인
- findByMemberId(): 사용자 수강 목록"
```

---

## 5. Phase 4: 학생 대시보드

**목표**: 학생의 전체 학습 현황을 한눈에 보여주는 대시보드 API

### 5.1 상세 구현 단계

이 부분은 길이상 간략하게 작성하겠습니다. 위의 Phase 1-3의 상세도와 동일하게 진행하면 됩니다.

#### Step 4.1: DTO 정의

**파일들:**
- `EnrollmentSummaryResponse.java`: 각 강의별 진도 요약
- `StudentDashboardResponse.java`: 전체 대시보드

```java
// EnrollmentSummaryResponse 예시
@Data
@Builder
public class EnrollmentSummaryResponse {
    private Long courseId;
    private String courseTitle;
    private String instructorName;
    private LocalDateTime enrolledAt;
    private Integer progressPercent;       // 완료한 강의 수 / 전체 강의 수 * 100
    private Integer completedLectures;
    private Integer totalLectures;
    private Boolean isCompleted;
    private String lastWatchedLectureTitle;
    private LocalDateTime lastWatchedAt;
}

// StudentDashboardResponse 예시
@Data
@Builder
public class StudentDashboardResponse {
    private Integer totalEnrollments;
    private Integer completedCourses;
    private Integer ongoingCourses;
    private Integer totalLearningMinutes;
    private Integer thisWeekLearningMinutes;
    private List<EnrollmentSummaryResponse> enrollmentSummary;
}
```

#### Step 4.2: Repository 쿼리

```java
// EnrollmentRepository에 추가
@Query("""
    SELECT e FROM Enrollment e
    JOIN FETCH e.course c
    JOIN FETCH c.instructor
    WHERE e.member.id = :memberId
    ORDER BY e.enrolledAt DESC
""")
Page<Enrollment> findByMemberWithDetails(Long memberId, Pageable pageable);
```

#### Step 4.3: Service 구현

```java
public StudentDashboardResponse getStudentDashboard(
    Long memberId,
    Pageable pageable
) {
    // 1. 사용자의 수강 목록 조회 (fetch join)
    Page<Enrollment> enrollments = enrollmentRepository.findByMemberWithDetails(
        memberId,
        pageable
    );
    
    // 2. 각 강의별 진도 계산
    List<EnrollmentSummaryResponse> summaries = enrollments.stream()
        .map(enrollment -> {
            Course course = enrollment.getCourse();
            Member member = enrollment.getMember();
            
            // 3. 강의의 전체 강의 개수
            Integer totalLectures = lectureRepository.countLecturesByCourse(course.getId());
            
            // 4. 완료한 강의 개수
            Integer completedLectures = lectureProgressRepository
                .countCompletedLecturesByCourseAndMember(course.getId(), memberId);
            
            // 5. 진도율 계산
            Integer progressPercent = totalLectures > 0 
                ? (completedLectures * 100) / totalLectures 
                : 0;
            
            // 6. 마지막 시청 정보 조회
            LectureProgress lastProgress = getLastWatchedLecture(memberId, course.getId());
            
            return EnrollmentSummaryResponse.builder()
                .courseId(course.getId())
                .courseTitle(course.getTitle())
                .instructorName(course.getInstructor().getNickname())
                .enrolledAt(enrollment.getEnrolledAt())
                .progressPercent(progressPercent)
                .completedLectures(completedLectures)
                .totalLectures(totalLectures)
                .isCompleted(enrollment.getIsCompleted())
                .lastWatchedLectureTitle(lastProgress != null ? lastProgress.getLecture().getTitle() : null)
                .lastWatchedAt(lastProgress != null ? lastProgress.getUpdatedAt() : null)
                .build();
        })
        .collect(Collectors.toList());
    
    // 7. 통계 계산
    Integer completedCount = (int) enrollments.stream()
        .filter(Enrollment::getIsCompleted)
        .count();
    
    Integer ongoingCount = (int) (enrollments.getTotalElements() - completedCount);
    
    Integer totalLearningMinutes = calculateTotalLearningMinutes(memberId);
    Integer thisWeekMinutes = calculateThisWeekLearningMinutes(memberId);
    
    return StudentDashboardResponse.builder()
        .totalEnrollments((int) enrollments.getTotalElements())
        .completedCourses(completedCount)
        .ongoingCourses(ongoingCount)
        .totalLearningMinutes(totalLearningMinutes)
        .thisWeekLearningMinutes(thisWeekMinutes)
        .enrollmentSummary(summaries)
        .build();
}

private Integer calculateTotalLearningMinutes(Long memberId) {
    // 모든 완료한 강의의 playTime 합
    Integer totalSeconds = lectureProgressRepository
        .findAll().stream()
        .filter(lp -> lp.getMember().getId().equals(memberId))
        .filter(lp -> lp.getLastPosition().equals(lp.getLecture().getPlayTime()))
        .mapToInt(lp -> lp.getLecture().getPlayTime())
        .sum();
    
    return totalSeconds / 60;  // 초 → 분
}

private Integer calculateThisWeekLearningMinutes(Long memberId) {
    LocalDateTime oneWeekAgo = LocalDateTime.now().minusWeeks(1);
    
    Integer weekSeconds = lectureProgressRepository
        .findAll().stream()
        .filter(lp -> lp.getMember().getId().equals(memberId))
        .filter(lp -> lp.getUpdatedAt().isAfter(oneWeekAgo))
        .mapToInt(LectureProgress::getLastPosition)
        .sum();
    
    return weekSeconds / 60;
}
```

#### Step 4.4: Controller 엔드포인트

```java
@GetMapping("/dashboard")
@PreAuthorize("hasRole('STUDENT')")
public ResponseEntity<ApiResponse<StudentDashboardResponse>> getStudentDashboard(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size,
    Authentication authentication
) {
    Long memberId = (Long) authentication.getPrincipal();
    
    Pageable pageable = PageRequest.of(page, size);
    StudentDashboardResponse result = lectureProgressService.getStudentDashboard(
        memberId,
        pageable
    );
    
    return ResponseEntity.ok(ApiResponse.success(
        result,
        "대시보드를 조회했습니다."
    ));
}
```

#### Step 4.5: 테스트

```
1. 대시보드 조회
   GET http://localhost:8080/api/students/dashboard?page=0&size=10
   Expected: 200, 모든 통계와 강의 목록

2. 진도율 검증
   강의1: 10/15 강의 완료 = 66.7% 확인
   강의2: 5/20 강의 완료 = 25% 확인

3. 학습 시간 계산
   이번 주 시간 = 정확히 계산되었는지 확인
```

### 5.2 커밋

```bash
# 커밋 1: DTO
git add src/main/java/com/chessmate/be/dto/response/EnrollmentSummaryResponse.java
git add src/main/java/com/chessmate/be/dto/response/StudentDashboardResponse.java
git commit -m "[Phase4-1] 대시보드 DTO 정의

- StudentDashboardResponse: 전체 대시보드
- EnrollmentSummaryResponse: 강의별 진도 요약"

# 커밋 2: Service
git add src/main/java/com/chessmate/be/service/EnrollmentService.java
git commit -m "[Phase4-2] 대시보드 비즈니스 로직 구현

- getStudentDashboard(): 대시보드 조회
- 진도율 계산, 학습 시간 계산
- 마지막 시청 정보 조회"

# 커밋 3: Controller + 테스트
git add src/main/java/com/chessmate/be/controller/EnrollmentController.java
git commit -m "[Phase4-3] 대시보드 API 엔드포인트

- GET /api/students/dashboard
- 페이지네이션 적용
- Postman 테스트 완료"
```

---

## 6. Phase 5: 통합 테스트 & 문서화

### 6.1 실행 항목

```
1. 전체 시나리오 테스트 (Postman)
   - 회원가입 → 로그인 → 강의 검색 → 상세 조회 → 수강 신청 → 진도 저장 → 대시보드
   
2. API 명세서 업데이트
   - API_SPECIFICATION.md에 새 엔드포인트 추가
   
3. Postman 컬렉션 내보내기
   - ChessMate_Student_API.postman_collection.json 생성
   
4. README 업데이트
   - MVP 완성 내용 추가
   
5. 예외 처리 검증
   - 각 엔드포인트별 에러 케이스 확인
```

### 6.2 커밋

```bash
# 커밋 1: API 명세서
git add API_SPECIFICATION.md
git commit -m "[Phase5-1] API 명세서 업데이트

- Phase 1-4 새 엔드포인트 추가
- 요청/응답 형식 문서화"

# 커밋 2: Postman 컬렉션
git add ChessMate_Student_API.postman_collection.json
git commit -m "[Phase5-2] Postman 컬렉션 생성

- 모든 엔드포인트 포함
- 샘플 요청/응답"

# 커밋 3: README
git add README.md
git commit -m "[Phase5-3] README 업데이트

- MVP 완성 표기
- Phase 1-4 기능 추가 내용 기록"

# 커밋 4: 최종 통합 테스트 결과
git commit -m "[Phase5-4] MVP 완성 및 통합 테스트 완료

- 전체 사용자 흐름 테스트 완료
- 예외 처리 검증 완료
- 성능 테스트 완료"
```

---

## 7. 커밋 규칙

### 7.1 커밋 메시지 포맷

```
[Phase#-Step#] 간단한 제목 (50자 이하)

상세 설명 (선택):
- 무엇을 구현했는가?
- 왜 이렇게 구현했는가?
- 어떤 파일이 변경되었는가?

예시:
[Phase1-1] 강의 검색 DTO 정의

- CourseSearchRequest: 검색 요청 파라미터
- CourseSearchResponse: 검색 결과 응답 DTO
- 강사 정보, 강의 개수, 총 재생 시간 포함
```

### 7.2 커밋 타이밍

```
원칙:
  - 각 파일/기능 완성 후 즉시 커밋
  - 한 번에 한 가지 기능만 커밋
  - 테스트 완료 후 커밋

예외:
  - DTO 정의는 여러 개를 함께 커밋 가능 (관련 있을 시)
  - Controller + Service는 함께 커밋 가능
```

### 7.3 커밋 체크리스트

```bash
# 커밋 전 확인
git status                      # 변경 파일 확인
git diff                        # 변경 내용 확인

# 컴파일 확인
./gradlew clean build

# 테스트 실행 (있으면)
./gradlew test

# 커밋
git add <file>
git commit -m "[Phase#-#] 메시지"

# 원격 저장소 푸시
git push origin main
```

---

## 8. 테스트 체크리스트

### Phase 별 테스트 항목

#### Phase 1: 검색 API
- [ ] 전체 강의 조회 (keyword 빈 문자열)
- [ ] 키워드 검색
- [ ] 카테고리 필터링
- [ ] 키워드 + 카테고리 조합
- [ ] 페이지네이션
- [ ] 인증 없이 접근 (401 확인)

#### Phase 2: 강의 상세 조회
- [ ] 강의 상세 조회 (섹션 + 강의 포함)
- [ ] 섹션/강의 정렬 확인
- [ ] 강사 정보 포함 확인
- [ ] 통계 계산 확인 (총 강의, 총 시간)
- [ ] 존재하지 않는 강의 (404)
- [ ] 인증 없이 접근 (401)

#### Phase 3: 진도 추적
- [ ] 진도 저장 (POST)
- [ ] 진도 조회 (GET)
- [ ] 진도 업데이트 확인
- [ ] 시청률 계산 확인
- [ ] 수강하지 않은 강의 진도 저장 (권한 확인)
- [ ] 유효하지 않은 진도값 (400)

#### Phase 4: 대시보드
- [ ] 대시보드 조회
- [ ] 진도율 계산 정확성
- [ ] 학습 시간 계산 정확성
- [ ] 완강 통계 확인
- [ ] 마지막 시청 정보 확인
- [ ] 페이지네이션

#### Phase 5: 통합
- [ ] 전체 흐름 테스트 (로그인 → 검색 → 상세 → 수강 → 진도 → 대시보드)
- [ ] 예외 처리 일관성
- [ ] API 응답 포맷 일관성
- [ ] 성능 확인 (응답 시간)

---

## 마무리

이 문서에 따라 순차적으로 진행하면 됩니다. 각 단계마다:

1. **구현** (코드 작성)
2. **테스트** (Postman)
3. **커밋** (작은 단위로)

💡 **팁**: 멀티태스킹하지 말고, 한 Phase씩 완결성 있게 완료하세요!

🚀 **시작하기!**

