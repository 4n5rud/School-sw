# 🚀 P1 StockFlow API 빠른 참고 가이드

**대상**: 프론트엔드 개발자, API 사용자  
**버전**: v1.0  
**작성일**: 2026-04-05

---

## 📌 기본 정보

| 항목 | 값 |
|------|-----|
| **Base URL** | `http://localhost:8080/api` |
| **Content-Type** | `application/json` |
| **인증 방식** | JWT (Bearer Token) |
| **문서** | `http://localhost:8080/swagger-ui.html` |

---

## 🔑 인증 토큰 사용 방법

모든 인증이 필요한 API 요청 시 다음 헤더를 포함하세요:

```
Authorization: Bearer {accessToken}
```

### 토큰 얻기
1. 회원가입: `POST /auth/signup`
2. 로그인: `POST /auth/login` → accessToken 수신
3. 토큰 만료 시: `POST /auth/refresh` → 새 토큰 수신

---

## 📊 빠른 API 목록

### 🔐 인증 (비로그인 사용 가능)
```
POST   /auth/signup          - 회원가입
POST   /auth/login           - 로그인
POST   /auth/refresh         - 토큰 갱신
GET    /auth/check-email     - 이메일 중복 확인
```

### 📚 강의 (비로그인 사용 가능)
```
GET    /courses              - 강의 목록 조회
GET    /courses/{id}         - 강의 상세 조회
GET    /courses/category/{category}  - 카테고리별 조회
GET    /courses/instructor/{id}      - 강사별 조회

POST   /courses              - 강의 등록 (강사만)
PUT    /courses/{id}         - 강의 수정 (강사만)
DELETE /courses/{id}         - 강의 삭제 (강사만)
```

### 🎓 수강 (학생만)
```
POST   /enrollments                  - 수강 신청
GET    /enrollments/my               - 내 수강 목록
PUT    /enrollments/courses/{id}/complete - 완강 처리
```

### 📈 학습 진행 (학생만)
```
POST   /lecture-progress             - 진행 저장
GET    /lecture-progress/lectures/{id}    - 진행 조회
GET    /lecture-progress/my               - 내 전체 진행
DELETE /lecture-progress/lectures/{id}    - 진행 삭제
```

### 🏥 헬스 체크
```
GET    /health               - 서버 상태 확인
```

---

## 💡 실전 예제

### 1️⃣ 회원가입 및 로그인

#### 회원가입 (학생)
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

**응답**:
```json
{
  "data": {
    "id": 1,
    "email": "student@example.com",
    "nickname": "학생1",
    "role": "STUDENT",
    "createdAt": "2026-04-05T22:00:00"
  },
  "message": "회원가입이 완료되었습니다"
}
```

#### 로그인
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePass123"
  }'
```

**응답** (accessToken 저장 필수):
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "member": {
      "id": 1,
      "email": "student@example.com",
      "nickname": "학생1",
      "role": "STUDENT",
      "createdAt": "2026-04-05T22:00:00"
    }
  },
  "message": "로그인이 완료되었습니다"
}
```

---

### 2️⃣ 강의 탐색 및 수강 신청

#### 전체 강의 목록 조회
```bash
curl -X GET "http://localhost:8080/api/courses?page=0&size=10&sort=createdAt,desc" \
  -H "Content-Type: application/json"
```

#### 카테고리별 강의 조회
```bash
curl -X GET "http://localhost:8080/api/courses/category/STOCK?page=0&size=10" \
  -H "Content-Type: application/json"
```

#### 강의 상세 조회
```bash
curl -X GET "http://localhost:8080/api/courses/1" \
  -H "Content-Type: application/json"
```

#### 수강 신청
```bash
curl -X POST "http://localhost:8080/api/enrollments" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": 1
  }'
```

**응답**:
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

---

### 3️⃣ 강의 진행 저장

#### 진행 상황 저장 (시청 중에 정기적으로 호출)
```bash
curl -X POST "http://localhost:8080/api/lecture-progress" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "lectureId": 5,
    "lastPosition": 1250
  }'
```

#### 진행 상황 조회 (영상 로드 시 마지막 위치 복원)
```bash
curl -X GET "http://localhost:8080/api/lecture-progress/lectures/5" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json"
```

**응답**:
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

### 4️⃣ 마이페이지 (내 수강 목록)

#### 내 수강 강의 목록
```bash
curl -X GET "http://localhost:8080/api/enrollments/my?page=0&size=10" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json"
```

**응답**:
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

#### 내 전체 진행 정보
```bash
curl -X GET "http://localhost:8080/api/lecture-progress/my" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json"
```

---

### 5️⃣ 강사 기능 (강의 등록)

#### 강사 회원가입
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

