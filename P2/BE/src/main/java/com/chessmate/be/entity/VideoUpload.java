package com.chessmate.be.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "video_upload")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoUpload {

    public enum UploadStatus {
        PRESIGNED,
        UPLOADED,
        CONFIRMED,
        FAILED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecture_id", nullable = false, unique = true)
    private Lecture lecture;

    @Column(name = "r2_object_key")
    private String r2ObjectKey;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type")
    private String contentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "upload_status")
    private UploadStatus uploadStatus;

    @Column(name = "upload_started_at")
    private LocalDateTime uploadStartedAt;

    @Column(name = "upload_completed_at")
    private LocalDateTime uploadCompletedAt;

    @PrePersist
    protected void onCreate() {
        uploadStartedAt = LocalDateTime.now();
    }
}