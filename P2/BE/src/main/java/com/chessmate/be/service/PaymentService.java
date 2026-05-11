package com.chessmate.be.service;

import com.chessmate.be.dto.request.EnrollmentCreateRequest;
import com.chessmate.be.dto.request.PaymentCreateRequest;
import com.chessmate.be.dto.response.PaymentResponse;
import com.chessmate.be.entity.Course;
import com.chessmate.be.entity.Member;
import com.chessmate.be.entity.Payment;
import com.chessmate.be.exception.AccessDeniedException;
import com.chessmate.be.exception.EntityNotFoundException;
import com.chessmate.be.repository.CourseRepository;
import com.chessmate.be.repository.EnrollmentRepository;
import com.chessmate.be.repository.MemberRepository;
import com.chessmate.be.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 결제 서비스 (더미 결제 - 실제 PG 연동 없음)
 * 결제 생성, 조회, 환불 기능 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final MemberRepository memberRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;

    /**
     * 결제 생성 (더미 - 즉시 완료 처리)
     *
     * @param request  결제 요청 (courseId, paymentMethod)
     * @param memberId 회원 ID (JWT에서 추출)
     * @return 결제 정보
     */
    @Transactional
    public PaymentResponse createPayment(PaymentCreateRequest request, Long memberId) {
        log.info("Create payment: course {} by member {}", request.getCourseId(), memberId);

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("강의를 찾을 수 없습니다"));

        // 이미 결제(완료) 또는 수강 중인지 확인
        boolean alreadyPaid = paymentRepository.existsByMember_IdAndCourse_IdAndStatus(
                memberId, course.getId(), Payment.Status.COMPLETED);
        if (alreadyPaid) {
            throw new IllegalArgumentException("이미 결제 완료된 강의입니다");
        }

        boolean alreadyEnrolled = enrollmentRepository.findByMemberIdAndCourseId(memberId, course.getId()).isPresent();
        if (alreadyEnrolled) {
            throw new IllegalArgumentException("이미 수강 중인 강의입니다");
        }

        // 무료 강의는 바로 수강 등록
        if (course.getPrice() == null || course.getPrice() == 0) {
            log.info("Free course - auto enroll: course {} for member {}", course.getId(), memberId);
            EnrollmentCreateRequest enrollRequest = new EnrollmentCreateRequest();
            enrollRequest.setCourseId(course.getId());
            enrollmentService.enrollCourse(enrollRequest, memberId);

            // 무료 결제 내역 생성 (amount=0, COMPLETED)
            Payment freePayment = Payment.builder()
                    .member(member)
                    .course(course)
                    .amount(0)
                    .status(Payment.Status.COMPLETED)
                    .paymentMethod("FREE")
                    .paidAt(LocalDateTime.now())
                    .build();
            Payment saved = paymentRepository.save(freePayment);
            log.info("Free payment created: {}", saved.getId());
            return PaymentResponse.from(saved);
        }

        // 유료 강의: PENDING 생성 후 즉시 COMPLETED (더미)
        String method = request.getPaymentMethod() != null ? request.getPaymentMethod() : "CARD";

        Payment payment = Payment.builder()
                .member(member)
                .course(course)
                .amount(course.getPrice())
                .status(Payment.Status.PENDING)
                .paymentMethod(method)
                .build();

        payment = paymentRepository.save(payment);
        log.info("Payment created (PENDING): {}", payment.getId());

        // 더미 결제 즉시 완료
        payment.setStatus(Payment.Status.COMPLETED);
        payment.setPaidAt(LocalDateTime.now());
        payment = paymentRepository.save(payment);
        log.info("Payment completed (COMPLETED): {}", payment.getId());

        // 수강 등록
        EnrollmentCreateRequest enrollRequest = new EnrollmentCreateRequest();
        enrollRequest.setCourseId(course.getId());
        enrollmentService.enrollCourse(enrollRequest, memberId);

        return PaymentResponse.from(payment);
    }

    /**
     * 내 결제 내역 목록 조회
     *
     * @param memberId 회원 ID
     * @return 결제 내역 목록
     */
    public List<PaymentResponse> getMyPayments(Long memberId) {
        log.debug("Get payments for member: {}", memberId);
        return paymentRepository.findByMember_IdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(PaymentResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 결제 상세 조회
     *
     * @param orderId  주문 ID
     * @param memberId 요청한 회원 ID
     * @return 결제 정보
     */
    public PaymentResponse getPayment(String orderId, Long memberId) {
        log.debug("Get payment: {} by member: {}", orderId, memberId);
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new EntityNotFoundException("결제 내역을 찾을 수 없습니다"));

        if (!payment.getMember().getId().equals(memberId)) {
            throw new AccessDeniedException("해당 결제 내역에 접근 권한이 없습니다");
        }

        return PaymentResponse.from(payment);
    }

    /**
     * 결제 환불
     *
     * @param orderId  주문 ID
     * @param memberId 요청한 회원 ID
     * @return 환불된 결제 정보
     */
    @Transactional
    public PaymentResponse refundPayment(String orderId, Long memberId) {
        log.info("Refund payment: {} by member: {}", orderId, memberId);

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new EntityNotFoundException("결제 내역을 찾을 수 없습니다"));

        if (!payment.getMember().getId().equals(memberId)) {
            throw new AccessDeniedException("해당 결제 내역에 접근 권한이 없습니다");
        }

        if (payment.getStatus() != Payment.Status.COMPLETED) {
            throw new IllegalArgumentException("완료된 결제만 환불할 수 있습니다");
        }

        payment.setStatus(Payment.Status.REFUNDED);
        Payment refunded = paymentRepository.save(payment);
        log.info("Payment refunded: {}", refunded.getId());

        // 수강 등록 취소
        Long courseId = refunded.getCourse().getId();
        enrollmentRepository.findByMemberIdAndCourseId(memberId, courseId)
                .ifPresent(enrollment -> {
                    enrollmentRepository.delete(enrollment);
                    log.info("Enrollment deleted for member {} course {}", memberId, courseId);
                });

        return PaymentResponse.from(refunded);
    }
}
