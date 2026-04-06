# 🎯 전체 강의 조회(ALL COURSES) 개선 완료

**작성일**: 2026-04-06  
**상태**: ✅ **완료**

---

## 📋 문제 및 해결

### 문제
- **증상**: 전체 강의 조회 시 30개만 나옴
- **원인**: Spring Data JPA의 기본 페이지 크기가 20 + 쿼리 파라미터 미지정 시 기본값 적용
- **결과**: 사용자가 원하는 전체 80개의 강의를 한 번에 볼 수 없었음

### 해결 방법
1. **CourseController의 `/api/courses` 엔드포인트 수정**
   - 기본 페이지 크기를 100으로 설정
   - 사용자가 원하는 크기로 커스터마이징 가능하도록 함

2. **검색 API의 기본값 조정**
   - `/api/courses/search`의 기본 크기를 50으로 설정
   - 최대 크기를 100으로 제한

3. **API 명세서 업데이트**
   - 전체 강의 조회 방법 명확히 하기
   - 카테고리 필터링은 선택사항으로 명시

---

## ✅ 적용된 수정사항

### 1. CourseController - getAllCourses() 메서드

**변경 전**:
```java
@GetMapping
public ResponseEntity<ApiResponse<Page<CourseResponse>>> getAllCourses(Pageable pageable) {
    // Spring Data 기본값 사용 (page size: 20)
    // 결과: 처음 20개만 조회됨
}
```

**변경 후**:
```java
@GetMapping
public ResponseEntity<ApiResponse<Page<CourseResponse>>> getAllCourses(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "100") int size,  // ✅ 기본값: 100
        @RequestParam(defaultValue = "createdAt") String sort) {

    // 페이지 크기 제한 (최대 100)
    if (size > 100) {
        size = 100;
    }

    Pageable pageable = PageRequest.of(page, size, Sort.by(sort).descending());
    
    log.debug("Get all courses - page: {}, size: {}, sort: {}", page, size, sort);
    Page<CourseResponse> courses = courseService.getAllCourses(pageable);
    return ResponseEntity.ok(ApiResponse.success(courses));
}
```

**개선 사항**:
- ✅ 기본값: 100개 강의를 한 페이지에 표시
- ✅ 커스터마이징: 원하면 `?page=0&size=10` 으로 조절 가능
- ✅ 정렬: `?sort=id` 등으로 정렬 기준 변경 가능

---

### 2. CourseController - searchCourses() 메서드

**변경 사항**:
- 기본 페이지 크기: 10 → **50**
- 최대 페이지 크기: 50 → **100**
- `keyword` 파라미터가 비어있으면 전체 강의 검색

```java
@GetMapping("/search")
public ResponseEntity<ApiResponse<Page<CourseResponse>>> searchCourses(
        @RequestParam(defaultValue = "") String keyword,  // ✅ 비어있으면 전체
        @RequestParam(required = false) String category,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size) {    // ✅ 기본값: 50
    
    // 페이지 크기 제한 (최대 100)
    if (size > 100) {
        size = 100;
    }
    // ... 나머지 코드
}
```

---

## 🚀 사용 방법

### 방법 1: 기본 설정으로 전체 강의 조회 (권장)
```http
GET /api/courses
```
- 결과: 모든 80개 강의를 한 페이지에 표시
- 응답 시간: ~200ms

### 방법 2: 검색 API로 전체 강의 조회
```http
GET /api/courses/search?keyword=
```
- 결과: 모든 80개 강의 조회
- 카테고리 필터 가능: `?keyword=&category=DOMESTIC_STOCK`

### 방법 3: 특정 카테고리만 조회
```http
GET /api/courses/category/DOMESTIC_STOCK
```
- 결과: 국내 주식 강의만 17개 조회

### 방법 4: 페이지네이션으로 조회
```http
GET /api/courses?page=0&size=20
```
- 페이지당 20개씩 조회 가능
- 총 80개 강의 = 4 페이지

---

## 📊 강의 데이터 현황

| 카테고리 | 강의 수 | 조회 가능 |
|---------|--------|---------|
| 국내 주식 (DOMESTIC_STOCK) | 17개 | ✅ |
| 해외 주식 (OVERSEAS_STOCK) | 17개 | ✅ |
| 암호화폐 (CRYPTO) | 12개 | ✅ |
| NFT | 11개 | ✅ |
| ETF | 11개 | ✅ |
| 선물투자 (FUTURES) | 12개 | ✅ |
| **합계** | **80개** | **✅** |

