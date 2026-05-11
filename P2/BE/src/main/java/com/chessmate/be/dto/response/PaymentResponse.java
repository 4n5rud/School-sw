package com.chessmate.be.dto.response;

import com.chessmate.be.entity.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.format.DateTimeFormatter;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {

    private Long id;
    private String orderId;
    private Long courseId;
    private String courseTitle;
    private int amount;
    private String status;
    private String paymentMethod;
    private String paidAt;
    private String createdAt;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    public static PaymentResponse from(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .courseId(payment.getCourse().getId())
                .courseTitle(payment.getCourse().getTitle())
                .amount(payment.getAmount())
                .status(payment.getStatus().name())
                .paymentMethod(payment.getPaymentMethod())
                .paidAt(payment.getPaidAt() != null ? payment.getPaidAt().format(FORMATTER) : null)
                .createdAt(payment.getCreatedAt() != null ? payment.getCreatedAt().format(FORMATTER) : null)
                .build();
    }
}
