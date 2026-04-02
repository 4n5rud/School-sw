# 🧪 ChessMate API 테스트 시나리오 및 검증 가이드

**버전**: 1.0  
**작성일**: 2026-04-02  
**목표**: 실제 사용자 시나리오를 기반으로 API 동작 검증

---

## 📑 목차

1. [테스트 환경 구성](#테스트-환경-구성)
2. [페르소나별 테스트 시나리오](#페르소나별-테스트-시나리오)
3. [단계별 테스트 수행](#단계별-테스트-수행)
4. [예상 결과 및 검증](#예상-결과-및-검증)
5. [오류 케이스 테스트](#오류-케이스-테스트)
6. [성능 테스트](#성능-테스트)
7. [테스트 체크리스트](#테스트-체크리스트)

---

## 테스트 환경 구성

### 사전 요구사항

```bash
# 1. Java 17 설치 확인
java -version

# 2. MySQL 실행 (또는 H2 메모리 DB)
# application.yml에서 H2 사용 중

# 3. IDE 실행
# IntelliJ IDEA 또는 VS Code

# 4. Postman 설치
# https://www.postman.com/downloads/
```

### 애플리케이션 실행

```bash
# 터미널에서 프로젝트 루트 디렉토리로 이동
cd BE

# Gradle을 사용한 빌드 및 실행
./gradlew bootRun

# 또는 IDE에서 BeApplication.java 실행
# 기본 포트: 8080
```

### Postman Collection 설정

```json
// 환경 변수 설정
{
  "baseUrl": "http://localhost:8080/api",
  "accessToken": "",      // 로그인 후 자동 저장
  "refreshToken": "",     // 로그인 후 자동 저장
  "studentId": "",        // 학생 ID
  "teacherId": "",        // 강사 ID
  "courseId": ""          // 강의 ID
}
```

---

## 페르소나별 테스트 시나리오

### 📱 페르소나 1: 강사 - "김선생" (TEACHER)

#### 배경 및 목표

- **직업**: 금융 전문가
- **나이**: 35세
- **목표**: 자신의 주식 투자 강의를 플랫폼에 등록하고 학생들에게 판매
- **기술 수준**: 기술에 익숙함

#### 사용 흐름

```
1. 회원가입 (TEACHER 역할)
   ↓
2. 로그인
   ↓
3. 강의 등록 (주식 투자 기초)
   ↓
4. 강의 정보 확인
   ↓
5. 강의 수정 (가격 변경)
   ↓
6. 추가 강의 등록 (암호화폐 투자)
   ↓
7. 내 강의 목록 조회
   ↓
8. 강의 삭제
```

#### 상세 테스트 시나리오

##### 1️⃣ 회원가입

**Request**:
```bash
curl -X POST "http://localhost:8080/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kim.teacher@example.com",
    "password": "SecurePassword123!",
    "nickname": "김선생",
    "role": "TEACHER"
  }'
```

**Expected Response (200 OK)**:
```json
{
  "data": {
    "id": 1,
    "email": "kim.teacher@example.com",
    "nickname": "김선생",
    "role": "TEACHER"
  },
  "message": "회원가입이 완료되었습니다"
}
```

**검증 항목**:
- ✅ ID가 생성되었는가? (id: 1)
- ✅ 비밀번호가 평문으로 저장되지 않았는가? (응답에 비밀번호 없음)
- ✅ role이 "TEACHER"로 저장되었는가?

---

##### 2️⃣ 로그인

**Request**:
```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kim.teacher@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response (200 OK)**:
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sZSI6IlRFQUNIRVIiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDA3MDgwMH0.signature_here",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sZSI6IlRFQUNIRVIiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDY3MjAwMH0.signature_here",
    "member": {
      "id": 1,
      "email": "kim.teacher@example.com",
      "nickname": "김선생",
      "role": "TEACHER"
    }
  },
  "message": "로그인이 완료되었습니다"
}
```

**검증 항목**:
- ✅ accessToken이 유효한 JWT 형식인가? (3개의 점으로 구분된 부분)
- ✅ refreshToken이 발급되었는가?
- ✅ member 정보가 올바른가?
- ✅ 토큰을 Postman 환경 변수에 저장할 수 있는가?

**Postman 자동 저장 스크립트** (Tests 탭):
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("accessToken", jsonData.data.accessToken);
    pm.environment.set("refreshToken", jsonData.data.refreshToken);
    pm.environment.set("teacherId", jsonData.data.member.id);
}
```

---

##### 3️⃣ 강의 등록

**Request**:
```bash
curl -X POST "http://localhost:8080/api/courses" \
  -H "Authorization: Bearer {{accessToken}}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "주식 투자 기초",
    "description": "초보자를 위한 주식 투자 완벽 가이드. 기본 개념부터 실제 투자까지 배워봅시다.",
    "category": "STOCK",
    "price": 29900,
    "thumbnailUrl": "https://example.com/stock-basic.jpg"
  }'
```

**Expected Response (201 Created)**:
```json
{
  "data": {
    "id": 1,
    "title": "주식 투자 기초",
    "description": "초보자를 위한 주식 투자 완벽 가이드. 기본 개념부터 실제 투자까지 배워봅시다.",
    "category": "STOCK",
    "price": 29900,
    "thumbnailUrl": "https://example.com/stock-basic.jpg",
    "instructor": {
      "id": 1,
      "email": "kim.teacher@example.com",
      "nickname": "김선생",
      "role": "TEACHER"
    },
    "studentCount": 0,
    "createdAt": "2026-04-02T10:30:00"
  },
  "message": "강의가 등록되었습니다"
}
```

**검증 항목**:
- ✅ HTTP 상태 코드가 201인가?
- ✅ instructor_id가 자신의 ID(1)로 저장되었는가?
- ✅ studentCount가 0인가? (아직 수강생 없음)
- ✅ courseId를 환경 변수에 저장할 수 있는가?

**Postman 자동 저장 스크립트**:
```javascript
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("courseId", jsonData.data.id);
}
```

---

##### 4️⃣ 강의 상세 조회

**Request**:
```bash
curl -X GET "http://localhost:8080/api/courses/1" \
  -H "Authorization: Bearer {{accessToken}}"
```

**Expected Response (200 OK)**:
```json
{
  "data": {
    "id": 1,
    "title": "주식 투자 기초",
    "description": "초보자를 위한 주식 투자 완벽 가이드. 기본 개념부터 실제 투자까지 배워봅시다.",
    "category": "STOCK",
    "price": 29900,
    "thumbnailUrl": "https://example.com/stock-basic.jpg",
    "instructor": {
      "id": 1,
      "email": "kim.teacher@example.com",
      "nickname": "김선생",
      "role": "TEACHER"
    },
    "studentCount": 0,
    "createdAt": "2026-04-02T10:30:00"
  },
  "message": "Success"
}
```

**검증 항목**:
- ✅ 강의 정보가 등록한 내용과 일치하는가?
- ✅ 강사 정보가 정상적으로 로드되었는가?

---

##### 5️⃣ 강의 수정

**Request**:
```bash
curl -X PUT "http://localhost:8080/api/courses/1" \
  -H "Authorization: Bearer {{accessToken}}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "주식 투자 기초 - 개정판",
    "description": "초보자를 위한 주식 투자 완벽 가이드 (2026년 최신 정보 반영)",
    "price": 34900,
    "thumbnailUrl": "https://example.com/stock-basic-v2.jpg"
  }'
```

**Expected Response (200 OK)**:
```json
{
  "data": {
    "id": 1,
    "title": "주식 투자 기초 - 개정판",
    "description": "초보자를 위한 주식 투자 완벽 가이드 (2026년 최신 정보 반영)",
    "category": "STOCK",  // 변경 불가
    "price": 34900,       // 변경됨
    "thumbnailUrl": "https://example.com/stock-basic-v2.jpg",
    "instructor": { ... },
    "studentCount": 0,
    "createdAt": "2026-04-02T10:30:00"
  },
  "message": "강의가 수정되었습니다"
}
```

**검증 항목**:
- ✅ 제목이 "주식 투자 기초 - 개정판"으로 변경되었는가?
- ✅ 가격이 34900으로 변경되었는가?
- ✅ category는 여전히 "STOCK"인가? (수정 불가)
- ✅ createdAt은 변경되지 않았는가?

---

##### 6️⃣ 다른 강사의 강의 수정 시도 (오류 케이스)

**이 단계 전에 다른 강사로 로그인해야 함**

**Request**:
```bash
# 강사2로 로그인한 후 (token2 = 강사2의 토큰)
curl -X PUT "http://localhost:8080/api/courses/1" \
  -H "Authorization: Bearer {{token2}}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "수정된 강의",
    "description": "...",
    "price": 9900,
    "thumbnailUrl": "..."
  }'
```

**Expected Response (403 Forbidden)**:
```json
{
  "data": null,
  "message": "자신의 강의만 수정할 수 있습니다"
}
```

**검증 항목**:
- ✅ HTTP 상태 코드가 403인가?
- ✅ 오류 메시지가 명확한가?
- ✅ 강의가 수정되지 않았는가?

---

##### 7️⃣ 강의 삭제

**Request**:
```bash
curl -X DELETE "http://localhost:8080/api/courses/1" \
  -H "Authorization: Bearer {{accessToken}}"
```

**Expected Response (200 OK)**:
```json
{
  "data": null,
  "message": "강의가 삭제되었습니다"
}
```

**검증 항목**:
- ✅ HTTP 상태 코드가 200인가?
- ✅ 강의가 실제로 삭제되었는가? (재조회 시 404)

**확인 쿼리**:
```bash
curl -X GET "http://localhost:8080/api/courses/1" \
  -H "Authorization: Bearer {{accessToken}}"

# Expected: 404 Not Found
# {
#   "data": null,
#   "message": "강의를 찾을 수 없습니다"
# }
```

---

### 📚 페르소나 2: 학생 - "이학생" (STUDENT)

#### 배경 및 목표

- **직업**: 직장인
- **나이**: 28세
- **목표**: 주식과 암호화폐 투자를 배워서 자산을 증식
- **기술 수준**: 기술에 어느 정도 익숙함

#### 사용 흐름

```
1. 회원가입 (STUDENT 역할)
   ↓
2. 로그인
   ↓
3. 전체 강의 목록 조회
   ↓
4. STOCK 카테고리 강의 조회
   ↓
5. 특정 강의 상세 조회
   ↓
6. 강의 수강 등록
   ↓
7. 내 수강 목록 조회
   ↓
8. 강의 진행 상황 저장 (진도 기록)
```

#### 상세 테스트 시나리오

##### 1️⃣ 회원가입

**Request**:
```bash
curl -X POST "http://localhost:8080/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "MyPassword456!",
    "nickname": "이학생",
    "role": "STUDENT"
  }'
```

**Expected Response (200 OK)**:
```json
{
  "data": {
    "id": 2,
    "email": "student@example.com",
    "nickname": "이학생",
    "role": "STUDENT"
  },
  "message": "회원가입이 완료되었습니다"
}
```

**검증 항목**:
- ✅ 새로운 ID(2)가 생성되었는가?
- ✅ role이 "STUDENT"인가?

---

##### 2️⃣ 로그인

**Request**:
```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "MyPassword456!"
  }'
