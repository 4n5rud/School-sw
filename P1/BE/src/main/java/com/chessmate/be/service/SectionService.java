package com.chessmate.be.service;

import com.chessmate.be.dto.response.LectureResponse;
import com.chessmate.be.dto.response.SectionResponse;
import com.chessmate.be.entity.Lecture;
import com.chessmate.be.entity.Section;
import com.chessmate.be.repository.LectureRepository;
import com.chessmate.be.repository.SectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 섹션(단원) 및 강의 관리 서비스
 * 강의별 섹션 목록과 섹션별 강의 목록 조회 기능 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SectionService {

    private final SectionRepository sectionRepository;
    private final LectureRepository lectureRepository;

    /**
     * 특정 강의의 모든 섹션과 강의 목록 조회
     *
     * @param courseId 강의 ID
     * @return 섹션 응답 리스트 (강의 포함)
     */
    public List<SectionResponse> getSectionsByCourse(Long courseId) {
        log.debug("Get sections for course: {}", courseId);

        List<Section> sections = sectionRepository.findByCourseId(courseId);

        log.info("Found {} sections for course: {}", sections.size(), courseId);

        return sections.stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .map(SectionResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 특정 섹션의 강의 목록 조회
     *
     * @param sectionId 섹션 ID
     * @return 강의 응답 리스트
     */
    public List<LectureResponse> getLecturesBySection(Long sectionId) {
        log.debug("Get lectures for section: {}", sectionId);

        List<Lecture> lectures = lectureRepository.findBySectionId(sectionId);

        log.info("Found {} lectures for section: {}", lectures.size(), sectionId);

        return lectures.stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .map(LectureResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 특정 강의(Lecture) 조회
     *
     * @param lectureId 강의 ID
     * @return 강의 응답
     * @throws IllegalArgumentException 강의를 찾을 수 없음
     */
    public LectureResponse getLectureById(Long lectureId) {
        log.debug("Get lecture: {}", lectureId);

        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> {
                    log.warn("Lecture not found: {}", lectureId);
                    return new IllegalArgumentException("강의를 찾을 수 없습니다: " + lectureId);
                });

        return LectureResponse.from(lecture);
    }
}
