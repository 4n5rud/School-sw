package com.chessmate.be.service;

import com.chessmate.be.dto.request.AnswerRequest;
import com.chessmate.be.dto.request.QuestionCreateRequest;
import com.chessmate.be.dto.response.QuestionResponse;
import com.chessmate.be.entity.Course;
import com.chessmate.be.entity.CourseQuestion;
import com.chessmate.be.entity.Member;
import com.chessmate.be.exception.AccessDeniedException;
import com.chessmate.be.exception.EntityNotFoundException;
import com.chessmate.be.repository.CourseQuestionRepository;
import com.chessmate.be.repository.CourseRepository;
import com.chessmate.be.repository.EnrollmentRepository;
import com.chessmate.be.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 강의 Q&A 서비스
 * 질문 등록, 조회, 답변, 삭제 기능 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CourseQuestionService {

    private final CourseQuestionRepository courseQuestionRepository;
    private final CourseRepository courseRepository;
    private final MemberRepository memberRepository;
    private final EnrollmentRepository enrollmentRepository;

    /**
     * 질문 등록 (수강생만 가능)
     *
     * @param courseId 강의 ID
     * @param request  질문 요청 (title, content)
     * @param memberId 회원 ID (JWT에서 추출)
     * @return 등록된 질문 정보
     */
    @Transactional
    public QuestionResponse createQuestion(Long courseId, QuestionCreateRequest request, Long memberId) {
        log.info("Create question: course {} by member {}", courseId, memberId);

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new EntityNotFoundException("강의를 찾을 수 없습니다"));

        // 수강 여부 확인
        boolean enrolled = enrollmentRepository.findByMemberIdAndCourseId(memberId, courseId).isPresent();
        if (!enrolled) {
            throw new AccessDeniedException("수강 중인 강의에만 질문을 등록할 수 있습니다");
        }

        CourseQuestion question = CourseQuestion.builder()
                .member(member)
                .course(course)
                .title(request.getTitle())
                .content(request.getContent())
                .isResolved(false)
                .build();

        CourseQuestion saved = courseQuestionRepository.save(question);
        log.info("Question created: {}", saved.getId());
        return QuestionResponse.from(saved);
    }

    /**
     * 강의별 질문 목록 조회 (페이지네이션)
     *
     * @param courseId 강의 ID
     * @param page     페이지 번호
     * @param size     페이지 크기
     * @return 질문 페이지
     */
    public Page<QuestionResponse> getQuestions(Long courseId, int page, int size) {
        log.debug("Get questions: course {}, page {}, size {}", courseId, page, size);

        // 강의 존재 여부 확인
        courseRepository.findById(courseId)
                .orElseThrow(() -> new EntityNotFoundException("강의를 찾을 수 없습니다"));

        Pageable pageable = PageRequest.of(page, size);
        Page<CourseQuestion> questions = courseQuestionRepository.findByCourse_IdOrderByCreatedAtDesc(courseId, pageable);
        return questions.map(QuestionResponse::from);
    }

    /**
     * 질문 답변 (강의 담당 강사만 가능)
     *
     * @param questionId 질문 ID
     * @param request    답변 요청
     * @param teacherId  강사 ID (JWT에서 추출)
     * @return 답변이 등록된 질문 정보
     */
    @Transactional
    public QuestionResponse answerQuestion(Long questionId, AnswerRequest request, Long teacherId) {
        log.info("Answer question: {} by teacher {}", questionId, teacherId);

        Member teacher = memberRepository.findById(teacherId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        CourseQuestion question = courseQuestionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("질문을 찾을 수 없습니다"));

        // 해당 강의의 강사인지 확인
        if (!question.getCourse().getInstructor().getId().equals(teacherId)) {
            throw new AccessDeniedException("해당 강의의 강사만 답변할 수 있습니다");
        }

        question.setAnswer(request.getAnswer());
        question.setAnsweredAt(LocalDateTime.now());
        question.setAnsweredBy(teacher);
        question.setResolved(true);

        CourseQuestion saved = courseQuestionRepository.save(question);
        log.info("Question answered: {}", saved.getId());
        return QuestionResponse.from(saved);
    }

    /**
     * 질문 삭제 (작성자 또는 강의 담당 강사만 가능)
     *
     * @param questionId 질문 ID
     * @param memberId   요청 회원 ID (JWT에서 추출)
     */
    @Transactional
    public void deleteQuestion(Long questionId, Long memberId) {
        log.info("Delete question: {} by member {}", questionId, memberId);

        CourseQuestion question = courseQuestionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("질문을 찾을 수 없습니다"));

        boolean isAuthor = question.getMember().getId().equals(memberId);
        boolean isInstructor = question.getCourse().getInstructor().getId().equals(memberId);

        if (!isAuthor && !isInstructor) {
            throw new AccessDeniedException("질문 작성자 또는 강의 담당 강사만 삭제할 수 있습니다");
        }

        courseQuestionRepository.delete(question);
        log.info("Question deleted: {}", questionId);
    }
}
