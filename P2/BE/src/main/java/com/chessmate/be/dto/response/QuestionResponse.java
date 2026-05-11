package com.chessmate.be.dto.response;

import com.chessmate.be.entity.CourseQuestion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.format.DateTimeFormatter;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponse {

    private Long id;
    private Long courseId;
    private Long memberId;
    private String memberNickname;
    private String title;
    private String content;
    private String answer;
    private String answeredAt;
    private boolean isResolved;
    private String createdAt;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    public static QuestionResponse from(CourseQuestion question) {
        return QuestionResponse.builder()
                .id(question.getId())
                .courseId(question.getCourse().getId())
                .memberId(question.getMember().getId())
                .memberNickname(question.getMember().getNickname())
                .title(question.getTitle())
                .content(question.getContent())
                .answer(question.getAnswer())
                .answeredAt(question.getAnsweredAt() != null ? question.getAnsweredAt().format(FORMATTER) : null)
                .isResolved(question.isResolved())
                .createdAt(question.getCreatedAt() != null ? question.getCreatedAt().format(FORMATTER) : null)
                .build();
    }
}