```

**Expected Response (200 OK)**:
```json
{
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "member": {
      "id": 2,
      "email": "student@example.com",
      "nickname": "이학생",
      "role": "STUDENT"
    }
  },
  "message": "로그인이 완료되었습니다"
}
```

---

##### 3️⃣ 전체 강의 목록 조회

**Request**:
```bash
curl -X GET "http://localhost:8080/api/courses?page=0&size=10&sort=id,desc" \
  -H "Authorization: Bearer {{accessToken}}"
```

**Expected Response (200 OK)**:
```json
{
  "data": {
    "content": [
      {
        "id": 2,
        "title": "암호화폐 투자 전략",
        "description": "비트코인과 이더리움 투자 전략",
        "category": "CRYPTO",
        "price": 39900,
        "instructor": { ... },
        "studentCount": 0,
        "createdAt": "2026-04-02T11:00:00"
      },
      {
        "id": 1,
        "title": "주식 투자 기초",
        "description": "초보자를 위한 주식 투자 완벽 가이드",
        "category": "STOCK",
        "price": 29900,
        "instructor": { ... },
        "studentCount": 0,
        "createdAt": "2026-04-02T10:30:00"
      }
    ],
    "pageable": { ... },
    "totalPages": 1,
    "totalElements": 2,
    "numberOfElements": 2
  },
  "message": "Success"
}
```

**검증 항목**:
- ✅ 모든 강의가 조회되었는가?
- ✅ 페이지네이션 정보가 정상인가?
- ✅ 강사 정보가 포함되었는가?
- ✅ studentCount가 0인가? (아직 수강생 없음)

---

##### 4️⃣ 카테고리별 강의 조회

**Request**:
```bash
curl -X GET "http://localhost:8080/api/courses/category/STOCK?page=0&size=10" \
  -H "Authorization: Bearer {{accessToken}}"
