package com.chessmate.be.controller.teacher;

import com.chessmate.be.dto.request.teacher.LectureCreateRequest;
import com.chessmate.be.dto.request.teacher.LectureUpdateRequest;
import com.chessmate.be.dto.request.teacher.SectionCreateRequest;
import com.chessmate.be.dto.request.teacher.SectionReorderRequest;
import com.chessmate.be.dto.request.teacher.SectionUpdateRequest;
import com.chessmate.be.dto.response.ApiResponse;
import com.chessmate.be.dto.response.LectureResponse;
import com.chessmate.be.dto.response.SectionResponse;
import com.chessmate.be.service.teacher.TeacherSectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('TEACHER')")
public class TeacherSectionController {

    private final TeacherSectionService teacherSectionService;

    @PostMapping("/api/v1/teacher/courses/{courseId}/sections")
    public ResponseEntity<ApiResponse<SectionResponse>> createSection(
            @PathVariable Long courseId,
            @Valid @RequestBody SectionCreateRequest request) {
        SectionResponse section = teacherSectionService.createSection(courseId, request, currentMemberId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(section, "섹션이 추가되었습니다."));
    }

    @PutMapping("/api/v1/teacher/sections/{sectionId}")
    public ResponseEntity<ApiResponse<SectionResponse>> updateSection(
            @PathVariable Long sectionId,
            @Valid @RequestBody SectionUpdateRequest request) {
        SectionResponse section = teacherSectionService.updateSection(sectionId, request, currentMemberId());
        return ResponseEntity.ok(ApiResponse.success(section, "섹션이 수정되었습니다."));
    }

    @DeleteMapping("/api/v1/teacher/sections/{sectionId}")
    public ResponseEntity<ApiResponse<Void>> deleteSection(@PathVariable Long sectionId) {
        teacherSectionService.deleteSection(sectionId, currentMemberId());
        return ResponseEntity.ok(ApiResponse.success(null, "섹션이 삭제되었습니다."));
    }

    @PatchMapping("/api/v1/teacher/courses/{courseId}/sections/reorder")
    public ResponseEntity<ApiResponse<List<SectionResponse>>> reorderSections(
            @PathVariable Long courseId,
            @Valid @RequestBody SectionReorderRequest request) {
        List<SectionResponse> sections = teacherSectionService.reorderSections(courseId, request, currentMemberId());
        return ResponseEntity.ok(ApiResponse.success(sections, "섹션 순서가 변경되었습니다."));
    }

    @PostMapping("/api/v1/teacher/sections/{sectionId}/lectures")
    public ResponseEntity<ApiResponse<LectureResponse>> createLecture(
            @PathVariable Long sectionId,
            @Valid @RequestBody LectureCreateRequest request) {
        LectureResponse lecture = teacherSectionService.createLecture(sectionId, request, currentMemberId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(lecture, "강의 영상이 추가되었습니다."));
    }

    @PutMapping("/api/v1/teacher/lectures/{lectureId}")
    public ResponseEntity<ApiResponse<LectureResponse>> updateLecture(
            @PathVariable Long lectureId,
            @Valid @RequestBody LectureUpdateRequest request) {
        LectureResponse lecture = teacherSectionService.updateLecture(lectureId, request, currentMemberId());
        return ResponseEntity.ok(ApiResponse.success(lecture, "강의 영상이 수정되었습니다."));
    }

    @DeleteMapping("/api/v1/teacher/lectures/{lectureId}")
    public ResponseEntity<ApiResponse<Void>> deleteLecture(@PathVariable Long lectureId) {
        teacherSectionService.deleteLecture(lectureId, currentMemberId());
        return ResponseEntity.ok(ApiResponse.success(null, "강의 영상이 삭제되었습니다."));
    }

    private Long currentMemberId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth.getPrincipal();
        if (principal instanceof Long) return (Long) principal;
        return Long.parseLong(principal.toString());
    }
}