package com.chessmate.be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseReviewSummary {

    private double averageRating;
    private long totalCount;
    private Map<Integer, Long> ratingDistribution;
}
