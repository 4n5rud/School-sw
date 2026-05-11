package com.chessmate.be.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentCreateRequest {

    private Long courseId;

    @Builder.Default
    private String paymentMethod = "CARD";
}