```

**Expected Response (200 OK)**:
```json
{
  "data": {
    "content": [
      {
        "id": 1,
        "title": "주식 투자 기초",
        "category": "STOCK",
        ...
      }
    ],
    "totalElements": 1
  },
  "message": "Success"
}
```

**검증 항목**:
- ✅ STOCK 카테고리의 강의만 조회되었는가?
- ✅ CRYPTO 강의는 없는가?

---

##### 5️⃣ 강의 수강 등록

**Request**:
```bash
curl -X POST "http://localhost:8080/api/enrollments" \
  -H "Authorization: Bearer {{accessToken}}" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": 1
  }'
```

**Expected Response (201 Created)**:
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

**검증 항목**:
- ✅ HTTP 상태 코드가 201인가?
- ✅ enrolledAt이 현재 시간인가?
- ✅ isCompleted가 false인가?
- ✅ enrollmentId를 환경 변수에 저장할 수 있는가?

---

##### 6️⃣ 강의 수강 중 등록 시도 (오류 케이스)

**Request**:
```bash
curl -X POST "http://localhost:8080/api/enrollments" \
  -H "Authorization: Bearer {{accessToken}}" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": 1
  }'
```

**Expected Response (409 Conflict 또는 400 Bad Request)**:
```json
{
  "data": null,
  "message": "이미 수강 등록한 강의입니다"
}
```

**검증 항목**:
- ✅ 중복 수강 등록이 거부되었는가?
- ✅ 명확한 오류 메시지가 반환되었는가?

---

##### 7️⃣ 내 수강 목록 조회

**Request**:
```bash
curl -X GET "http://localhost:8080/api/enrollments/my?page=0&size=10" \
  -H "Authorization: Bearer {{accessToken}}"