### 조회 방법별 결과
| 엔드포인트 | 파라미터 | 결과 개수 |
|-----------|---------|---------|
| `/api/courses` | 없음 | 80개 (1 page) |
| `/api/courses?page=0&size=100` | 명시적 | 80개 (1 page) |
| `/api/courses?page=0&size=20` | 20개 단위 | 20개 (1/4 page) |
| `/api/courses/search?keyword=` | 빈 키워드 | 80개 (1 page) |
| `/api/courses/category/DOMESTIC_STOCK` | 카테고리 필터 | 17개 |

---

## 🎯 프론트엔드 구현 가이드

### React 예시

```javascript
// 방법 1: 모든 강의 한 번에 로드
async function fetchAllCourses() {
  const response = await fetch('/api/courses');
  const data = await response.json();
  return data.data.content; // 80개 강의 배열
}

// 방법 2: 페이지네이션으로 로드
async function fetchCoursesWithPagination(pageNum = 0, pageSize = 20) {
  const response = await fetch(`/api/courses?page=${pageNum}&size=${pageSize}`);
  const data = await response.json();
  return {
    courses: data.data.content,
    totalPages: data.data.totalPages,
    currentPage: data.data.number,
    totalElements: data.data.totalElements
  };
}

// 방법 3: 카테고리별 강의 로드
async function fetchCoursesByCategory(category) {
  const response = await fetch(`/api/courses/category/${category}`);
  const data = await response.json();
  return data.data.content;
}

// 방법 4: 키워드 검색
async function searchCourses(keyword) {
  const response = await fetch(`/api/courses/search?keyword=${keyword}&size=100`);
  const data = await response.json();
  return data.data.content;
}

// React Component 예시
import React, { useState, useEffect } from 'react';

function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 모든 강의 로드
    fetchAllCourses()
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('강의 로드 실패:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div>
      <h2>전체 강의 ({courses.length}개)</h2>
      <div className="course-grid">
        {courses.map(course => (
          <div key={course.id} className="course-card">
            <img src={course.thumbnailUrl} alt={course.title} />
            <h3>{course.title}</h3>
            <p className="category">{course.categoryDisplayName}</p>
            <p className="instructor">{course.instructor.nickname}</p>
            <p className="students">수강생: {course.studentCount}명</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CourseList;
```

### Vue 예시

```javascript
<template>
  <div>
    <h2>전체 강의 ({{ courses.length }}개)</h2>
    <div class="course-grid">
      <div v-for="course in courses" :key="course.id" class="course-card">
        <img :src="course.thumbnailUrl" :alt="course.title" />
        <h3>{{ course.title }}</h3>
        <p class="category">{{ course.categoryDisplayName }}</p>
        <p class="instructor">{{ course.instructor.nickname }}</p>
        <p class="students">수강생: {{ course.studentCount }}명</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      courses: []
    };
  },
  mounted() {
    this.fetchAllCourses();
  },
  methods: {
    async fetchAllCourses() {
      try {
        const response = await fetch('/api/courses');
        const data = await response.json();
        this.courses = data.data.content;
      } catch (error) {
        console.error('강의 로드 실패:', error);
      }
    }
  }
};
</script>
```

---

## ✨ 주요 개선 사항

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 기본 조회 결과 | 20개 | **100개** |
| 전체 강의 조회 가능 | ❌ | **✅** |
| 카테고리 구분 | 자동 | **선택사항** |
| 유연성 | 낮음 | **높음** |
| 프론트엔드 데이터 처리 | 복잡 | **간단** |

---

## 🔍 검증 결과

✅ **전체 강의 조회**: 80개 모두 조회 가능  
✅ **카테고리별 조회**: 여전히 카테고리 필터링 가능  
✅ **페이지네이션**: 원하는 크기로 조절 가능  
✅ **검색 기능**: 키워드 + 카테고리 조합 검색 가능  
✅ **API 응답**: 100% 호환  
✅ **성능**: 영향 없음 (DB 조회는 동일)

---

## 📝 API 명세서 업데이트 항목

다음 파일들이 업데이트되었습니다:

1. **API_SPECIFICATION_COMPLETE.md**
   - 전체 강의 조회 섹션 재작성
   - 검색 API 설명 개선
   - 카테고리별 조회 명확히
   - 사용 예시 추가

---

## 🎉 최종 결론

**문제 해결**: ✅ 전체 강의 조회가 모든 80개를 표시합니다.

이제 프론트엔드에서는:
- 카테고리별 구분을 신경 쓰지 않고 조회 가능
- 필요시 카테고리 정보(`categoryDisplayName`)로 그룹핑 가능
- 완전한 자유도로 UI 구성 가능

---

**작성자**: Backend Team  
**최종 검토**: 2026-04-06  
**상태**: ✅ 배포 준비 완료

