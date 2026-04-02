# 🔌 ChessMate API 명세서 (OpenAPI 3.0)

**버전**: 1.0.0  
**기본 URL**: `http://localhost:8080/api`  
**마지막 업데이트**: 2026-04-02

---

## 📑 목차

1. [인증 API (Auth)](#인증-api)
2. [강의 API (Courses)](#강의-api)
3. [수강 API (Enrollments)](#수강-api)
4. [강의 진행 API (Lecture Progress)](#강의-진행-api)
5. [HTTP 상태 코드](#http-상태-코드)
6. [오류 응답](#오류-응답)

---

## 🔐 인증 API

### 1. 회원가입

회원가입하여 새로운 계정을 생성합니다.

**Endpoint**:
```
POST /auth/signup
```

**요청 헤더**:
```
Content-Type: application/json
```

**요청 본문**:
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123",
  "nickname": "StudentName",
  "role": "STUDENT"
}
```

**요청 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 | 제약 조건 |
|---------|------|-----|------|---------|
| email | string | O | 사용자 이메일 | 유효한 이메일 형식, 중복 불가 |
| password | string | O | 비밀번호 | 8-50자, BCrypt로 암호화됨 |
| nickname | string | O | 닉네임 | 2-30자 |
| role | string | O | 사용자 역할 | STUDENT, TEACHER, ADMIN 중 선택 |

**응답 (200 OK)**:
```json
{
  "data": {
    "id": 1,
    "email": "student@example.com",
    "nickname": "StudentName",
    "role": "STUDENT"
  },
  "message": "회원가입이 완료되었습니다"
}
```

**응답 (400 Bad Request - 이메일 중복)**:
```json
{
  "data": null,
  "message": "이미 사용 중인 이메일입니다: student@example.com"
}
```

**응답 (400 Bad Request - 검증 실패)**:
```json
{
  "data": null,
  "message": "입력값 검증 실패: email: 유효한 이메일 형식이 아닙니다, role: 역할은 STUDENT, TEACHER, ADMIN 중 하나여야 합니다"
}
```

---

### 2. 로그인

이메일과 비밀번호로 로그인합니다.

**Endpoint**:
```
POST /auth/login
```

**요청 헤더**:
```
Content-Type: application/json
```

**요청 본문**:
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123"
}
```

**요청 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|-----|------|
| email | string | O | 사용자 이메일 |
| password | string | O | 비밀번호 |

**응답 (200 OK)**:
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sZSI6IlNUVURFTlQiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDA3MDgwMH0.signature",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sZSI6IlNUVURFTlQiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDY3MjAwMH0.signature",
    "member": {
      "id": 1,
      "email": "student@example.com",
      "nickname": "StudentName",
      "role": "STUDENT"
    }
  },
  "message": "로그인이 완료되었습니다"
}
```

**응답 (401 Unauthorized - 사용자 없음)**:
```json
{
  "data": null,
  "message": "사용자를 찾을 수 없습니다"
}
```

**응답 (401 Unauthorized - 비밀번호 불일치)**:
```json
{
  "data": null,
  "message": "로그인 정보가 일치하지 않습니다"
}
```

---

### 3. Refresh Token으로 Access Token 재발급

Refresh Token을 사용하여 새로운 Access Token을 발급합니다.

**Endpoint**:
```
POST /auth/refresh
```

**요청 헤더**:
```
Content-Type: application/json
X-Refresh-Token: {refreshToken}
```

**또는 요청 본문**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**응답 (200 OK)**:
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sZSI6IlNUVURFTlQiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDA3MDgwMH0.new_signature",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sZSI6IlNUVURFTlQiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDY3MjAwMH0.new_signature",
    "member": {
      "id": 1,
      "email": "student@example.com",
      "nickname": "StudentName",
      "role": "STUDENT"
    }
  },
  "message": "토큰이 갱신되었습니다"
}
```

**응답 (400 Bad Request - 토큰 필요)**:
```json
{
  "data": null,
  "message": "Refresh Token이 필요합니다"
}
```

**응답 (401 Unauthorized - 토큰 만료)**:
```json
{
  "data": null,
  "message": "토큰이 만료되었습니다. 다시 로그인해주세요"
}
```

---

### 4. 이메일 중복 체크

특정 이메일이 이미 사용 중인지 확인합니다.

**Endpoint**:
```
GET /auth/check-email?email=student@example.com
```

**쿼리 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|-----|------|
| email | string | O | 확인할 이메일 |

**응답 (200 OK - 이미 존재)**:
```json
{
  "data": true,
  "message": "이미 사용 중인 이메일입니다"
}
```

**응답 (200 OK - 사용 가능)**:
```json
{
  "data": false,
  "message": "사용 가능한 이메일입니다"
}
```

---

## 📚 강의 API

### 1. 강의 등록 (강사만)

새로운 강의를 등록합니다. **TEACHER 역할만 가능합니다.**

**Endpoint**:
```
POST /courses
```

**요청 헤더**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**요청 본문**:
```json
{
  "title": "주식 투자 기초",
  "description": "초보자를 위한 주식 투자 완벽 가이드입니다. 기본 개념부터 실제 투자까지 배워봅시다.",
  "category": "STOCK",
  "price": 29900,
  "thumbnailUrl": "https://example.com/thumbnail.jpg"
}
```

**요청 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 | 제약 조건 |
|---------|------|-----|------|---------|
| title | string | O | 강의 제목 | 3-100자 |
| description | string | O | 강의 설명 | 10-1000자 |
| category | string | O | 강의 카테고리 | STOCK 또는 CRYPTO |
| price | integer | O | 강의 가격 | 0-10,000,000 |
| thumbnailUrl | string | X | 썸네일 URL | 유효한 URL 형식 |

**응답 (201 Created)**:
```json
{
  "data": {
    "id": 1,
    "title": "주식 투자 기초",
    "description": "초보자를 위한 주식 투자 완벽 가이드입니다. 기본 개념부터 실제 투자까지 배워봅시다.",
    "category": "STOCK",
    "price": 29900,
    "thumbnailUrl": "https://example.com/thumbnail.jpg",
    "instructor": {
      "id": 1,
      "email": "teacher@example.com",
      "nickname": "ChessTrainer",
      "role": "TEACHER"
    },
    "studentCount": 0,
    "createdAt": "2026-04-02T10:30:00"
  },
  "message": "강의가 등록되었습니다"
}
```

**응답 (403 Forbidden - 권한 없음)**:
```json
{
  "data": null,
  "message": "강사만 강의를 등록할 수 있습니다"
}
```

**응답 (401 Unauthorized - 토큰 없음)**:
```json
{
  "data": null,
  "message": "유효한 토큰이 필요합니다"
}
```

---

### 2. 강의 목록 조회 (모두 가능)

모든 강의 목록을 조회합니다. 페이지네이션을 지원합니다.

**Endpoint**:
```
GET /courses?page=0&size=10&sort=id,desc
```

**쿼리 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|---------|------|-----|------|-------|
| page | integer | X | 페이지 번호 (0부터 시작) | 0 |
| size | integer | X | 페이지 크기 | 20 |
| sort | string | X | 정렬 기준 (필드명,asc/desc) | id,asc |

**응답 (200 OK)**:
```json
{
  "data": {
    "content": [
      {
        "id": 2,
        "title": "암호화폐 투자 전략",
        "description": "비트코인과 이더리움 투자 전략을 배워봅시다",
        "category": "CRYPTO",
        "price": 39900,
        "thumbnailUrl": "https://example.com/crypto.jpg",
        "instructor": {
          "id": 2,
          "email": "expert@example.com",
          "nickname": "CryptoExpert",
          "role": "TEACHER"
        },
        "studentCount": 5,
        "createdAt": "2026-04-01T14:20:00"
      },
      {
        "id": 1,
        "title": "주식 투자 기초",
        "description": "초보자를 위한 주식 투자 완벽 가이드입니다",
        "category": "STOCK",
        "price": 29900,
        "thumbnailUrl": "https://example.com/thumbnail.jpg",
        "instructor": {
          "id": 1,
          "email": "teacher@example.com",
          "nickname": "ChessTrainer",
          "role": "TEACHER"
        },
        "studentCount": 0,
        "createdAt": "2026-04-02T10:30:00"
      }
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
      "paged": true,
      "unpaged": false
    },
    "totalPages": 1,
    "totalElements": 2,
    "last": true,
    "size": 10,
    "number": 0,
    "numberOfElements": 2,
    "first": true,
    "empty": false
  },
  "message": "Success"
}
```

**응답 (200 OK - 강의 없음)**:
```json
{
  "data": {
    "content": [],
    "pageable": { ... },
    "totalPages": 0,
    "totalElements": 0,
    "last": true,
    "size": 10,
    "number": 0,
    "numberOfElements": 0,
    "first": true,
    "empty": true
  },
  "message": "Success"
}
```

---

### 3. 강의 상세 조회 (모두 가능)

특정 강의의 상세 정보를 조회합니다.

**Endpoint**:
```
GET /courses/{courseId}
```

**경로 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|-----|------|
| courseId | integer | O | 강의 ID |

**응답 (200 OK)**:
```json
{
  "data": {
    "id": 1,
    "title": "주식 투자 기초",
    "description": "초보자를 위한 주식 투자 완벽 가이드입니다",
    "category": "STOCK",
    "price": 29900,
    "thumbnailUrl": "https://example.com/thumbnail.jpg",
    "instructor": {
      "id": 1,
      "email": "teacher@example.com",
      "nickname": "ChessTrainer",
      "role": "TEACHER"
    },
    "studentCount": 3,
    "createdAt": "2026-04-02T10:30:00"
  },
  "message": "Success"
}
```

**응답 (404 Not Found)**:
```json
{
  "data": null,
  "message": "강의를 찾을 수 없습니다"
}
```

---

### 4. 카테고리별 강의 조회 (모두 가능)

특정 카테고리의 강의를 조회합니다.

**Endpoint**:
```
GET /courses/category/{category}?page=0&size=10
```

**경로 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|-----|------|
| category | string | O | 강의 카테고리 (STOCK 또는 CRYPTO) |

**쿼리 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|-----|------|
| page | integer | X | 페이지 번호 |
| size | integer | X | 페이지 크기 |

**응답 (200 OK)**:
```json
{
  "data": {
    "content": [
      {
        "id": 1,
        "title": "주식 투자 기초",
        "description": "초보자를 위한 주식 투자 완벽 가이드입니다",
        "category": "STOCK",
        "price": 29900,
        "thumbnailUrl": "https://example.com/thumbnail.jpg",
        "instructor": { ... },
        "studentCount": 3,
        "createdAt": "2026-04-02T10:30:00"
      },
      {
        "id": 3,
        "title": "주식 고급 전략",
        "description": "심화 투자 전략",
        "category": "STOCK",
        "price": 49900,
        "thumbnailUrl": "https://example.com/advanced.jpg",
        "instructor": { ... },
        "studentCount": 1,
        "createdAt": "2026-04-02T11:00:00"
      }
    ],
    "pageable": { ... },
    "totalPages": 1,
    "totalElements": 2,
    "last": true,
    "size": 10,
    "number": 0,
    "numberOfElements": 2,
    "first": true,
    "empty": false
  },
  "message": "Success"
}
```

---

### 5. 강사별 강의 조회 (모두 가능)

특정 강사의 강의 목록을 조회합니다.

**Endpoint**:
```
GET /courses/instructor/{instructorId}?page=0&size=10
```

**경로 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|-----|------|
| instructorId | integer | O | 강사 ID |

**응답 (200 OK)**:
```json
{
  "data": {
    "content": [
      {
        "id": 1,
        "title": "주식 투자 기초",
        "description": "초보자를 위한 주식 투자 완벽 가이드입니다",
        "category": "STOCK",
        "price": 29900,
        "thumbnailUrl": "https://example.com/thumbnail.jpg",
        "instructor": {
          "id": 1,
          "email": "teacher@example.com",
          "nickname": "ChessTrainer",
          "role": "TEACHER"
        },
        "studentCount": 3,
        "createdAt": "2026-04-02T10:30:00"
      }
    ],
    "pageable": { ... },
    "totalPages": 1,
    "totalElements": 1,
    "last": true,
    "size": 10,
    "number": 0,
    "numberOfElements": 1,
    "first": true,
    "empty": false
  },
  "message": "Success"
}
```

---

### 6. 강의 수정 (강사만 자신의 강의 수정 가능)

강의 정보를 수정합니다. **강사만 자신의 강의를 수정할 수 있습니다.**

**Endpoint**:
```
PUT /courses/{courseId}
```

**요청 헤더**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**경로 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|-----|------|
| courseId | integer | O | 강의 ID |

**요청 본문**:
```json
{
  "title": "주식 투자 기초 - 개정판",
  "description": "초보자를 위한 주식 투자 완벽 가이드입니다. 2026년 최신 정보 포함",
  "price": 34900,
  "thumbnailUrl": "https://example.com/thumbnail-v2.jpg"
}
```

**요청 파라미터** (주의: category는 수정 불가):
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|-----|------|
| title | string | O | 강의 제목 |
| description | string | O | 강의 설명 |
| price | integer | O | 강의 가격 |
| thumbnailUrl | string | X | 썸네일 URL |

**응답 (200 OK)**:
```json
{
  "data": {
    "id": 1,
    "title": "주식 투자 기초 - 개정판",
    "description": "초보자를 위한 주식 투자 완벽 가이드입니다. 2026년 최신 정보 포함",
    "category": "STOCK",
    "price": 34900,
    "thumbnailUrl": "https://example.com/thumbnail-v2.jpg",
    "instructor": { ... },
    "studentCount": 3,
    "createdAt": "2026-04-02T10:30:00"
  },
  "message": "강의가 수정되었습니다"
}
```

**응답 (403 Forbidden - 권한 없음)**:
```json
{
  "data": null,
  "message": "자신의 강의만 수정할 수 있습니다"
}
```

**응답 (404 Not Found)**:
```json
{
  "data": null,
  "message": "강의를 찾을 수 없습니다"
}
```

---

### 7. 강의 삭제 (강사만 자신의 강의 삭제 가능)

강의를 삭제합니다. **강사만 자신의 강의를 삭제할 수 있습니다.**

**Endpoint**:
```
DELETE /courses/{courseId}
```

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**경로 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|-----|------|
| courseId | integer | O | 강의 ID |

**응답 (200 OK)**:
```json
{
  "data": null,
  "message": "강의가 삭제되었습니다"
}
```

**응답 (403 Forbidden)**:
```json
{
  "data": null,
  "message": "자신의 강의만 삭제할 수 있습니다"
}
```

**응답 (404 Not Found)**:
```json
{
  "data": null,
  "message": "강의를 찾을 수 없습니다"
}
```

---

## 📖 수강 API (향후 구현)

### 1. 수강 등록

학생이 강의에 수강 등록합니다.

**Endpoint**:
```
POST /enrollments
```

**요청 헤더**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**요청 본문**:
```json
{
  "courseId": 1
}
```

**응답 (201 Created)**:
```json
{
  "data": {
    "id": 1,
    "memberId": 2,
    "courseId": 1,
    "courseTitle": "주식 투자 기초",
    "enrolledAt": "2026-04-02T12:00:00",
    "isCompleted": false
  },
  "message": "수강 등록이 완료되었습니다"
}
```

---

### 2. 내 수강 목록 조회

로그인한 학생이 수강 중인 강의 목록을 조회합니다.

**Endpoint**:
```
GET /enrollments/my?page=0&size=10
```

**응답 (200 OK)**:
```json
{
  "data": {
    "content": [
      {
        "id": 1,
        "memberId": 2,
        "courseId": 1,
        "courseTitle": "주식 투자 기초",
        "enrolledAt": "2026-04-02T12:00:00",
        "isCompleted": false
      }
    ],
    "pageable": { ... },
    "totalPages": 1,
    "totalElements": 1,
    "last": true,
    "size": 10,
    "number": 0,
    "numberOfElements": 1,
    "first": true,
    "empty": false
  },
  "message": "Success"
}
```

---

## 🎥 강의 진행 API (향후 구현)

### 1. 강의 진행 상황 저장

학생이 강의의 진행 상황(마지막 시청 시간)을 저장합니다.

**Endpoint**:
```
POST /lectures/{lectureId}/progress
```

**요청 헤더**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**요청 본문**:
```json
{
  "lastPosition": 300
}
```

**응답 (200 OK)**:
```json
{
  "data": {
    "id": 1,
    "memberId": 2,
    "lectureId": 1,
    "lastPosition": 300,
    "updatedAt": "2026-04-02T12:30:00"
  },
  "message": "진행 상황이 저장되었습니다"
}
```

---

## 📊 HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| 200 | OK | 요청 성공 |
| 201 | Created | 리소스 생성 성공 |
| 400 | Bad Request | 잘못된 요청 (검증 실패 등) |
| 401 | Unauthorized | 인증 실패 (토큰 없음, 만료 등) |
| 403 | Forbidden | 권한 없음 (다른 사용자의 리소스 접근 등) |
| 404 | Not Found | 리소스를 찾을 수 없음 |
| 500 | Internal Server Error | 서버 오류 |

---

## ⚠️ 오류 응답

모든 오류 응답은 다음 형식으로 반환됩니다:

```json
{
  "data": null,
  "message": "오류 메시지"
}
```

**주요 오류 메시지**:

| 오류 메시지 | HTTP 코드 | 원인 |
|-----------|---------|------|
| 이미 사용 중인 이메일입니다 | 400 | 이메일 중복 |
| 입력값 검증 실패: ... | 400 | DTO 필드 검증 실패 |
| 사용자를 찾을 수 없습니다 | 401 | 존재하지 않는 사용자 |
| 로그인 정보가 일치하지 않습니다 | 401 | 비밀번호 불일치 |
| 유효한 토큰이 필요합니다 | 401 | Authorization 헤더 없음 |
| 토큰이 만료되었습니다 | 401 | JWT 만료 |
| 유효하지 않은 토큰입니다 | 401 | 토큰 손상/조작 |
| 강사만 강의를 등록할 수 있습니다 | 403 | TEACHER 역할 아님 |
| 자신의 강의만 수정할 수 있습니다 | 403 | 강의 소유권 없음 |
| 강의를 찾을 수 없습니다 | 404 | 존재하지 않는 강의 |
| 서버 오류가 발생했습니다 | 500 | 예상치 못한 오류 |

---

## 🔑 인증 방식

모든 보호된 API는 **JWT Bearer Token**을 사용합니다.

### Authorization 헤더 형식:

```
Authorization: Bearer {accessToken}
```

### 예시:

```http
GET /api/courses HTTP/1.1
Host: localhost:8080
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sZSI6IlNUVURFTlQiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDA3MDgwMH0.signature
```

---

## 📝 예제 호출 시퀀스

### 1. 학생 회원가입 및 강의 조회

```
1. POST /api/auth/signup
   - email: student@example.com
   - password: SecurePassword123
   - nickname: StudentName
   - role: STUDENT
   → 회원 생성, ID: 2

2. POST /api/auth/login
   - email: student@example.com
   - password: SecurePassword123
   → accessToken, refreshToken 발급

3. GET /api/courses
   - Authorization: Bearer {accessToken}
   → 모든 강의 목록 조회 (페이지네이션)

4. GET /api/courses/1
   - Authorization: Bearer {accessToken}
   → 특정 강의 상세 정보 조회
```

### 2. 강사 강의 등록 및 관리

```
1. POST /api/auth/signup
   - email: teacher@example.com
   - password: SecurePassword123
   - nickname: ChessTrainer
   - role: TEACHER
   → 강사 계정 생성, ID: 1

2. POST /api/auth/login
   - email: teacher@example.com
   - password: SecurePassword123
   → accessToken 발급

3. POST /api/courses
   - Authorization: Bearer {accessToken}
   - title: "주식 투자 기초"
   - description: "..."
   - category: "STOCK"
   - price: 29900
   → 강의 생성, ID: 1

4. PUT /api/courses/1
   - Authorization: Bearer {accessToken}
   - title: "주식 투자 기초 - 개정판"
   - price: 34900
   → 강의 정보 수정

5. GET /api/courses/instructor/1
   - Authorization: Bearer {accessToken}
   → 자신의 강의 목록 조회

6. DELETE /api/courses/1
   - Authorization: Bearer {accessToken}
   → 강의 삭제
```

---

## 📌 Postman Collection 사용법

1. **Postman 다운로드**: https://www.postman.com/downloads/
2. **Collection 가져오기**: `ChessMate_Auth_API.postman_collection.json` 파일 import
3. **환경 설정**: `baseUrl` 변수를 `http://localhost:8080/api`로 설정
4. **토큰 저장**: 로그인 후 응답의 `accessToken`을 환경 변수 `token`으로 저장

---

## 🔗 관련 문서

- [구현 명세서](./IMPLEMENTATION_SPEC.md)
- [JWT 인증 보고서](./JWT_AUTH_REPORT.md)
- [개발자 가이드](./DEVELOPER_GUIDE.md)

---

## ✅ 마지막 검증 체크리스트

- [ ] 모든 API가 HTTPS를 사용합니다 (프로덕션)
- [ ] 모든 민감한 데이터(비밀번호, 토큰)는 응답에서 제외됩니다
- [ ] 모든 입력값은 서버 측에서 검증됩니다
- [ ] 모든 오류 응답은 표준화된 형식을 따릅니다
- [ ] 토큰 만료 시간을 정기적으로 검토합니다
- [ ] 로그인 실패 횟수에 따른 계정 잠금 기능 추가 고려
- [ ] Rate Limiting 기능 추가 고려

---

**문의사항**: API 관련 질문이나 추가 사항이 있으면 개발팀에 문의하세요.

**마지막 수정**: 2026-04-02

