package com.chessmate.be.service.teacher;

import com.chessmate.be.dto.request.teacher.LectureCreateRequest;
import com.chessmate.be.dto.request.teacher.LectureUpdateRequest;
import com.chessmate.be.dto.request.teacher.SectionCreateRequest;
import com.chessmate.be.dto.request.teacher.SectionReorderRequest;
import com.chessmate.be.dto.request.teacher.SectionUpdateRequest;
import com.chessmate.be.dto.response.LectureResponse;
import com.chessmate.be.dto.response.SectionResponse;
import com.chessmate.be.entity.Course;
import com.chessmate.be.entity.Lecture;
import com.chessmate.be.entity.Section;
import com.chessmate.be.exception.EntityNotFoundException;
import com.chessmate.be.repository.CourseRepository;
import com.chessmate.be.repository.LectureRepository;
import com.chessmate.be.repository.SectionRepository;
import com.chessmate.be.security.TeacherOwnershipValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TeacherSectionService {

    private final SectionRepository sectionRepository;
    private final LectureRepository lectureRepository;
    private final CourseRepository courseRepository;
    private final TeacherOwnershipValidator ownershipValidator;

    @Transactional
    public SectionResponse createSection(Long courseId, SectionCreateRequest request, Long instructorId) {
        Course course = ownershipValidator.validateCourseOwner(courseId, instructorId);

        int maxOrder = sectionRepository.findMaxSortOrderByCourseId(courseId);
        Section section = Section.builder()
                .course(course)
                .title(request.getTitle())
                .sortOrder(maxOrder + 1)
                .build();

        Section saved = sectionRepository.save(section);
        return SectionResponse.from(saved);
    }

    @Transactional
    public SectionResponse updateSection(Long sectionId, SectionUpdateRequest request, Long instructorId) {
        Section section = ownershipValidator.validateSectionOwner(sectionId, instructorId);

        section.setTitle(request.getTitle());
        if (request.getSortOrder() != null) {
            section.setSortOrder(request.getSortOrder());
        }

        Section updated = sectionRepository.save(section);
        return SectionResponse.from(updated);
    }

    @Transactional
    public void deleteSection(Long sectionId, Long instructorId) {
        Section section = ownershipValidator.validateSectionOwner(sectionId, instructorId);
        sectionRepository.delete(section);
        log.info("Section deleted: {} by instructor: {}", sectionId, instructorId);
    }

    @Transactional
    public List<SectionResponse> reorderSections(Long courseId, SectionReorderRequest request, Long instructorId) {
        ownershipValidator.validateCourseOwner(courseId, instructorId);

        for (SectionReorderRequest.SectionOrderItem item : request.getSectionOrders()) {
            Section section = sectionRepository.findById(item.getSectionId())
                    .orElseThrow(() -> new EntityNotFoundException("섹션을 찾을 수 없습니다: " + item.getSectionId()));
            if (!section.getCourse().getId().equals(courseId)) {
                throw new com.chessmate.be.exception.AccessDeniedException("해당 섹션은 이 강의에 속하지 않습니다.");
            }
            section.setSortOrder(item.getSortOrder());
            sectionRepository.save(section);
        }

        List<Section> sections = sectionRepository.findByCourseId(courseId);
        return sections.stream().map(SectionResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public LectureResponse createLecture(Long sectionId, LectureCreateRequest request, Long instructorId) {
        Section section = ownershipValidator.validateSectionOwner(sectionId, instructorId);

        Lecture lecture = Lecture.builder()
                .section(section)
                .title(request.getTitle())
                .sortOrder(request.getSortOrder())
                .uploadStatus(Lecture.UploadStatus.PENDING)
                .build();

        Lecture saved = lectureRepository.save(lecture);
        return LectureResponse.from(saved);
    }

    @Transactional
    public LectureResponse updateLecture(Long lectureId, LectureUpdateRequest request, Long instructorId) {
        Lecture lecture = ownershipValidator.validateLectureOwner(lectureId, instructorId);

        if (request.getTitle() != null) lecture.setTitle(request.getTitle());
        if (request.getSortOrder() != null) lecture.setSortOrder(request.getSortOrder());
        if (request.getVideoUrl() != null) lecture.setVideoUrl(request.getVideoUrl());
        if (request.getPlayTime() != null) lecture.setPlayTime(request.getPlayTime());

        Lecture updated = lectureRepository.save(lecture);
        return LectureResponse.from(updated);
    }

    @Transactional
    public void deleteLecture(Long lectureId, Long instructorId) {
        Lecture lecture = ownershipValidator.validateLectureOwner(lectureId, instructorId);
        lectureRepository.delete(lecture);
        log.info("Lecture deleted: {} by instructor: {}", lectureId, instructorId);
    }
}