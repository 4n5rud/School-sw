# StockClass API 명세서

> **Base URL**: `http://localhost:8080`  
> **Content-Type**: `application/json`  
> **인증 방식**: JWT Bearer Token — 로그인 후 발급된 `accessToken`을 헤더에 포함
> ```
> Authorization: Bearer {accessToken}
> ```

---

## 공통 응답 형식

모든 API는 아래 형식으로 응답합니다.

```json
{
  "success": true,
  "data": { ... },
  "message": "처리 완료 메시지",
  "timestamp": "2025-05-07T12:00:00"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | boolean | 성공 여부 |
| `data` | any | 실제 응답 데이터 (실패 시 null) |
| `message` | string | 처리 결과 메시지 |
| `timestamp` | string | 응답 시각 (ISO 8601) |

### 주요 HTTP 상태 코드

| 코드 | 의미 |
|------|------|
| `200 OK` | 조회·수정·삭제 성공 |
| `201 Created` | 생성 성공 |
| `400 Bad Request` | 잘못된 입력값 |
| `401 Unauthorized` | 로그인 필요 |
| `403 Forbidden` | 권한 없음 |
| `404 Not Found` | 리소스 없음 |
| `409 Conflict` | 중복 데이터 충돌 |

---

## 1. 인증 (Auth)

### 1-1. 회원가입

```
POST /api/auth/signup
인증 불필요
```

**Request Body**

| 필드 | 타입 | 필수 | 제약조건 |
|------|------|:----:|----------|
| `email` | string | O | 이메일 형식 |
| `password` | string | O | 8~50자 |
| `nickname` | string | O | 2~30자 |
| `role` | string | O | `STUDENT` / `TEACHER` / `ADMIN` |

```json
{
  "email": "student@example.com",
  "password": "password123",
  "nickname": "주식초보",
  "role": "STUDENT"
}
```

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "student@example.com",
    "nickname": "주식초보",
    "role": "STUDENT"
  },
  "message": "회원가입이 완료되었습니다"
}
```

**Error**

| 상황 | 코드 |
|------|------|
| 이미 사용 중인 이메일 | `409 Conflict` |
| 필드 누락 / 형식 오류 | `400 Bad Request` |

---

### 1-2. 로그인

```
POST /api/auth/login
인증 불필요
```

**Request Body**

| 필드 | 타입 | 필수 |
|------|------|:----:|
| `email` | string | O |
| `password` | string | O |

```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "member": {
      "id": 1,
      "email": "student@example.com",
      "nickname": "주식초보",
      "role": "STUDENT"
    }
  },
  "message": "로그인이 완료되었습니다"
}
```

**Error**

| 상황 | 코드 |
|------|------|
| 존재하지 않는 이메일 | `401 Unauthorized` |
| 비밀번호 불일치 | `401 Unauthorized` |

---

### 1-3. 토큰 갱신

```
POST /api/auth/refresh
인증 불필요
```

**Request** — 아래 두 방식 중 하나

- 헤더: `X-Refresh-Token: {refreshToken}`
- Body: refreshToken 문자열 그대로

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...(새 토큰)",
    "refreshToken": "eyJhbGci...(새 토큰)",
    "member": { ... }
  },
  "message": "토큰이 갱신되었습니다"
}
```

**Error**

| 상황 | 코드 |
|------|------|
| 토큰 없음 | `400 Bad Request` |
| 만료된 토큰 | `401 Unauthorized` |

---

### 1-4. 이메일 중복 확인

```
GET /api/auth/check-email?email={email}
인증 불필요
```

**Query Parameter**: `email` (string)

**Response `200 OK`**

```json
{
  "success": true,
  "data": true,
  "message": "이미 사용 중인 이메일입니다"
}
```

> `data: false` → "사용 가능한 이메일입니다"

---

## 2. 강의 (Course) — 공개 API

### 2-1. 전체 강의 목록

```
GET /api/courses?page=0&size=100
인증 불필요
```

**Query Parameters**

| 파라미터 | 기본값 | 설명 |
|----------|:------:|------|
| `page` | `0` | 페이지 번호 (0부터 시작) |
| `size` | `100` | 페이지당 개수 (최대 100) |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "title": "주식 기초 완성",
        "description": "주식 입문자를 위한 강의",
        "category": "DOMESTIC_STOCK",
        "price": 50000,
        "thumbnailUrl": "https://pub-xxx.r2.dev/courses/1/thumbnail.jpg",
        "isPublished": true,
        "instructorId": 2,
        "instructorNickname": "주식고수",
        "createdAt": "2025-05-01T10:00:00"
      }
    ],
    "totalElements": 25,
    "totalPages": 1,
    "number": 0,
    "size": 100
  }
}
```

