package com.chessmate.be.dto.request.teacher;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class SectionReorderRequest {
    @NotEmpty(message = "섹션 순서 목록은 필수입니다")
    private List<SectionOrderItem> sectionOrders;

    @Data
    public static class SectionOrderItem {
        private Long sectionId;
        private Integer sortOrder;
    }
}