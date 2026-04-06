# ✅ 강의 검색, 페이지네이션, 추가 강의 완료

## 📋 추가된 기능

### 1️⃣ 강의 검색 기능 (Search)

**엔드포인트**:
```
GET /api/courses/search?keyword=주식&category=domestic_stock&page=0&size=10
```

**쿼리 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|:---:|:---:|:---:|:---|
| `keyword` | String | ❌ | 강의 제목 검색 (빈 값이면 전체 조회) |
| `category` | String | ❌ | 카테고리 필터 (DOMESTIC_STOCK, OVERSEAS_STOCK, CRYPTO, NFT, ETF, FUTURES) |
| `page` | Integer | ❌ | 페이지 번호 (기본값: 0) |
| `size` | Integer | ❌ | 페이지 크기 (기본값: 10, 최대: 50) |

**특징**:
✅ 키워드가 비어있으면 전체 강의 조회
✅ 카테고리 필터 선택적 적용
✅ 최신순 정렬 (createdAt DESC)
✅ 페이지 크기 최대 50개로 제한
✅ 인증 없이 접근 가능 (공개 API)

---

### 2️⃣ 페이지네이션 완전 지원

**사용 가능한 모든 엔드포인트**:
```
GET /api/courses?page=0&size=10&sort=id,desc
GET /api/courses/category/{category}?page=0&size=10
GET /api/courses/instructor/{id}?page=0&size=10
GET /api/courses/search?keyword=test&page=0&size=10
```

**정렬 옵션** (Spring Data Pageable):
```
sort=id,desc          # ID 역순
sort=createdAt,desc   # 생성일 역순 (기본)
sort=price,asc        # 가격 오름차순
sort=title,asc        # 제목 오름차순
```

**응답 포맷**:
```json
{
  "data": {
    "content": [ /* 강의 목록 */ ],
    "totalElements": 100,
    "totalPages": 10,
    "currentPage": 0,
    "pageSize": 10
  },
  "message": "강의 검색 결과입니다."
}
```

---

### 3️⃣ 초기 강의 데이터 확대

**이전**: 70개 강의
- 국내 주식: 12개
- 해외 주식: 12개
- 암호화폐: 12개
- NFT: 11개
- ETF: 11개
- 선물투자: 12개

**지금**: 100개 강의 (70개 + 30개 추가)
- 국내 주식: 17개 (12 + 5)
- 해외 주식: 17개 (12 + 5)
- 암호화폐: 17개 (12 + 5)
- NFT: 16개 (11 + 5)
- ETF: 16개 (11 + 5)
- 선물투자: 17개 (12 + 5)

---

## 🔧 코드 변경사항

### 1. CourseController 수정

**검색 엔드포인트 업데이트**:
```java
@GetMapping("/search")
public ResponseEntity<ApiResponse<Page<CourseResponse>>> searchCourses(
    @RequestParam(defaultValue = "") String keyword,
    @RequestParam(required = false) String category,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size
)
```

**변경 사항**:
- ✅ `@PreAuthorize("isAuthenticated()")` 제거 → 공개 API로 변경
- ✅ 반환 타입 `CourseSearchResponse` → `CourseResponse` (통일)
- ✅ Enum 기반 카테고리 지원

---

### 2. CourseService 수정

**searchCourses 메서드 개선**:
```java
public Page<CourseResponse> searchCourses(
    String keyword,
    String category,
    Pageable pageable
)
```

**특징**:
```java
// 1. String → Enum 자동 변환
Course.CourseCategory courseCategory = null;
if (category != null && !category.trim().isEmpty()) {
    try {
        courseCategory = Course.CourseCategory.valueOf(category.toUpperCase());
    } catch (IllegalArgumentException e) {
        courseCategory = null; // 유효하지 않은 카테고리는 무시
    }
}

// 2. CourseResponse 반환 (수강인원 포함)
return courses.map(course -> {
    Integer studentCount = enrollmentRepository.countByCourseId(course.getId());
    return CourseResponse.from(course, studentCount);
});
```

---

### 3. DataInitializer 추가 강의 생성

**추가된 강의 (30개)**:

**국내 주식 추가 (5개)**:
```
1. 국내 우량주 분석 가이드
2. 한국 경제 지표 읽기
3. 주식 봉차트 마스터
4. 시가총액별 투자 전략
5. 국내 신생기업 주식 투자
```

**해외 주식 추가 (5개)**:
```
1. 캐나다 주식 투자
2. 호주 광산주 분석
3. 뉴질랜드 투자 기회
4. 신흥국 주식 투자
5. 글로벌 인덱스펀드 활용
```

**암호화폐 추가 (5개)**:
```
1. 암호화폐 지갑 완벽 가이드
2. 리스크 관리 전략
3. 암호화폐 뉴스 분석
4. 코인 차트 기술 분석
5. 암호화폐 거래 심리학
```

**NFT 추가 (5개)**:
```
1. NFT 커뮤니티 활동법
2. 메타버스 NFT 투자
3. 스포츠 NFT 전략
4. 음악 NFT 시장 분석
5. NFT 로열티 수익화
```

**ETF 추가 (5개)**:
```
1. 하이일드 ETF 투자
2. 금 ETF 투자 가이드
3. 부동산 ETF 활용
4. 에너지 전환 ETF
5. 국제 채권 ETF
```

**선물투자 추가 (5개)**:
```
1. KOSPI 200 선물 전략
2. 금리 선물 투자
3. 환율 선물 활용
4. 에너지 선물 분석
5. 선물 위험 관리
```

