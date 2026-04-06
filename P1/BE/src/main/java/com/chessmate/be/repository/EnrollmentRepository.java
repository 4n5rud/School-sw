package com.chessmate.be.repository;

import com.chessmate.be.entity.Enrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByMemberId(Long memberId);
    List<Enrollment> findByCourseId(Long courseId);
    Optional<Enrollment> findByMemberIdAndCourseId(Long memberId, Long courseId);

    /**
     * 멤버와 강의로 수강 여부 확인
     */
    Optional<Enrollment> findByMemberAndCourse(com.chessmate.be.entity.Member member, com.chessmate.be.entity.Course course);

    /**
     * 강의별 수강생 수 조회
     */
    Integer countByCourseId(Long courseId);

    /**
     * 멤버별 수강 목록 조회 (페이지네이션)
     */
    @Query("SELECT e FROM Enrollment e JOIN FETCH e.course WHERE e.member.id = :memberId")
    Page<Enrollment> findByMemberIdWithCourse(@Param("memberId") Long memberId, Pageable pageable);
}



