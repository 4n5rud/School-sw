package com.chessmate.be.dto.response;

import com.chessmate.be.entity.Enrollment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentResponse {
    private Long id;
    private Long memberId;
    private Long courseId;
    private String courseTitle;
    private LocalDateTime enrolledAt;
    private Boolean isCompleted;

    public static EnrollmentResponse from(Enrollment enrollment) {
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .memberId(enrollment.getMember().getId())
                .courseId(enrollment.getCourse().getId())
                .courseTitle(enrollment.getCourse().getTitle())
                .enrolledAt(enrollment.getEnrolledAt())
                .isCompleted(enrollment.getIsCompleted())
                .build();
    }
}

