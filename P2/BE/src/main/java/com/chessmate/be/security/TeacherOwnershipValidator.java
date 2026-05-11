package com.chessmate.be.security;

import com.chessmate.be.entity.Course;
import com.chessmate.be.entity.Lecture;
import com.chessmate.be.entity.Section;
import com.chessmate.be.exception.AccessDeniedException;
import com.chessmate.be.exception.EntityNotFoundException;
import com.chessmate.be.repository.CourseRepository;
import com.chessmate.be.repository.LectureRepository;
import com.chessmate.be.repository.SectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TeacherOwnershipValidator {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LectureRepository lectureRepository;

    public Course validateCourseOwner(Long courseId, Long memberId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new EntityNotFoundException("강의를 찾을 수 없습니다."));
        if (!course.getInstructor().getId().equals(memberId)) {
            throw new AccessDeniedException("해당 강의에 대한 권한이 없습니다.");
        }
        return course;
    }

    public Section validateSectionOwner(Long sectionId, Long memberId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new EntityNotFoundException("섹션을 찾을 수 없습니다."));
        if (!section.getCourse().getInstructor().getId().equals(memberId)) {
            throw new AccessDeniedException("해당 섹션에 대한 권한이 없습니다.");
        }
        return section;
    }

    public Lecture validateLectureOwner(Long lectureId, Long memberId) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new EntityNotFoundException("강의 영상을 찾을 수 없습니다."));
        if (!lecture.getSection().getCourse().getInstructor().getId().equals(memberId)) {
            throw new AccessDeniedException("해당 강의 영상에 대한 권한이 없습니다.");
        }
        return lecture;
    }
}