---

## 🧪 API 테스트 방법

### 1️⃣ 전체 검색 (키워드 없이)
```bash
curl http://localhost:8080/api/courses/search?page=0&size=10
```

### 2️⃣ 키워드 기반 검색
```bash
# "주식" 포함 강의 검색
curl http://localhost:8080/api/courses/search?keyword=%EC%A3%BC%EC%8B%9D&page=0&size=10
# URL 디코딩: "주식"

# "투자" 포함 강의 검색
curl http://localhost:8080/api/courses/search?keyword=%ED%88%AC%EC%9E%90
```

### 3️⃣ 카테고리별 필터링
```bash
# 국내 주식 검색
curl http://localhost:8080/api/courses/search?category=domestic_stock&page=0&size=10

# "주식" 키워드 + 국내 주식 카테고리
curl http://localhost:8080/api/courses/search?keyword=%EC%A3%BC%EC%8B%9D&category=domestic_stock

# 암호화폐 전체 (키워드 없음)
curl http://localhost:8080/api/courses/search?category=crypto&page=0&size=10
```

### 4️⃣ 페이지네이션 테스트
```bash
# 1페이지 (0 ~ 9번째)
curl http://localhost:8080/api/courses/search?page=0&size=10

# 2페이지 (10 ~ 19번째)
curl http://localhost:8080/api/courses/search?page=1&size=10

# 페이지 크기 20
curl http://localhost:8080/api/courses/search?page=0&size=20

# 페이지 크기 50 (최대)
curl http://localhost:8080/api/courses/search?page=0&size=50

# 페이지 크기 100 → 자동으로 50으로 제한됨
curl http://localhost:8080/api/courses/search?page=0&size=100
```

### 5️⃣ 정렬 옵션 (카테고리 조회)
```bash
# 최신순 (기본)
curl http://localhost:8080/api/courses/category/domestic_stock?page=0&size=10

# 가격 오름차순
curl http://localhost:8080/api/courses?page=0&size=10&sort=price,asc

# 제목 오름차순
curl http://localhost:8080/api/courses?page=0&size=10&sort=title,asc
```

---

## 📊 응답 예시

### 검색 성공 (3개 결과)
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
        "thumbnailUrl": "https://via.placeholder.com/300x200?text=DOMESTIC_STOCK",
        "instructor": {
          "id": 1,
          "email": "teacher1@example.com",
          "nickname": "주식 전문가 김강사"
        },
        "studentCount": 3,
        "createdAt": "2026-04-06T12:00:00"
      },
      {
        "id": 2,
        "title": "KOSPI 지수 읽기",
        "description": "KOSPI 지수 읽기에 대한 완전한 강의입니다...",
        "category": "DOMESTIC_STOCK",
        "categoryDisplayName": "국내 주식",
        "price": 30900,
        "thumbnailUrl": "https://via.placeholder.com/300x200?text=DOMESTIC_STOCK",
        "instructor": {
          "id": 2,
          "email": "teacher2@example.com",
          "nickname": "암호화폐 전문가 이강사"
        },
        "studentCount": 2,
        "createdAt": "2026-04-06T12:00:00"
      },
      {
        "id": 3,
        "title": "한국 기업 분석하기",
        "description": "한국 기업 분석하기에 대한 완전한 강의입니다...",
        "category": "DOMESTIC_STOCK",
        "categoryDisplayName": "국내 주식",
        "price": 31900,
        "thumbnailUrl": "https://via.placeholder.com/300x200?text=DOMESTIC_STOCK",
        "instructor": {
          "id": 3,
          "email": "teacher3@example.com",
          "nickname": "파이낸셜 컨설턴트 박강사"
        },
        "studentCount": 1,
        "createdAt": "2026-04-06T12:00:00"
      }
    ],
    "totalElements": 100,
    "totalPages": 10,
    "currentPage": 0,
    "pageSize": 10
  },
  "message": "강의 검색 결과입니다."
}
```

---

## 🎯 주요 개선 사항

| 항목 | 이전 | 지금 | 변경 |
|:---:|:---:|:---:|:---|
| **강의 수** | 70개 | 100개 | +30개 |
| **검색 인증** | 필수 | 불필요 | 공개 API |
| **검색 반환** | CourseSearchResponse | CourseResponse | 통일 |
| **카테고리 처리** | String | Enum (자동 변환) | 타입 안전성 |
| **페이지 크기 제한** | 없음 | 최대 50개 | 성능 최적화 |
| **정렬 옵션** | 없음 | 다중 정렬 지원 | 유연성 증가 |

---

## 🚀 배포 전 체크리스트

- [x] CourseController 검색 엔드포인트 수정
- [x] CourseService searchCourses 메서드 개선
- [x] DataInitializer 추가 강의 생성
- [x] SecurityConfig 검색 공개 설정 (이미 포함)
- [ ] 프로젝트 재빌드 (`gradle build`)
- [ ] 서버 재시작 (`gradle bootRun`)
- [ ] 검색 기능 테스트 (키워드, 카테고리, 페이지네이션)
- [ ] 초기 데이터 100개 생성 확인
- [ ] 성능 테스트 (페이지 크기 제한 확인)

---

**수정 완료**: 2026-04-06  
**파일 수정**: 3개 (CourseController, CourseService, DataInitializer)  
**상태**: ✅ 검색, 페이지네이션, 추가 강의 완료


