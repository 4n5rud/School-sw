# 📖 ChessMate P1 개발 가이드

**작성일**: 2026-04-02  
**상태**: 📋 개발 가이드 완성

---

## 📑 목차

1. [개발 환경 설정](#1-개발-환경-설정)
2. [Git 커밋 전략](#2-git-커밋-전략)
3. [코드 스타일 가이드](#3-코드-스타일-가이드)
4. [구현 순서](#4-구현-순서)
5. [디버깅 가이드](#5-디버깅-가이드)
6. [배포 전 체크리스트](#6-배포-전-체크리스트)

---

## 1. 개발 환경 설정

### 1.1 필수 도구

| 도구 | 버전 | 설치 링크 |
|:---|:---|:---|
| Java | 17+ | https://openjdk.java.net/ |
| Gradle | 7.6+ | https://gradle.org/install/ |
| IDE | IntelliJ IDEA 2023+ | https://www.jetbrains.com/idea/ |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/ |
| Postman | 최신 | https://www.postman.com/downloads/ |

### 1.2 프로젝트 초기 설정

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd chessmate-be

# 2. Gradle 의존성 다운로드
gradle build

# 3. IDE에서 프로젝트 열기
# IntelliJ IDEA → Open → build.gradle 선택

# 4. 애플리케이션 실행
./gradlew bootRun
# 또는 IDE에서 BeApplication.java 실행
```

### 1.3 데이터베이스 설정

**application.yml 수정:**

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/chessmate
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: update  # 개발 환경에서만 사용
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        use_sql_comments: true
  
  h2:
    console:
      enabled: true
```

**DB 생성:**

```sql
CREATE DATABASE chessmate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chessmate;

-- 테이블 자동 생성됨 (JPA DDL)
```

### 1.4 IDE 플러그인 설정

**IntelliJ IDEA 필수 플러그인:**

```
1. Lombok Plugin
   - File → Settings → Plugins → Lombok
   - Install 클릭

2. SQL 하이라이팅
   - File → Settings → Languages & Frameworks → SQL Dialects
   - MySQL 선택

3. REST Client
   - File → Settings → Plugins → HTTP Client
   - 또는 Postman 사용

4. Git 연동
   - File → Settings → Version Control → Git
   - Git 경로 설정
```

---

## 2. Git 커밋 전략

### 2.1 커밋 메시지 규칙

**형식:**
```
[Phase<번호>-Step<번호>] <타입>: <제목>

<본문>

<푸터>
```

**예시:**
```
[Phase1-Step1] feat: DTO 정의 (CourseSearchRequest, CourseSearchResponse)

- CourseSearchRequest: 검색 조건 (keyword, category, page, size)
- CourseSearchResponse: 검색 결과 (강의 기본 정보 + 강사 정보)
- PageResponse: 페이지네이션 정보

Issue: #1
```

### 2.2 커밋 타입

| 타입 | 설명 | 예시 |
|:---|:---|:---|
| `feat` | 새로운 기능 | feat: 검색 API 엔드포인트 추가 |
| `fix` | 버그 수정 | fix: N+1 쿼리 문제 해결 |
| `refactor` | 코드 리팩토링 | refactor: Service 로직 분리 |
| `test` | 테스트 추가 | test: CourseServiceTest 작성 |
| `docs` | 문서 작성 | docs: API 명세서 업데이트 |
| `chore` | 설정 변경 | chore: build.gradle 의존성 추가 |

### 2.3 커밋 주기

**원칙: 작은 단위로 자주 커밋**

```
Good ✅                          Bad ❌
[Step1] DTO 정의                 [Phase1] 모든 기능 구현
[Step2] Repository 추가          
[Step3] Service 로직             
[Step4] Controller 구현          
[Step5] 테스트 완료              
```

### 2.4 브랜치 전략

**브랜치 이름 규칙:**

```
main (프로덕션)
  ├── develop (개발 기준)
  │   ├── feature/phase1-search-api
  │   ├── feature/phase2-detail-api
  │   ├── feature/phase3-progress-api
  │   ├── feature/phase4-dashboard-api
  │   └── bugfix/fix-n1-query
  └── hotfix/urgent-fix
```

**브랜치 생성 및 병합:**

```bash
# 1. develop에서 feature 브랜치 생성
git checkout develop
git pull origin develop
git checkout -b feature/phase1-search-api

# 2. 작업 진행 및 커밋
git add .
git commit -m "[Phase1-Step1] feat: DTO 정의"

# 3. 작업 완료 후 develop에 병합
git checkout develop
git pull origin develop
git merge feature/phase1-search-api
git push origin develop

# 4. feature 브랜치 삭제
git branch -d feature/phase1-search-api
```

---

## 3. 코드 스타일 가이드

### 3.1 Java 코딩 컨벤션

**패키지 구조:**

```
com.chessmate.be
├── api          # API 관련 (Controller, DTO)
├── config       # 설정 (SecurityConfig, etc)
├── controller   # REST Controller
├── domain       # 도메인 (Entity, Repository)
├── dto          # Data Transfer Object
│   ├── request
│   └── response
├── entity       # JPA Entity
├── exception    # 예외 처리
├── repository   # Data Access
├── security     # 인증/인가
└── service      # 비즈니스 로직
```

**클래스 네이밍:**

```java
// Controller
CourseController.java
CourseSearchController.java

// Service
CourseService.java
LectureProgressService.java

// Repository
CourseRepository.java

// Entity
Course.java
LectureProgress.java

// DTO
CourseSearchRequest.java
CourseSearchResponse.java
```

### 3.2 메서드 작성 가이드

**메서드 주석 (Javadoc):**

```java
/**
 * 강의 검색
 * 
 * 사용자가 입력한 키워드와 카테고리로 강의를 검색합니다.
 * 결과는 최신순으로 정렬되며 페이지네이션을 지원합니다.
 * 
 * @param keyword 검색 키워드 (제목, 설명에서 검색)
 * @param category 카테고리 필터 (STOCK, CRYPTO 또는 null)
 * @param page 페이지 번호 (0-based)
 * @param size 페이지 크기 (1-50)
 * @return 검색 결과를 포함한 PageResponse
 * @throws IllegalArgumentException keyword가 null 또는 empty인 경우
 * @throws IllegalArgumentException category가 유효하지 않은 경우
 */
public PageResponse<CourseSearchResponse> searchCourses(
    String keyword,
    String category,
    Integer page,
    Integer size
) {
    // 구현
}
```

**메서드 길이:**

```
✅ 1개 메서드 = 20-30줄 (이상적)
⚠️  1개 메서드 > 50줄 (리팩토링 고려)
❌  1개 메서드 > 100줄 (반드시 분리)
```

### 3.3 DTO 작성 가이드

```java
/**
 * 강의 검색 요청 DTO
 * 
 * 사용자로부터 받은 검색 조건을 담는 객체입니다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSearchRequest {
    
    @NotBlank(message = "keyword는 필수입니다.")
    private String keyword;
    
    @Pattern(regexp = "^(STOCK|CRYPTO)$|null", 
             message = "category는 STOCK, CRYPTO이어야 합니다.")
    private String category;
    
    @Min(value = 0, message = "page는 0 이상이어야 합니다.")
    private Integer page = 0;
    
    @Min(value = 1, message = "size는 1 이상이어야 합니다.")
    @Max(value = 50, message = "size는 50 이하여야 합니다.")
    private Integer size = 10;
}
```

### 3.4 Service 계층 가이드

```java
@Service
@RequiredArgsConstructor
@Transactional
public class CourseService {
    
    // 생성자 주입 (권장)
    private final CourseRepository courseRepository;
    private final SecurityUtils securityUtils;
    
    // 조회 메서드는 readOnly 필수
    @Transactional(readOnly = true)
    public PageResponse<CourseSearchResponse> searchCourses(...) {
        // 비즈니스 로직
    }
    
    // 수정 메서드는 readOnly 불필요 (default = false)
    public void saveCourse(...) {
        // 비즈니스 로직
    }
}
```

### 3.5 Repository 가이드

```java
@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    // 1. 간단한 쿼리는 메서드명으로 표현
    Optional<Course> findByTitle(String title);
    
    List<Course> findByCategory(String category);
    
    // 2. 복잡한 쿼리는 @Query 사용
    @Query("""
        SELECT c
        FROM Course c
        LEFT JOIN FETCH c.instructor i
        LEFT JOIN FETCH c.sections s
        WHERE c.id = :courseId
        """)
    Optional<Course> findByIdWithSections(@Param("courseId") Long courseId);
    
    // 3. Pageable은 마지막 파라미터
    Page<Course> findByCategory(String category, Pageable pageable);
}
```

---

## 4. 구현 순서

### 4.1 Phase별 구현 체크리스트

#### Phase 1: 검색 API

- [ ] Step 1.1: DTO 생성
  - [ ] `CourseSearchRequest.java`
  - [ ] `CourseSearchResponse.java`
  - [ ] `PageResponse.java`

- [ ] Step 1.2: Repository 메서드 추가
  - [ ] `CourseRepository.searchByKeywordAndCategory()`
  - [ ] JPQL 쿼리 작성

- [ ] Step 1.3: Service 메서드 구현
  - [ ] `CourseService.searchCourses()`
  - [ ] 입력값 검증
  - [ ] 통계 계산 (totalLectures, totalPlayTime)

- [ ] Step 1.4: Controller 엔드포인트 구현
  - [ ] `GET /api/courses/search`
  - [ ] 쿼리 파라미터 바인딩
  - [ ] 예외 처리

- [ ] Step 1.5: 테스트 및 커밋
  - [ ] Postman 테스트
  - [ ] Unit/Integration 테스트 작성
  - [ ] 커밋 및 푸시

#### Phase 2: 강의 상세 조회

- [ ] Step 2.1: DTO 생성
- [ ] Step 2.2: Repository 쿼리 추가
- [ ] Step 2.3: Service 메서드 구현
- [ ] Step 2.4: Controller 엔드포인트
- [ ] Step 2.5: 테스트 및 커밋

#### Phase 3: 진도 추적

- [ ] Step 3.1: DTO 생성
- [ ] Step 3.2: Repository 메서드 추가
- [ ] Step 3.3: Service 메서드 구현
- [ ] Step 3.4: Controller 엔드포인트
- [ ] Step 3.5: Entity 수정 (필요시)
- [ ] Step 3.6: 테스트 및 커밋

#### Phase 4: 대시보드

- [ ] Step 4.1: DTO 생성
- [ ] Step 4.2: Service 메서드 구현
- [ ] Step 4.3: Controller 엔드포인트
- [ ] Step 4.4: 테스트 및 커밋

#### Phase 5: 통합 테스트 & 문서화

- [ ] Step 5.1: Postman 컬렉션 작성
- [ ] Step 5.2: API 문서 최종 정리
- [ ] Step 5.3: 예외 처리 재검증
- [ ] Step 5.4: 통합 테스트 시나리오 실행

---

## 5. 디버깅 가이드

### 5.1 로깅 설정

**application.yml:**

```yaml
logging:
  level:
    com.chessmate.be: DEBUG
    org.springframework.web: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql: TRACE
```

**코드에서 로깅:**

```java
private static final Logger log = LoggerFactory.getLogger(CourseService.class);

public PageResponse<CourseSearchResponse> searchCourses(...) {
    log.debug("강의 검색 시작: keyword={}, category={}", keyword, category);
    
    try {
        PageResponse<CourseSearchResponse> result = ...;
        log.debug("강의 검색 완료: count={}", result.getContent().size());
        return result;
    } catch (Exception e) {
        log.error("강의 검색 실패", e);
        throw e;
    }
}
```

### 5.2 자주 발생하는 오류

#### 1. N+1 쿼리 문제

**증상:**
```
1 + N개의 SQL 쿼리가 실행됨 (예: 1개 SELECT + 100개 SELECT)
```

**해결:**
```java
// ❌ 잘못된 방식 (지연 로딩)
@OneToMany(fetch = FetchType.LAZY)
private List<Section> sections;

// ✅ 올바른 방식 (fetch join)
@Query("""
    SELECT c
    FROM Course c
    LEFT JOIN FETCH c.sections s
    LEFT JOIN FETCH s.lectures l
    WHERE c.id = :courseId
    """)
Optional<Course> findByIdWithSections(@Param("courseId") Long courseId);
```

#### 2. LazyInitializationException

**증상:**
```
failed to lazily initialize a collection of role ...
```

**해결:**
```java
// Service에서 @Transactional 필수
@Transactional(readOnly = true)
public CourseDetailResponse getCourseDetail(Long courseId) {
    Course course = courseRepository.findByIdWithSectionsAndLectures(courseId)
        .orElseThrow(...);
    // 여기서 course.getSections() 접근 가능
    return ...;
}
```

#### 3. 순환 참조 (Jackson 직렬화)

**증상:**
```
Infinite recursion (StackOverflowError)
```

**해결:**
```java
// ✅ DTO를 사용 (엔티티 직접 반환 금지)
public ResponseEntity<?> getCourse(@PathVariable Long id) {
    Course course = courseRepository.findById(id).orElseThrow();
    return ResponseEntity.ok(CourseResponse.from(course));  // DTO 반환
}
```

### 5.3 SQL 디버깅

**IntelliJ Database Tool:**

```
View → Tool Windows → Database
마우스 우클릭 → New Database
설정: Host=localhost, User=root, Password=..., Database=chessmate
OK 클릭
테이블 조회 가능
```

**쿼리 실행:**

```sql
-- Hibernate가 생성한 쿼리를 수동으로 실행
SELECT DISTINCT c
FROM course c
LEFT JOIN course_section s ON c.id = s.course_id
LEFT JOIN section_lecture l ON s.id = l.section_id
WHERE c.title LIKE '%주식%' AND c.category = 'STOCK'
ORDER BY c.created_at DESC
LIMIT 10;
```

---

## 6. 배포 전 체크리스트

### 6.1 코드 품질 검증

```bash
# 1. 컴파일 확인
./gradlew build

# 2. 테스트 실행
./gradlew test

# 3. 모든 패키지 import 확인 (미사용 import 제거)
# IntelliJ: Code → Optimize Imports (Ctrl+Shift+O)

# 4. 코드 스타일 검증
# IntelliJ: Code → Inspect Code

# 5. Git 상태 확인
git status
git log --oneline -10
```

### 6.2 보안 검증

```java
// ✅ 모든 API에 @PreAuthorize 또는 권한 검증 필수
@PreAuthorize("hasRole('STUDENT')")
@GetMapping("/dashboard")
public ResponseEntity<?> getDashboard() { ... }

// ✅ 모든 수정 작업은 소유자 검증 필수
if (!enrollment.getMemberId().equals(getCurrentMemberId())) {
    throw new AccessDeniedException("...");
}

// ✅ 민감한 정보는 로깅하지 않기
log.debug("사용자 로그인: {}", user.getId());  // ✅
log.debug("사용자 로그인: {} / {}", user.getEmail(), user.getPassword());  // ❌
```

### 6.3 성능 검증

```
체크 항목:
- [ ] N+1 쿼리 없음 (fetch join 확인)
- [ ] 페이지네이션 적용 (대량 데이터 조회)
- [ ] 인덱스 생성 (검색 컬럼)
- [ ] 불필요한 로깅 제거
- [ ] 트랜잭션 범위 최소화
```

### 6.4 데이터베이스 검증

```sql
-- 인덱스 생성
CREATE INDEX idx_course_category ON course(category);
CREATE INDEX idx_course_title ON course(title);
CREATE INDEX idx_lecture_progress_enrollment ON lecture_progress(enrollment_id);

-- 타입 확인
DESC course;  -- 모든 컬럼이 적절한 타입인지 확인

-- 제약조건 확인
SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'course';
```

### 6.5 배포 체크리스트

```
배포 전 확인사항:
- [ ] 모든 테스트 통과 (Unit + Integration + E2E)
- [ ] API 문서 최신화
- [ ] 환경 변수 설정 (DB URL, JWT Secret 등)
- [ ] 로깅 레벨 적절히 설정
- [ ] 에러 메시지 명확함
- [ ] CORS 설정 프로덕션용으로 변경
- [ ] SQL 쿼리 최적화 완료
- [ ] 코드 리뷰 완료
- [ ] 성능 테스트 완료
- [ ] 보안 감시 완료
```

---

## 🚀 빠른 시작 가이드

### 새로운 기능 구현할 때:

```bash
# 1. feature 브랜치 생성
git checkout develop
git checkout -b feature/phase1-search-api

# 2. 작업 진행
# - DTO 작성
# - Repository 메서드 추가
# - Service 로직 구현
# - Controller 엔드포인트 구현

# 3. 각 단계마다 커밋
git add .
git commit -m "[Phase1-Step1] feat: DTO 정의"
git commit -m "[Phase1-Step2] feat: Repository 메서드 추가"
git commit -m "[Phase1-Step3] feat: Service 로직 구현"

# 4. 테스트 및 최종 커밋
git commit -m "[Phase1-Step4] test: API 테스트 완료"

# 5. develop에 병합
git checkout develop
git merge feature/phase1-search-api
git push origin develop
```

---

**작성자**: GitHub Copilot  
**최종 수정**: 2026-04-02

