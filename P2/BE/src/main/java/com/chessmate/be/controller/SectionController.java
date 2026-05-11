package com.chessmate.be.controller;

import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.LectureResponse;
import com.chessmate.be.dto.response.SectionResponse;
import com.chessmate.be.service.SectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 섹션(단원) API 컨트롤러
 * 강의별 섹션 목록 및 섹션별 강의 목록 조회 엔드포인트 제공
 */
@RestController
@RequestMapping("/api/sections")
@RequiredArgsConstructor
@Slf4j
public class SectionController {

    private final SectionService sectionService;

    /**
     * 특정 강의의 모든 섹션과 강의 목록 조회
     * GET /api/courses/{courseId}/sections
     *
     * 응답 구조:
     * {
     *   "success": true,
     *   "data": [
     *     {
     *       "id": 1,
     *       "title": "1단원: 기초 개념",
     *       "sortOrder": 1,
     *       "lectures": [
     *         {
     *           "id": 1,
     *           "title": "1-1. 주식의 기초",
     *           "videoUrl": "https://example.com/video1.mp4",
     *           "playTime": 1200,
     *           "sortOrder": 1
     *         }
     *       ]
     *     }
     *   ]
     * }
     *
     * @param courseId 강의 ID
     * @return 섹션 목록 (강의 포함)
     */
    @GetMapping("/courses/{courseId}")
    public ResponseEntity<ApiResponse<List<SectionResponse>>> getSectionsByCourse(
            @PathVariable Long courseId) {

        log.info("Get sections for course: {}", courseId);

        List<SectionResponse> sections = sectionService.getSectionsByCourse(courseId);

        return ResponseEntity.ok(
                ApiResponse.success(sections, "강의 섹션 목록입니다")
        );
    }

    /**
     * 특정 섹션의 강의 목록 조회
     * GET /api/sections/{sectionId}/lectures
     *
     * @param sectionId 섹션 ID
     * @return 강의 목록
     */
    @GetMapping("/{sectionId}/lectures")
    public ResponseEntity<ApiResponse<List<LectureResponse>>> getLecturesBySection(
            @PathVariable Long sectionId) {

        log.info("Get lectures for section: {}", sectionId);

        List<LectureResponse> lectures = sectionService.getLecturesBySection(sectionId);

        return ResponseEntity.ok(
                ApiResponse.success(lectures, "섹션 강의 목록입니다")
        );
    }

    /**
     * 특정 강의 조회
     * GET /api/sections/lectures/{lectureId}
     *
     * @param lectureId 강의 ID
     * @return 강의 정보
     */
    @GetMapping("/lectures/{lectureId}")
    public ResponseEntity<ApiResponse<LectureResponse>> getLectureById(
            @PathVariable Long lectureId) {

        log.debug("Get lecture: {}", lectureId);

        LectureResponse lecture = sectionService.getLectureById(lectureId);

        return ResponseEntity.ok(
                ApiResponse.success(lecture, "강의 정보입니다")
        );
    }
}
