package com.chessmate.be.repository;

import com.chessmate.be.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    @Query("SELECT c FROM Course c JOIN FETCH c.instructor WHERE c.id = :id")
    Optional<Course> findByIdWithInstructor(@Param("id") Long id);

    @Query("SELECT c FROM Course c JOIN FETCH c.instructor ORDER BY c.createdAt DESC")
    Page<Course> findAll(Pageable pageable);

    @Query("SELECT c FROM Course c JOIN FETCH c.instructor WHERE c.category = :category ORDER BY c.createdAt DESC")
    Page<Course> findByCategory(@Param("category") Course.CourseCategory category, Pageable pageable);

    @Query("SELECT c FROM Course c JOIN FETCH c.instructor WHERE c.instructor.id = :instructorId ORDER BY c.createdAt DESC")
    Page<Course> findByInstructorId(@Param("instructorId") Long instructorId, Pageable pageable);

    @Query("SELECT c FROM Course c JOIN FETCH c.instructor WHERE c.instructor.id = :instructorId ORDER BY c.createdAt DESC")
    List<Course> findAllByInstructorId(@Param("instructorId") Long instructorId);

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

    long countByCategory(Course.CourseCategory category);

    long countByInstructorId(Long instructorId);
}