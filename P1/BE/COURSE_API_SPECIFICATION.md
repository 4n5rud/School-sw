# 🎓 강의 조회 API 명세서 (Course Query API Specification)

## 📋 목차
1. [기본 정보](#기본-정보)
2. [응답 데이터 구조](#응답-데이터-구조)
3. [API 엔드포인트](#api-엔드포인트)
4. [카테고리 정의](#카테고리-정의)
5. [예제 및 테스트](#예제-및-테스트)

---

## 기본 정보

| 항목 | 내용 |
|:---:|:---|
| **Base URL** | `http://localhost:8080/api/courses` |
| **Protocol** | HTTP/REST |
| **Authentication** | ❌ 불필요 (모든 조회 API는 토큰 없이 접근 가능) |
| **Response Format** | JSON |
| **Pagination** | Page 기반 (page, size) |
| **Default Ordering** | 최신 강의 순 (createdAt DESC) |

### 📌 인증 정책

**조회 API (모두 공개)** ✅
```
GET /api/courses              ← 토큰 불필요 ✅
GET /api/courses/{id}         ← 토큰 불필요 ✅
GET /api/courses/search       ← 토큰 불필요 ✅
GET /api/courses/category/... ← 토큰 불필요 ✅
GET /api/courses/instructor/..← 토큰 불필요 ✅
```

**생성/수정/삭제 API (인증 필수)** 🔒
```
POST /api/courses             ← JWT 토큰 필요 (TEACHER 역할)
PUT /api/courses/{id}         ← JWT 토큰 필요 (TEACHER 역할)
DELETE /api/courses/{id}      ← JWT 토큰 필요 (TEACHER 역할)
```

**인증 방식**
- Header: `Authorization: Bearer {JWT_TOKEN}`
- 공개 API는 위 헤더 없이도 접근 가능

---

## 응답 데이터 구조

### ApiResponse 구조 (모든 응답) ⭐ 필수

```json
{
  "success": true,
  "data": {...},
  "message": "강의 검색 결과입니다.",
  "timestamp": "2026-04-08T10:30:00"
}
```

**응답 필드 설명:**

| 필드 | 타입 | 필수 | 설명 |
|:---:|:---:|:---:|:---|
| `success` | boolean | ✅ | 요청 성공 여부 (true/false) |
| `data` | T (제네릭) | ✅ | 실제 데이터 (성공 시 data, 실패 시 null) |
| `message` | string | ✅ | 응답 메시지 |
| `timestamp` | string | ✅ | 응답 시간 (ISO8601 형식) |

**중요:** 프론트엔드에서는 **반드시 `success` 필드를 체크**해야 합니다.

```javascript
// ✅ 올바른 처리
if (response.success) {
  // 성공 처리
  const data = response.data;
} else {
  // 실패 처리
  console.error(response.message);
}
```

### CourseResponse 객체

```json
{
  "id": 1,
  "title": "주식 초보자를 위한 기초 강좌",
  "description": "주식 투자의 기본 개념부터 실전 매매까지",
  "category": "DOMESTIC_STOCK",
  "categoryDisplayName": "국내 주식",
  "price": 49900,
  "thumbnailUrl": "https://example.com/thumbnail.jpg",
  "instructor": {
    "id": 1,
    "email": "teacher@example.com",
    "nickname": "투자의신",
    "role": "TEACHER"
  },
  "studentCount": 150,
  "createdAt": "2026-04-01T15:00:00"
}
```

### Page 응답 구조

```json
{
  "success": true,
  "data": {
    "content": [
      {...},
      {...}
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": {
        "empty": false,
        "sorted": true,
        "unsorted": false
      },
      "offset": 0,
      "unpaged": false,
      "paged": true
    },
    "totalPages": 10,
    "totalElements": 100,
    "first": true,
    "last": false,
    "size": 10,
    "number": 0,
    "numberOfElements": 10,
    "empty": false
  },
  "message": "강의 검색 결과입니다.",
  "timestamp": "2026-04-08T10:30:00"
}
```

---

## API 엔드포인트

### 1️⃣ 전체 강의 조회 (All Courses)

**엔드포인트:** `GET /api/courses`

**설명:** 모든 강의를 페이지네이션으로 조회합니다. 기본값으로 최신 강의 순서로 정렬됩니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 기본값 | 설명 |
|:---:|:---:|:---:|:---|
| `page` | int | 0 | 페이지 번호 (0부터 시작) |
| `size` | int | 100 | 페이지당 강의 개수 (최대 100) |

**HTTP 요청:**
```http
GET /api/courses?page=0&size=10 HTTP/1.1
Host: localhost:8080
```

**응답 코드:**
- `200 OK` - 조회 성공
- `400 Bad Request` - 잘못된 파라미터

**응답 예제:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 30,
        "title": "선물 옵션 실전 거래법",
        "description": "선물과 옵션의 고급 거래 기법",
        "category": "FUTURES",
        "categoryDisplayName": "선물투자",
        "price": 79900,
        "thumbnailUrl": "https://example.com/futures.jpg",
        "instructor": {
          "id": 5,
          "email": "futures@example.com",
          "nickname": "선물매니아",
          "role": "TEACHER"
        },
        "studentCount": 45,
        "createdAt": "2026-04-08T10:00:00"
      }
    ],
    "totalPages": 10,
    "totalElements": 100,
    "first": true,
    "last": false,
    "size": 10,
    "number": 0
  },
  "message": "조회되었습니다.",
  "timestamp": "2026-04-08T10:30:00"
}
```

---

### 2️⃣ 강의 상세 조회 (Course Detail)

**엔드포인트:** `GET /api/courses/{courseId}`

**설명:** 특정 강의의 상세 정보를 조회합니다.

**경로 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|:---:|:---:|:---:|:---|
| `courseId` | Long | ✅ | 강의 ID |

**HTTP 요청:**
```http
GET /api/courses/1 HTTP/1.1
Host: localhost:8080
```

**응답 코드:**
- `200 OK` - 조회 성공
- `404 Not Found` - 강의가 없음

**응답 예제:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "주식 초보자를 위한 기초 강좌",
    "description": "주식 투자의 기본 개념부터 실전 매매까지 완벽하게 배워보세요",
    "category": "DOMESTIC_STOCK",
    "categoryDisplayName": "국내 주식",
    "price": 49900,
    "thumbnailUrl": "https://example.com/domestic_stock_1.jpg",
    "instructor": {
      "id": 1,
      "email": "teacher1@example.com",
      "nickname": "주식전문가",
      "role": "TEACHER"
    },
    "studentCount": 250,
    "createdAt": "2026-04-01T09:00:00"
  },
  "message": "조회되었습니다.",
  "timestamp": "2026-04-08T10:30:00"
}
```

---

### 3️⃣ 강의 검색 및 필터링 (Search Courses)

**엔드포인트:** `GET /api/courses/search`

**설명:** 키워드와 카테고리를 조합하여 강의를 검색합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 기본값 | 필수 | 설명 |
|:---:|:---:|:---:|:---:|:---|
| `keyword` | String | "" | ❌ | 검색 키워드 (제목 기반, 빈 문자열 = 전체) |
| `category` | String | null | ❌ | 카테고리 필터 (선택사항, 지정 시 필터링) |
| `page` | int | 0 | ❌ | 페이지 번호 |
| `size` | int | 50 | ❌ | 페이지당 강의 개수 (최대 100) |

**HTTP 요청:**
```http
GET /api/courses/search?keyword=주식&category=DOMESTIC_STOCK&page=0&size=10 HTTP/1.1
Host: localhost:8080
```

**응답 코드:**
- `200 OK` - 검색 성공
- `400 Bad Request` - 잘못된 카테고리

**응답 예제 - 검색 결과 있음:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "title": "주식 초보자를 위한 기초 강좌",
        "description": "주식 투자의 기본 개념부터 실전 매매까지",
        "category": "DOMESTIC_STOCK",
        "categoryDisplayName": "국내 주식",
        "price": 49900,
        "thumbnailUrl": "https://example.com/domestic_stock_1.jpg",
        "instructor": {
          "id": 1,
          "email": "teacher1@example.com",
          "nickname": "주식전문가",
          "role": "TEACHER"
        },
        "studentCount": 250,
        "createdAt": "2026-04-01T09:00:00"
      }
    ],
    "totalPages": 3,
    "totalElements": 25,
    "first": true,
    "last": false,
    "size": 10,
    "number": 0
  },
  "message": "강의 검색 결과입니다.",
  "timestamp": "2026-04-08T10:30:00"
}
```

**응답 예제 - 검색 결과 없음:**
```json
{
  "success": true,
  "data": {
    "content": [],
    "totalPages": 0,
    "totalElements": 0,
    "first": true,
    "last": true,
    "size": 10,
    "number": 0
  },
  "message": "검색 결과가 없습니다.",
  "timestamp": "2026-04-08T10:30:00"
}
```

---

### 4️⃣ 카테고리별 강의 조회 (Courses by Category)

**엔드포인트:** `GET /api/courses/category/{category}`

**설명:** 특정 카테고리의 강의를 조회합니다.

**경로 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|:---:|:---:|:---:|:---|
| `category` | String | ✅ | 카테고리명 (예: DOMESTIC_STOCK, CRYPTO 등) |

**쿼리 파라미터:**

| 파라미터 | 타입 | 기본값 | 설명 |
|:---:|:---:|:---:|:---|
| `page` | int | 0 | 페이지 번호 |
| `size` | int | 20 | 페이지당 강의 개수 |

**HTTP 요청:**
```http
GET /api/courses/category/DOMESTIC_STOCK?page=0&size=10 HTTP/1.1
Host: localhost:8080
```

**응답 코드:**
- `200 OK` - 조회 성공
- `400 Bad Request` - 유효하지 않은 카테고리

**응답 예제:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "title": "주식 초보자를 위한 기초 강좌",
        "description": "주식 투자의 기본 개념부터 실전 매매까지",
        "category": "DOMESTIC_STOCK",
        "categoryDisplayName": "국내 주식",
        "price": 49900,
        "thumbnailUrl": "https://example.com/domestic_stock_1.jpg",
        "instructor": {
          "id": 1,
          "email": "teacher1@example.com",
          "nickname": "주식전문가",
          "role": "TEACHER"
        },
        "studentCount": 250,
        "createdAt": "2026-04-01T09:00:00"
      }
    ],
    "totalPages": 5,
    "totalElements": 50,
    "first": true,
    "last": false,
    "size": 10,
    "number": 0
  },
  "message": "조회되었습니다.",
  "timestamp": "2026-04-08T10:30:00"
}
```

