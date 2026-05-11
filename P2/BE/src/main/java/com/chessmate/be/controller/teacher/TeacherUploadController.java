package com.chessmate.be.controller.teacher;

import com.chessmate.be.dto.request.teacher.ThumbnailConfirmRequest;
import com.chessmate.be.dto.request.teacher.ThumbnailPresignedRequest;
import com.chessmate.be.dto.request.teacher.VideoConfirmRequest;
import com.chessmate.be.dto.request.teacher.VideoPresignedRequest;
import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.teacher.ThumbnailConfirmResponse;
import com.chessmate.be.dto.response.teacher.ThumbnailPresignedResponse;
import com.chessmate.be.dto.response.teacher.VideoConfirmResponse;
import com.chessmate.be.dto.response.teacher.VideoPresignedResponse;
import com.chessmate.be.service.teacher.TeacherUploadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/teacher/uploads")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('TEACHER')")
public class TeacherUploadController {

    private final TeacherUploadService teacherUploadService;

    @PostMapping("/video-presigned")
    public ResponseEntity<ApiResponse<VideoPresignedResponse>> getVideoPresignedUrl(
            @Valid @RequestBody VideoPresignedRequest request) {
        VideoPresignedResponse response = teacherUploadService.generateVideoPresignedUrl(request, currentMemberId());
        return ResponseEntity.ok(ApiResponse.success(response, "업로드 URL이 발급되었습니다."));
    }

    @PostMapping("/video-confirm")
    public ResponseEntity<ApiResponse<VideoConfirmResponse>> confirmVideoUpload(
            @Valid @RequestBody VideoConfirmRequest request) {
        VideoConfirmResponse response = teacherUploadService.confirmVideoUpload(request, currentMemberId());
        return ResponseEntity.ok(ApiResponse.success(response, "영상 업로드가 확인되었습니다."));
    }

    @PostMapping("/thumbnail-presigned")
    public ResponseEntity<ApiResponse<ThumbnailPresignedResponse>> getThumbnailPresignedUrl(
            @Valid @RequestBody ThumbnailPresignedRequest request) {
        ThumbnailPresignedResponse response = teacherUploadService.generateThumbnailPresignedUrl(request, currentMemberId());
        return ResponseEntity.ok(ApiResponse.success(response, "썸네일 업로드 URL이 발급되었습니다."));
    }

    @PostMapping("/thumbnail-confirm")
    public ResponseEntity<ApiResponse<ThumbnailConfirmResponse>> confirmThumbnailUpload(
            @Valid @RequestBody ThumbnailConfirmRequest request) {
        ThumbnailConfirmResponse response = teacherUploadService.confirmThumbnailUpload(request, currentMemberId());
        return ResponseEntity.ok(ApiResponse.success(response, "썸네일 업로드가 확인되었습니다."));
    }

    private Long currentMemberId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth.getPrincipal();
        if (principal instanceof Long) return (Long) principal;
        return Long.parseLong(principal.toString());
    }
}