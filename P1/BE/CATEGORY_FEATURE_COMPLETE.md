# ✅ 강의 카테고리 기능 추가 완료

## 📋 추가된 기능

### 1️⃣ 새로운 카테고리 구조

**이전** (2개 카테고리):
```
- STOCK
- CRYPTO
```

**지금** (6개 상세 카테고리):
```
- DOMESTIC_STOCK    (국내 주식)
- OVERSEAS_STOCK    (해외 주식)
- CRYPTO            (암호화폐)
- NFT               (NFT)
- ETF               (ETF)
- FUTURES           (선물투자)
```

---

## 📊 초기 데이터 생성

### 카테고리별 강의 개수

| 카테고리 | 한글명 | 강의 수 | 설명 |
|:---:|:---|:---:|:---|
| DOMESTIC_STOCK | 국내 주식 | 12개 | 코스피, 기업분석, 배당주 등 |
| OVERSEAS_STOCK | 해외 주식 | 12개 | 나스닥, 미국주, 유럽주 등 |
| CRYPTO | 암호화폐 | 12개 | 비트코인, 이더리움, 알트코인 등 |
| NFT | NFT | 11개 | NFT 마켓, 디지털 아트 등 |
| ETF | ETF | 11개 | 섹터 ETF, 채권 ETF 등 |
| FUTURES | 선물투자 | 12개 | 스탁옵션, 마진 거래 등 |
| **총합** | | **70개** | |

### 강의 생성 예시

**국내 주식 강의 (12개)**:
```
1. 국내 주식 투자의 기초
2. KOSPI 지수 읽기
3. 한국 기업 분석하기
4. 국내 대형주 투자 전략
5. 국내 소형주 고수익 전략
6. 국내 배당주 완벽 가이드
... (총 12개)
```

**해외 주식 강의 (12개)**:
```
1. 미국 주식 투자 시작하기
2. 나스닥 100 투자법
3. S&P 500 전략
4. 미국 기술주 투자
... (총 12개)
```

**암호화폐 강의 (12개)**:
```
1. 비트코인 완전 정복
2. 이더리움 스마트 컨트랙트
3. 블록체인 기술 이해
... (총 12개)
```

**NFT 강의 (11개)**:
```
1. NFT 기초 이해하기
2. NFT 마켓플레이스 활용
... (총 11개)
```

**ETF 강의 (11개)**:
```
1. ETF 기초 개념
2. 주식 ETF 투자 전략
... (총 11개)
```

**선물투자 강의 (12개)**:
```
1. 선물 투자 기초
2. 스탁옵션 이해하기
... (총 12개)
```

---

## 🔧 코드 변경사항

### 1. Course 엔티티 수정

**추가된 Enum**:
```java
public enum CourseCategory {
    DOMESTIC_STOCK("국내 주식"),
    OVERSEAS_STOCK("해외 주식"),
    CRYPTO("암호화폐"),
    NFT("NFT"),
    ETF("ETF"),
    FUTURES("선물투자");

    private final String displayName;
    
    public String getDisplayName() {
        return displayName;
    }
}
```

**변경된 필드**:
```java
// 이전
@Column(nullable = false)
private String category; // "STOCK", "CRYPTO"

// 지금
@Enumerated(EnumType.STRING)
@Column(nullable = false)
private CourseCategory category; // Enum 타입
```

---

### 2. CourseRepository 수정

**추가된 메서드**:
```java
// Enum 기반 조회
Page<Course> findByCategory(Course.CourseCategory category, Pageable pageable);

// 카테고리별 개수 조회
long countByCategory(Course.CourseCategory category);

// 검색 쿼리 (Enum 지원)
Page<Course> searchByKeywordAndCategory(
    String keyword,
    Course.CourseCategory category,
    Pageable pageable
);
```

---

### 3. CourseService 수정

**추가된 메서드**:
```java
// Enum 기반 조회
public Page<CourseResponse> getCoursesByCategory(
    Course.CourseCategory category, 
    Pageable pageable
)

// String 기반 편의 메서드
public Page<CourseResponse> getCoursesByCategoryName(
    String categoryName, 
    Pageable pageable
)
```

---

### 4. CourseController 수정

**변경된 엔드포인트**:
```java
@GetMapping("/category/{category}")
public ResponseEntity<ApiResponse<Page<CourseResponse>>> getCoursesByCategory(
    @PathVariable String category,
    Pageable pageable
)
```

**사용 예시**:
```
GET /api/courses/category/domestic_stock?page=0&size=10
GET /api/courses/category/overseas_stock
GET /api/courses/category/crypto
GET /api/courses/category/nft
GET /api/courses/category/etf
GET /api/courses/category/futures
```

---

### 5. DTO 수정

**CourseCreateRequest**:
```java
// 이전
@Pattern(regexp = "^(STOCK|CRYPTO)$")
private String category;

// 지금
@NotNull
private Course.CourseCategory category; // Enum 타입
```

**CourseResponse**:
```java
private Course.CourseCategory category;
private String categoryDisplayName; // "국내 주식" 등
```

---

### 6. DataInitializer 수정

**추가된 메서드**:
```java
private void createCoursesByCategory(
    List<Course> courses,
    List<Member> instructors,
    String[] titles,
    Course.CourseCategory category,
    String categoryName
)
```

