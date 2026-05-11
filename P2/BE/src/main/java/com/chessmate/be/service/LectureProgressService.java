package com.chessmate.be.service;

import com.chessmate.be.dto.response.LectureProgressResponse;
import com.chessmate.be.entity.Lecture;
import com.chessmate.be.entity.LectureProgress;
import com.chessmate.be.entity.Member;
import com.chessmate.be.exception.EntityNotFoundException;
import com.chessmate.be.repository.LectureProgressRepository;
import com.chessmate.be.repository.LectureRepository;
import com.chessmate.be.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 강의 시청 진행 서비스
 * 학생의 강의 시청 진행 상황 관리
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LectureProgressService {

    private final LectureProgressRepository lectureProgressRepository;
    private final MemberRepository memberRepository;
    private final LectureRepository lectureRepository;

    /**
     * 강의 시청 진행 상황 저장
     *
     * @param memberId 학생 ID
     * @param lectureId 강의 ID
     * @param lastPosition 마지막 시청 위치 (초 단위)
     * @return 저장된 진행 정보
     */
    @Transactional
    public LectureProgressResponse saveProgress(
            Long memberId, Long lectureId, Integer lastPosition) {
        log.info("Save progress for member: {}, lecture: {}, position: {}",
                 memberId, lectureId, lastPosition);

        // 1. 학생 정보 조회
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> {
                    log.warn("Member not found: {}", memberId);
                    return new EntityNotFoundException("학생을 찾을 수 없습니다");
                });

        // 2. 강의 정보 조회
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> {
                    log.warn("Lecture not found: {}", lectureId);
                    return new EntityNotFoundException("강의를 찾을 수 없습니다");
                });

        // 3. 기존 진행 정보 조회 또는 새로 생성
        LectureProgress progress = lectureProgressRepository
                .findByMemberIdAndLectureId(memberId, lectureId)
                .orElse(LectureProgress.builder()
                        .member(member)
                        .lecture(lecture)
                        .lastPosition(0)
                        .updatedAt(LocalDateTime.now())
                        .build());

        // 4. 진행 위치 업데이트
        progress.setLastPosition(lastPosition);
        progress.setUpdatedAt(LocalDateTime.now());

        LectureProgress savedProgress = lectureProgressRepository.save(progress);
        log.info("Progress saved: lecture {} for member {}", lectureId, memberId);

        return LectureProgressResponse.from(savedProgress);
    }

    /**
     * 강의 시청 진행 정보 조회
     *
     * @param memberId 학생 ID
     * @param lectureId 강의 ID
     * @return 진행 정보
     */
    public LectureProgressResponse getProgress(Long memberId, Long lectureId) {
        log.debug("Get progress for member: {}, lecture: {}", memberId, lectureId);

        LectureProgress progress = lectureProgressRepository
                .findByMemberIdAndLectureId(memberId, lectureId)
                .orElseThrow(() -> {
                    log.warn("Progress not found for member: {}, lecture: {}", memberId, lectureId);
                    return new EntityNotFoundException("진행 정보를 찾을 수 없습니다");
                });

        return LectureProgressResponse.from(progress);
    }

    /**
     * 학생이 시청한 모든 강의의 진행 상황 조회
     *
     * @param memberId 학생 ID
     * @return 진행 정보 리스트
     */
    public List<LectureProgressResponse> getProgressByMember(Long memberId) {
        log.debug("Get all progress for member: {}", memberId);

        List<LectureProgress> progressList = lectureProgressRepository.findByMemberId(memberId);

        return progressList.stream()
                .map(LectureProgressResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 특정 강의의 진행 정보 삭제
     *
     * @param memberId 학생 ID
     * @param lectureId 강의 ID
     */
    @Transactional
    public void deleteProgress(Long memberId, Long lectureId) {
        log.info("Delete progress for member: {}, lecture: {}", memberId, lectureId);

        LectureProgress progress = lectureProgressRepository
                .findByMemberIdAndLectureId(memberId, lectureId)
                .orElseThrow(() -> {
                    log.warn("Progress not found for deletion: member {}, lecture {}", memberId, lectureId);
                    return new EntityNotFoundException("진행 정보를 찾을 수 없습니다");
                });

        lectureProgressRepository.delete(progress);
        log.info("Progress deleted: lecture {} for member {}", lectureId, memberId);
    }
}

