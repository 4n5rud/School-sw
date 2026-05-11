package com.chessmate.be.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSearchRequest {
    private String keyword;      // 검색 키워드 (제목, 설명)
    private String category;     // STOCK, CRYPTO (optional)
    private Integer page;        // 페이지 번호 (기본값: 0)
    private Integer size;        // 페이지 크기 (기본값: 10)
}

