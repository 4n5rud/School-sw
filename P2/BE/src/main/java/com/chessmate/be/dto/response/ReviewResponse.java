package com.chessmate.be.dto.response;

import com.chessmate.be.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private Long id;
    private Long courseId;
    private Long memberId;
    private String memberNickname;
    private int rating;
    private String content;
    private String createdAt;

    public static ReviewResponse from(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .courseId(review.getCourse().getId())
                .memberId(review.getMember().getId())
                .memberNickname(review.getMember().getNickname())
                .rating(review.getRating())
                .content(review.getContent())
                .createdAt(review.getCreatedAt() != null ? review.getCreatedAt().toString() : null)
                .build();
    }
}