```

**Expected Response (200 OK)**:
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
    "totalElements": 1
  },
  "message": "Success"
}
```

**검증 항목**:
- ✅ 자신이 등록한 강의만 조회되었는가?
- ✅ 다른 학생의 수강 정보는 없는가?

---

##### 8️⃣ 강의 진행 상황 저장

**Request**:
```bash
curl -X POST "http://localhost:8080/api/lectures/1/progress" \
  -H "Authorization: Bearer {{accessToken}}" \
  -H "Content-Type: application/json" \
  -d '{
    "lastPosition": 300
  }'
```

**Expected Response (200 OK)**:
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

**검증 항목**:
- ✅ lastPosition이 300으로 저장되었는가?
- ✅ updatedAt이 현재 시간인가?

---

##### 9️⃣ 강의 등록 시도 (권한 오류)

**Request**:
```bash
curl -X POST "http://localhost:8080/api/courses" \
  -H "Authorization: Bearer {{accessToken}}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "학생이 만든 강의",
    "description": "...",
    "category": "STOCK",
    "price": 9900,
    "thumbnailUrl": "..."
  }'
```

**Expected Response (403 Forbidden)**:
```json
{
  "data": null,
  "message": "강사만 강의를 등록할 수 있습니다"
}
```

**검증 항목**:
- ✅ HTTP 상태 코드가 403인가?
- ✅ 강의가 등록되지 않았는가?

---

## 단계별 테스트 수행

### Step 1: 기본 기능 테스트

```
┌──────────────────────────────────────────┐
│   1. 회원가입 (TEACHER)                   │
│   ✓ 성공                                  │
│   ✓ 이메일 중복 검증                     │
│   ✓ 비밀번호 암호화                      │
└────────┬─────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│   2. 로그인                                │
│   ✓ 토큰 발급 (Access + Refresh)         │
│   ✓ 사용자 정보 반환                      │
└────────┬─────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│   3. 강의 CRUD                             │
│   ✓ 강의 등록                             │
│   ✓ 강의 조회                             │
│   ✓ 강의 수정                             │
│   ✓ 강의 삭제                             │
└──────────────────────────────────────────┘
```

