# 🏛️ ChessMate - 재무 교육 플랫폼 (백엔드)

**프로젝트명**: ChessMate Backend API  
**버전**: 1.0.0  
**언어**: Java 17  
**프레임워크**: Spring Boot 4.0.4  
**라이센스**: MIT

---

## 📌 프로젝트 개요

**ChessMate**는 강사가 투자 관련 강의를 등록하고 학생이 수강할 수 있는 **온라인 금융 교육 플랫폼**입니다.

### 🎯 핵심 기능

- ✅ **JWT 기반 사용자 인증**: 강사(TEACHER), 학생(STUDENT), 관리자(ADMIN) 역할 관리
- ✅ **강의 CRUD**: 강사만 자신의 강의를 등록, 수정, 삭제 가능
- ✅ **강의 조회 및 검색**: 학생은 강의를 조회하고 카테고리, 강사별로 검색
- ✅ **수강 관리**: 학생이 강의에 수강 등록 및 진행 상황 추적
- ✅ **권한 기반 접근 제어 (RBAC)**: 역할별로 사용 가능한 API 제한

---

## 📚 문서 구조

> 📖 **먼저 이 README를 읽은 후, 아래 문서들을 순서대로 읽어주세요.**

### 1️⃣ 빠른 시작 (이 페이지)
- 프로젝트 개요
- 기술 스택
- 빠른 시작 가이드

### 2️⃣ [📋 PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 프로젝트 전체 요약
- 프로젝트 목표 및 범위
- 아키텍처 개요
- 구현 순서 및 일정
- **다음 단계**: IMPLEMENTATION_SPEC.md 읽기

### 3️⃣ [📖 IMPLEMENTATION_SPEC.md](./IMPLEMENTATION_SPEC.md) - 상세 구현 명세 ⭐ **가장 중요**
- 아키텍처 상세 설명
- 인증 흐름 (회원가입, 로그인, 토큰 검증)
- DTO 설계 및 구현 방법
- Service 계층 구현 코드
- Controller 계층 구현 코드
- 예외 처리 전략
- **다음 단계**: API_SPECIFICATION.md 읽기

### 4️⃣ [🔌 API_SPECIFICATION.md](./API_SPECIFICATION.md) - OpenAPI 3.0 명세서
- 모든 REST API 엔드포인트
- 요청/응답 형식
- HTTP 상태 코드
- 오류 응답 샘플
- Postman Collection 사용 방법
- **다음 단계**: DECISION_RATIONALE.md 읽기

### 5️⃣ [🎯 DECISION_RATIONALE.md](./DECISION_RATIONALE.md) - 의사결정 가이드
- 설계 철학 및 이유
- JWT vs Session 비교
- BCrypt 암호화 전략
- DTO vs Entity 선택 이유
- 트레이드오프 분석
- **다음 단계**: TEST_SCENARIOS.md 읽기

### 6️⃣ [🧪 TEST_SCENARIOS.md](./TEST_SCENARIOS.md) - 테스트 시나리오 및 검증
- 페르소나 기반 테스트 시나리오
- 강사(TEACHER) 사용 흐름
- 학생(STUDENT) 사용 흐름
- 오류 케이스 테스트
- 성능 테스트
- 최종 체크리스트
- **다음 단계**: 코드 구현 시작

### 7️⃣ [👨‍💻 DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - 개발자 가이드
- 개발 환경 설정
- 프로젝트 구조
- 빌드 및 실행 방법
- IDE 설정

### 8️⃣ [🔐 JWT_AUTH_REPORT.md](./JWT_AUTH_REPORT.md) - JWT 인증 보고서
- JWT 기술 상세
- 토큰 구조
- 보안 고려사항

---

## 🛠️ 기술 스택

### Backend Framework
- **Spring Boot 4.0.4**: 기본 웹 프레임워크
- **Spring Security 6**: 인증 및 권한 관리
- **Spring Data JPA**: 객체-관계 매핑

### Authentication & Security
- **JWT (JJWT 0.12.3)**: Stateless 인증
- **BCrypt**: 비밀번호 암호화

### Database
- **H2** (개발): 메모리 데이터베이스
- **MySQL** (프로덕션): 관계형 데이터베이스

### Build Tool
- **Gradle**: 의존성 관리 및 빌드

### Code Quality
- **Lombok**: 보일러플레이트 코드 제거
- **Java 17**: 최신 Java 버전

---

## 🚀 빠른 시작

### 사전 요구사항

```bash
# 1. Java 17 설치 확인
java -version
# openjdk version "17.x.x" 2021-09-14

# 2. Gradle 설치 (선택사항, Gradle wrapper 포함)
gradle -v
```

### 애플리케이션 실행

