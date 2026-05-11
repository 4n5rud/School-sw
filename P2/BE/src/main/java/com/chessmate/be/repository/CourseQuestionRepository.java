package com.chessmate.be.repository;

import com.chessmate.be.entity.CourseQuestion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseQuestionRepository extends JpaRepository<CourseQuestion, Long> {

    Page<CourseQuestion> findByCourse_IdOrderByCreatedAtDesc(Long courseId, Pageable pageable);

    List<CourseQuestion> findByMember_IdOrderByCreatedAtDesc(Long memberId);
}