---

### 2-2. 강의 상세 조회

```
GET /api/courses/{courseId}
인증 불필요
```

**Path Parameter**: `courseId` (Long)

**Response `200 OK`** — 위 목록의 단일 객체와 동일

**Error**: 존재하지 않는 ID → `404 Not Found`

---

### 2-3. 강의 검색

```
GET /api/courses/search?keyword=주식&category=DOMESTIC_STOCK&page=0&size=50
인증 불필요
```

**Query Parameters**

| 파라미터 | 기본값 | 필수 | 설명 |
|----------|:------:|:----:|------|
| `keyword` | `""` | X | 제목 기반 검색 (빈 값 = 전체) |
| `category` | 없음 | X | 카테고리 필터 |
| `page` | `0` | X | 페이지 번호 |
| `size` | `50` | X | 페이지 크기 (최대 100) |

**카테고리 값**

| 값 | 한글명 |
|----|--------|
| `DOMESTIC_STOCK` | 국내 주식 |
| `OVERSEAS_STOCK` | 해외 주식 |
| `CRYPTO` | 암호화폐 |
| `NFT` | NFT |
| `ETF` | ETF |
| `FUTURES` | 선물투자 |

**Response `200 OK`** — 페이지 형식 (2-1과 동일 구조)

---

### 2-4. 카테고리별 강의 조회

```
GET /api/courses/category/{category}?page=0&size=10
인증 불필요
```

**Path Parameter**: `category` — 위 카테고리 값 중 하나

---

### 2-5. 강사별 강의 조회

```
GET /api/courses/instructor/{instructorId}?page=0&size=10
인증 불필요
```

**Path Parameter**: `instructorId` (Long)

---

### 2-6. 강의 등록

```
POST /api/courses
권한: TEACHER
```

**Request Body**

| 필드 | 타입 | 필수 | 제약조건 |
|------|------|:----:|----------|
| `title` | string | O | 3~100자 |
| `description` | string | O | 10~1000자 |
| `category` | string | O | 카테고리 Enum 값 |
| `price` | integer | O | 0 이상 10,000,000 이하 |
| `thumbnailUrl` | string | X | URL 형식 |

```json
{
  "title": "주식 기초 완성",
  "description": "주식을 처음 시작하는 분들을 위한 완벽 입문 강의입니다.",
  "category": "DOMESTIC_STOCK",
  "price": 50000,
  "thumbnailUrl": "https://pub-xxx.r2.dev/courses/1/thumbnail.jpg"
}
```

**Response `201 Created`**

---

### 2-7. 강의 수정

```
PUT /api/courses/{courseId}
권한: TEACHER (본인 강의만)
```

**Request Body** — 2-6과 동일 구조

**Error**: 타 강사의 강의 수정 → `403 Forbidden`

---

### 2-8. 강의 삭제

```
DELETE /api/courses/{courseId}
권한: TEACHER (본인 강의만)
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": null,
  "message": "강의가 삭제되었습니다"
}
```

---

## 3. 섹션 (Section) — 공개 API

### 3-1. 강의별 섹션 + 영상 목록 조회

```
GET /api/sections/courses/{courseId}
인증 불필요
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "1단원: 주식의 기초",
      "sortOrder": 1,
      "lectures": [
        {
          "id": 1,
          "title": "1-1. 주식이란?",
          "videoUrl": "https://pub-xxx.r2.dev/lectures/1/uuid.mp4",
          "playTime": 1200,
          "sortOrder": 1,
          "uploadStatus": "CONFIRMED"
        }
      ]
    }
  ],
  "message": "강의 섹션 목록입니다"
}
```

---

### 3-2. 섹션별 영상 목록 조회

```
GET /api/sections/{sectionId}/lectures
인증 불필요
```

---

### 3-3. 단일 영상 조회

```
GET /api/sections/lectures/{lectureId}
인증 불필요
```

---

## 4. 수강 (Enrollment)

### 4-1. 수강 등록

```
POST /api/enrollments
권한: STUDENT
```

**Request Body**

| 필드 | 타입 | 필수 |
|------|------|:----:|
| `courseId` | Long | O |

