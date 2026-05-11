package com.chessmate.be.service;

import com.chessmate.be.dto.request.ReviewCreateRequest;
import com.chessmate.be.dto.response.CourseReviewSummary;
import com.chessmate.be.dto.response.ReviewResponse;
import com.chessmate.be.entity.Course;
import com.chessmate.be.entity.Member;
import com.chessmate.be.entity.Review;
import com.chessmate.be.exception.EntityNotFoundException;
import com.chessmate.be.repository.CourseRepository;
import com.chessmate.be.repository.EnrollmentRepository;
import com.chessmate.be.repository.MemberRepository;
import com.chessmate.be.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 리뷰 서비스
 * 강의 리뷰 작성, 조회, 삭제 기능 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CourseRepository courseRepository;
    private final MemberRepository memberRepository;
    private final EnrollmentRepository enrollmentRepository;

    /**
     * 리뷰 작성 또는 수정 (upsert)
     * 이미 작성한 리뷰가 있으면 수정, 없으면 새로 작성
     *
     * @param courseId 강의 ID
     * @param request  리뷰 요청 (rating, content)
     * @param memberId 회원 ID
     * @return 리뷰 정보
     * @throws IllegalArgumentException 수강 등록하지 않은 강의인 경우
     */
    @Transactional
    public ReviewResponse createOrUpdateReview(Long courseId, ReviewCreateRequest request, Long memberId) {
        log.info("Create or update review for course: {} by member: {}", courseId, memberId);

        // 1. 강의 조회
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new EntityNotFoundException("강의를 찾을 수 없습니다"));

        // 2. 수강 여부 확인
        boolean isEnrolled = enrollmentRepository.findByMemberIdAndCourseId(memberId, courseId).isPresent();
        if (!isEnrolled) {
            log.warn("Member {} is not enrolled in course {}", memberId, courseId);
            throw new IllegalArgumentException("수강 등록한 강의에만 리뷰를 작성할 수 있습니다");
        }

        // 3. 회원 조회
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        // 4. 기존 리뷰가 있으면 수정, 없으면 새로 생성 (upsert)
        Optional<Review> existingReview = reviewRepository.findByMember_IdAndCourse_Id(memberId, courseId);

        Review review;
        if (existingReview.isPresent()) {
            review = existingReview.get();
            review.setRating(request.getRating());
            review.setContent(request.getContent());
            log.info("Review updated for course: {} by member: {}", courseId, memberId);
        } else {
            review = Review.builder()
                    .member(member)
                    .course(course)
                    .rating(request.getRating())
                    .content(request.getContent())
                    .build();
            log.info("Review created for course: {} by member: {}", courseId, memberId);
        }

        Review saved = reviewRepository.save(review);
        return ReviewResponse.from(saved);
    }

    /**
     * 리뷰 삭제
     *
     * @param courseId 강의 ID
     * @param memberId 회원 ID
     * @throws EntityNotFoundException 리뷰를 찾을 수 없는 경우
     */
    @Transactional
    public void deleteReview(Long courseId, Long memberId) {
        log.info("Delete review for course: {} by member: {}", courseId, memberId);

        Review review = reviewRepository.findByMember_IdAndCourse_Id(memberId, courseId)
                .orElseThrow(() -> new EntityNotFoundException("리뷰를 찾을 수 없습니다"));

        reviewRepository.delete(review);
        log.info("Review deleted for course: {} by member: {}", courseId, memberId);
    }

    /**
     * 강의 리뷰 목록 조회 (최신순)
     *
     * @param courseId 강의 ID
     * @return 리뷰 목록
     */
    public List<ReviewResponse> getCourseReviews(Long courseId) {
        log.debug("Get reviews for course: {}", courseId);

        return reviewRepository.findByCourse_IdOrderByCreatedAtDesc(courseId)
                .stream()
                .map(ReviewResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 강의 리뷰 요약 통계 조회
     *
     * @param courseId 강의 ID
     * @return 리뷰 요약 (평균 평점, 총 수, 평점 분포)
     */
    public CourseReviewSummary getCourseReviewSummary(Long courseId) {
        log.debug("Get review summary for course: {}", courseId);

        Double averageRating = reviewRepository.findAverageRatingByCourseId(courseId);
        long totalCount = reviewRepository.countByCourse_Id(courseId);

        // 평점 분포 계산 (1~5점 각각 몇 개인지)
        List<Review> reviews = reviewRepository.findByCourse_IdOrderByCreatedAtDesc(courseId);
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            ratingDistribution.put(i, 0L);
        }
        reviews.forEach(r -> ratingDistribution.merge(r.getRating(), 1L, Long::sum));

        return CourseReviewSummary.builder()
                .averageRating(averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0)
                .totalCount(totalCount)
                .ratingDistribution(ratingDistribution)
                .build();
    }
}
