package com.chessmate.be.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "lecture")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lecture {

    public enum UploadStatus {
        PENDING,
        PRESIGNED,
        UPLOADING,
        UPLOADED,
        CONFIRMED,
        FAILED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(nullable = false)
    private String title;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "play_time")
    private Integer playTime;

    @Column(nullable = false)
    private Integer sortOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "upload_status")
    @Builder.Default
    private UploadStatus uploadStatus = UploadStatus.PENDING;
}