### Step 2: 권한 테스트

```
강사 (TEACHER)
├─ 자신의 강의 수정: ✓
├─ 자신의 강의 삭제: ✓
├─ 다른 강사 강의 수정: ✗ (403)
└─ 강의 등록: ✓

학생 (STUDENT)
├─ 강의 조회: ✓
├─ 강의 등록: ✗ (403)
├─ 수강 등록: ✓
└─ 내 수강 목록: ✓
```

### Step 3: 토큰 테스트

```
┌─────────────────────────────────────────┐
│   Token Lifecycle                        │
├─────────────────────────────────────────┤
│   1. Access Token 발급                   │
│      - 유효시간: 1시간                   │
│   2. API 호출 (Authorization 헤더)      │
│      - 유효한 토큰: 성공                 │
│   3. Token 만료 후 API 호출              │
│      - 401 Unauthorized                  │
│   4. Refresh Token으로 재발급            │
│      - 새로운 Access Token 받기         │
│   5. 새 Token으로 API 호출               │
│      - 성공                              │
└─────────────────────────────────────────┘
```

---

## 예상 결과 및 검증

### 성공 케이스 검증 매트릭스

| 테스트 항목 | 예상 결과 | 검증 방법 | 상태 |
|-----------|---------|---------|------|
| 회원가입 | 200 OK | 응답 코드 확인 | [ ] |
| 이메일 중복 검증 | 400 Bad Request | 오류 메시지 | [ ] |
| 로그인 | 200 OK + Token | JWT 구조 확인 | [ ] |
| 강의 등록 | 201 Created | DB 저장 확인 | [ ] |
| 강의 조회 | 200 OK | 강의 정보 일치 | [ ] |
| 강의 수정 | 200 OK | DB 업데이트 확인 | [ ] |
| 강의 삭제 | 200 OK | DB 삭제 확인 | [ ] |
| 권한 검증 | 403 Forbidden | 오류 메시지 | [ ] |
| 토큰 만료 | 401 Unauthorized | 오류 메시지 | [ ] |
| 페이지네이션 | 200 OK | 페이지 정보 확인 | [ ] |

---

## 오류 케이스 테스트

### 1️⃣ 인증 오류

#### 1.1 토큰 없이 API 호출

**Request**:
```bash
curl -X GET "http://localhost:8080/api/courses"
# Authorization 헤더 없음
```

**Expected Response (401 Unauthorized)**:
```json
{
  "data": null,
  "message": "유효한 토큰이 필요합니다"
}
```

---

#### 1.2 만료된 토큰으로 API 호출

**요청 시간**: Access Token 만료 후 1시간 경과

**Request**:
```bash
curl -X GET "http://localhost:8080/api/courses" \
  -H "Authorization: Bearer {expired_token}"
```

**Expected Response (401 Unauthorized)**:
```json
{
  "data": null,
  "message": "토큰이 만료되었습니다. 다시 로그인해주세요"
}
```

---

#### 1.3 조작된 토큰으로 API 호출

**Request**:
```bash
curl -X GET "http://localhost:8080/api/courses" \
  -H "Authorization: Bearer {modified_token}"
```

**Expected Response (401 Unauthorized)**:
```json
{
  "data": null,
  "message": "유효하지 않은 토큰입니다"
}
```

---

### 2️⃣ 검증 오류

#### 2.1 필수 필드 누락

**Request**:
```bash
curl -X POST "http://localhost:8080/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
    // password, nickname, role 누락
  }'
```

**Expected Response (400 Bad Request)**:
```json
{
  "data": null,
  "message": "입력값 검증 실패: password: 비밀번호는 필수입니다, nickname: 닉네임은 필수입니다, role: 역할은 필수입니다"
}
```

---

#### 2.2 이메일 형식 오류

**Request**:
```bash
curl -X POST "http://localhost:8080/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",  // @ 기호 없음
    "password": "SecurePassword123",
    "nickname": "Test",
    "role": "STUDENT"
  }'
```

**Expected Response (400 Bad Request)**:
```json
{
  "data": null,
  "message": "입력값 검증 실패: email: 유효한 이메일 형식이 아닙니다"
}
```

---

#### 2.3 역할 값 오류

**Request**:
```bash
curl -X POST "http://localhost:8080/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123",
    "nickname": "Test",
    "role": "INVALID_ROLE"  // 유효하지 않은 역할
  }'
```

