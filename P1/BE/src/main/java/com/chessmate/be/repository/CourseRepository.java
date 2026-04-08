package com.chessmate.be.repository;

import com.chessmate.be.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    /**
     * 강의와 강사 정보를 함께 조회 (N+1 문제 해결)
     */
    @Query("SELECT c FROM Course c JOIN FETCH c.instructor WHERE c.id = :id")
    Optional<Course> findByIdWithInstructor(@Param("id") Long id);

    /**
     * 전체 강의 조회 (JOIN FETCH - instructor 정보 포함)
     */
    @Query("SELECT c FROM Course c JOIN FETCH c.instructor ORDER BY c.createdAt DESC")
    Page<Course> findAll(Pageable pageable);

    /**
     * Enum 기반 카테고리로 강의 조회 (JOIN FETCH)
     */
    @Query("SELECT c FROM Course c JOIN FETCH c.instructor WHERE c.category = :category ORDER BY c.createdAt DESC")
    Page<Course> findByCategory(@Param("category") Course.CourseCategory category, Pageable pageable);

    /**
     * 강사별 강의 조회 (JOIN FETCH)
     */
    @Query("SELECT c FROM Course c JOIN FETCH c.instructor WHERE c.instructor.id = :instructorId ORDER BY c.createdAt DESC")
    Page<Course> findByInstructorId(@Param("instructorId") Long instructorId, Pageable pageable);

    /**
     * 키워드와 카테고리로 강의 검색 (Enum 기반, JOIN FETCH)
     */
    @Query("""
        SELECT c FROM Course c
        JOIN FETCH c.instructor
        WHERE c.title LIKE %:keyword%
          AND (:category IS NULL OR c.category = :category)
        ORDER BY c.createdAt DESC
    """)
    Page<Course> searchByKeywordAndCategory(
        @Param("keyword") String keyword,
        @Param("category") Course.CourseCategory category,
        Pageable pageable
    );

    /**
     * 카테고리별 강의 개수 조회
     */
    long countByCategory(Course.CourseCategory category);
}
