# 📋 P1 StockFlow 백엔드 API 명세서

**프로젝트명**: StockFlow  
**버전**: v1 (P1 MVP)  
**작성일**: 2026-04-05  
**기본 URL**: `http://localhost:8080/api`  

---

## 📑 목차
1. [개요](#개요)
2. [인증 API](#1-인증-api)
3. [강의 API](#2-강의-api)
4. [수강 API](#3-수강-api)
5. [학습 진행 API](#4-학습-진행-api)
6. [헬스 체크](#5-헬스-체크)
7. [응답 포맷](#응답-포맷)
8. [에러 처리](#에러-처리)

---

## 개요

### API 버전 및 프로토콜
- **REST API** 기반
- **HTTP/HTTPS** 프로토콜 사용
- **JSON** 요청/응답 형식
- **JWT 토큰** 기반 인증

### 인증 방식
모든 인증이 필요한 엔드포인트는 다음 헤더를 포함해야 합니다:

```
Authorization: Bearer {accessToken}
```

### 역할 기반 접근 제어 (RBAC)
- **STUDENT**: 일반 사용자 (강의 수강, 진도 저장)
- **TEACHER**: 강사 (강의 등록, 수정)
- **ADMIN**: 관리자 (전체 시스템 관리)

---

## 1. 인증 API

### 1-1. 회원가입
**엔드포인트**: `POST /auth/signup`

**설명**: 새로운 사용자 계정을 생성합니다.

**요청 헤더**:
```
Content-Type: application/json
```

**요청 본문**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "nickname": "사용자닉네임",
  "role": "STUDENT"
}
```

**요청 파라미터**:
| 필드 | 타입 | 필수 | 설명 | 제약조건 |
|------|------|------|------|---------|
| email | string | ✅ | 사용자 이메일 | 유효한 이메일 형식, 고유값 |
| password | string | ✅ | 비밀번호 | 8자 이상 50자 이하 |
| nickname | string | ✅ | 사용자 닉네임 | 2자 이상 30자 이하 |
| role | string | ✅ | 사용자 역할 | STUDENT, TEACHER, ADMIN 중 하나 |

**응답 (201 Created)**:
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "사용자닉네임",
    "role": "STUDENT",
    "createdAt": "2026-04-05T22:00:00"
  },
  "message": "회원가입이 완료되었습니다"
}
```

**응답 필드**:
| 필드 | 타입 | 설명 |
|------|------|------|
| id | number | 사용자 ID |
| email | string | 사용자 이메일 |
| nickname | string | 사용자 닉네임 |
| role | string | 사용자 역할 |
| createdAt | string(ISO 8601) | 계정 생성 시간 |

**에러 응답**:
```json
{
  "data": null,
  "message": "이미 사용 중인 이메일입니다"
}
```

---

### 1-2. 로그인
**엔드포인트**: `POST /auth/login`

**설명**: 사용자 인증을 수행하고 토큰을 발급합니다.

**요청 본문**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**요청 파라미터**:
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | string | ✅ | 사용자 이메일 |
| password | string | ✅ | 비밀번호 |

**응답 (200 OK)**:
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "member": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "사용자닉네임",
      "role": "STUDENT",
      "createdAt": "2026-04-05T22:00:00"
    }
  },
  "message": "로그인이 완료되었습니다"
}
```

**응답 필드**:
| 필드 | 타입 | 설명 |
|------|------|------|
| accessToken | string | 접근 토큰 (유효시간: 30분) |
| refreshToken | string | 갱신 토큰 (유효시간: 7일) |
| member | object | 사용자 정보 |

**토큰 클레임**:
- `memberId`: 사용자 ID
- `email`: 사용자 이메일
- `role`: 사용자 역할
- `iat`: 발급 시간
- `exp`: 만료 시간

---

### 1-3. 토큰 갱신
**엔드포인트**: `POST /auth/refresh`

**설명**: Refresh Token을 이용하여 새로운 Access Token을 발급받습니다.

**요청 헤더** (방법 1):
```
X-Refresh-Token: {refreshToken}
```

**요청 본문** (방법 2):
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**응답 (200 OK)**:
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "member": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "사용자닉네임",
      "role": "STUDENT",
      "createdAt": "2026-04-05T22:00:00"
    }
  },
  "message": "토큰이 갱신되었습니다"
}
```

---

### 1-4. 이메일 중복 확인
**엔드포인트**: `GET /auth/check-email`

**설명**: 특정 이메일이 이미 사용 중인지 확인합니다.

**요청 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| email | string | ✅ | 확인할 이메일 |

**요청 예시**:
```
GET /auth/check-email?email=user@example.com
```

**응답 (200 OK)** - 사용 가능:
```json
{
  "data": false,
  "message": "사용 가능한 이메일입니다"
}
```

**응답 (200 OK)** - 사용 불가:
```json
{
  "data": true,
  "message": "이미 사용 중인 이메일입니다"
}
```

---

## 2. 강의 API

### 2-1. 강의 목록 조회
**엔드포인트**: `GET /courses`

**설명**: 전체 강의 목록을 페이지네이션과 함께 조회합니다.

**인증**: ❌ 필수 아님

**요청 파라미터**:
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|-------|------|
| page | number | ❌ | 0 | 페이지 번호 (0부터 시작) |
| size | number | ❌ | 10 | 페이지당 항목 수 |
| sort | string | ❌ | id,desc | 정렬 기준 (예: id,desc / createdAt,asc) |

**요청 예시**:
```
GET /courses?page=0&size=10&sort=createdAt,desc
```

**응답 (200 OK)**:
```json
{
  "data": {
    "content": [
      {
        "id": 1,
        "title": "주식 입문 완벽 가이드",
        "description": "주식 초보자를 위한 기초 강의입니다.",
        "category": "STOCK",
        "price": 29900,
        "thumbnailUrl": "https://example.com/thumbnail1.jpg",
        "instructor": {
          "id": 10,
          "email": "teacher@example.com",
          "nickname": "전문가강사",
          "role": "TEACHER",
          "createdAt": "2026-03-01T10:00:00"
        },
        "studentCount": 145,
        "createdAt": "2026-03-15T14:30:00"
      },
      {
        "id": 2,
        "title": "암호화폐 투자 전략",
        "description": "비트코인과 알트코인 투자 전략을 배웁니다.",
        "category": "CRYPTO",
        "price": 39900,
        "thumbnailUrl": "https://example.com/thumbnail2.jpg",
        "instructor": {
          "id": 11,
          "email": "crypto_teacher@example.com",
          "nickname": "암호화폐전문가",
          "role": "TEACHER",
          "createdAt": "2026-03-10T10:00:00"
        },
        "studentCount": 287,
        "createdAt": "2026-03-20T16:45:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 42,
      "totalPages": 5
    }
  },
  "message": "Success"
}
```

**응답 필드** (content 배열의 각 항목):
| 필드 | 타입 | 설명 |
|------|------|------|
| id | number | 강의 ID |
| title | string | 강의 제목 |
| description | string | 강의 설명 |
| category | string | 강의 카테고리 (STOCK, CRYPTO) |
| price | number | 강의 가격 (원) |
| thumbnailUrl | string | 강의 썸네일 URL |
| instructor | object | 강사 정보 |
| studentCount | number | 수강생 수 |
| createdAt | string(ISO 8601) | 강의 생성 시간 |

---

### 2-2. 강의 상세 조회
**엔드포인트**: `GET /courses/{courseId}`

**설명**: 특정 강의의 상세 정보를 조회합니다.

**인증**: ❌ 필수 아님

**경로 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| courseId | number | ✅ | 강의 ID |

**요청 예시**:
```
GET /courses/1
```

**응답 (200 OK)**:
```json
{
  "data": {
    "id": 1,
    "title": "주식 입문 완벽 가이드",
    "description": "주식 초보자를 위한 기초 강의입니다. 주식의 기본 개념부터 실제 투자 방법까지 상세히 다룹니다.",
    "category": "STOCK",
    "price": 29900,
    "thumbnailUrl": "https://example.com/thumbnail1.jpg",
    "instructor": {
      "id": 10,
      "email": "teacher@example.com",
      "nickname": "전문가강사",
      "role": "TEACHER",
      "createdAt": "2026-03-01T10:00:00"
    },
    "studentCount": 145,
    "createdAt": "2026-03-15T14:30:00"
  },
  "message": "Success"
}
```

---

### 2-3. 카테고리별 강의 조회
**엔드포인트**: `GET /courses/category/{category}`

**설명**: 특정 카테고리의 강의 목록을 조회합니다.

**인증**: ❌ 필수 아님

**경로 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| category | string | ✅ | 카테고리 (STOCK 또는 CRYPTO) |

**요청 파라미터**:
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|-------|------|
| page | number | ❌ | 0 | 페이지 번호 |
| size | number | ❌ | 10 | 페이지당 항목 수 |

**요청 예시**:
```
GET /courses/category/STOCK?page=0&size=10
```

**응답 (200 OK)**:
```json
{
  "data": {
    "content": [
      {
        "id": 1,
        "title": "주식 입문 완벽 가이드",
        "description": "주식 초보자를 위한 기초 강의입니다.",
        "category": "STOCK",
        "price": 29900,
        "thumbnailUrl": "https://example.com/thumbnail1.jpg",
        "instructor": {
          "id": 10,
          "email": "teacher@example.com",
          "nickname": "전문가강사",
          "role": "TEACHER",
          "createdAt": "2026-03-01T10:00:00"
        },
        "studentCount": 145,
        "createdAt": "2026-03-15T14:30:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 25,
      "totalPages": 3
    }
  },
  "message": "Success"
}
```

---

### 2-4. 강사별 강의 조회
**엔드포인트**: `GET /courses/instructor/{instructorId}`

**설명**: 특정 강사의 강의 목록을 조회합니다.

**인증**: ❌ 필수 아님

**경로 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| instructorId | number | ✅ | 강사 ID |

**요청 파라미터**:
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|-------|------|
| page | number | ❌ | 0 | 페이지 번호 |
| size | number | ❌ | 10 | 페이지당 항목 수 |

**요청 예시**:
```
GET /courses/instructor/10?page=0&size=10
```

**응답 (200 OK)**:
(강의 목록 조회와 동일한 형식)

---

### 2-5. 강의 등록
**엔드포인트**: `POST /courses`

**설명**: 새로운 강의를 등록합니다. **강사(TEACHER) 역할만 가능합니다.**

**인증**: ✅ 필수 (TEACHER)

**요청 헤더**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**요청 본문**:
```json
{
  "title": "고급 주식 분석 기법",
  "description": "기술적 분석과 기본적 분석을 결합한 고급 주식 분석 방법을 배웁니다.",
  "category": "STOCK",
  "price": 49900,
  "thumbnailUrl": "https://example.com/advanced-stock.jpg"
}
```

**요청 파라미터**:
| 필드 | 타입 | 필수 | 제약조건 | 설명 |
|------|------|------|---------|------|
| title | string | ✅ | 3-100자 | 강의 제목 |
| description | string | ✅ | 10-1000자 | 강의 설명 |
| category | string | ✅ | STOCK 또는 CRYPTO | 강의 카테고리 |
| price | number | ✅ | 0 - 10,000,000 | 강의 가격 (원) |
| thumbnailUrl | string | ❌ | 유효한 URL | 강의 썸네일 URL |

**응답 (201 Created)**:
```json
{
  "data": {
    "id": 3,
    "title": "고급 주식 분석 기법",
    "description": "기술적 분석과 기본적 분석을 결합한 고급 주식 분석 방법을 배웁니다.",
    "category": "STOCK",
    "price": 49900,
    "thumbnailUrl": "https://example.com/advanced-stock.jpg",
    "instructor": {
      "id": 10,
      "email": "teacher@example.com",
      "nickname": "전문가강사",
      "role": "TEACHER",
      "createdAt": "2026-03-01T10:00:00"
    },
    "studentCount": 0,
    "createdAt": "2026-04-05T22:30:00"
  },
  "message": "강의가 등록되었습니다"
}
```

---

### 2-6. 강의 수정
**엔드포인트**: `PUT /courses/{courseId}`

**설명**: 기존 강의를 수정합니다. **강사는 자신의 강의만 수정 가능합니다.**

**인증**: ✅ 필수 (TEACHER)

**경로 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| courseId | number | ✅ | 강의 ID |

**요청 본문**:
```json
{
  "title": "고급 주식 분석 기법 - 업데이트",
  "description": "기술적 분석과 기본적 분석을 결합한 고급 주식 분석 방법을 배웁니다. (개정판)",
  "category": "STOCK",
  "price": 59900,
  "thumbnailUrl": "https://example.com/advanced-stock-v2.jpg"
}
```

**응답 (200 OK)**:
```json
{
  "data": {
    "id": 3,
    "title": "고급 주식 분석 기법 - 업데이트",
    "description": "기술적 분석과 기본적 분석을 결합한 고급 주식 분석 방법을 배웁니다. (개정판)",
    "category": "STOCK",
    "price": 59900,
    "thumbnailUrl": "https://example.com/advanced-stock-v2.jpg",
    "instructor": {
      "id": 10,
      "email": "teacher@example.com",
      "nickname": "전문가강사",
      "role": "TEACHER",
      "createdAt": "2026-03-01T10:00:00"
    },
    "studentCount": 5,
    "createdAt": "2026-04-05T22:30:00"
  },
  "message": "강의가 수정되었습니다"
}
```

---

### 2-7. 강의 삭제
**엔드포인트**: `DELETE /courses/{courseId}`

**설명**: 강의를 삭제합니다. **강사는 자신의 강의만 삭제 가능합니다.**

**인증**: ✅ 필수 (TEACHER)

**경로 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| courseId | number | ✅ | 강의 ID |

**요청 예시**:
```
DELETE /courses/3
```

**응답 (200 OK)**:
```json
{
  "data": null,
  "message": "강의가 삭제되었습니다"
}
```

---

## 3. 수강 API

### 3-1. 수강 신청
**엔드포인트**: `POST /enrollments`

**설명**: 특정 강의에 등록하여 수강을 시작합니다. **학생(STUDENT) 역할만 가능합니다.**

**인증**: ✅ 필수 (STUDENT)

**요청 본문**:
```json
{
  "courseId": 1
}
```

**요청 파라미터**:
| 필드 | 타입 | 필수 | 제약조건 | 설명 |
|------|------|------|---------|------|
| courseId | number | ✅ | 양수 | 강의 ID |

**응답 (201 Created)**:
```json
{
  "data": {
    "id": 1,
    "memberId": 1,
    "courseId": 1,
    "courseName": "주식 입문 완벽 가이드",
    "enrolledAt": "2026-04-05T22:00:00",
    "isCompleted": false
  },
  "message": "수강 등록이 완료되었습니다"
}
```

**응답 필드**:
| 필드 | 타입 | 설명 |
|------|------|------|
| id | number | 수강 ID |
| memberId | number | 학생 ID |
| courseId | number | 강의 ID |
| courseName | string | 강의 제목 |
| enrolledAt | string(ISO 8601) | 수강 신청 시간 |
| isCompleted | boolean | 완강 여부 |

---

### 3-2. 내 수강 목록 조회
**엔드포인트**: `GET /enrollments/my`

**설명**: 현재 사용자가 수강 중인 강의 목록을 조회합니다.

**인증**: ✅ 필수 (STUDENT)

**요청 파라미터**:
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|-------|------|
| page | number | ❌ | 0 | 페이지 번호 |
| size | number | ❌ | 10 | 페이지당 항목 수 |

**요청 예시**:
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
        "memberId": 1,
        "courseId": 1,
        "courseName": "주식 입문 완벽 가이드",
        "enrolledAt": "2026-04-05T22:00:00",
        "isCompleted": false
      },
      {
        "id": 2,
        "memberId": 1,
        "courseId": 2,
        "courseName": "암호화폐 투자 전략",
        "enrolledAt": "2026-04-04T10:30:00",
        "isCompleted": false
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 2,
      "totalPages": 1
    }
  },
  "message": "Success"
}
```

---

### 3-3. 강의 완강 처리
**엔드포인트**: `PUT /enrollments/courses/{courseId}/complete`

**설명**: 특정 강의를 완강 처리합니다.

**인증**: ✅ 필수 (STUDENT)

**경로 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| courseId | number | ✅ | 강의 ID |

**요청 예시**:
```
PUT /enrollments/courses/1/complete
```

**응답 (200 OK)**:
```json
{
  "data": null,
  "message": "강의 완강 처리 되었습니다"
}
```

---

## 4. 학습 진행 API

### 4-1. 강의 진행 상황 저장
**엔드포인트**: `POST /lecture-progress`

**설명**: 현재 강의의 시청 위치를 저장합니다.

**인증**: ✅ 필수 (STUDENT)

**요청 본문**:
```json
{
  "lectureId": 5,
  "lastPosition": 1250
}
```

**요청 파라미터**:
| 필드 | 타입 | 필수 | 제약조건 | 설명 |
|------|------|------|---------|------|
| lectureId | number | ✅ | 양수 | 강의 ID |
| lastPosition | number | ✅ | 0 이상 | 마지막 시청 위치 (초) |

**응답 (201 Created)**:
```json
{
  "data": {
    "id": 12,
    "memberId": 1,
    "lectureId": 5,
    "lectureName": "섹션 1 - 기본 개념",
    "lastPosition": 1250,
    "updatedAt": "2026-04-05T22:15:30"
  },
  "message": "강의 진행 상황이 저장되었습니다"
}
```

**응답 필드**:
| 필드 | 타입 | 설명 |
|------|------|------|
| id | number | 진행 정보 ID |
| memberId | number | 학생 ID |
| lectureId | number | 강의 ID |
| lectureName | string | 강의 제목 |
| lastPosition | number | 마지막 시청 위치 (초) |
| updatedAt | string(ISO 8601) | 마지막 업데이트 시간 |

---

### 4-2. 강의 진행 정보 조회
**엔드포인트**: `GET /lecture-progress/lectures/{lectureId}`

**설명**: 특정 강의의 시청 진행 정보를 조회합니다.

**인증**: ✅ 필수 (STUDENT)

**경로 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| lectureId | number | ✅ | 강의 ID |

**요청 예시**:
```
GET /lecture-progress/lectures/5
```

**응답 (200 OK)**:
```json
{
  "data": {
    "id": 12,
    "memberId": 1,
    "lectureId": 5,
    "lectureName": "섹션 1 - 기본 개념",
    "lastPosition": 1250,
    "updatedAt": "2026-04-05T22:15:30"
  },
  "message": "Success"
}
```

---

### 4-3. 내 전체 진행 정보 조회
**엔드포인트**: `GET /lecture-progress/my`

**설명**: 현재 사용자의 모든 강의 진행 정보를 조회합니다.

**인증**: ✅ 필수 (STUDENT)

**요청 예시**:
```
GET /lecture-progress/my
```

**응답 (200 OK)**:
```json
{
  "data": [
    {
      "id": 12,
      "memberId": 1,
      "lectureId": 5,
      "lectureName": "섹션 1 - 기본 개념",
      "lastPosition": 1250,
      "updatedAt": "2026-04-05T22:15:30"
    },
    {
      "id": 13,
      "memberId": 1,
      "lectureId": 6,
      "lectureName": "섹션 2 - 실전 분석",
      "lastPosition": 2500,
      "updatedAt": "2026-04-05T21:45:00"
    }
  ],
  "message": "Success"
}
```

---

### 4-4. 강의 진행 정보 삭제
**엔드포인트**: `DELETE /lecture-progress/lectures/{lectureId}`

**설명**: 특정 강의의 시청 진행 정보를 삭제합니다.

**인증**: ✅ 필수 (STUDENT)

**경로 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| lectureId | number | ✅ | 강의 ID |

**요청 예시**:
```
DELETE /lecture-progress/lectures/5
```

**응답 (200 OK)**:
```json
{
  "data": null,
  "message": "강의 진행 정보가 삭제되었습니다"
}
```

---

## 5. 헬스 체크

### 5-1. 서버 상태 확인
**엔드포인트**: `GET /health`

**설명**: 서버의 정상 작동 여부를 확인합니다.

**인증**: ❌ 필수 아님

**요청 예시**:
```
GET /health
```

**응답 (200 OK)**:
```json
{
  "data": "Server is running",
  "message": "Health check passed"
}
```

---

## 응답 포맷

모든 API 응답은 다음의 표준 JSON 포맷을 따릅니다:

```json
{
  "data": {},
  "message": "Success message or error description"
}
```

### 응답 필드 설명
| 필드 | 타입 | 설명 |
|------|------|------|
| data | any | 응답 데이터 (성공: 요청한 데이터, 실패: null) |
| message | string | 응답 메시지 (성공/실패 사유) |

### 페이지네이션 응답 구조
```json
{
  "data": {
    "content": [],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 42,
      "totalPages": 5
    }
  },
  "message": "Success"
}
```

---

## 에러 처리

### 에러 응답 포맷
모든 에러는 다음과 같은 JSON 포맷으로 반환됩니다:

```json
{
  "data": null,
  "message": "에러 메시지"
}
```

### HTTP 상태 코드

| 상태 코드 | 설명 | 예시 상황 |
|---------|------|---------|
| **200** | OK | 요청 성공 |
| **201** | Created | 리소스 생성 성공 |
| **400** | Bad Request | 잘못된 요청 형식 (유효성 검사 실패) |
| **401** | Unauthorized | 인증 실패 (토큰 없음/만료) |
| **403** | Forbidden | 권한 부족 (역할 미충족) |
| **404** | Not Found | 요청한 리소스 미존재 |
| **409** | Conflict | 데이터 충돌 (예: 중복된 이메일) |
| **500** | Internal Server Error | 서버 내부 오류 |

### 주요 에러 메시지

#### 인증 관련
```json
{
  "data": null,
  "message": "이메일 또는 비밀번호가 일치하지 않습니다"
}
```

```json
{
  "data": null,
  "message": "인증 토큰이 유효하지 않습니다"
}
```

#### 권한 관련
```json
{
  "data": null,
  "message": "접근 권한이 없습니다. 강사 역할이 필요합니다"
}
```

#### 유효성 검사 관련
```json
{
  "data": null,
  "message": "이메일은 필수입니다"
}
```

```json
{
  "data": null,
  "message": "비밀번호는 8자 이상 50자 이하여야 합니다"
}
```

#### 리소스 미존재
```json
{
  "data": null,
  "message": "존재하지 않는 강의입니다"
}
```

#### 중복 데이터
```json
{
  "data": null,
  "message": "이미 사용 중인 이메일입니다"
}
```

```json
{
  "data": null,
  "message": "이미 수강 중인 강의입니다"
}
```

---

## 예제 시나리오

### 시나리오 1: 회원가입 → 로그인 → 강의 수강

#### 1. 회원가입
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePass123",
    "nickname": "학생1",
    "role": "STUDENT"
  }'
```

