package com.chessmate.be.repository;

import com.chessmate.be.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    List<Wishlist> findByMember_IdOrderByCreatedAtDesc(Long memberId);

    boolean existsByMember_IdAndCourse_Id(Long memberId, Long courseId);

    Optional<Wishlist> findByMember_IdAndCourse_Id(Long memberId, Long courseId);

    void deleteByMember_IdAndCourse_Id(Long memberId, Long courseId);
}
