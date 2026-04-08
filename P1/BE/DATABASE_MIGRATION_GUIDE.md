# 📊 데이터베이스 H2 → MySQL 마이그레이션 가이드

## ✅ 완료 사항

H2에서 MySQL로 데이터베이스를 변경했습니다.

---

## 🔧 변경 사항

### 1. application.yml 수정

**Before (H2):**
```yaml
datasource:
  url: jdbc:h2:mem:testdb
  driver-class-name: org.h2.Driver
  username: sa
  password:
jpa:
  database-platform: org.hibernate.dialect.H2Dialect
```

**After (MySQL):**
```yaml
datasource:
  url: jdbc:mysql://localhost:3306/stock_class?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
  driver-class-name: com.mysql.cj.jdbc.Driver
  username: root
  password: 
jpa:
  database-platform: org.hibernate.dialect.MySQLDialect
  properties:
    hibernate:
      dialect: org.hibernate.dialect.MySQL8Dialect
```

---

## 📋 데이터베이스 연결 정보

| 항목 | 값 |
|:---:|:---|
| **Host** | localhost |
| **Port** | 3306 |
| **Database** | stock_class |
| **Username** | root |
| **Password** | (비워둠) |
| **Driver** | com.mysql.cj.jdbc.Driver |

---

## 🚀 MySQL 서버 준비

### 1단계: MySQL 설치 (이미 설치되었다면 스킵)

**Windows:**
```bash
# MySQL Community Server 다운로드 및 설치
# https://dev.mysql.com/downloads/mysql/
```

### 2단계: MySQL 서비스 시작

**Windows PowerShell (관리자):**
```powershell
# MySQL 서비스 시작
net start MySQL80

# 또는 MySQL 명령어로
mysql -u root
```

### 3단계: 데이터베이스 생성

**MySQL CLI에서 실행:**
```sql
-- stock_class 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS stock_class 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 생성 확인
SHOW DATABASES;

-- 데이터베이스 선택
USE stock_class;
```

또는 **MySQL Workbench 사용:**
1. MySQL Workbench 열기
2. 로컬 연결 선택
3. 새 스키마 생성
4. 이름: `stock_class`
5. Charset: `utf8mb4`
6. Collation: `utf8mb4_unicode_ci`

---

## 🔑 MySQL 연결 옵션 설명

### JDBC URL 구성 요소

```
jdbc:mysql://localhost:3306/stock_class?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
```

| 옵션 | 설명 |
|:---:|:---|
| `useSSL=false` | SSL 암호화 비활성화 (개발 환경) |
| `serverTimezone=UTC` | 타임존 설정 (UTC) |
| `allowPublicKeyRetrieval=true` | 공개 키 기반 인증 허용 |

---

## 🧪 테스트

### 1. 빌드 및 실행

```bash
# 프로젝트 클린 빌드
./gradlew clean build -x test

# 서버 시작
java -jar build/libs/BE-0.0.1-SNAPSHOT.jar
```

### 2. 서버 로그 확인

**정상 시작 시 로그:**
```
HikariPool-1 - Starting...
HikariPool-1 - Added connection conn0: url=jdbc:mysql://localhost:3306/stock_class user=root
HikariPool-1 - Start completed.

Database info:
	Database JDBC URL [jdbc:mysql://localhost:3306/stock_class...]
	Database driver: MySQL Connector/J
	Database dialect: MySQL8Dialect
```

### 3. 데이터베이스 테이블 생성 확인

```sql
USE stock_class;
SHOW TABLES;
```

예상 출력:
```
+----------------------+
| Tables_in_stock_class |
+----------------------+
| course               |
| enrollment           |
| lecture              |
| lecture_progress     |
| member               |
| section              |
+----------------------+
```

### 4. API 테스트

```bash
# 전체 강의 조회
curl http://localhost:8080/api/courses

# 응답 예시
{
  "success": true,
  "data": {
    "content": [...],
    "totalElements": 0
  },
  "message": "조회되었습니다.",
  "timestamp": "2026-04-08T10:30:00"
}
```

