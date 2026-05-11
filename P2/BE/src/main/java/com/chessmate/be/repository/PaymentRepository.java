package com.chessmate.be.repository;

import com.chessmate.be.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByMember_IdOrderByCreatedAtDesc(Long memberId);

    Optional<Payment> findByOrderId(String orderId);

    boolean existsByMember_IdAndCourse_IdAndStatus(Long memberId, Long courseId, Payment.Status status);
}
