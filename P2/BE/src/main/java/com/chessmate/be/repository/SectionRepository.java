package com.chessmate.be.repository;

import com.chessmate.be.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByCourseId(Long courseId);

    @Query("SELECT s FROM Section s JOIN FETCH s.lectures WHERE s.course.id = :courseId ORDER BY s.sortOrder ASC")
    List<Section> findByCourseIdWithLectures(@Param("courseId") Long courseId);

    @Query("SELECT COALESCE(MAX(s.sortOrder), 0) FROM Section s WHERE s.course.id = :courseId")
    int findMaxSortOrderByCourseId(@Param("courseId") Long courseId);
}
