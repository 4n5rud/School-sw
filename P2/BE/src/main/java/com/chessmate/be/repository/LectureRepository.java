package com.chessmate.be.repository;

import com.chessmate.be.entity.Lecture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LectureRepository extends JpaRepository<Lecture, Long> {
    List<Lecture> findBySectionId(Long sectionId);

    List<Lecture> findBySectionIdOrderBySortOrder(Long sectionId);

    @Query("SELECT l FROM Lecture l WHERE l.section.course.id = :courseId")
    List<Lecture> findByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT COALESCE(MAX(l.sortOrder), 0) FROM Lecture l WHERE l.section.id = :sectionId")
    int findMaxSortOrderBySectionId(@Param("sectionId") Long sectionId);
}
