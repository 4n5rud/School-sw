package com.chessmate.be.controller;

import com.chessmate.be.dto.request.PaymentCreateRequest;
import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.PaymentResponse;
import com.chessmate.be.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 결제 API 컨트롤러
 * 결제 생성, 조회, 환불 엔드포인트 제공
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * 결제 생성 (더미 결제)
     * POST /api/payments
     *
     * @param request 결제 요청 (courseId, paymentMethod)
     * @return 결제 정보
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @RequestBody PaymentCreateRequest request) {

        Long memberId = extractMemberIdFromAuthentication();
        log.info("Create payment: course {} by member {}", request.getCourseId(), memberId);

        PaymentResponse payment = paymentService.createPayment(request, memberId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(payment, "결제가 완료되었습니다")
        );
    }

    /**
     * 내 결제 내역 목록 조회
     * GET /api/payments
     *
     * @return 결제 내역 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPayments() {

        Long memberId = extractMemberIdFromAuthentication();
        log.debug("Get payments for member: {}", memberId);

        List<PaymentResponse> payments = paymentService.getMyPayments(memberId);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    /**
     * 결제 상세 조회
     * GET /api/payments/{orderId}
     *
     * @param orderId 주문 ID
     * @return 결제 정보
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(
            @PathVariable String orderId) {

        Long memberId = extractMemberIdFromAuthentication();
        log.debug("Get payment: {} by member: {}", orderId, memberId);

        PaymentResponse payment = paymentService.getPayment(orderId, memberId);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    /**
     * 결제 환불
     * POST /api/payments/{orderId}/refund
     *
     * @param orderId 주문 ID
     * @return 환불된 결제 정보
     */
    @PostMapping("/{orderId}/refund")
    public ResponseEntity<ApiResponse<PaymentResponse>> refundPayment(
            @PathVariable String orderId) {

        Long memberId = extractMemberIdFromAuthentication();
        log.info("Refund payment: {} by member: {}", orderId, memberId);

        PaymentResponse payment = paymentService.refundPayment(orderId, memberId);
        return ResponseEntity.ok(ApiResponse.success(payment, "환불이 완료되었습니다"));
    }

    /**
     * SecurityContext에서 Member ID 추출
     */
    private Long extractMemberIdFromAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();

        if (principal instanceof Long) {
            return (Long) principal;
        }

        return Long.parseLong(principal.toString());
    }
}
