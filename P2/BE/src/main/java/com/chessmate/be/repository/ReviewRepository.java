package com.chessmate.be.repository;

import com.chessmate.be.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByCourse_IdOrderByCreatedAtDesc(Long courseId);

    Optional<Review> findByMember_IdAndCourse_Id(Long memberId, Long courseId);

    boolean existsByMember_IdAndCourse_Id(Long memberId, Long courseId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.course.id = :courseId")
    Double findAverageRatingByCourseId(@Param("courseId") Long courseId);

    long countByCourse_Id(Long courseId);
}
