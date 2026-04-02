package com.chessmate.be.repository;

import com.chessmate.be.entity.LectureProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LectureProgressRepository extends JpaRepository<LectureProgress, Long> {
    List<LectureProgress> findByMemberId(Long memberId);
    Optional<LectureProgress> findByMemberIdAndLectureId(Long memberId, Long lectureId);
}