#### 방법 1: IDE에서 실행

```
1. IntelliJ IDEA 또는 VS Code에서 프로젝트 열기
2. BeApplication.java 파일 찾기
3. 우클릭 → "Run 'BeApplication'"
4. http://localhost:8080/api 접속
```

#### 방법 2: 터미널에서 실행

```bash
# 프로젝트 루트 디렉토리로 이동
cd BE

# Gradle을 사용한 빌드 및 실행
./gradlew bootRun

# Windows에서는
gradlew.bat bootRun
```

#### 방법 3: JAR 파일로 실행

```bash
# 빌드
./gradlew build

# JAR 파일 실행
java -jar build/libs/BE-0.0.1-SNAPSHOT.jar
```

### 애플리케이션 확인

```bash
# 헬스 체크 엔드포인트
curl http://localhost:8080/api/health

# 응답 (200 OK)
{
  "data": "Server is running",
  "message": "OK"
}
```

---

## 📂 프로젝트 구조

```
BE/
├── src/
│   ├── main/
│   │   ├── java/com/chessmate/be/
│   │   │   ├── BeApplication.java           # 애플리케이션 엔트리포인트
│   │   │   ├── config/
│   │   │   │   └── SecurityConfig.java      # Spring Security 설정
│   │   │   ├── controller/                  # REST API 컨트롤러
│   │   │   │   ├── AuthController.java      # 인증 API (TODO)
│   │   │   │   ├── CourseController.java    # 강의 API (TODO)
│   │   │   │   └── HealthController.java    # 헬스 체크
│   │   │   ├── service/                     # 비즈니스 로직
│   │   │   │   ├── AuthService.java         # 인증 로직 (TODO)
│   │   │   │   └── CourseService.java       # 강의 로직 (TODO)
│   │   │   ├── repository/                  # 데이터 접근
│   │   │   │   ├── MemberRepository.java    # 회원 DB 접근
│   │   │   │   ├── CourseRepository.java    # 강의 DB 접근
│   │   │   │   └── ...
│   │   │   ├── entity/                      # JPA 엔티티
│   │   │   │   ├── Member.java              # ✅ 완료
│   │   │   │   ├── Course.java              # ✅ 완료
│   │   │   │   ├── Section.java             # ✅ 완료
│   │   │   │   ├── Lecture.java             # ✅ 완료
│   │   │   │   ├── Enrollment.java          # ✅ 완료
│   │   │   │   └── LectureProgress.java     # ✅ 완료
│   │   │   ├── dto/                         # 데이터 전송 객체
│   │   │   │   ├── request/                 # 요청 DTO
│   │   │   │   │   ├── SignupRequest.java   # ✅ 완료
│   │   │   │   │   └── LoginRequest.java    # ✅ 완료
│   │   │   │   └── response/                # 응답 DTO
│   │   │   │       ├── ApiResponse.java     # ✅ 완료
│   │   │   │       ├── MemberResponse.java  # ✅ 완료
│   │   │   │       └── TokenResponse.java   # ✅ 완료
│   │   │   ├── security/                    # 보안 관련
│   │   │   │   ├── JwtTokenProvider.java    # ✅ 완료
│   │   │   │   ├── JwtAuthenticationFilter.java  # (구현 예정)
│   │   │   │   └── CustomUserDetailsService.java # ✅ 완료
│   │   │   └── exception/                   # 예외 처리
│   │   │       ├── GlobalExceptionHandler.java   # (구현 예정)
│   │   │       ├── DuplicateEmailException.java  # ✅ 완료
│   │   │       └── EntityNotFoundException.java  # ✅ 완료
│   │   └── resources/
│   │       └── application.yml               # ✅ 완료
│   └── test/
│       └── java/...                         # 테스트 코드 (TODO)
│
├── gradle/
├── build/                                    # 빌드 아티팩트
├── build.gradle                              # ✅ 완료
├── settings.gradle
├── gradlew / gradlew.bat
│
├── 📄 README.md                             # 이 파일
├── 📄 PROJECT_SUMMARY.md                   # 프로젝트 요약
├── 📄 IMPLEMENTATION_SPEC.md                # 구현 명세서 ⭐
├── 📄 API_SPECIFICATION.md                 # API 명세서
├── 📄 DECISION_RATIONALE.md                # 의사결정 가이드
├── 📄 TEST_SCENARIOS.md                    # 테스트 시나리오
├── 📄 DEVELOPER_GUIDE.md                   # 개발자 가이드
├── 📄 JWT_AUTH_REPORT.md                   # JWT 보고서
├── 📄 ChessMate_Auth_API.postman_collection.json  # Postman Collection
└── ...
```

### 구현 상태

