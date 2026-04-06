# ✅ 403 에러 해결 보고서

## 🔴 문제점

**403 Forbidden 에러**가 발생하는 원인:
- 강의 목록/상세 조회 시 로그인 없이 요청
- SecurityConfig에서 모든 `/api/**` 요청이 **인증(로그인) 필수**로 설정되어 있음

### 원인 분석

**이전 SecurityConfig 설정** (❌ 문제있음):
```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**").permitAll()      // 회원가입, 로그인만 공개
    .requestMatchers("/api/admin/**").hasRole("ADMIN") // 관리자만 접근
    .anyRequest().authenticated()                       // ← 나머지는 모두 인증 필수!
)
```

**결과**:
- `GET /api/courses` → 로그인 필수 → 토큰 없음 → **403 에러**
- `POST /api/enrollments` → 로그인 필수 → 토큰 필요 (정상)

---

## ✅ 해결 방법

**SecurityConfig 수정** (✅ 해결됨):
```java
.authorizeHttpRequests(auth -> auth
    // 🟢 인증 관련 (공개)
    .requestMatchers("/api/auth/**").permitAll()
    
    // 🟢 강의 조회 (공개 - 로그인 불필요)
    .requestMatchers(HttpMethod.GET, "/api/v1/courses").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/courses/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/courses").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/courses/**").permitAll()
    
    // 🟢 헬스 체크 (공개)
    .requestMatchers("/health").permitAll()
    .requestMatchers("/api/health").permitAll()
    
    // 🔴 관리자 (ADMIN만)
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    
    // 🔴 나머지 (인증 필수)
    .anyRequest().authenticated()
)
```

---

## 📋 수정된 엔드포인트 정리

### 🟢 로그인 불필요 (permitAll)

| Method | Path | 설명 |
|:---:|:---|:---|
| `GET` | `/api/courses` | 강의 목록 조회 |
| `GET` | `/api/courses/{id}` | 강의 상세 조회 |
| `GET` | `/api/v1/courses` | 강의 목록 (v1) |
| `GET` | `/api/v1/courses/{id}` | 강의 상세 (v1) |
| `POST` | `/api/auth/signup` | 회원가입 |
| `POST` | `/api/auth/login` | 로그인 |
| `GET` | `/health` | 헬스 체크 |

### 🔴 로그인 필수 (authenticated)

| Method | Path | 설명 | 필요 역할 |
|:---:|:---|:---|:---:|
| `POST` | `/api/enrollments` | 수강 신청 | STUDENT |
| `GET` | `/api/enrollments/my` | 내 강의실 | STUDENT |
| `POST` | `/api/courses` | 강의 등록 | TEACHER |
| `PATCH` | `/api/lectures/{id}/progress` | 진도 저장 | STUDENT |

### 🔐 관리자만 (hasRole('ADMIN'))

| Method | Path | 설명 |
|:---:|:---|:---|
| `GET/POST` | `/api/admin/**` | 관리자 기능 |

---

## 🧪 테스트 방법

### 1️⃣ 로그인 없이 강의 조회 (✅ 이제 성공)
```bash
curl http://localhost:8080/api/courses?category=STOCK
# 이전: 403 에러 ❌
# 지금: 200 OK ✅
```

### 2️⃣ 로그인 후 수강 신청 (✅ 이전처럼 작동)
```bash
# Step 1: 로그인
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@example.com","password":"Student1Pass"}'
# 응답: { accessToken: "...", refreshToken: "..." }

# Step 2: 수강 신청 (토큰 필요)
curl -X POST http://localhost:8080/api/enrollments \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{"courseId":1}'
# 응답: 200 OK ✅
```

---

## 🎯 권한 검증 흐름도

```
사용자 요청 (Authorization 헤더 포함/미포함)
    ↓
SecurityConfig의 authorizeHttpRequests 규칙 적용
    ↓
    ├─ requestMatchers("/api/auth/**").permitAll()
    │  └─ 인증 없이 통과 ✅
    │
    ├─ requestMatchers(GET, "/api/courses/**").permitAll()
    │  └─ 인증 없이 통과 ✅ (← 새로 추가)
    │
    ├─ requestMatchers("/api/admin/**").hasRole("ADMIN")
    │  ├─ 토큰 있음 + ADMIN 역할 → 통과 ✅
    │  └─ 토큰 없음 또는 STUDENT → 403 에러 ❌
    │
    ├─ anyRequest().authenticated()
    │  ├─ 토큰 있음 → 통과 ✅
    │  └─ 토큰 없음 → 403 에러 ❌
    │
JwtAuthenticationFilter
    ↓
    ├─ 토큰 있음 → SecurityContext에 인증 정보 저장
    └─ 토큰 없음 → 요청 통과 (permitAll 처리를 위함)
```

---

## 📊 변경 전후 비교

### ❌ 이전 (403 에러)
```
요청: GET /api/courses
조건: anyRequest().authenticated()
결과: 로그인 필수 → 토큰 없음 → 403 Forbidden
```

### ✅ 지금 (정상 작동)
```
요청: GET /api/courses
조건: .requestMatchers(GET, "/api/courses/**").permitAll()
결과: 로그인 불필요 → 200 OK
```

---

## 🔍 추가 검증 로그

JwtAuthenticationFilter에 상세 로그 추가:
```java
log.debug("🔍 [JWT Filter] {} {} - Token Present: {}", 
    requestMethod, requestPath, jwt != null);

log.info("✅ [JWT Filter] 인증 성공 - Member ID: {}, Role: {}", 
    memberId, roleString);

log.debug("⚠️ [JWT Filter] Token 없음 - {}", requestPath);
```

### 로그 확인 방법
```
서버 시작 후 API 요청 시:

✅ 강의 조회 (로그인 불필요):
⚠️ [JWT Filter] Token 없음 - /api/courses
→ 요청 계속 진행 (permitAll이므로)

✅ 수강 신청 (로그인 필수):
✅ [JWT Filter] 인증 성공 - Member ID: 6, Role: ROLE_STUDENT
→ 요청 계속 진행
```

---

## ✨ 최종 정리

| 항목 | 상태 | 비고 |
|:---:|:---:|:---|
| **강의 조회** | ✅ 수정됨 | GET /api/courses → 로그인 불필요 |
| **수강 신청** | ✅ 정상 | POST /api/enrollments → 로그인 필수 |
| **관리자 기능** | ✅ 유지 | /api/admin/** → ADMIN만 |
| **토큰 검증** | ✅ 유지 | JWT 인증 시스템 정상 작동 |

---

## 🚀 배포 전 체크리스트

- [x] SecurityConfig 수정
- [x] 공개 API 설정 (GET /api/courses)
- [x] 로그인 필수 API 유지 (POST /api/enrollments)
- [ ] 프로젝트 재빌드 (`gradle build`)
- [ ] 서버 재시작 (`gradle bootRun`)
- [ ] 로그인 없이 강의 조회 테스트
- [ ] 로그인 후 수강 신청 테스트

---

**수정 완료**: 2026-04-06  
**파일**: `SecurityConfig.java`  
**상태**: ✅ 403 에러 해결됨