**Expected Response (400 Bad Request)**:
```json
{
  "data": null,
  "message": "입력값 검증 실패: role: 역할은 STUDENT, TEACHER, ADMIN 중 하나여야 합니다"
}
```

---

### 3️⃣ 비즈니스 로직 오류

#### 3.1 이메일 중복

**Request**:
```bash
# 첫 번째 회원가입 (성공)
curl -X POST "http://localhost:8080/api/auth/signup" \
  -d '{"email": "duplicate@example.com", ...}'

# 같은 이메일로 재가입 (실패)
curl -X POST "http://localhost:8080/api/auth/signup" \
  -d '{"email": "duplicate@example.com", ...}'
```

**Expected Response (400 Bad Request)**:
```json
{
  "data": null,
  "message": "이미 사용 중인 이메일입니다: duplicate@example.com"
}
```

---

#### 3.2 존재하지 않는 강의 조회

**Request**:
```bash
curl -X GET "http://localhost:8080/api/courses/99999" \
  -H "Authorization: Bearer {{accessToken}}"
```

**Expected Response (404 Not Found)**:
```json
{
  "data": null,
  "message": "강의를 찾을 수 없습니다"
}
```

---

#### 3.3 다른 강사의 강의 수정 시도

**Request**:
```bash
# 강사1이 강사2의 강의 수정 시도
curl -X PUT "http://localhost:8080/api/courses/2" \
  -H "Authorization: Bearer {{teacher1_token}}" \
  -d '{
    "title": "수정된 제목",
    ...
  }'
```

**Expected Response (403 Forbidden)**:
```json
{
  "data": null,
  "message": "자신의 강의만 수정할 수 있습니다"
}
```

---

### 4️⃣ 권한 오류

#### 4.1 학생이 강의 등록 시도

**Request**:
```bash
curl -X POST "http://localhost:8080/api/courses" \
  -H "Authorization: Bearer {{student_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "학생이 만든 강의",
    ...
  }'
```

**Expected Response (403 Forbidden)**:
```json
{
  "data": null,
  "message": "강사만 강의를 등록할 수 있습니다"
}
```

---

## 성능 테스트

### 1️⃣ 대규모 데이터셋 테스트

#### 목표
> 1000개의 강의가 있을 때 페이지네이션이 정상 작동하는지 확인

#### 준비
```sql
-- 샘플 데이터 1000개 삽입
INSERT INTO course (title, description, category, price, instructor_id)
SELECT 
  CONCAT('강의 ', seq),
  'Sample description',
  CASE WHEN seq % 2 = 0 THEN 'STOCK' ELSE 'CRYPTO' END,
  (seq * 1000) % 100000,
  1
FROM (
  SELECT @seq := @seq + 1 AS seq
  FROM (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) t1,
       (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) t2,
       (SELECT @seq := 0) t3
) numbers
WHERE seq <= 1000;
```

#### 테스트 케이스

```bash
# 페이지 1 (0-9)
curl -X GET "http://localhost:8080/api/courses?page=0&size=10"

# 페이지 50 (490-499)
curl -X GET "http://localhost:8080/api/courses?page=49&size=10"

# 페이지 100 (990-999)
curl -X GET "http://localhost:8080/api/courses?page=99&size=10"
```

#### 검증 항목

- ✅ 응답 시간이 1초 이내인가?
- ✅ 메모리 누수가 없는가?
- ✅ totalPages가 100인가?
- ✅ 정렬이 정상 작동하는가?

---

### 2️⃣ 동시 요청 테스트

#### 목표
> 100개의 동시 요청을 처리할 수 있는지 확인

#### Apache JMeter 또는 Locust를 사용한 테스트

```bash
# Postman Collection Runner 사용
# 또는 Apache JMeter로 다음 설정:
# - Thread count: 100
# - Ramp-up period: 10초
# - Loop count: 1

# 기대 결과:
# - 모든 요청이 성공 (200, 201 상태 코드)
# - 응답 시간 평균 < 500ms
# - 에러율 < 1%
```

---

### 3️⃣ 부하 테스트

#### 목표
> 시스템의 최대 처리량 확인