```
✅ = 완료
⏳ = 진행 중
❌ = 미구현

Entity Layer       ✅ 100%
├─ Member         ✅
├─ Course         ✅
├─ Section        ✅
├─ Lecture        ✅
├─ Enrollment     ✅
└─ LectureProgress ✅

DTO Layer         ⏳ 50%
├─ Request        ✅ 기본 구현
├─ Response       ✅ 기본 구현
└─ Validation     ⏳ 추가 필요

Repository Layer  ✅ 60%
├─ MemberRepository      ✅
├─ CourseRepository      ⏳ 쿼리 메서드 추가 필요
├─ EnrollmentRepository  ✅
└─ ...

Security Layer    ✅ 80%
├─ JwtTokenProvider           ✅
├─ JwtAuthenticationFilter    ✅
├─ CustomUserDetailsService   ✅
└─ SecurityConfig            ✅

Service Layer     ❌ 0%
├─ AuthService      ❌
├─ CourseService    ❌
└─ EnrollmentService ❌

Controller Layer  ❌ 0%
├─ AuthController      ❌
├─ CourseController    ❌
└─ EnrollmentController ❌

Exception Handler ❌ 0%
└─ GlobalExceptionHandler ❌
```

---

## 📖 학습 경로

### 1단계: 기초 이해 (1일)

```
1. PROJECT_SUMMARY.md 읽기
2. 기술 스택 이해
3. 프로젝트 목표 파악
```

### 2단계: 아키텍처 학습 (2일)

```
1. IMPLEMENTATION_SPEC.md의 아키텍처 섹션 읽기
2. DECISION_RATIONALE.md에서 설계 이유 학습
3. ERD 다이어그램 분석
```

### 3단계: API 이해 (2일)

```
1. API_SPECIFICATION.md 정독
2. 각 API 엔드포인트 이해
3. 요청/응답 형식 숙지
```

### 4단계: 인증 흐름 이해 (2일)

```
1. IMPLEMENTATION_SPEC.md의 인증 흐름 읽기
2. JWT 토큰 구조 이해
3. 비밀번호 보안 학습
```

### 5단계: 테스트 시나리오 (2일)

```
1. TEST_SCENARIOS.md의 페르소나별 흐름 읽기
2. 각 테스트 케이스 분석
3. Postman Collection 실습
```

### 6단계: 코드 구현 (3주)

```
Week 1: AuthService & AuthController
Week 2: CourseService & CourseController
Week 3: EnrollmentService & 통합 테스트
```

---

## 🔑 핵심 개념

### JWT 인증 흐름

```
1. 사용자가 이메일과 비밀번호로 로그인
   ↓
2. AuthService가 비밀번호를 BCrypt로 검증
   ↓
3. 검증 성공 시 JwtTokenProvider가 토큰 생성
   ├─ Access Token (1시간 유효)
   └─ Refresh Token (7일 유효)
   ↓
4. 클라이언트가 Authorization 헤더에 토큰 포함
   ↓
5. JwtAuthenticationFilter가 요청마다 토큰 검증
   ↓
6. 유효한 토큰이면 SecurityContext에 사용자 정보 저장
   ↓
7. Controller와 Service에서 권한 확인
```

### 권한 기반 접근 제어 (RBAC)

```
역할 (Role)
├─ STUDENT (학생)
│   ├─ 강의 조회 ✓
│   ├─ 강의 등록 ✗
│   ├─ 수강 등록 ✓
│   └─ 강의 수정/삭제 ✗
│
├─ TEACHER (강사)
│   ├─ 강의 조회 ✓
│   ├─ 강의 등록 ✓ (자신의 강의)
│   ├─ 강의 수정 ✓ (자신의 강의만)
│   └─ 강의 삭제 ✓ (자신의 강의만)
│
└─ ADMIN (관리자)
    └─ 모든 기능 ✓
```

### DTO 패턴

```
Request DTO
├─ SignupRequest (이메일, 비밀번호, 닉네임, 역할)
├─ LoginRequest (이메일, 비밀번호)
├─ CourseCreateRequest (제목, 설명, 카테고리, 가격, 썸네일)
└─ ...

Response DTO
├─ ApiResponse<T> (data, message)
├─ MemberResponse (id, email, nickname, role)
├─ TokenResponse (accessToken, refreshToken, member)
├─ CourseResponse (id, title, description, instructor, ...)
└─ ...

변환 방식:
Entity → DTO (from() 메서드)
DTO → Entity (생성자 또는 builder)
```

---

## 🧪 테스트 방법

### Postman을 사용한 API 테스트

1. **Postman Collection 가져오기**
   ```
   File → Import → ChessMate_Auth_API.postman_collection.json
   ```

