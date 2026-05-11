package com.chessmate.be.controller;

import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.WishlistResponse;
import com.chessmate.be.service.WishlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 위시리스트 API 컨트롤러
 * 위시리스트 조회, 토글, 상태 확인 엔드포인트 제공
 */
@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@Slf4j
public class WishlistController {

    private final WishlistService wishlistService;

    /**
     * 내 위시리스트 조회
     * GET /api/wishlist
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<WishlistResponse>>> getMyWishlist() {
        Long memberId = currentMemberId();
        log.debug("Get wishlist for member: {}", memberId);

        List<WishlistResponse> wishlist = wishlistService.getMyWishlist(memberId);
        return ResponseEntity.ok(ApiResponse.success(wishlist));
    }

    /**
     * 위시리스트 토글 (추가/제거)
     * POST /api/wishlist/{courseId}
     */
    @PostMapping("/{courseId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleWishlist(
            @PathVariable Long courseId) {
        Long memberId = currentMemberId();
        log.info("Toggle wishlist for course: {} by member: {}", courseId, memberId);

        boolean added = wishlistService.toggle(courseId, memberId);
        String message = added ? "위시리스트에 추가되었습니다" : "위시리스트에서 제거되었습니다";
        return ResponseEntity.ok(ApiResponse.success(Map.of("wishlisted", added), message));
    }

    /**
     * 위시리스트 등록 여부 확인
     * GET /api/wishlist/{courseId}/status
     */
    @GetMapping("/{courseId}/status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> getWishlistStatus(
            @PathVariable Long courseId) {
        Long memberId = currentMemberId();
        log.debug("Check wishlist status for course: {} by member: {}", courseId, memberId);

        boolean wishlisted = wishlistService.isWishlisted(courseId, memberId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("wishlisted", wishlisted)));
    }

    /**
     * SecurityContext에서 Member ID 추출
     */
    private Long currentMemberId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();

        if (principal instanceof Long) {
            return (Long) principal;
        }

        return Long.parseLong(principal.toString());
    }
}