---

### 5️⃣ 강사별 강의 조회 (Courses by Instructor)

**엔드포인트:** `GET /api/courses/instructor/{instructorId}`

**설명:** 특정 강사가 등록한 강의를 조회합니다.

**경로 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|:---:|:---:|:---:|:---|
| `instructorId` | Long | ✅ | 강사(Member) ID |

**쿼리 파라미터:**

| 파라미터 | 타입 | 기본값 | 설명 |
|:---:|:---:|:---:|:---|
| `page` | int | 0 | 페이지 번호 |
| `size` | int | 20 | 페이지당 강의 개수 |

**HTTP 요청:**
```http
GET /api/courses/instructor/1?page=0&size=10 HTTP/1.1
Host: localhost:8080
```

**응답 코드:**
- `200 OK` - 조회 성공
- `404 Not Found` - 강사가 없음

**응답 예제:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "title": "주식 초보자를 위한 기초 강좌",
        "description": "주식 투자의 기본 개념부터 실전 매매까지",
        "category": "DOMESTIC_STOCK",
        "categoryDisplayName": "국내 주식",
        "price": 49900,
        "thumbnailUrl": "https://example.com/domestic_stock_1.jpg",
        "instructor": {
          "id": 1,
          "email": "teacher1@example.com",
          "nickname": "주식전문가",
          "role": "TEACHER"
        },
        "studentCount": 250,
        "createdAt": "2026-04-01T09:00:00"
      },
      {
        "id": 2,
        "title": "주식 기술적 분석 완벽 가이드",
        "description": "차트 분석과 매매 신호",
        "category": "DOMESTIC_STOCK",
        "categoryDisplayName": "국내 주식",
        "price": 59900,
        "thumbnailUrl": "https://example.com/domestic_stock_2.jpg",
        "instructor": {
          "id": 1,
          "email": "teacher1@example.com",
          "nickname": "주식전문가",
          "role": "TEACHER"
        },
        "studentCount": 180,
        "createdAt": "2026-04-02T10:00:00"
      }
    ],
    "totalPages": 2,
    "totalElements": 20,
    "first": true,
    "last": false,
    "size": 10,
    "number": 0
  },
  "message": "조회되었습니다.",
  "timestamp": "2026-04-08T10:30:00"
}
```

---

## 카테고리 정의

### 유효한 카테고리 목록

| 카테고리 코드 | 한글명 | 설명 |
|:---:|:---|:---|
| `DOMESTIC_STOCK` | 국내 주식 | 한국 거래소(KRX) 상장 주식 |
| `OVERSEAS_STOCK` | 해외 주식 | 미국, 일본 등 해외 주식 |
| `CRYPTO` | 암호화폐 | 비트코인, 이더리움 등 |
| `NFT` | NFT | 디지털 자산 및 NFT 투자 |
| `ETF` | ETF | 상장지수펀드 및 개별 ETF |
| `FUTURES` | 선물투자 | 선물 및 옵션 거래 |

**카테고리 사용 예시:**

```
GET /api/courses/category/DOMESTIC_STOCK     → 국내 주식 강의
GET /api/courses/category/OVERSEAS_STOCK     → 해외 주식 강의
GET /api/courses/category/CRYPTO              → 암호화폐 강의
GET /api/courses/category/NFT                 → NFT 강의
GET /api/courses/category/ETF                 → ETF 강의
GET /api/courses/category/FUTURES             → 선물투자 강의
```

---

## 예제 및 테스트

### cURL 예제

**1. 전체 강의 조회 (첫 페이지, 10개)**
```bash
curl -X GET "http://localhost:8080/api/courses?page=0&size=10" \
  -H "Content-Type: application/json"
