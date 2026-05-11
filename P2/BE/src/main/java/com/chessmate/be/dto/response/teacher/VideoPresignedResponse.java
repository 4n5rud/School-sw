package com.chessmate.be.dto.response.teacher;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoPresignedResponse {
    private String uploadUrl;
    private String objectKey;
    private LocalDateTime expiresAt;
    private long maxFileSize;
}