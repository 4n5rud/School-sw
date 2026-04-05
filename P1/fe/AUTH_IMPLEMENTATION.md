# StockClass - 인증 시스템 구현

## 📋 프로젝트 개요

StockClass는 클린 아키텍처 기반의 JWT 인증 시스템이 통합된 투자 교육 플랫폼입니다.

## 🏗️ 아키텍처

### Frontend (FE)
```
lib/
├── api/
│   ├── types.ts          # API 타입 정의
│   ├── client.ts         # HTTP 클라이언트
│   └── authService.ts    # 인증 비즈니스 로직
├── context/
│   └── AuthContext.tsx   # 전역 인증 상태 관리
└── ...

app/
├── auth/
│   ├── login/page.tsx    # 로그인 페이지
│   └── signup/page.tsx   # 회원가입 페이지
└── ...

components/
├── Header.tsx            # 헤더 (인증 상태 표시)
└── ...
```

### Backend (BE)
BE 폴더의 구현은 유지되며, 다음 API를 제공합니다:

## 🔐 API 엔드포인트

### 인증 (Auth)

#### 1. 회원가입
```
POST /api/auth/signup
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePassword123!",
  "nickname": "김학생",
  "role": "STUDENT"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "student@example.com",
    "nickname": "김학생",
    "role": "STUDENT",
    "createdAt": "2026-04-02T10:30:00"
  }
}
```

#### 2. 로그인
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePassword123!"
}

Response: (회원가입과 동일)
```

#### 3. 이메일 중복 확인
```
GET /api/auth/check-email?email=student@example.com

Response:
{
  "available": false,
  "email": "student@example.com"
}
```

#### 4. 토큰 재발급
```
POST /api/auth/refresh
Authorization: Bearer <refreshToken>

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 공개 API (Public)

#### 헬스 체크
```
GET /api/health

Response:
{
  "status": "UP"
}
```

## 🛠️ 구현 상세

### 1. API Client (`lib/api/client.ts`)
- REST API 호출 추상화
- 자동 헤더 설정 (Content-Type, Authorization)
- 에러 처리 및 응답 변환

### 2. Auth Service (`lib/api/authService.ts`)
- 회원가입/로그인 로직
- 토큰 저장 및 관리 (localStorage)
- 이메일 중복 확인
- 토큰 재발급

### 3. Auth Context (`lib/context/AuthContext.tsx`)
- 전역 인증 상태 관리 (React Context)
- 사용자 정보 관리
- 로그인/로그아웃 기능
- AuthProvider로 앱 래핑

### 4. 인증 페이지
- **로그인 페이지** (`app/auth/login/page.tsx`)
  - 이메일, 비밀번호 입력
  - 회원가입 링크
  - 에러 처리

- **회원가입 페이지** (`app/auth/signup/page.tsx`)
  - 이메일, 비밀번호, 닉네임, 역할 입력
  - 이메일 중복 확인
  - 비밀번호 유효성 검사
  - 비밀번호 확인 일치 검사

### 5. Header 컴포넌트
- 인증 상태에 따른 메뉴 변경
- 로그인 상태: 닉네임 표시 + 로그아웃 버튼
- 로그아웃 상태: 로그인/회원가입 버튼
- 모바일 반응형 지원

## 📱 사용 방법

### 개발 서버 실행
```bash
cd fe
npm install
npm run dev
```

### API 서버 연결
```bash
# .env.local 파일 확인
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 테스트 흐름

1. **회원가입**
   - `/auth/signup` 페이지 방문
   - 계정 정보 입력 및 이메일 중복 확인
   - 회원가입 완료 → 자동으로 로그인 상태로 변경

2. **로그인**
   - `/auth/login` 페이지 방문
   - 이메일, 비밀번호 입력
   - 로그인 완료 → 홈페이지로 이동

3. **로그아웃**
   - 헤더 우측의 "로그아웃" 버튼 클릭
   - 토큰 삭제 및 상태 초기화

4. **인증 필요한 페이지**
   - `/my-courses` - 로그인 필요
   - 미인증 사용자가 접근 시 로그인 페이지로 리다이렉트 가능 (추가 구현 필요)

## 🔑 토큰 관리

### Access Token
- 짧은 유효 기간 (권장: 15분)
- 모든 보호된 API 요청시 사용
- Authorization 헤더: `Bearer <accessToken>`

### Refresh Token
- 긴 유효 기간 (권장: 7일)
- AccessToken 재발급에 사용
- localStorage에 안전하게 저장

### 토큰 자동 갱신
추후 구현 예정:
```typescript
// Interceptor를 통한 자동 토큰 갱신
if (response.status === 401) {
  const newAccessToken = await authService.refreshAccessToken();
  // 원래 요청 재시도
}
```

## 🎨 UI/UX 특징

- **다크 테마**: 검정/흰색 기반 최소한의 색상 사용
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **실시간 유효성 검사**: 폼 입력시 실시간 검증
- **에러 피드백**: 명확한 에러 메시지 표시
- **로딩 상태**: 비동기 작업 중 UI 업데이트

## 📋 기술 스택

**Frontend:**
- Next.js 16.2.1
- React 19.2.4
- TypeScript 5.x
- Tailwind CSS v4
- Fetch API (내장)

**Backend:**
- Spring Boot 4.0.4
- Spring Security
- JWT (jjwt)
- JPA/Hibernate
- MySQL/H2

## 📚 파일 구조

```
fe/
├── lib/
│   ├── api/
│   │   ├── types.ts
│   │   ├── client.ts
│   │   └── authService.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   └── ...
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── layout.tsx
│   └── ...
├── components/
│   ├── Header.tsx
│   └── ...
├── .env.local
└── ...
```

## 🚀 향후 개선사항

- [ ] Refresh Token 자동 갱신 (Interceptor)
- [ ] 로그인 필수 페이지 프로텍션
- [ ] 소셜 로그인 (Google, Kakao)
- [ ] 2FA (Two-Factor Authentication)
- [ ] 비밀번호 재설정
- [ ] 프로필 수정
- [ ] 역할 기반 접근 제어 (RBAC)

## 📞 문제 해결

### 토큰이 저장되지 않는 경우
- localStorage가 활성화되어 있는지 확인
- 브라우저의 개인정보 보호 모드 비활성화

### API 502/503 에러
- BE 서버가 `http://localhost:8080`에서 실행 중인지 확인
- `.env.local`의 `NEXT_PUBLIC_API_URL` 확인

### CORS 에러
- BE에서 CORS 설정 확인
- FE URL이 허용 목록에 포함되어 있는지 확인

## 📝 라이선스

이 프로젝트는 ChessMate 인증 시스템을 기반으로 합니다.