```

**2. 주식 키워드로 검색**
```bash
curl -X GET "http://localhost:8080/api/courses/search?keyword=주식&page=0&size=10" \
  -H "Content-Type: application/json"
```

**3. 국내 주식 강의만 조회**
```bash
curl -X GET "http://localhost:8080/api/courses/category/DOMESTIC_STOCK?page=0&size=10" \
  -H "Content-Type: application/json"
```

**4. 암호화폐 강의 중 "비트코인" 검색**
```bash
curl -X GET "http://localhost:8080/api/courses/search?keyword=비트코인&category=CRYPTO&page=0&size=10" \
  -H "Content-Type: application/json"
```

**5. 특정 강사의 강의 조회 (강사 ID = 1)**
```bash
curl -X GET "http://localhost:8080/api/courses/instructor/1?page=0&size=10" \
  -H "Content-Type: application/json"
```

**6. 강의 상세 조회 (강의 ID = 1)**
```bash
curl -X GET "http://localhost:8080/api/courses/1" \
  -H "Content-Type: application/json"
```

---

### Postman 테스트 시나리오

#### 시나리오 1: 전체 강의 브라우징
```
1. GET /api/courses?page=0&size=10
   → 첫 페이지 강의 10개 조회
2. GET /api/courses?page=1&size=10
   → 다음 페이지 강의 조회