**생성 로직**:
```java
private List<Course> createCourses(List<Member> instructors) {
    List<Course> courses = new ArrayList<>();
    
    // 카테고리별 강의 생성
    createCoursesByCategory(courses, instructors, domesticStockTitles, 
        Course.CourseCategory.DOMESTIC_STOCK, "국내 주식");
    
    createCoursesByCategory(courses, instructors, overseasStockTitles,
        Course.CourseCategory.OVERSEAS_STOCK, "해외 주식");
    
    // ... 나머지 카테고리
    
    return courses;
}
```

---

## 🧪 API 테스트 방법

### 1️⃣ 전체 강의 조회
```bash
curl http://localhost:8080/api/courses?page=0&size=10
```

### 2️⃣ 카테고리별 조회

```bash
# 국내 주식
curl http://localhost:8080/api/courses/category/domestic_stock?page=0&size=10

# 해외 주식
curl http://localhost:8080/api/courses/category/overseas_stock?page=0&size=10

# 암호화폐
curl http://localhost:8080/api/courses/category/crypto?page=0&size=10

# NFT
curl http://localhost:8080/api/courses/category/nft?page=0&size=10

# ETF
curl http://localhost:8080/api/courses/category/etf?page=0&size=10

# 선물투자
curl http://localhost:8080/api/courses/category/futures?page=0&size=10
```

### 3️⃣ 응답 예시

```json
{
  "data": {
    "content": [
      {
        "id": 1,
        "title": "국내 주식 투자의 기초",
        "description": "국내 주식 투자의 기초에 대한 완전한 강의입니다...",
        "category": "DOMESTIC_STOCK",
        "categoryDisplayName": "국내 주식",
        "price": 29900,
        "thumbnailUrl": "https://via.placeholder.com/300x200...",
        "instructor": {
          "id": 1,
          "email": "teacher1@example.com",
          "nickname": "주식 전문가 김강사"
        },
        "studentCount": 3,
        "createdAt": "2026-04-06T12:00:00"
      },
      ...
    ],
    "totalElements": 12,
    "totalPages": 2,
    "currentPage": 0,
    "pageSize": 10
  },
  "message": "강의 목록 조회 성공"
}
```

---

## 📝 카테고리 참고사항

### 카테고리 이름 규칙

| 요청 값 | 올바른 형식 |
|:---:|:---|
| `domestic_stock` | ❌ (underscore) |
| `DOMESTIC_STOCK` | ✅ (권장) |
| `Domestic_Stock` | ✅ (혼합, 자동 변환됨) |
| `domestic-stock` | ❌ (dash 불가) |

**자동 변환**:
- `domestic_stock` → `DOMESTIC_STOCK` (내부적으로 자동 변환)
- 대소문자 무관 (`.toUpperCase()` 처리)

### 유효한 카테고리 목록

```
DOMESTIC_STOCK   → "국내 주식"
OVERSEAS_STOCK   → "해외 주식"
CRYPTO           → "암호화폐"
NFT              → "NFT"
ETF              → "ETF"
FUTURES          → "선물투자"
```

---

## 🎯 마이그레이션 가이드

기존 데이터가 있는 경우 DB 스키마 변경:

### SQL 스크립트
```sql
-- 기존 course 테이블의 category 컬럼 수정
-- (H2 또는 Hibernate auto-create 사용 시 자동 처리)

-- MySQL의 경우:
ALTER TABLE course CHANGE COLUMN category category VARCHAR(50) NOT NULL;

-- 기존 데이터 마이그레이션 (선택사항)
-- STOCK → DOMESTIC_STOCK 또는 OVERSEAS_STOCK
-- CRYPTO → CRYPTO (변경 없음)
```

### 주의사항

- ✅ 새로운 환경: DataInitializer가 자동으로 70개 강의 생성
- ⚠️ 기존 환경: 수동으로 스키마 변경 필요
- 💾 DB 백업 권장

---

## ✨ 변경 사항 요약

| 항목 | 이전 | 지금 | 변경 사항 |
|:---:|:---:|:---:|:---|
| **카테고리 수** | 2개 | 6개 | +4개 카테고리 추가 |
| **초기 강의 수** | 32개 | 70개 | +38개 강의 |
| **카테고리 타입** | String | Enum | 타입 안전성 향상 |
| **표시명** | 없음 | 추가 | 한글 표시명 제공 |
| **카테고리 개수 조회** | 없음 | 추가 | 통계 기능 추가 |

---

## 🚀 배포 전 체크리스트

- [x] Course 엔티티 수정
- [x] CourseRepository 메서드 추가
- [x] CourseService 메서드 추가
- [x] CourseController 엔드포인트 수정
- [x] DTO 수정
- [x] DataInitializer 강의 생성 로직 추가
- [ ] 프로젝트 재빌드 (`gradle build`)
- [ ] 서버 재시작 (`gradle bootRun`)
- [ ] 각 카테고리별 조회 테스트
- [ ] 페이지네이션 테스트

---

**수정 완료**: 2026-04-06  
**파일 수정**: 6개 (Entity, Repository, Service, Controller, DTO, DataInitializer)  
**상태**: ✅ 카테고리 기능 완료


