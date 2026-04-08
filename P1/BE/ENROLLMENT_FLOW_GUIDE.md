# 📚 로그인 → 수강 신청 전체 흐름 가이드

## 🎯 수강 신청 프로세스

### 전체 흐름

```
1️⃣ 로그인 (JWT 토큰 발급)
   ↓
2️⃣ JWT 토큰 저장 (로컬스토리지/쿠키)
   ↓
3️⃣ 수강 신청 요청 (Authorization 헤더에 토큰 포함)
   ↓
4️⃣ 수강 신청 완료
```

---

## 1️⃣ 로그인 API

### 요청

```http
POST /api/auth/login HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 응답

```json
{
  "success": true,
  "data": {
    "memberId": 1,
    "email": "user@example.com",
    "nickname": "사용자",
    "role": "STUDENT",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "로그인 성공",
  "timestamp": "2026-04-08T20:13:00"
}
```

### 🔑 중요: accessToken 저장

프론트엔드에서 **반드시 accessToken을 저장**해야 합니다!

---

## 2️⃣ 토큰 저장 (프론트엔드 JavaScript)

### 로컬스토리지에 저장

```javascript
// ✅ 로그인 응답 받은 후
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const json = await response.json();

if (json.success) {
  // ✨ accessToken 저장
  localStorage.setItem('accessToken', json.data.accessToken);
  localStorage.setItem('memberId', json.data.memberId);
  localStorage.setItem('nickname', json.data.nickname);
  
  console.log('로그인 성공!');
  // 메인 페이지로 이동
  window.location.href = '/courses';
}
```

---

## 3️⃣ 수강 신청 API (인증 필수)

### 요청 - ⭐ Authorization 헤더에 토큰 포함

```http
POST /api/enrollments HTTP/1.1
Host: localhost:8080
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "courseId": 1
}
```

**중요:** Authorization 헤더 형식
```
Authorization: Bearer <accessToken>
```

### 응답

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

## 🔗 프론트엔드 구현 (전체 흐름)

### Step 1: 로그인 함수

```javascript
async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const json = await response.json();

    if (json.success) {
      // ✨ 토큰 저장
      localStorage.setItem('accessToken', json.data.accessToken);
      localStorage.setItem('memberId', json.data.memberId);
      
      return json.data;
    } else {
      alert('로그인 실패: ' + json.message);
      return null;
    }
  } catch (error) {
    console.error('로그인 에러:', error);
    alert('로그인 중 오류가 발생했습니다');
    return null;
  }
}
```

### Step 2: 수강 신청 함수

```javascript
async function enrollCourse(courseId) {
  try {
    // ✨ 저장된 토큰 가져오기
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      alert('로그인이 필요합니다');
      // 로그인 페이지로 이동
      window.location.href = '/login';
      return null;
    }

    // ✨ Authorization 헤더에 토큰 포함
    const response = await fetch('/api/enrollments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`  // ⭐ 중요!
      },
      body: JSON.stringify({ courseId: courseId })
    });

    const json = await response.json();

    if (json.success) {
      alert('수강 신청이 완료되었습니다!');
      return json.data;
    } else if (response.status === 401) {
      // ⚠️ 토큰 만료
      alert('로그인 정보가 만료되었습니다. 다시 로그인해주세요');
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    } else {
      alert('수강 신청 실패: ' + json.message);
      return null;
    }
  } catch (error) {
    console.error('수강 신청 에러:', error);
    alert('수강 신청 중 오류가 발생했습니다');
    return null;
  }
}
```

### Step 3: 사용 예시 (HTML 버튼)

```html
<!-- 로그인 폼 -->
<form onsubmit="handleLogin(event)">
  <input type="email" id="email" placeholder="이메일" required>
  <input type="password" id="password" placeholder="비밀번호" required>
  <button type="submit">로그인</button>
</form>

<script>
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  const result = await login(email, password);
  
  if (result) {
    // 로그인 성공 - 강의 목록 페이지로 이동
    window.location.href = '/courses';
  }
}
</script>

<!-- 수강 신청 버튼 -->
<button onclick="enrollCourse(courseId)">
  수강 신청
</button>
```

---

## 🧪 테스트 (cURL)

### 1️⃣ 로그인

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'
```

응답에서 **accessToken** 복사:
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2️⃣ 수강 신청 (Authorization 헤더에 토큰)

```bash
curl -X POST http://localhost:8080/api/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "courseId": 1
  }'
```

---

## ⚠️ 일반적인 에러 및 해결

### 1️⃣ 401 Unauthorized

```json
{
  "success": false,
  "data": null,
  "message": "토큰이 유효하지 않습니다"
}
```

**원인:**
- Authorization 헤더가 없음
- 토큰 형식이 잘못됨 (`Bearer` 접두사 누락)
- 토큰 만료

**해결:**
```javascript
// ❌ 잘못된 형식
'Authorization': 'eyJhbGc...'

// ✅ 올바른 형식
'Authorization': 'Bearer eyJhbGc...'
```

### 2️⃣ 403 Forbidden

```json
{
  "success": false,
  "data": null,
  "message": "강의를 찾을 수 없습니다"
}
```

**원인:**
- courseId가 잘못됨
- 존재하지 않는 강의 ID

### 3️⃣ 중복 수강

```json
{
  "success": false,
  "data": null,
  "message": "이미 등록된 강의입니다"
}
```

**원인:**
- 이미 수강 중인 강의

---

## 📊 보안 체크리스트

- [x] 로그인 시 accessToken 발급
- [x] 토큰은 loalStorage에 저장
- [x] 수강 신청 시 Authorization 헤더에 토큰 포함
- [x] 401 응답 시 로그인 페이지로 리다이렉트
- [x] 민감한 데이터는 HTTPS 사용 (프로덕션)

---

## 🔄 로그아웃

```javascript
function logout() {
  // 토큰 삭제
  localStorage.removeItem('accessToken');
  localStorage.removeItem('memberId');
  localStorage.removeItem('nickname');
  
  // 로그인 페이지로 이동
  window.location.href = '/login';
}
```

---

## 📚 관련 API 문서

- `/api/auth/login` - 로그인
- `/api/auth/signup` - 회원가입
- `/api/enrollments` - 수강 신청
- `/api/enrollments/my` - 내 수강 목록

---

**핵심:** Authorization 헤더에 `Bearer <accessToken>`을 포함해야 합니다! ✨