```

#### 시나리오 2: 카테고리 탐색
```
1. GET /api/courses/category/DOMESTIC_STOCK
   → 국내 주식 강의 조회
2. GET /api/courses/category/CRYPTO
   → 암호화폐 강의 조회
3. GET /api/courses/category/FUTURES
   → 선물투자 강의 조회
```

#### 시나리오 3: 검색 및 필터
```
1. GET /api/courses/search?keyword=초보자&page=0&size=10
   → "초보자" 키워드 검색
2. GET /api/courses/search?keyword=&category=DOMESTIC_STOCK&page=0&size=10
   → 국내 주식 전체 (검색어 없음)
3. GET /api/courses/search?keyword=분석&category=OVERSEAS_STOCK&page=0&size=10
   → 해외 주식 중 "분석" 검색
```

#### 시나리오 4: 강사 강의 조회
```
1. GET /api/courses/instructor/1?page=0&size=10
   → 강사 ID 1의 강의 목록
```

#### 시나리오 5: 상세 조회
```
1. GET /api/courses/1
   → 강의 ID 1의 상세 정보 조회
```

---

## 성능 정보

### 쿼리 최적화

| 엔드포인트 | 쿼리 수 | 설명 |
|:---:|:---:|:---|
| `GET /api/courses` | **2개** | 강의 조회(1) + Enrollment count 배치(1) |
| `GET /api/courses/{id}` | **2개** | 강의 조회(JOIN) + Enrollment count(1) |
| `GET /api/courses/search` | **2개** | 검색 조회(1) + Enrollment count 배치(1) |
| `GET /api/courses/category/{cat}` | **2개** | 카테고리 조회(1) + Enrollment count 배치(1) |
| `GET /api/courses/instructor/{id}` | **2개** | 강사 조회(1) + Enrollment count 배치(1) |

**N+1 쿼리 해결:**
- ✅ JOIN FETCH로 instructor 정보 한 번에 조회
- ✅ 배치 쿼리로 모든 enrollment count 1번의 쿼리로 조회

---

## 에러 처리

### 에러 응답 형식

```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지",
  "timestamp": "2026-04-08T10:30:00"
}
```

**에러 응답 필드:**
- `success`: **항상 false**
- `data`: **항상 null**
- `message`: 에러 상세 메시지
- `timestamp`: 에러 발생 시간

### 주요 에러 코드 및 응답

#### ✅ 200 OK - 조회 성공

```json
{
  "success": true,
  "data": {...},
  "message": "조회되었습니다.",
  "timestamp": "2026-04-08T10:30:00"
}
```

#### ❌ 400 Bad Request - 잘못된 요청

**원인:**
- 유효하지 않은 카테고리
- 잘못된 쿼리 파라미터
- 검증 실패

**응답:**
```json
{
  "success": false,
  "data": null,
  "message": "유효하지 않은 카테고리입니다: INVALID_CAT",
  "timestamp": "2026-04-08T10:30:00"
}
```

#### ❌ 404 Not Found - 리소스 없음

**원인:**
- 존재하지 않는 강의 ID
- 존재하지 않는 강사

**응답:**
```json
{
  "success": false,
  "data": null,
  "message": "강의를 찾을 수 없습니다",
  "timestamp": "2026-04-08T10:30:00"
}
```

#### ❌ 500 Internal Server Error - 서버 오류

**원인:**
- 예상하지 못한 서버 에러

**응답:**
```json
{
  "success": false,
  "data": null,
  "message": "서버 오류가 발생했습니다",
  "timestamp": "2026-04-08T10:30:00"
}
```

### 프론트엔드 에러 처리 예제

```javascript
// ✅ 올바른 에러 처리
async function getCourses() {
  try {
    const response = await fetch('/api/courses');
    const json = await response.json();
    
    if (json.success) {
      // 성공 처리
      console.log('강의 수:', json.data.totalElements);
      return json.data;
    } else {
      // 실패 처리
      console.error('에러:', json.message);
      alert(json.message);
      return null;
    }
  } catch (error) {
    console.error('네트워크 에러:', error);
  }
}
```

---

## 주의사항

1. **페이지 크기 제한**
   - 최대 size는 100입니다
   - size > 100이면 자동으로 100으로 조정됩니다

2. **정렬 순서**
   - 모든 조회는 최신 강의 순(`createdAt DESC`)으로 정렬됩니다

3. **검색 키워드**
   - 키워드는 제목(title) 기반으로만 검색됩니다
   - 공백은 포함되지 않습니다

4. **인증 불필요**
   - 모든 조회 API는 인증 토큰이 필요 없습니다
   - 강의 등록/수정/삭제는 TEACHER 역할이 필요합니다

5. **Instructor 정보**
   - 모든 강의 응답에 강사 정보가 포함됩니다
   - N+1 쿼리 문제는 완전히 해결되었습니다