2. **환경 변수 설정**
   ```json
   {
     "baseUrl": "http://localhost:8080/api",
     "accessToken": "",
     "refreshToken": ""
   }
   ```

3. **테스트 순서**
   - 회원가입 (TEACHER)
   - 로그인
   - 강의 등록
   - 강의 조회
   - 강의 수정
   - 강의 삭제

### cURL을 사용한 API 테스트

```bash
# 회원가입
curl -X POST "http://localhost:8080/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "SecurePassword123",
    "nickname": "Teacher",
    "role": "TEACHER"
  }'

# 로그인
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "SecurePassword123"
  }'

# 강의 조회
curl -X GET "http://localhost:8080/api/courses" \
  -H "Authorization: Bearer {accessToken}"
```

---

## 🐛 일반적인 문제 해결

### 1. 포트 이미 사용 중

```bash
# 8080 포트가 이미 사용 중인 경우
# application.yml에서 포트 변경
server:
  port: 8081  # 8080 → 8081
```

### 2. 데이터베이스 연결 오류

```bash
# H2 콘솔 확인
http://localhost:8080/h2-console

# JDBC URL: jdbc:h2:mem:testdb
# Username: sa
# Password: (빈 칸)
```

### 3. JWT 토큰 검증 실패

```
토큰 확인:
1. jwt.io에서 토큰 디코딩
2. 서명(Signature) 확인
3. 만료 시간(exp) 확인
4. secret key 일치 확인
```

---

## 📋 다음 단계

### Immediate (이번 주)

- [ ] 모든 문서 정독
- [ ] TEST_SCENARIOS.md의 테스트 케이스 분석
- [ ] Postman Collection 설치 및 실행

### Short Term (1-2주)

- [ ] AuthService 구현
- [ ] AuthController 구현
- [ ] GlobalExceptionHandler 구현
- [ ] 인증 관련 테스트 작성

### Medium Term (3-4주)

- [ ] CourseService 구현
- [ ] CourseController 구현
- [ ] 강의 관리 테스트 작성
- [ ] 권한 검증 테스트

### Long Term (향후)

- [ ] EnrollmentService 구현
- [ ] LectureProgressService 구현
- [ ] 통합 테스트 작성
- [ ] 성능 최적화
- [ ] 프로덕션 배포

---

## 📚 참고 자료

### 공식 문서
- [Spring Boot 공식 문서](https://spring.io/projects/spring-boot)
- [Spring Security 공식 문서](https://spring.io/projects/spring-security)
- [JWT.io - JWT 토큰 검증](https://jwt.io)

### 추천 학습 자료
- JWT 개념 및 구현 패턴
- Spring Security 권한 관리
- REST API 설계 원칙
- JPA/Hibernate 최적화

### 개발 도구
- Postman: API 테스트
- IntelliJ IDEA: IDE
- DataGrip: 데이터베이스 관리
- Git: 버전 관리

---

## 🤝 기여 가이드

### 코드 작성 규칙

```java
// Good
@Service
@RequiredArgsConstructor
public class AuthService {
    private final MemberRepository memberRepository;
    
    public MemberResponse signup(SignupRequest request) {
        // 구현
    }
}

// Bad
public class AuthService {
    MemberRepository memberRepository;
    
    public Member signup(String email, String password) {
        // 구현
    }
}
```

### 커밋 메시지 규칙

```
[feature] AuthService 구현
[bugfix] JWT 토큰 검증 오류 수정
[test] AuthController 테스트 추가
[docs] API 명세서 업데이트
[refactor] CourseService 리팩토링
```

---

## 📞 문의 및 지원

### 질문이 있으신가요?

1. **문서 확인**: 관련 문서를 먼저 검토해주세요
2. **Issue 생성**: GitHub Issues에 문제를 등록해주세요
3. **토론**: Discussions 탭에서 의견을 나누세요

### 버그 리포트

```markdown
**버그 설명**: 
**재현 방법**: 
**예상 결과**: 
**실제 결과**: 
**환경**: Java 17, Spring Boot 4.0.4
```

---

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

```
MIT License

Copyright (c) 2026 ChessMate Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 🎉 마지막으로

이 프로젝트는 **JWT 기반 인증**, **REST API 설계**, **권한 관리**를 배우는 완벽한 예제입니다.

### 성공의 열쇠

✅ 문서를 꼼꼼하게 읽기  
✅ 테스트 시나리오를 이해하기  
✅ 코드를 단계적으로 구현하기  
✅ 정기적으로 테스트하기  

**"좋은 코드는 좋은 문서와 함께 시작된다"** - Robert C. Martin

---

**프로젝트 시작 일자**: 2026-04-02  
**마지막 업데이트**: 2026-04-02  
**유지보수자**: ChessMate Development Team