```json
{
  "courseId": 1
}
```

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": 10,
    "courseId": 1,
    "courseTitle": "주식 기초 완성",
    "enrolledAt": "2025-05-07T12:00:00",
    "isCompleted": false
  },
  "message": "수강 등록이 완료되었습니다"
}
```

**Error**

| 상황 | 코드 |
|------|------|
| 이미 수강 중인 강의 | `409 Conflict` |
| 존재하지 않는 강의 | `404 Not Found` |

---

### 4-2. 내 수강 목록 조회

```
GET /api/enrollments/my?page=0&size=10
권한: STUDENT
```

**Response `200 OK`** — 수강 정보 페이지 목록

---

### 4-3. 완강 처리

```
PUT /api/enrollments/courses/{courseId}/complete
권한: STUDENT
```

**Path Parameter**: `courseId` (Long)

**Response `200 OK`**

```json
{
  "success": true,
  "data": null,
  "message": "강의 완강 처리 되었습니다"
}
```

**Error**: 수강하지 않은 강의 → `404 Not Found`

---

## 5. 시청 진행 (Lecture Progress)

### 5-1. 진행 상황 저장

```
POST /api/lecture-progress
권한: STUDENT
```

**Request Body**

| 필드 | 타입 | 필수 | 제약조건 |
|------|------|:----:|----------|
| `lectureId` | Long | O | |
| `lastPosition` | integer | O | 0 이상 (초 단위) |

```json
{
  "lectureId": 1,
  "lastPosition": 360
}
```

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "lectureId": 1,
    "lastPosition": 360,
    "isCompleted": false,
    "updatedAt": "2025-05-07T12:00:00"
  },
  "message": "강의 진행 상황이 저장되었습니다"
}
```

---

### 5-2. 특정 강의 진행 조회

```
GET /api/lecture-progress/lectures/{lectureId}
권한: STUDENT
```

---

### 5-3. 내 전체 시청 기록 조회

```
GET /api/lecture-progress/my
권한: STUDENT
```

**Response `200 OK`** — 진행 정보 배열

---

### 5-4. 진행 기록 삭제

```
DELETE /api/lecture-progress/lectures/{lectureId}
권한: STUDENT
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": null,
  "message": "강의 진행 정보가 삭제되었습니다"
}
```

---

## 6. 강사 전용 — 강의 관리 (Teacher Course)

> 모든 엔드포인트 `TEACHER` 권한 필요

### 6-1. 내 강의 목록

```
GET /api/v1/teacher/courses
권한: TEACHER
```

**Response `200 OK`** — 강의 목록 배열 (수강자 수 포함)

---

### 6-2. 강의 생성

```
POST /api/v1/teacher/courses
권한: TEACHER
```

**Request Body** — 공개 API 2-6과 동일 구조

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": 3,
    "title": "ETF 완전정복",
    "category": "ETF",
    "price": 30000,
    "isPublished": true,
    "enrollmentCount": 0,
    "createdAt": "2025-05-07T12:00:00"
  },
  "message": "강의가 생성되었습니다."
}
```

---

### 6-3. 강의 수정

```
PUT /api/v1/teacher/courses/{courseId}
권한: TEACHER (본인 강의만)
```

---

### 6-4. 강의 삭제

```
DELETE /api/v1/teacher/courses/{courseId}
권한: TEACHER (본인 강의만)
```

---

### 6-5. 강의 공개/비공개 전환

```
PATCH /api/v1/teacher/courses/{courseId}/publish
권한: TEACHER (본인 강의만)
```

**Request Body 없음**

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": 3,
    "isPublished": false,
    ...
  },
  "message": "강의가 비공개되었습니다."
}
```

> `isPublished: true`이면 "강의가 공개되었습니다."

---

## 7. 강사 전용 — 섹션·영상 관리 (Teacher Section)

> 모든 엔드포인트 `TEACHER` 권한 필요, 본인 강의만 조작 가능

### 7-1. 섹션 추가

```
POST /api/v1/teacher/courses/{courseId}/sections
권한: TEACHER (본인 강의만)
```

**Request Body**

| 필드 | 타입 | 필수 | 제약조건 |
|------|------|:----:|----------|
| `title` | string | O | 100자 이하 |

