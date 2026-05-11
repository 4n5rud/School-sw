package com.chessmate.be.service;

import com.chessmate.be.dto.response.WishlistResponse;
import com.chessmate.be.entity.Course;
import com.chessmate.be.entity.Member;
import com.chessmate.be.entity.Wishlist;
import com.chessmate.be.exception.EntityNotFoundException;
import com.chessmate.be.repository.CourseRepository;
import com.chessmate.be.repository.MemberRepository;
import com.chessmate.be.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 위시리스트 서비스
 * 위시리스트 토글, 조회, 상태 확인 기능 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final CourseRepository courseRepository;
    private final MemberRepository memberRepository;

    /**
     * 위시리스트 토글
     * 이미 추가된 경우 제거, 없는 경우 추가
     *
     * @param courseId 강의 ID
     * @param memberId 회원 ID
     * @return true: 추가됨, false: 제거됨
     */
    @Transactional
    public boolean toggle(Long courseId, Long memberId) {
        log.info("Toggle wishlist for course: {} by member: {}", courseId, memberId);

        Optional<Wishlist> existing = wishlistRepository.findByMember_IdAndCourse_Id(memberId, courseId);

        if (existing.isPresent()) {
            wishlistRepository.deleteByMember_IdAndCourse_Id(memberId, courseId);
            log.info("Wishlist removed for course: {} by member: {}", courseId, memberId);
            return false;
        }

        // 강의 및 회원 조회
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new EntityNotFoundException("강의를 찾을 수 없습니다"));
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        Wishlist wishlist = Wishlist.builder()
                .member(member)
                .course(course)
                .build();

        wishlistRepository.save(wishlist);
        log.info("Wishlist added for course: {} by member: {}", courseId, memberId);
        return true;
    }

    /**
     * 내 위시리스트 조회 (최신순)
     *
     * @param memberId 회원 ID
     * @return 위시리스트 목록
     */
    public List<WishlistResponse> getMyWishlist(Long memberId) {
        log.debug("Get wishlist for member: {}", memberId);

        return wishlistRepository.findByMember_IdOrderByCreatedAtDesc(memberId)
                .stream()
                .map(WishlistResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 위시리스트 등록 여부 확인
     *
     * @param courseId 강의 ID
     * @param memberId 회원 ID
     * @return true: 위시리스트에 있음, false: 없음
     */
    public boolean isWishlisted(Long courseId, Long memberId) {
        return wishlistRepository.existsByMember_IdAndCourse_Id(memberId, courseId);
    }
}
