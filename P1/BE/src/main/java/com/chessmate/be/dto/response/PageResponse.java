package com.chessmate.be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * 페이지네이션 응답 DTO
 *
 * 페이지 단위로 데이터를 조회할 때 사용합니다.
 *
 * @param <T> 데이터 타입
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageResponse<T> {

    /** 현재 페이지의 데이터 목록 */
    private List<T> content;

    /** 현재 페이지 번호 (0-based) */
    private Integer page;

    /** 페이지 크기 (한 페이지의 데이터 개수) */
    private Integer size;

    /** 전체 데이터 개수 */
    private Long totalElements;

    /** 전체 페이지 개수 */
    private Integer totalPages;

    /** 다음 페이지 존재 여부 */
    private Boolean hasNext;
}