```json
{
  "title": "1단원: 주식의 기초"
}
```

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "title": "1단원: 주식의 기초",
    "sortOrder": 1,
    "lectures": []
  },
  "message": "섹션이 추가되었습니다."
}
```

---

### 7-2. 섹션 수정

```
PUT /api/v1/teacher/sections/{sectionId}
권한: TEACHER (본인 강의만)
```

**Request Body**

| 필드 | 타입 | 필수 | 제약조건 |
|------|------|:----:|----------|
| `title` | string | O | 100자 이하 |

---

### 7-3. 섹션 삭제

```
DELETE /api/v1/teacher/sections/{sectionId}
권한: TEACHER (본인 강의만)
```

> 섹션 삭제 시 소속 영상도 함께 삭제됩니다 (Cascade).

---

### 7-4. 섹션 순서 변경

```
PATCH /api/v1/teacher/courses/{courseId}/sections/reorder
권한: TEACHER (본인 강의만)
```

**Request Body**

```json
{
  "sectionOrders": [
    { "sectionId": 3, "sortOrder": 1 },
    { "sectionId": 1, "sortOrder": 2 },
    { "sectionId": 5, "sortOrder": 3 }
  ]
}
```

**Response `200 OK`** — 변경된 순서의 섹션 목록

---

### 7-5. 영상 유닛 추가

```
POST /api/v1/teacher/sections/{sectionId}/lectures
권한: TEACHER (본인 강의만)
```

**Request Body**

| 필드 | 타입 | 필수 | 제약조건 |
|------|------|:----:|----------|
| `title` | string | O | 200자 이하 |
| `sortOrder` | integer | O | 정렬 순서 |

```json
{
  "title": "1-1. 주식이란 무엇인가?",
  "sortOrder": 1
}
```

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": 10,
    "title": "1-1. 주식이란 무엇인가?",
    "videoUrl": null,
    "playTime": null,
    "sortOrder": 1,
    "uploadStatus": "PENDING"
  },
  "message": "강의 영상이 추가되었습니다."
}
```

---

### 7-6. 영상 유닛 수정

```
PUT /api/v1/teacher/lectures/{lectureId}
권한: TEACHER (본인 강의만)
```

**Request Body**

| 필드 | 타입 | 필수 |
|------|------|:----:|
| `title` | string | O |
| `sortOrder` | integer | O |

---

### 7-7. 영상 유닛 삭제

```
DELETE /api/v1/teacher/lectures/{lectureId}
권한: TEACHER (본인 강의만)
```

---

## 8. 강사 전용 — 파일 업로드 (Teacher Upload)

> 모든 엔드포인트 `TEACHER` 권한 필요  
> 파일은 R2 버킷(`stockclass`)에 직접 업로드. BE 서버를 거치지 않습니다.

### 업로드 흐름

```
① video-presigned 요청 → presigned URL 발급
② presigned URL로 R2에 직접 PUT 업로드 (BE 미경유)
③ video-confirm 요청 → 업로드 완료 확인 + videoUrl 저장
```

### 8-1. 영상 업로드 URL 발급

```
POST /api/v1/teacher/uploads/video-presigned
권한: TEACHER
```

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `lectureId` | Long | O | 영상을 연결할 유닛 ID |
| `filename` | string | O | 원본 파일명 |
| `contentType` | string | O | `video/mp4` 또는 `video/webm` |
| `fileSize` | Long | O | 파일 크기(bytes), 최대 5GB |

```json
{
  "lectureId": 10,
  "filename": "intro_lecture.mp4",
  "contentType": "video/mp4",
  "fileSize": 104857600
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://stockclass.r2.cloudflarestorage.com/lectures/10/uuid.mp4?X-Amz-Signature=...",
    "objectKey": "lectures/10/550e8400-e29b-41d4-a716-446655440000.mp4",
    "expiresAt": "2025-05-07T13:00:00",
    "maxFileSize": 5368709120
  },
  "message": "업로드 URL이 발급되었습니다."
}
```

> `uploadUrl`로 `PUT` 요청으로 파일을 직접 업로드합니다.  
> URL 유효 시간은 **1시간**입니다.

**Error**

| 상황 | 코드 |
|------|------|
| 허용되지 않은 파일 형식 | `400 Bad Request` |
| 5GB 초과 | `400 Bad Request` |
| 타 강사의 강의 | `403 Forbidden` |

---

### 8-2. 영상 업로드 완료 확인