```bash
# 지속적인 요청 (30분)
# - 초당 요청 수: 10
# - 총 요청: 18,000

# 기대 결과:
# - 성공률 > 99%
# - 응답 시간 > 2초인 요청 < 5%
# - 메모리 누수 없음
```

---

## 테스트 체크리스트

### 기본 기능 테스트

- [ ] **회원가입**
  - [ ] 정상 회원가입
  - [ ] 이메일 중복 검증
  - [ ] 비밀번호 암호화 확인
  - [ ] 역할별 회원가입 (STUDENT, TEACHER)

- [ ] **로그인**
  - [ ] 정상 로그인
  - [ ] JWT 토큰 발급 (Access + Refresh)
  - [ ] 토큰 만료 시간 확인
  - [ ] 잘못된 비밀번호 거부

- [ ] **강의 관리**
  - [ ] 강의 등록 (강사만)
  - [ ] 강의 조회 (모두)
  - [ ] 강의 목록 조회 (페이지네이션)
  - [ ] 카테고리별 강의 조회
  - [ ] 강사별 강의 조회
  - [ ] 강의 수정 (강사 권한)
  - [ ] 강의 삭제 (강사 권한)

### 권한 테스트

- [ ] **강사 권한**
  - [ ] 자신의 강의 수정 가능
  - [ ] 자신의 강의 삭제 가능
  - [ ] 다른 강사 강의 수정 불가 (403)
  - [ ] 다른 강사 강의 삭제 불가 (403)

- [ ] **학생 권한**
  - [ ] 강의 조회 가능
  - [ ] 강의 등록 불가 (403)
  - [ ] 수강 등록 가능
  - [ ] 내 수강 목록 조회 가능

### 토큰 테스트

- [ ] **Access Token**
  - [ ] 1시간 유효시간
  - [ ] 만료 후 401 오류
  - [ ] Refresh Token으로 재발급

- [ ] **Refresh Token**
  - [ ] 7일 유효시간
  - [ ] 유효한 Refresh Token으로 새 토큰 발급
  - [ ] 만료된 Refresh Token 거부

### 검증 테스트

- [ ] **입력값 검증**
  - [ ] 필수 필드 누락
  - [ ] 이메일 형식 오류
  - [ ] 패스워드 길이 오류
  - [ ] 역할 값 오류
  - [ ] 가격 범위 오류

### 오류 처리 테스트

- [ ] **HTTP 상태 코드**
  - [ ] 200 OK (성공)
  - [ ] 201 Created (생성)
  - [ ] 400 Bad Request (검증 실패)
  - [ ] 401 Unauthorized (인증 실패)
  - [ ] 403 Forbidden (권한 없음)
  - [ ] 404 Not Found (리소스 없음)

- [ ] **오류 메시지**
  - [ ] 명확한 오류 메시지
  - [ ] 오류 메시지 일관성
  - [ ] 민감한 정보 제외

### 성능 테스트

- [ ] **응답 시간**
  - [ ] 단일 요청 < 500ms
  - [ ] 목록 조회 (10개) < 1초
  - [ ] 목록 조회 (100개) < 2초

- [ ] **동시성**
  - [ ] 100개 동시 요청 성공
  - [ ] 메모리 누수 없음

### 데이터 일관성 테스트

- [ ] **데이터 저장**
  - [ ] 회원 정보 정상 저장
  - [ ] 강의 정보 정상 저장
  - [ ] instructor_id 정상 저장

- [ ] **데이터 조회**
  - [ ] 강사 정보 정상 로드
  - [ ] 순환 참조 없음
  - [ ] Lazy Loading 정상 작동

---

## 최종 검증

모든 테스트를 완료한 후 다음을 확인하세요:

```
┌─────────────────────────────────────────┐
│         최종 검증 체크리스트             │
├─────────────────────────────────────────┤
│ ✓ 기본 기능 테스트: 100% 통과           │
│ ✓ 권한 테스트: 100% 통과               │
│ ✓ 토큰 테스트: 100% 통과               │
│ ✓ 검증 테스트: 100% 통과               │
│ ✓ 오류 처리 테스트: 100% 통과          │
│ ✓ 성능 테스트: 통과                    │
│                                        │
│ → 프로덕션 배포 가능                    │
└─────────────────────────────────────────┘
```

---

**문의사항**: 테스트 중 문제가 발생하면 개발팀에 보고하세요.

**마지막 수정**: 2026-04-02

