# 📚 StockFlow P1 - 전체 API 명세서

**프로젝트**: StockFlow (온라인 강의 플랫폼)  
**버전**: P1 (MVP)  
**작성일**: 2026-04-06  
**대상**: 프론트엔드 개발팀

---

## 📋 목차

1. [API 개요](#api-개요)
2. [인증 (Authentication)](#인증-authentication)
3. [강의 (Course)](#강의-course)
4. [수강 (Enrollment)](#수강-enrollment)
5. [학습 진행 (Lecture Progress)](#학습-진행-lecture-progress)
6. [오류 응답](#오류-응답)
7. [데이터 모델](#데이터-모델)

---

## API 개요

### 기본 정보
- **Base URL**: `http://localhost:8080`
- **API Version**: `/api/v1` (or `/api`)
- **Content-Type**: `application/json`
- **인증 방식**: JWT Bearer Token

### API 응답 포맷

모든 API는 다음의 표준 응답 포맷을 사용합니다:

```json
{
  "success": true,
  "message": "성공 메시지",
  "data": {
    // 실제 데이터
  },
  "timestamp": "2026-04-06T10:30:00"
}
```

**오류 응답:**
```json
{
  "success": false,
  "message": "오류 메시지",
  "data": null,
  "timestamp": "2026-04-06T10:30:00"
}
```

---

## 인증 (Authentication)

### 1️⃣ 회원가입

**엔드포인트**
```http
POST /api/auth/signup
```

**요청 본문**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "nickname": "사용자닉네임",
  "role": "STUDENT"
}
```

**요청 필드**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | String | O | 이메일 (유효한 이메일 형식) |
| password | String | O | 비밀번호 (8자 이상) |
| nickname | String | O | 닉네임 (2자 이상 30자 이하) |
| role | String | O | 역할 (STUDENT/TEACHER/ADMIN) |

**응답 (201 Created)**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "사용자닉네임",
    "role": "STUDENT"
  }
}
```

**오류 응답**
- `400 Bad Request`: 유효하지 않은 입력
- `409 Conflict`: 이미 사용 중인 이메일

---

### 2️⃣ 로그인

**엔드포인트**
```http
POST /api/auth/login
```

**요청 본문**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**응답 (200 OK)**
```json
{
  "success": true,
  "message": "로그인이 완료되었습니다",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "member": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "사용자닉네임",
      "role": "STUDENT"
    }
  }
}
```

**Token 정보**
- **accessToken**: 30분 유효 (API 요청에 사용)
- **refreshToken**: 7일 유효 (토큰 갱신용)

**헤더에 토큰 포함 방법**
```http
Authorization: Bearer {accessToken}
```

---

### 3️⃣ 토큰 갱신

**엔드포인트**
```http
POST /api/auth/refresh
```

**요청 방법 1: 헤더에 포함**
```http
X-Refresh-Token: {refreshToken}
```

**요청 방법 2: 본문에 포함**
```json
{
  "refreshToken": "{refreshToken}"
}
```

**응답 (200 OK)**
```json
{
  "success": true,
  "message": "토큰이 갱신되었습니다",
  "data": {
    "accessToken": "새로운 accessToken",
    "refreshToken": "새로운 refreshToken",
    "member": { ... }
  }
}
```

---

### 4️⃣ 이메일 중복 확인

**엔드포인트**
```http
GET /api/auth/check-email?email=user@example.com
```

**응답 (200 OK) - 이메일 사용 중**
```json
{
  "success": true,
  "message": "이미 사용 중인 이메일입니다",
  "data": true
}
```

**응답 (200 OK) - 이메일 사용 가능**
```json
{
  "success": true,
  "message": "사용 가능한 이메일입니다",
  "data": false
}
```

---

## 강의 (Course)

### 1️⃣ 전체 강의 목록 조회

**엔드포인트**
```http
GET /api/courses?page=0&size=10&sort=createdAt,desc
```

**쿼리 파라미터**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| page | int | 0 | 페이지 번호 (0부터 시작) |
| size | int | 10 | 페이지당 개수 (최대 50) |
| sort | String | createdAt,desc | 정렬 기준 |

**응답 (200 OK)**
```json
{
  "success": true,
  "message": null,
  "data": {
    "content": [
      {
        "id": 1,
        "title": "국내 주식 투자의 기초",
        "description": "초보자를 위한 국내 주식 기초 강의입니다.",
        "category": "DOMESTIC_STOCK",
        "categoryDisplayName": "국내 주식",
        "price": 0,
        "thumbnailUrl": "https://...",
        "instructor": {
          "id": 1,
          "email": "teacher1@example.com",
          "nickname": "주식 전문가 김강사",
          "role": "TEACHER"
        },
        "studentCount": 45,
        "createdAt": "2026-04-05T10:30:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": { ... }
    },
    "totalElements": 100,
    "totalPages": 10,
    "first": true,
    "last": false
  }
}
```

---

### 2️⃣ 강의 상세 조회

**엔드포인트**
```http
GET /api/courses/{courseId}
```

**경로 파라미터**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| courseId | Long | 강의 ID |

**응답 (200 OK)**
```json
{
  "success": true,
  "message": null,
  "data": {
    "id": 1,
    "title": "국내 주식 투자의 기초",
    "description": "초보자를 위한 국내 주식 기초 강의입니다.",
    "category": "DOMESTIC_STOCK",
    "categoryDisplayName": "국내 주식",
    "price": 0,
    "thumbnailUrl": "https://...",
    "instructor": {
      "id": 1,
      "email": "teacher1@example.com",
      "nickname": "주식 전문가 김강사",
      "role": "TEACHER"
    },
    "studentCount": 45,
    "createdAt": "2026-04-05T10:30:00"
  }
}
```

---

### 3️⃣ 강의 검색 및 필터링

**엔드포인트**
```http
GET /api/courses/search?keyword=주식&category=DOMESTIC_STOCK&page=0&size=10
```

**쿼리 파라미터**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| keyword | String | "" | 검색 키워드 (제목 기반) |
| category | String | - | 카테고리 필터 (선택) |
| page | int | 0 | 페이지 번호 |
| size | int | 10 | 페이지당 개수 |

**가능한 카테고리 값**
- `DOMESTIC_STOCK` - 국내 주식
- `OVERSEAS_STOCK` - 해외 주식
- `CRYPTO` - 암호화폐
- `NFT` - NFT
- `ETF` - ETF
- `FUTURES` - 선물투자

**응답 (200 OK)**
```json
{
  "success": true,
  "message": "강의 검색 결과입니다.",
  "data": {
    "content": [ ... ],
    "totalElements": 25,
    "totalPages": 3
  }
}
```

---

### 4️⃣ 카테고리별 강의 조회

**엔드포인트**
```http
GET /api/courses/category/{category}?page=0&size=10
```

**경로 파라미터**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| category | String | 카테고리 (DOMESTIC_STOCK, OVERSEAS_STOCK, CRYPTO, NFT, ETF, FUTURES) |

**응답 (200 OK)**
```json
{
  "success": true,
  "message": null,
  "data": {
    "content": [ ... ],
    "totalElements": 12,
    "totalPages": 2
  }
}
```

---

### 5️⃣ 강사별 강의 조회

**엔드포인트**
```http
GET /api/courses/instructor/{instructorId}?page=0&size=10
```

**경로 파라미터**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| instructorId | Long | 강사 ID |

**응답 (200 OK)**
강의 목록 (위의 전체 강의 목록과 동일한 형식)

---

### 6️⃣ 강의 등록 (강사만)

**엔드포인트**
```http
POST /api/courses
Authorization: Bearer {accessToken}
```

**요청 본문**
```json
{
  "title": "새로운 강의 제목",
  "description": "강의에 대한 설명",
  "category": "DOMESTIC_STOCK",
  "price": 0,
  "thumbnailUrl": "https://..."
}
```

**요청 필드**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | String | O | 강의 제목 |
| description | String | O | 강의 설명 |
| category | String | O | 카테고리 |
| price | Integer | X | 강의 가격 (기본값: 0) |
| thumbnailUrl | String | X | 썸네일 URL |

**응답 (201 Created)**
```json
{
  "success": true,
  "message": "강의가 등록되었습니다",
  "data": { ... }
}
```

**권한 오류**
- `403 Forbidden`: 강사 권한이 없는 경우

---

### 7️⃣ 강의 수정 (강사만)

**엔드포인트**
```http
PUT /api/courses/{courseId}
Authorization: Bearer {accessToken}
```

**요청 본문**
```json
{
  "title": "수정된 강의 제목",
  "description": "수정된 설명",
  "category": "OVERSEAS_STOCK",
  "price": 10000,
  "thumbnailUrl": "https://..."
}
```

**응답 (200 OK)**
```json
{
  "success": true,
  "message": "강의가 수정되었습니다",
  "data": { ... }
}
```

---

### 8️⃣ 강의 삭제 (강사만)

**엔드포인트**
```http
DELETE /api/courses/{courseId}
Authorization: Bearer {accessToken}
```

**응답 (200 OK)**
```json
{
  "success": true,
  "message": "강의가 삭제되었습니다",
  "data": null
}
```

---

## 수강 (Enrollment)

### 1️⃣ 수강 신청

**엔드포인트**
```http
POST /api/enrollments
Authorization: Bearer {accessToken}
```

**요청 본문**
```json
{
  "courseId": 1
}
```

**요청 필드**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| courseId | Long | O | 수강할 강의 ID |

**응답 (201 Created)**
```json
{
  "success": true,
  "message": "수강 등록이 완료되었습니다",
  "data": {
    "id": 1,
    "memberId": 2,
    "courseId": 1,
    "courseTitle": "국내 주식 투자의 기초",
    "enrolledAt": "2026-04-06T10:30:00",
    "isCompleted": false
  }
}
```

**오류 응답**
- `400 Bad Request`: 이미 수강 중인 강의
- `404 Not Found`: 강의를 찾을 수 없음
- `403 Forbidden`: 학생 권한이 필요함

---

### 2️⃣ 내 수강 목록 조회

**엔드포인트**
```http
GET /api/enrollments/my?page=0&size=10
Authorization: Bearer {accessToken}
```

**쿼리 파라미터**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| page | int | 0 | 페이지 번호 |
| size | int | 10 | 페이지당 개수 |

**응답 (200 OK)**
```json
{
  "success": true,
  "message": null,
  "data": {
    "content": [
      {
        "id": 1,
        "memberId": 2,
        "courseId": 1,
        "courseTitle": "국내 주식 투자의 기초",
        "enrolledAt": "2026-04-06T10:30:00",
        "isCompleted": false
      }
    ],
    "totalElements": 5,
    "totalPages": 1
  }
}
```

---

### 3️⃣ 강의 완강 처리

**엔드포인트**
```http
PUT /api/enrollments/courses/{courseId}/complete
Authorization: Bearer {accessToken}
```

**경로 파라미터**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| courseId | Long | 강의 ID |

**응답 (200 OK)**
```json
{
  "success": true,
  "message": "강의 완강 처리 되었습니다",
  "data": null
}
```

---

## 학습 진행 (Lecture Progress)

### 1️⃣ 강의 시청 진행 상황 저장

**엔드포인트**
```http
POST /api/lecture-progress
Authorization: Bearer {accessToken}
```

**요청 본문**
```json
{
  "lectureId": 1,
  "lastPosition": 300
}
```

**요청 필드**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| lectureId | Long | O | 강의 영상 ID |
| lastPosition | Integer | O | 마지막 시청 위치 (초) |

**응답 (201 Created)**
```json
{
  "success": true,
  "message": "강의 진행 상황이 저장되었습니다",
  "data": {
    "id": 1,
    "memberId": 2,
    "lectureId": 1,
    "lastPosition": 300,
    "updatedAt": "2026-04-06T10:30:00"
  }
}
```

---

### 2️⃣ 강의 시청 진행 정보 조회

**엔드포인트**
```http
GET /api/lecture-progress/lectures/{lectureId}
Authorization: Bearer {accessToken}
```

**경로 파라미터**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| lectureId | Long | 강의 영상 ID |

**응답 (200 OK)**
```json
{
  "success": true,
  "message": null,
  "data": {
    "id": 1,
    "memberId": 2,
    "lectureId": 1,
    "lastPosition": 300,
    "updatedAt": "2026-04-06T10:30:00"
  }
}
```

---

### 3️⃣ 내 강의 시청 진행 목록 조회

**엔드포인트**
```http
GET /api/lecture-progress/my
Authorization: Bearer {accessToken}
```

**응답 (200 OK)**
```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": 1,
      "memberId": 2,
      "lectureId": 1,
      "lastPosition": 300,
      "updatedAt": "2026-04-06T10:30:00"
    },
    {
      "id": 2,
      "memberId": 2,
      "lectureId": 2,
      "lastPosition": 500,
      "updatedAt": "2026-04-06T11:00:00"
    }
  ]
}
```

---

### 4️⃣ 강의 시청 진행 정보 삭제

**엔드포인트**
```http
DELETE /api/lecture-progress/lectures/{lectureId}
Authorization: Bearer {accessToken}
```

**경로 파라미터**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| lectureId | Long | 강의 영상 ID |

**응답 (200 OK)**
```json
{
  "success": true,
  "message": "강의 진행 정보가 삭제되었습니다",
  "data": null
}
```

---

## 오류 응답

### 공통 오류 코드

| HTTP 상태 | 메시지 | 설명 |
|----------|--------|------|
| 400 | Bad Request | 유효하지 않은 요청 |
| 401 | Unauthorized | 인증이 필요함 (토큰 없음 또는 만료됨) |
| 403 | Forbidden | 권한이 없음 |
| 404 | Not Found | 리소스를 찾을 수 없음 |
| 409 | Conflict | 중복된 리소스 (예: 이메일 중복) |
| 500 | Internal Server Error | 서버 오류 |

### 오류 응답 예시

```json
{
  "success": false,
  "message": "사용자를 찾을 수 없습니다",
  "data": null,
  "timestamp": "2026-04-06T10:30:00"
}
```

---

## 데이터 모델

### Member (회원)

```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "사용자닉네임",
  "role": "STUDENT",
  "createdAt": "2026-04-05T10:30:00"
}
```

**역할 (Role)**
- `STUDENT` - 학생 (강의 수강)
- `TEACHER` - 강사 (강의 등록/관리)
- `ADMIN` - 관리자

---

### Course (강의)

```json
{
  "id": 1,
  "title": "국내 주식 투자의 기초",
  "description": "초보자를 위한 국내 주식 기초 강의입니다.",
  "category": "DOMESTIC_STOCK",
  "categoryDisplayName": "국내 주식",
  "price": 0,
  "thumbnailUrl": "https://...",
  "instructor": {
    "id": 1,
    "email": "teacher1@example.com",
    "nickname": "주식 전문가 김강사",
    "role": "TEACHER"
  },
  "studentCount": 45,
  "createdAt": "2026-04-05T10:30:00"
}
```

**카테고리 (Category)**
- `DOMESTIC_STOCK` - 국내 주식
- `OVERSEAS_STOCK` - 해외 주식
- `CRYPTO` - 암호화폐
- `NFT` - NFT
- `ETF` - ETF
- `FUTURES` - 선물투자

---

### Enrollment (수강)

```json
{
  "id": 1,
  "memberId": 2,
  "courseId": 1,
  "courseTitle": "국내 주식 투자의 기초",
  "enrolledAt": "2026-04-06T10:30:00",
  "isCompleted": false
}
```

---

### LectureProgress (학습 진행)

```json
{
  "id": 1,
  "memberId": 2,
  "lectureId": 1,
  "lastPosition": 300,
  "updatedAt": "2026-04-06T10:30:00"
}
```

---

## 🔐 보안 및 인증

### JWT Token 사용 방법

모든 인증이 필요한 API 요청 시 다음 헤더를 포함하세요:

```http
Authorization: Bearer {accessToken}
```

### Token 갱신 흐름

1. 로그인 시 `accessToken`과 `refreshToken` 획득
2. API 요청 시 `accessToken` 사용
3. `accessToken` 만료 시 `/api/auth/refresh` 엔드포인트로 토큰 갱신
4. 새로운 토큰으로 API 요청 계속

### 권한 검증

- **STUDENT**: 수강 신청, 영상 시청, 진행 상황 저장
- **TEACHER**: 강의 등록/수정/삭제
- **ADMIN**: 모든 작업 수행 가능

---

## 💡 사용 예시

### 1. 회원가입 및 로그인

```javascript
// 1단계: 회원가입
POST /api/auth/signup
Body: {
  "email": "student@example.com",
  "password": "Password123!",
  "nickname": "학생1",
  "role": "STUDENT"
}

// 2단계: 로그인
POST /api/auth/login
Body: {
  "email": "student@example.com",
  "password": "Password123!"
}

// 응답에서 accessToken 획득
// Response: { accessToken: "...", refreshToken: "..." }
```

### 2. 강의 조회 및 수강 신청

```javascript
// 1단계: 강의 목록 조회
GET /api/courses?page=0&size=10

// 2단계: 강의 상세 정보 조회
GET /api/courses/1

// 3단계: 수강 신청
POST /api/enrollments
Headers: { Authorization: "Bearer {accessToken}" }
Body: { "courseId": 1 }
```

### 3. 강의 시청 및 진행 상황 저장

```javascript
// 1단계: 강의 시청 시작
// 영상 플레이어에서 영상 재생

// 2단계: 진행 상황 저장 (주기적으로 호출)
POST /api/lecture-progress
Headers: { Authorization: "Bearer {accessToken}" }
Body: {
  "lectureId": 1,
  "lastPosition": 300
}

// 3단계: 강의 완강 처리
PUT /api/enrollments/courses/1/complete
Headers: { Authorization: "Bearer {accessToken}" }
```

---

## 📝 페이지네이션 사용법

### 요청

```http
GET /api/courses?page=0&size=10&sort=createdAt,desc
```

### 응답 구조

```json
{
  "data": {
    "content": [ ... ],           // 실제 데이터
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": { ... }
    },
    "totalElements": 100,         // 전체 요소 개수
    "totalPages": 10,             // 전체 페이지 수
    "first": true,                // 첫 페이지 여부
    "last": false,                // 마지막 페이지 여부
    "number": 0,                  // 현재 페이지 번호
    "size": 10                    // 페이지 크기
  }
}
```

### 다음 페이지 조회

```
현재 page=0이면 다음은 page=1
페이지 번호는 0부터 시작
last가 true이면 마지막 페이지
```

---

## 🚀 빠른 시작 체크리스트

- [ ] 모든 API가 Base URL `/api` 또는 `/api/v1`로 시작
- [ ] 인증이 필요한 API는 `Authorization: Bearer {token}` 헤더 포함
- [ ] JSON 형식으로 요청/응답
- [ ] 페이지네이션이 필요한 경우 `page`, `size` 파라미터 사용
- [ ] 오류 응답은 `success: false`로 확인
- [ ] 카테고리는 정확한 enum 값 사용 (대문자)

---

**마지막 수정일**: 2026-04-06  
**작성자**: Backend Team  
**상태**: ✅ 완성 (P1 MVP)
