package com.chessmate.be.dto.response.teacher;

import com.chessmate.be.entity.Lecture;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoConfirmResponse {
    private Long lectureId;
    private String videoUrl;
    private Lecture.UploadStatus uploadStatus;
    private LocalDateTime confirmedAt;
}