```
POST /api/v1/teacher/uploads/video-confirm
권한: TEACHER
```

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `lectureId` | Long | O | 강의 유닛 ID |
| `objectKey` | string | O | 발급받은 objectKey |
| `playTime` | integer | X | 영상 길이(초) |

```json
{
  "lectureId": 10,
  "objectKey": "lectures/10/550e8400-e29b-41d4-a716-446655440000.mp4",
  "playTime": 1200
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "lectureId": 10,
    "videoUrl": "https://pub-xxx.r2.dev/lectures/10/550e8400-e29b-41d4-a716-446655440000.mp4",
    "uploadStatus": "CONFIRMED",
    "confirmedAt": "2025-05-07T12:05:00"
  },
  "message": "영상 업로드가 확인되었습니다."
}
```

**Error**: R2에 파일이 없는 경우 → `404 Not Found`

---

### 8-3. 썸네일 업로드 URL 발급

```
POST /api/v1/teacher/uploads/thumbnail-presigned
권한: TEACHER
```

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `courseId` | Long | O | 강의 ID |
| `filename` | string | O | 원본 파일명 |
| `contentType` | string | O | `image/jpeg` / `image/png` / `image/webp` |

```json
{
  "courseId": 3,
  "filename": "thumbnail.jpg",
  "contentType": "image/jpeg"
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://stockclass.r2.cloudflarestorage.com/courses/3/thumbnail.jpg?X-Amz-Signature=...",
    "objectKey": "courses/3/thumbnail.jpg",
    "expiresAt": "2025-05-07T13:00:00"
  },
  "message": "썸네일 업로드 URL이 발급되었습니다."
}
```

---

### 8-4. 썸네일 업로드 완료 확인

```
POST /api/v1/teacher/uploads/thumbnail-confirm
권한: TEACHER
```

**Request Body**

| 필드 | 타입 | 필수 |
|------|------|:----:|
| `courseId` | Long | O |
| `objectKey` | string | O |

```json
{
  "courseId": 3,
  "objectKey": "courses/3/thumbnail.jpg"
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "courseId": 3,
    "thumbnailUrl": "https://pub-xxx.r2.dev/courses/3/thumbnail.jpg",
    "confirmedAt": "2025-05-07T12:05:00"
  },
  "message": "썸네일 업로드가 확인되었습니다."
}
```

---

## 9. 강사 전용 — 통계 (Teacher Analytics)

> 모든 엔드포인트 `TEACHER` 권한 필요, 본인 강의 데이터만 조회 가능

### 9-1. 대시보드 (전체 통계)

```
GET /api/v1/teacher/dashboard
권한: TEACHER
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "totalCourses": 5,
    "totalStudents": 128,
    "totalCompletions": 34,
    "courses": [
      {
        "id": 1,
        "title": "주식 기초 완성",
        "enrollmentCount": 80,
        "completionCount": 20
      }
    ]
  }
}
```

---

### 9-2. 강의별 수강생 목록

```
GET /api/v1/teacher/courses/{courseId}/students
권한: TEACHER (본인 강의만)
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "courseTitle": "주식 기초 완성",
    "students": [
      {
        "memberId": 5,
        "nickname": "주식초보",
        "enrolledAt": "2025-04-01T09:00:00",
        "isCompleted": false,
        "progressRate": 65
      }
    ]
  }
}
```

---

### 9-3. 강의별 통계

```
GET /api/v1/teacher/courses/{courseId}/stats
권한: TEACHER (본인 강의만)
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "courseTitle": "주식 기초 완성",
    "totalEnrollments": 80,
    "completionRate": 25.0,
    "lectureStats": [
      {
        "lectureId": 1,
        "lectureTitle": "1-1. 주식이란?",
        "viewCount": 75,
        "completionCount": 60
      }
    ]
  }
}
```

---

## 10. 기타

### 헬스 체크

```
GET /health
인증 불필요
```

**Response `200 OK`**

```json
{
  "status": "UP"
}
```

---

## 부록 — R2 버킷 객체 경로 규칙

> 버킷명: `stockclass`

| 파일 종류 | 경로 패턴 | 예시 |
|----------|----------|------|
| 강의 영상 | `lectures/{lectureId}/{UUID}.mp4` | `lectures/10/550e8400.mp4` |
| 강의 썸네일 | `courses/{courseId}/thumbnail.{ext}` | `courses/3/thumbnail.jpg` |

**CDN 공개 URL**: `https://pub-378809bd4c2a444baef31df7769cfdcd.r2.dev/{objectKey}`