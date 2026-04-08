# 📚 FE 수강신청 통합 구현 가이드

## 🎯 목표

이 문서는 로그인부터 수강신청까지의 **전체 프론트엔드 구현**을 설명합니다.  
가이드를 따르면 JWT 기반 인증과 토큰 만료 처리가 자동으로 수행됩니다.

---

## 📋 목차

1. [시스템 아키텍처](#시스템-아키텍처)
2. [로그인 구현 상태](#로그인-구현-상태)
3. [수강신청 구현 상태](#수강신청-구현-상태)
4. [에러 처리](#에러-처리)
5. [토크큰 관리](#토큰-관리)
6. [테스트 가이드](#테스트-가이드)

---

## 시스템 아키텍처

### 전체 흐름도

```
┌─────────────┐
│   사용자    │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│  로그인 페이지       │ (app/auth/login/page.tsx)
└────────────┬─────────┘
             │
             ▼
    ┌────────────────┐
    │ API 요청       │◀─── POST /api/auth/login
    │ jwt 토큰 발급  │        {email, password}
    └────────┬───────┘
             │
             ▼
    ┌────────────────────────┐
    │ 토큰 저장               │
    │ localStorage에 저장:    │
    │ - accessToken          │
    │ - refreshToken         │
    │ - user (JSON)          │
    └────────┬───────────────┘
             │
             ▼
    ┌─────────────────────┐
    │ AuthContext 업데이트 │
    │ user 정보 반영       │
    └────────┬────────────┘
             │
             ▼
    ┌──────────────────┐
    │ 강의 목록 페이지  │ 이동
    └──────────────────┘
             │
             ├─────────────────┐
             │                 │
             ▼                 ▼
    ┌──────────────┐    ┌──────────────┐
    │ 강의 카드    │    │ 강의 상세 페이지
    │ 클릭         │    │ 수강신청 버튼
    └──────┬───────┘    └──────┬───────┘
           │                   │
           └─────────┬─────────┘
                     │
                     ▼
          ┌────────────────────────┐
          │ 수강 신청 요청          │
          │ Authorization 헤더:    │
          │ Bearer {accessToken}   │
          └────────┬───────────────┘
                   │
                   ▼
          ┌────────────────────┐
          │ 성공/실패 처리     │
          │ - 409: 중복 등록   │
          │ - 401: 토큰 만료   │
          │ - 403: 강의 없음   │
          └────────────────────┘
```

---

## 로그인 구현 상태

### ✅ 구현됨

#### 1. 로그인 페이지 (`app/auth/login/page.tsx`)

```typescript
// 사용자 입력받기
const [formData, setFormData] = useState<LoginRequest>({
  email: '',
  password: '',
});

// 로그인 요청
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    // POST /api/auth/login 호출
    await authService.login(formData);
    
    // ✨ 토큰 자동 저장 (authService에서 처리)
    // localStorage:
    // - accessToken
    // - refreshToken  
    // - user (JSON)
    
    refreshUser(); // AuthContext 업데이트
    router.push('/'); // 메인 페이지로 이동
  } catch (err) {
    setError(err.message || '로그인 실패');
  }
};
```

#### 2. 토큰 저장 (`lib/api/authService.ts`)

```typescript
private saveAuthData(data: LoginResponse): void {
  if (typeof window === 'undefined') return;
  
  // ✨ 1️⃣ accessToken 저장
  localStorage.setItem(this.ACCESS_TOKEN_KEY, data.accessToken);
  
  // ✨ 2️⃣ refreshToken 저장
  localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
  
  // ✨ 3️⃣ 사용자 정보 저장
  localStorage.setItem(this.USER_KEY, JSON.stringify(data.member));
}
```

#### 3. AuthContext (`lib/context/AuthContext.tsx`)

```typescript
// 로그인 상태 관리
interface AuthContextType {
  user: UserInfo | null;          // 사용자 정보
  isLoggedIn: boolean;            // 로그인 여부
  isLoading: boolean;             // 로드 중 상태
  logout: () => void;             // 로그아웃
  refreshUser: () => void;        // 사용자 정보 새로고침
  hasValidToken: () => boolean;   // 유효한 토큰 확인
}

// 사용방법
const { user, isLoggedIn } = useAuth();

if (isLoggedIn) {
  // 로그인된 상태
} else {
  // 로그아웃된 상태
}
```

---

## 수강신청 구현 상태

### ✅ 구현됨

#### 1. 수강신청 버튼 (강의 상세 페이지)

```typescript
// app/courses/[id]/page.tsx

const handleEnroll = async () => {
  // 1️⃣ 로그인 확인
  if (!isLoggedIn) {
    alert('로그인 후 수강 신청이 가능합니다');
    router.push('/auth/login');
    return;
  }

  try {
    setIsEnrolling(true);
    
    // 2️⃣ 수강 신청 API 호출
    // POST /api/enrollments
    // Authorization: Bearer {accessToken} (자동 포함)
    await enrollmentService.enrollCourse(courseId);
    
    // 3️⃣ 성공 처리
    setEnrollSuccess(true);
    alert('수강 신청이 완료되었습니다!');
  } catch (err: any) {
    // 4️⃣ 에러 처리 (아래 에러 처리 섹션 참고)
    handleEnrollmentError(err);
  } finally {
    setIsEnrolling(false);
  }
};
```

#### 2. Authorization 헤더 자동 포함 (`lib/api/client.ts`)

```typescript
private getHeaders(includeAuth: boolean = false): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // 인증이 필요한 경우 Authorization 헤더 추가
  if (includeAuth) {
    const token = this.getAccessToken();
    if (token) {
      // ⭐ Bearer {token} 형식
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// 수강신청 호출
async enrollCourse(data: EnrollmentCreateRequest): Promise<ApiResponse<Enrollment>> {
  return this.makeRequest<Enrollment>('/enrollments', {
    method: 'POST',
    body: JSON.stringify(data),
    includeAuth: true,  // ✨ 자동으로 Authorization 헤더 추가
  });
}
```

#### 3. 응답 처리 (`lib/api/enrollmentService.ts`)

```typescript
async enrollCourse(courseId: number): Promise<Enrollment> {
  const data: EnrollmentCreateRequest = { courseId };
  const response = await apiClient.enrollCourse(data);
  return response.data;
}
```

**응답 구조:**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "memberId": 1,
    "courseId": 1,
    "courseName": "주식 초보자를 위한 기초 강좌",
    "enrolledAt": "2026-04-08T20:13:00",
    "isCompleted": false
  },
  "message": "수강 등록이 완료되었습니다",
  "timestamp": "2026-04-08T20:13:11"
}
```

---

## 에러 처리

### ✅ 구현된 에러처리

#### 1. 401 Unauthorized (토큰 만료)

**현상:** 토큰이 만료되었거나 유효하지 않음

**자동 처리 (`lib/api/client.ts`):**

```typescript
if (response.status === 401) {
  // 1️⃣ 토큰 삭제
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // 2️⃣ 로그인 페이지로 리다이렉트
  window.location.href = '/auth/login';
}
```

**메시지:** "로그인 정보가 만료되었습니다. 다시 로그인해주세요"

#### 2. 409 Conflict (중복 수강 등록)

**현상:** 이미 등록된 강의

**처리 (`app/courses/[id]/page.tsx`):**

```typescript
if (err.status === 409) {
  alert('이미 등록된 강의입니다');
}
```

#### 3. 403 Forbidden (강의 없음)

**현상:** 존재하지 않는 강의 ID

**처리 (`app/courses/[id]/page.tsx`):**

```typescript
if (err.status === 403) {
  alert('강의를 찾을 수 없습니다');
}
```

#### 4. 기타 에러

**처리:**

```typescript
alert(err.message || '수강 신청에 실패했습니다');
```

---

## 토큰 관리

### 📍 저장 위치

| 항목 | 저장소 | 키 | 내용 |
|------|--------|-----|------|
| Access Token | localStorage | `accessToken` | JWT 토큰 |
| Refresh Token | localStorage | `refreshToken` | 갱신용 토큰 |
| 사용자 정보 | localStorage | `user` | JSON 형식 |

### 🔄 토큰 갱신 (선택사항)

```typescript
// 만약 Refresh Token을 사용해야 한다면:
async refreshAccessToken(): Promise<string> {
  const response = await apiClient.refreshToken();
  // 새로운 토큰으로 저장
  this.saveAuthData(response.data);
  return response.data.accessToken;
}
```

### 🚪 로그아웃

```typescript
const handleLogout = () => {
  // 1️⃣ authService에서 토큰 삭제
  logout();
  
  // 2️⃣ AuthContext에서 사용자 정보 초기화
  // (자동으로 처리됨)
  
  // 3️⃣ 로그인 페이지로 리다이렉트
  router.push('/');
};
```

**삭제되는 데이터:**

```typescript
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
localStorage.removeItem('user');
```

---

## 테스트 가이드

### 🧪 로컬 테스트 시나리오

#### 1️⃣ 정상 로그인 → 수강신청

**단계:**

```bash
# 1. 로그인 페이지로 이동
http://localhost:3000/auth/login

# 2. 로그인 (테스트 계정)
email: student@example.com
password: password123

# 3. 콘솔 로그 확인 (F12 개발자도구)
[AuthContext] 초기 로드: { hasUser: true, hasToken: true }
[API Request] POST /auth/login
[API Response] Status: 200

# 4. 메인 페이지로 이동 확인
# 5. Header에 사용자 이름 표시 확인

# 6. 강의 선택 후 강의 상세 페이지 이동
# 7. "지금 수강하기" 버튼 클릭

# 8. 콘솔 로그 확인
[API Auth Check] POST /enrollments
  { hasToken: true, authHeader: '포함됨' }
[API Response] Status: 200
[수강신청 성공] 강의ID: 1

# 9. 성공 메시지 확인
```

#### 2️⃣ 토큰 만료 시뮬레이션

```bash
# 1. 브라우저 개발자도구 → 콘솔 열기 (F12)

# 2. 다음 명령어 실행하여 토큰 삭제
localStorage.removeItem('accessToken');

# 3. "지금 수강하기" 버튼 클릭

# 4. 콘솔 확인
[API Auth Check] POST /enrollments
  { hasToken: false, authHeader: '없음' }

# 5. 자동으로 로그인 페이지로 리다이렉트됨
# 6. 로그인 다시 필요
```

#### 3️⃣ 중복 수강

```bash
# 1. 첫 번째 수강신청 완료 후

# 2. 같은 강의 상세 페이지로 다시 이동

# 3. "지금 수강하기" 다시 클릭

# 4. 에러 메시지 확인
"이미 등록된 강의입니다"
```

### 📊 개발자도구 확인 방법

#### Network 탭

```
Methods     Host            Path                  Status
─────────────────────────────────────────────────
POST        localhost:8080  /api/auth/login       200 ✅
POST        localhost:8080  /api/enrollments      200 ✅
POST        localhost:8080  /api/enrollments      409 ❌ (중복)
POST        localhost:8080  /api/enrollments      401 ❌ (토큰없음)
```

#### Request Headers 확인

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### Response 확인

```json
{
  "success": true,
  "data": {
    "id": 5,
    "memberId": 1,
    "courseId": 1,
    "courseName": "주식 초보자를 위한 기초 강좌",
    "enrolledAt": "2026-04-08T20:13:00"
  },
  "message": "수강 등록이 완료되었습니다",
  "timestamp": "2026-04-08T20:13:11"
}
```

#### Console 탭 로그

```javascript
// 로그인 성공
[API Request] {"method":"POST","fullUrl":"http://localhost:8080/api/auth/login",...}
[API Response] Status: 200 {statusText:"OK",...}
[AuthContext] 초기 로드: {hasUser: true, hasToken: true}

// 수강신청 성공
[API Auth Check] POST /enrollments {hasToken: true, authHeader: "포함됨"}
[API Request] {"method":"POST","fullUrl":"http://localhost:8080/api/enrollments",...}
[API Response] Status: 200 {statusText:"OK",...}
[수강신청 성공] 강의ID: 1

// 토큰 만료 처리
[API Auth Check] POST /enrollments {hasToken: false, authHeader: "없음"}
[API Error Response] 401 {message: "토큰이 유효하지 않습니다", status: 401, ...}
[API Cleanup] 토큰 및 사용자 정보 삭제 완료
// → 자동으로 /auth/login으로 리다이렉트
```

---

## 📌 중요 요점 정리

### ✅ 반드시 확인해야 할 것

1. **로그인 성공 후**
   - [ ] localStorage에 accessToken 저장됨
   - [ ] localStorage에 user 정보 저장됨
   - [ ] AuthContext의 user가 업데이트됨
   - [ ] Header에 사용자 이름 표시됨

2. **수강신청 전**
   - [ ] isLoggedIn이 true인지 확인
   - [ ] 로그인되지 않으면 로그인 페이지로 리다이렉트
   - [ ] 로그인했으면 수강신청 버튼 활성화

3. **수강신청 요청 시**
   - [ ] Authorization 헤더에 Bearer 토큰 포함
   - [ ] Content-Type이 application/json
   - [ ] 요청 본문에 courseId 포함

4. **수강신청 응답 시**
   - [ ] status 200이면 성공 처리
   - [ ] status 409이면 이미 등록된 강의 메시지
   - [ ] status 401이면 자동으로 로그인 페이지로 리다이렉트
   - [ ] 기타 에러는 에러 메시지 표시

### 🚨 문제 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 수강신청 버튼 비활성 | isLoggedIn이 false | 로그인 확인 |
| Authorization 헤더 없음 | includeAuth가 false | enrollCourse에서 includeAuth: true 확인 |
| 401 에러 무한 응답 | 토큰이 계속 없음 | localStorage 토큰 확인 |
| 중복 수강 불가 | 이미 등록됨 | 409 에러 처리 추가 |

---

## 📚 관련 파일

| 파일 | 역할 |
|------|------|
| `app/auth/login/page.tsx` | 로그인 페이지 |
| `app/courses/[id]/page.tsx` | 강의 상세 페이지 및 수강신청 |
| `lib/api/authService.ts` | 인증 서비스 |
| `lib/api/enrollmentService.ts` | 수강신청 서비스 |
| `lib/api/client.ts` | API 클라이언트 (토큰 관리) |
| `lib/context/AuthContext.tsx` | 전역 인증 상태 관리 |
| `components/Header.tsx` | 상단 네비게이션 (로그아웃) |

---

## 🎓 참고 자료

- [가이드 문서](./📚%20로그인%20→%20수강%20신청%20전체%20흐름%20가이드.md)
- [API 명세](./../BE/API_SPECIFICATION.md)
- [JWT 인증](./../BE/JWT_AUTH_REPORT.md)

---

**마지막 업데이트:** 2026-04-10  
**작성자:** ChessMate FE Team