---

## ⚠️ 주의사항

### 1. MySQL 서비스 확인

```bash
# Windows에서 MySQL 서비스 상태 확인
Get-Service MySQL80

# MySQL 서비스 시작
net start MySQL80

# MySQL 서비스 중지
net stop MySQL80
```

### 2. 비밀번호 설정

현재 설정에서 MySQL root 비밀번호는 비워져 있습니다.

**비밀번호 설정 필요 시:**

```yaml
datasource:
  username: root
  password: your_password  # ← 여기에 입력
```

### 3. 방화벽 확인

MySQL 포트(3306)가 방화벽에서 열려있는지 확인하세요.

### 4. 문자 인코딩

MySQL은 `utf8mb4`를 사용하여 한글, 이모지 등 모든 문자를 지원합니다.

---

## 📊 Hibernate DDL 옵션

### ddl-auto: create-drop

```yaml
hibernate:
  ddl-auto: create-drop
```

| 옵션 | 설명 | 용도 |
|:---:|:---|:---|
| `create-drop` | 시작 시 생성, 종료 시 삭제 | **개발 환경** ✅ |
| `create` | 시작 시 생성 | 테스트 |
| `update` | 필요시만 수정 | 프로덕션 |
| `validate` | 검증만 수행 | 프로덕션 ✅ |
| `none` | 아무것도 하지 않음 | 프로덕션 |

**프로덕션 변경:**
```yaml
hibernate:
  ddl-auto: validate
```

---

## 🔄 H2에서 마이그레이션 시 데이터 손실

⚠️ **주의:** 현재 `ddl-auto: create-drop`이므로 서버 재시작 시 모든 데이터가 초기화됩니다.

**기존 H2 데이터 백업 필요 시:**
1. H2 데이터베이스를 SQL 덤프 생성
2. MySQL로 import

---

## 🎯 MySQL 설정 최종 체크리스트

- [ ] MySQL 서버 설치 및 실행
- [ ] `stock_class` 데이터베이스 생성
- [ ] application.yml 수정 완료 ✅
- [ ] build.gradle 확인 (mysql-connector-j 포함) ✅
- [ ] 프로젝트 빌드: `./gradlew clean build -x test`
- [ ] 서버 시작 및 로그 확인
- [ ] API 테스트 (curl or Postman)
- [ ] 데이터베이스 테이블 생성 확인

---

## 🆘 트러블슈팅

### 1. "Connection refused" 에러

```
java.sql.SQLException: Could not create connection to database server
```

**해결:**
```bash
# MySQL 서비스 시작
net start MySQL80

# MySQL 포트 확인
netstat -an | findstr 3306
```

### 2. "Access denied for user 'root'@'localhost'"

```
java.sql.SQLException: Access denied for user 'root'@'localhost' (using password: NO)
```

**해결:**
```yaml
datasource:
  username: root
  password: your_actual_password  # 비밀번호 설정
```

### 3. "Unknown database 'stock_class'"

```
java.sql.SQLException: Unknown database 'stock_class'
```

**해결:**
```sql
CREATE DATABASE stock_class CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. "Timezone error"

```
java.sql.SQLException: The server timezone value...
```

**이미 해결됨:**
- JDBC URL에 `serverTimezone=UTC` 포함

---

## 📈 성능 팁

### 1. Connection Pool 설정 추가 (선택사항)

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 20000
      idle-timeout: 300000
      max-lifetime: 1200000
```

### 2. MySQL 쿼리 로깅

```yaml
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        use_sql_comments: true
```

---

## 📌 참고

- **Spring Boot 버전:** 4.0.4
- **MySQL Connector:** 9.6.0
- **Java:** 17
- **Dialect:** MySQL8Dialect

---

## 🚀 다음 단계

1. MySQL 서버 준비 완료 확인
2. 프로젝트 빌드 및 테스트
3. API 테스트로 정상 작동 확인
4. 필요시 DataInitializer에서 초기 데이터 추가

**모든 설정이 완료되었습니다!** ✅

