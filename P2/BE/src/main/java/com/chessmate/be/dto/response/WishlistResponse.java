package com.chessmate.be.dto.response;

import com.chessmate.be.entity.Wishlist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistResponse {

    private Long id;
    private Long courseId;
    private String courseTitle;
    private String courseThumbnailUrl;
    private int coursePrice;
    private String instructorNickname;
    private String createdAt;

    public static WishlistResponse from(Wishlist wishlist) {
        return WishlistResponse.builder()
                .id(wishlist.getId())
                .courseId(wishlist.getCourse().getId())
                .courseTitle(wishlist.getCourse().getTitle())
                .courseThumbnailUrl(wishlist.getCourse().getThumbnailUrl())
                .coursePrice(wishlist.getCourse().getPrice() != null ? wishlist.getCourse().getPrice() : 0)
                .instructorNickname(wishlist.getCourse().getInstructor().getNickname())
                .createdAt(wishlist.getCreatedAt() != null ? wishlist.getCreatedAt().toString() : null)
                .build();
    }
}