**응답**: 200 + 회원 정보

#### 2. 로그인
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePass123"
  }'
```

**응답**: 200 + accessToken, refreshToken, member

#### 3. 강의 목록 조회
```bash
curl -X GET "http://localhost:8080/api/courses?page=0&size=10" \
  -H "Content-Type: application/json"
```

**응답**: 200 + 강의 목록

#### 4. 강의 상세 조회
```bash
curl -X GET http://localhost:8080/api/courses/1 \
  -H "Content-Type: application/json"
```

**응답**: 200 + 강의 상세 정보

#### 5. 수강 신청
```bash
curl -X POST http://localhost:8080/api/enrollments \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": 1
  }'
```

**응답**: 201 + 수강 정보

#### 6. 강의 진행 상황 저장
```bash
curl -X POST http://localhost:8080/api/lecture-progress \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "lectureId": 5,
    "lastPosition": 1250
  }'
```

**응답**: 201 + 진행 정보

---

### 시나리오 2: 강사 강의 등록

#### 1. 강사 회원가입
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "TeacherPass123",
    "nickname": "강사1",
    "role": "TEACHER"
  }'
```

#### 2. 강사 로그인
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "TeacherPass123"
  }'
```

#### 3. 강의 등록
```bash
curl -X POST http://localhost:8080/api/courses \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "고급 주식 분석",
    "description": "기술적 분석과 기본적 분석을 결합한 방법",
    "category": "STOCK",
    "price": 49900,
    "thumbnailUrl": "https://example.com/course.jpg"
  }'
```

**응답**: 201 + 강의 정보

---

## 릴리스 노트

### v1.0.0 (P1 MVP)
- ✅ 회원가입 및 로그인 API
- ✅ JWT 토큰 기반 인증
- ✅ 강의 CRUD API
- ✅ 수강 신청 및 관리 API
- ✅ 학습 진행 상황 저장 API
- ✅ 역할 기반 접근 제어 (RBAC)
- ✅ 페이지네이션 지원
- ✅ 표준 에러 처리

---

## API 문서 링크

- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI 3.0 JSON**: `http://localhost:8080/v3/api-docs`

---

**문서 작성일**: 2026-04-05  
**최종 업데이트**: 2026-04-05  
**작성자**: 백엔드 개발팀

