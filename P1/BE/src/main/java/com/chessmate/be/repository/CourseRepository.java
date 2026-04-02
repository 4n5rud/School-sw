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
     * 카테고리별 강의 조회
     */
    Page<Course> findByCategory(String category, Pageable pageable);

    /**
     * 강사별 강의 조회
     */
    Page<Course> findByInstructorId(Long instructorId, Pageable pageable);

    /**
     * 강사별 강의 조회 (JOIN FETCH)
     */
    @Query("SELECT c FROM Course c JOIN FETCH c.instructor WHERE c.instructor.id = :instructorId")
    Page<Course> findByInstructorIdWithInstructor(@Param("instructorId") Long instructorId, Pageable pageable);
}