#### 강의 등록
```bash
curl -X POST "http://localhost:8080/api/courses" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "고급 주식 분석 기법",
    "description": "기술적 분석과 기본적 분석을 결합한 고급 주식 분석 방법을 배웁니다.",
    "category": "STOCK",
    "price": 49900,
    "thumbnailUrl": "https://example.com/course.jpg"
  }'
```

#### 강의 수정 (자신의 강의만)
```bash
curl -X PUT "http://localhost:8080/api/courses/3" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "고급 주식 분석 기법 - 개정판",
    "description": "기술적 분석과 기본적 분석을 결합한 고급 주식 분석 방법을 배웁니다. (개정판)",
    "category": "STOCK",
    "price": 59900,
    "thumbnailUrl": "https://example.com/course-v2.jpg"
  }'
```

---

## ⚡ 자주 묻는 질문

### Q1. 토큰이 만료되면?
**A.** `POST /auth/refresh` 엔드포인트에 refreshToken을 보내서 새 accessToken을 받으세요.

```bash
curl -X POST "http://localhost:8080/api/auth/refresh" \
  -H "X-Refresh-Token: {refreshToken}" \
  -H "Content-Type: application/json"
```

### Q2. 이메일 중복 확인하려면?
**A.** `GET /auth/check-email?email=user@example.com`으로 사전 확인 가능합니다.

### Q3. 강의를 수강 신청한 후 시청하는 방법?
**A.** 
1. 강의 상세 조회 → Section 정보 획득
2. 각 Lecture의 video_url에서 영상 재생
3. 정기적으로 `POST /lecture-progress` 호출 (10초~1분 간격 권장)

### Q4. 마지막 시청 위치 복원 방법?
**A.** 
1. 영상 로드 시 `GET /lecture-progress/lectures/{id}` 호출
2. 응답의 `lastPosition` 값으로 영상 시작 위치 설정

### Q5. 강사는 자신의 강의만 수정 가능?
**A.** 네, 시스템이 자동으로 권한을 검증합니다. 다른 강사의 강의는 수정할 수 없습니다.

### Q6. 에러 응답 형식?
**A.** 모든 에러는 data: null, message: 에러메시지로 반환됩니다.

---

## 📊 역할별 권한 매트릭스

| 기능 | STUDENT | TEACHER | ADMIN | 비로그인 |
|------|---------|---------|-------|---------|
| 회원가입 | ✅ | ✅ | ✅ | ✅ |
| 로그인 | ✅ | ✅ | ✅ | ✅ |
| 강의 목록 조회 | ✅ | ✅ | ✅ | ✅ |
| 강의 상세 조회 | ✅ | ✅ | ✅ | ✅ |
| 강의 등록 | ❌ | ✅ | ✅ | ❌ |
| 강의 수정 | ❌ | ✅ (자신만) | ✅ | ❌ |
| 강의 삭제 | ❌ | ✅ (자신만) | ✅ | ❌ |
| 수강 신청 | ✅ | ❌ | ❌ | ❌ |
| 내 수강 조회 | ✅ | ❌ | ❌ | ❌ |
| 진행 저장 | ✅ | ❌ | ❌ | ❌ |
| 진행 조회 | ✅ (자신만) | ❌ | ❌ | ❌ |

---

## 🔄 주요 API 플로우

### 학생 수강 플로우
```
회원가입 → 로그인 → 강의 검색 → 강의 상세 조회 → 수강 신청 
→ 내 수강 목록 → 영상 재생 → 진행 저장 → 완강 처리
```

### 강사 강의 등록 플로우
```
회원가입(TEACHER) → 로그인 → 강의 등록 → 강의 수정 → 강의 조회
```

---

## 🐛 일반적인 에러 및 해결법

| 에러 | 원인 | 해결 |
|------|------|------|
| 401 Unauthorized | 토큰 없음/만료 | 토큰 새로 발급 또는 갱신 |
| 403 Forbidden | 권한 부족 | 올바른 역할로 로그인 |
| 404 Not Found | 리소스 미존재 | 올바른 ID 확인 |
| 400 Bad Request | 유효성 검사 실패 | 요청 데이터 형식 확인 |
| 409 Conflict | 중복 데이터 | 다른 값으로 시도 |

---

## 📚 추가 리소스

- **상세 명세서**: `P1_API_SPECIFICATION.md`
- **구현 현황**: `P1_API_IMPLEMENTATION_STATUS.md`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8080/v3/api-docs`
- **Postman Collection**: `ChessMate_Auth_API.postman_collection.json`

---

## 📞 개발자 연락처

질문이 있으시면 Swagger UI 또는 명세서를 참고하세요.

**문서 버전**: v1.0  
**최종 업데이트**: 2026-04-05

