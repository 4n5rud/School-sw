package com.chessmate.be.repository;

import com.chessmate.be.entity.Enrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByMemberId(Long memberId);
    List<Enrollment> findByCourseId(Long courseId);
    Optional<Enrollment> findByMemberIdAndCourseId(Long memberId, Long courseId);
    Optional<Enrollment> findByMemberAndCourse(com.chessmate.be.entity.Member member, com.chessmate.be.entity.Course course);

    Integer countByCourseId(Long courseId);

    @Query("SELECT e FROM Enrollment e JOIN FETCH e.course WHERE e.member.id = :memberId")
    Page<Enrollment> findByMemberIdWithCourse(@Param("memberId") Long memberId, Pageable pageable);

    @Query("SELECT new map(e.course.id as courseId, COUNT(e) as count) FROM Enrollment e WHERE e.course.id IN :courseIds GROUP BY e.course.id")
    List<Map<String, Object>> countEnrollmentsByCourseIds(@Param("courseIds") List<Long> courseIds);

    @Query("SELECT e FROM Enrollment e JOIN FETCH e.member WHERE e.course.id = :courseId")
    List<Enrollment> findByCourseIdWithMember(@Param("courseId") Long courseId);

    long countByCourseIdAndIsCompletedTrue(Long courseId);
}
