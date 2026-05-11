package com.chessmate.be.repository;

import com.chessmate.be.entity.VideoUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VideoUploadRepository extends JpaRepository<VideoUpload, Long> {
    Optional<VideoUpload> findByLectureId(Long lectureId);
}