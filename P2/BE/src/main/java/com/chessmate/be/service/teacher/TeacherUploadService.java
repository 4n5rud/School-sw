package com.chessmate.be.service.teacher;

import com.chessmate.be.dto.request.teacher.ThumbnailConfirmRequest;
import com.chessmate.be.dto.request.teacher.ThumbnailPresignedRequest;
import com.chessmate.be.dto.request.teacher.VideoConfirmRequest;
import com.chessmate.be.dto.request.teacher.VideoPresignedRequest;
import com.chessmate.be.dto.response.teacher.ThumbnailConfirmResponse;
import com.chessmate.be.dto.response.teacher.ThumbnailPresignedResponse;
import com.chessmate.be.dto.response.teacher.VideoConfirmResponse;
import com.chessmate.be.dto.response.teacher.VideoPresignedResponse;
import com.chessmate.be.entity.Course;
import com.chessmate.be.entity.Lecture;
import com.chessmate.be.entity.VideoUpload;
import com.chessmate.be.exception.EntityNotFoundException;
import com.chessmate.be.repository.CourseRepository;
import com.chessmate.be.repository.LectureRepository;
import com.chessmate.be.repository.VideoUploadRepository;
import com.chessmate.be.security.TeacherOwnershipValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TeacherUploadService {

    private static final long MAX_VIDEO_SIZE = 5L * 1024 * 1024 * 1024;
    private static final List<String> ALLOWED_VIDEO_TYPES = List.of("video/mp4", "video/webm");
    private static final List<String> ALLOWED_IMAGE_TYPES = List.of("image/jpeg", "image/png", "image/webp");

    private final S3Client r2Client;
    private final S3Presigner r2Presigner;
    private final LectureRepository lectureRepository;
    private final CourseRepository courseRepository;
    private final VideoUploadRepository videoUploadRepository;
    private final TeacherOwnershipValidator ownershipValidator;

    @Value("${cloudflare.r2.bucket}")
    private String bucket;

    @Value("${cloudflare.r2.public-cdn-url}")
    private String publicCdnUrl;

    @Value("${cloudflare.r2.presigned-url-expiry}")
    private long presignedUrlExpiry;

    @Transactional
    public VideoPresignedResponse generateVideoPresignedUrl(VideoPresignedRequest request, Long instructorId) {
        Lecture lecture = ownershipValidator.validateLectureOwner(request.getLectureId(), instructorId);

        if (!ALLOWED_VIDEO_TYPES.contains(request.getContentType())) {
            throw new IllegalArgumentException("허용되지 않은 파일 형식입니다. (허용: mp4, webm)");
        }
        if (request.getFileSize() > MAX_VIDEO_SIZE) {
            throw new IllegalArgumentException("파일 크기는 5GB 이하여야 합니다.");
        }

        String objectKey = "lectures/" + request.getLectureId() + "/" + UUID.randomUUID() + ".mp4";
        String uploadUrl = buildPresignedUrl(bucket, objectKey, request.getContentType());

        lecture.setUploadStatus(Lecture.UploadStatus.PRESIGNED);
        lectureRepository.save(lecture);

        // upsert: 기존 VideoUpload가 있으면 업데이트, 없으면 생성
        VideoUpload videoUpload = videoUploadRepository.findByLectureId(request.getLectureId())
                .orElse(VideoUpload.builder().lecture(lecture).build());
        videoUpload.setR2ObjectKey(objectKey);
        videoUpload.setOriginalFilename(request.getFilename());
        videoUpload.setFileSize(request.getFileSize());
        videoUpload.setContentType(request.getContentType());
        videoUpload.setUploadStatus(VideoUpload.UploadStatus.PRESIGNED);
        videoUpload.setUploadCompletedAt(null);
        if (videoUpload.getUploadStartedAt() == null) {
            videoUpload.setUploadStartedAt(LocalDateTime.now());
        }
        videoUploadRepository.save(videoUpload);

        return VideoPresignedResponse.builder()
                .uploadUrl(uploadUrl)
                .objectKey(objectKey)
                .expiresAt(LocalDateTime.now().plusSeconds(presignedUrlExpiry))
                .maxFileSize(MAX_VIDEO_SIZE)
                .build();
    }

    @Transactional
    public VideoConfirmResponse confirmVideoUpload(VideoConfirmRequest request, Long instructorId) {
        Lecture lecture = ownershipValidator.validateLectureOwner(request.getLectureId(), instructorId);

        verifyR2ObjectExists(bucket, request.getObjectKey());

        String videoUrl = publicCdnUrl + "/" + request.getObjectKey();
        lecture.setVideoUrl(videoUrl);
        lecture.setUploadStatus(Lecture.UploadStatus.CONFIRMED);
        if (request.getPlayTime() != null) {
            lecture.setPlayTime(request.getPlayTime());
        }
        lectureRepository.save(lecture);

        videoUploadRepository.findByLectureId(request.getLectureId()).ifPresent(upload -> {
            upload.setUploadStatus(VideoUpload.UploadStatus.CONFIRMED);
            upload.setUploadCompletedAt(LocalDateTime.now());
            videoUploadRepository.save(upload);
        });

        return VideoConfirmResponse.builder()
                .lectureId(lecture.getId())
                .videoUrl(videoUrl)
                .uploadStatus(Lecture.UploadStatus.CONFIRMED)
                .confirmedAt(LocalDateTime.now())
                .build();
    }

    @Transactional
    public ThumbnailPresignedResponse generateThumbnailPresignedUrl(ThumbnailPresignedRequest request, Long instructorId) {
        ownershipValidator.validateCourseOwner(request.getCourseId(), instructorId);

        if (!ALLOWED_IMAGE_TYPES.contains(request.getContentType())) {
            throw new IllegalArgumentException("허용되지 않은 이미지 형식입니다. (허용: jpeg, png, webp)");
        }

        String ext = request.getFilename().contains(".") ?
                request.getFilename().substring(request.getFilename().lastIndexOf('.')) : ".jpg";
        String objectKey = "courses/" + request.getCourseId() + "/thumbnail" + ext;
        String uploadUrl = buildPresignedUrl(bucket, objectKey, request.getContentType());

        return ThumbnailPresignedResponse.builder()
                .uploadUrl(uploadUrl)
                .objectKey(objectKey)
                .expiresAt(LocalDateTime.now().plusSeconds(presignedUrlExpiry))
                .build();
    }

    @Transactional
    public ThumbnailConfirmResponse confirmThumbnailUpload(ThumbnailConfirmRequest request, Long instructorId) {
        Course course = ownershipValidator.validateCourseOwner(request.getCourseId(), instructorId);

        verifyR2ObjectExists(bucket, request.getObjectKey());

        String thumbnailUrl = publicCdnUrl + "/" + request.getObjectKey();
        course.setThumbnailUrl(thumbnailUrl);
        courseRepository.save(course);

        return ThumbnailConfirmResponse.builder()
                .courseId(course.getId())
                .thumbnailUrl(thumbnailUrl)
                .confirmedAt(LocalDateTime.now())
                .build();
    }

    private String buildPresignedUrl(String bucket, String objectKey, String contentType) {
        try {
            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(presignedUrlExpiry))
                    .putObjectRequest(r -> r
                            .bucket(bucket)
                            .key(objectKey)
                            .contentType(contentType)
                            .build())
                    .build();
            return r2Presigner.presignPutObject(presignRequest).url().toString();
        } catch (Exception e) {
            log.error("R2 presigned URL 생성 실패: {}", e.getMessage());
            throw new RuntimeException("업로드 URL 생성에 실패했습니다. R2 설정을 확인해주세요.");
        }
    }

    private void verifyR2ObjectExists(String bucket, String objectKey) {
        try {
            r2Client.headObject(HeadObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey)
                    .build());
        } catch (Exception e) {
            log.error("R2 오브젝트 확인 실패: {}/{}", bucket, objectKey);
            throw new EntityNotFoundException("업로드된 파일을 확인할 수 없습니다. 다시 업로드해주세요.");
        }
    }
}