package com.chessmate.be.repository;

import com.chessmate.be.entity.LectureProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LectureProgressRepository extends JpaRepository<LectureProgress, Long> {
    List<LectureProgress> findByMemberId(Long memberId);
    Optional<LectureProgress> findByMemberIdAndLectureId(Long memberId, Long lectureId);

    List<LectureProgress> findByMemberIdAndLectureIdIn(Long memberId, List<Long> lectureIds);

    List<LectureProgress> findByLectureIdIn(List<Long> lectureIds);

    long countByLectureIdAndIsCompletedTrue(Long lectureId);

    long countByLectureId(Long lectureId);

    @Query("SELECT lp FROM LectureProgress lp WHERE lp.member.id = :memberId AND lp.lecture.id IN :lectureIds")
    List<LectureProgress> findByMemberAndLectures(
        @Param("memberId") Long memberId,
        @Param("lectureIds") List<Long> lectureIds
    );
}