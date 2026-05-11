package com.chessmate.be.config;

import com.chessmate.be.entity.*;
import com.chessmate.be.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 애플리케이션 시작 시 초기 데이터를 DB에 삽입합니다.
 * 강의 100개 (70개 기본 + 30개 추가), 강사 3명, 테스트 계정 등을 자동으로 생성합니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final MemberRepository memberRepository;
    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LectureRepository lectureRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("🚀 초기 데이터 삽입을 시작합니다...");

        try {
            // 1. 기존 데이터 확인
            if (memberRepository.count() > 0) {
                log.info("✅ 이미 데이터가 존재합니다. 초기화를 건너뜁니다.");
                return;
            }

            // 2. 강사 생성
            List<Member> instructors = createInstructors();
            log.info("✅ {}명의 강사가 생성되었습니다.", instructors.size());

            // 3. 학생 생성
            List<Member> students = createStudents();
            log.info("✅ {}명의 학생이 생성되었습니다.", students.size());

            // 4. 강의 생성 (30개 이상)
            List<Course> courses = createCourses(instructors);
            log.info("✅ {}개의 강의가 생성되었습니다.", courses.size());

            // 5. 섹션 및 강의 비디오 생성
            createSectionsAndLectures(courses);
            log.info("✅ 섹션 및 강의 비디오가 생성되었습니다.");

            // 6. 수강 신청 생성
            createEnrollments(students, courses);
            log.info("✅ 수강 신청이 생성되었습니다.");

            log.info("✨ 초기 데이터 삽입이 완료되었습니다!");

        } catch (Exception e) {
            log.error("❌ 초기 데이터 삽입 중 오류 발생: {}", e.getMessage());
        }
    }

    /**
     * 강사 3명 생성
     */
    private List<Member> createInstructors() {
        List<Member> instructors = new ArrayList<>();

        String[][] instructorData = {
                {"teacher1@example.com", "Teacher1Pass", "주식 전문가 김강사"},
                {"teacher2@example.com", "Teacher2Pass", "암호화폐 전문가 이강사"},
                {"teacher3@example.com", "Teacher3Pass", "파이낸셜 컨설턴트 박강사"}
        };

        for (String[] data : instructorData) {
            Member instructor = Member.builder()
                    .email(data[0])
                    .password(passwordEncoder.encode(data[1]))
                    .nickname(data[2])
                    .role(Member.Role.TEACHER)
                    .createdAt(LocalDateTime.now())
                    .build();
            instructors.add(memberRepository.save(instructor));
        }

        return instructors;
    }

    /**
     * 학생 5명 생성
     */
    private List<Member> createStudents() {
        List<Member> students = new ArrayList<>();

        String[][] studentData = {
                {"student1@example.com", "Student1Pass", "투자자 민준"},
                {"student2@example.com", "Student2Pass", "초보 지인"},
                {"student3@example.com", "Student3Pass", "개미 경석"},
                {"student4@example.com", "Student4Pass", "트레이더 수현"},
                {"student5@example.com", "Student5Pass", "분석가 혜지"}
        };

        for (String[] data : studentData) {
            Member student = Member.builder()
                    .email(data[0])
                    .password(passwordEncoder.encode(data[1]))
                    .nickname(data[2])
                    .role(Member.Role.STUDENT)
                    .createdAt(LocalDateTime.now())
                    .build();
            students.add(memberRepository.save(student));
        }

        return students;
    }

    /**
     * 강의 70개 이상 생성 (카테고리별 10개 이상)
     */
    private List<Course> createCourses(List<Member> instructors) {
        List<Course> courses = new ArrayList<>();

        // 국내 주식 (12개)
        String[] domesticStockTitles = {
                "국내 주식 투자의 기초",
                "KOSPI 지수 읽기",
                "한국 기업 분석하기",
                "국내 대형주 투자 전략",
                "국내 소형주 고수익 전략",
                "국내 배당주 완벽 가이드",
                "기업 재무제표 분석",
                "국내 섹터별 투자 전략",
                "한국 증시 사이클 이해하기",
                "국내 IPO 투자 기법",
                "국내 주식 기술적 분석",
                "한국 증권사 활용법"
        };
        createCoursesByCategory(courses, instructors, domesticStockTitles,
                Course.CourseCategory.DOMESTIC_STOCK, "국내 주식");

        // 해외 주식 (12개)
        String[] overseasStockTitles = {
                "미국 주식 투자 시작하기",
                "나스닥 100 투자법",
                "S&P 500 전략",
                "미국 기술주 투자",
                "미국 에너지주 분석",
                "미국 금융주 투자",
                "유럽 주식 투자 가이드",
                "일본 주식 시장 이해하기",
                "홍콩 주식 투자",
                "싱가포르 주식 투자",
                "글로벌 분산 투자",
                "해외 주식 세금 및 환율"
        };
        createCoursesByCategory(courses, instructors, overseasStockTitles,
                Course.CourseCategory.OVERSEAS_STOCK, "해외 주식");

        // 암호화폐 (12개)
        String[] cryptoTitles = {
                "비트코인 완전 정복",
                "이더리움 스마트 컨트랙트",
                "블록체인 기술 이해",
                "암호화폐 거래 기초",
                "알트코인 투자 전략",
                "암호화폐 보안 가이드",
                "마이닝으로 수익 창출",
                "스테이킹 수익화",
                "디파이 DeFi 이해",
                "암호화폐 세금 계산",
                "코인 프로젝트 분석",
                "암호화폐 심리학"
        };
        createCoursesByCategory(courses, instructors, cryptoTitles,
                Course.CourseCategory.CRYPTO, "암호화폐");

        // NFT (11개)
        String[] nftTitles = {
                "NFT 기초 이해하기",
                "NFT 마켓플레이스 활용",
                "디지털 아트 NFT 투자",
                "게임 NFT 전략",
                "메타버스 NFT 기회",
                "NFT 스마트 컨트랙트",
                "NFT 세금 이해하기",
                "한국 NFT 시장 분석",
                "NFT 수집가 되기",
                "NFT 사기 피하기",
                "NFT 미래 전망"
        };
        createCoursesByCategory(courses, instructors, nftTitles,
                Course.CourseCategory.NFT, "NFT");

        // ETF (11개)
        String[] etfTitles = {
                "ETF 기초 개념",
                "주식 ETF 투자 전략",
                "채권 ETF 이해하기",
                "섹터 ETF 선택 가이드",
                "국내 ETF 투자",
                "해외 ETF 투자",
                "자동 배당 ETF",
                "레버리지 ETF 활용",
                "ETF 비용 최소화",
                "ETF 포트폴리오 구성",
                "ETF vs 뮤추얼펀드"
        };
        createCoursesByCategory(courses, instructors, etfTitles,
                Course.CourseCategory.ETF, "ETF");

        // 선물투자 (12개)
        String[] futuresTitles = {
                "선물 투자 기초",
                "스탁옵션 이해하기",
                "선물 차트 분석",
                "마진 거래 안전하게",
                "헤징 전략",
                "스프레드 거래",
                "선물 시장 사이클",
                "변동성 분석",
                "레버리지 관리",
                "선물 손실 최소화",
                "선물 심리학",
                "전문가 거래 기법"
        };
        createCoursesByCategory(courses, instructors, futuresTitles,
                Course.CourseCategory.FUTURES, "선물투자");

        // ========== 추가 강의 30개 (카테고리별 5개씩) ==========

        // 국내 주식 추가 (5개)
        String[] domesticStockAdditional = {
                "국내 우량주 분석 가이드",
                "한국 경제 지표 읽기",
                "주식 봉차트 마스터",
                "시가총액별 투자 전략",
                "국내 신생기업 주식 투자"
        };
        createCoursesByCategory(courses, instructors, domesticStockAdditional,
                Course.CourseCategory.DOMESTIC_STOCK, "국내 주식");

        // 해외 주식 추가 (5개)
        String[] overseasStockAdditional = {
                "캐나다 주식 투자",
                "호주 광산주 분석",
                "뉴질랜드 투자 기회",
                "신흥국 주식 투자",
                "글로벌 인덱스펀드 활용"
        };
        createCoursesByCategory(courses, instructors, overseasStockAdditional,
                Course.CourseCategory.OVERSEAS_STOCK, "해외 주식");

        // 암호화폐 추가 (5개)
        String[] cryptoAdditional = {
                "암호화폐 지갑 완벽 가이드",
                "리스크 관리 전략",
                "암호화폐 뉴스 분석",
                "코인 차트 기술 분석",
                "암호화폐 거래 심리학"
        };
        createCoursesByCategory(courses, instructors, cryptoAdditional,
                Course.CourseCategory.CRYPTO, "암호화폐");

        // NFT 추가 (5개)
        String[] nftAdditional = {
                "NFT 커뮤니티 활동법",
                "메타버스 NFT 투자",
                "스포츠 NFT 전략",
                "음악 NFT 시장 분석",
                "NFT 로열티 수익화"
        };
        createCoursesByCategory(courses, instructors, nftAdditional,
                Course.CourseCategory.NFT, "NFT");

        // ETF 추가 (5개)
        String[] etfAdditional = {
                "하이일드 ETF 투자",
                "금 ETF 투자 가이드",
                "부동산 ETF 활용",
                "에너지 전환 ETF",
                "국제 채권 ETF"
        };
        createCoursesByCategory(courses, instructors, etfAdditional,
                Course.CourseCategory.ETF, "ETF");

        // 선물투자 추가 (5개)
        String[] futuresAdditional = {
                "KOSPI 200 선물 전략",
                "금리 선물 투자",
                "환율 선물 활용",
                "에너지 선물 분석",
                "선물 위험 관리"
        };
        createCoursesByCategory(courses, instructors, futuresAdditional,
                Course.CourseCategory.FUTURES, "선물투자");

        return courses;
    }

    /**
     * 카테고리별 강의 생성 헬퍼 메서드
     */
    private void createCoursesByCategory(List<Course> courses, List<Member> instructors,
                                        String[] titles, Course.CourseCategory category, String categoryName) {
        for (int i = 0; i < titles.length; i++) {
            Course course = Course.builder()
                    .title(titles[i])
                    .description(titles[i] + "에 대한 완전한 강의입니다. " + categoryName + " 투자의 모든 것을 배워보세요.")
                    .category(category)
                    .price(29900 + (i * 1000))
                    .thumbnailUrl("https://via.placeholder.com/300x200?text=" + category.name())
                    .instructor(instructors.get(i % instructors.size()))
                    .createdAt(LocalDateTime.now())
                    .build();
            courses.add(courseRepository.save(course));
        }
    }

    /**
     * 강의마다 섹션 2-3개, 각 섹션에 3-5개의 강의 비디오 생성
     */
    private void createSectionsAndLectures(List<Course> courses) {
        for (Course course : courses) {
            int sectionCount = 2 + (int) (Math.random() * 2); // 2-3개 섹션

            for (int s = 1; s <= sectionCount; s++) {
                Section section = Section.builder()
                        .course(course)
                        .title(course.getTitle() + " - Section " + s)
                        .sortOrder(s)
                        .build();
                section = sectionRepository.save(section);

                int lectureCount = 3 + (int) (Math.random() * 3); // 3-5개 강의

                for (int l = 1; l <= lectureCount; l++) {
                    int playTime = 900 + (int) (Math.random() * 2700); // 15분 ~ 60분

                    Lecture lecture = Lecture.builder()
                            .section(section)
                            .title(section.getTitle() + " - Lecture " + l)
                            .videoUrl("https://video.example.com/video_" + course.getId() + "_" + s + "_" + l + ".mp4")
                            .playTime(playTime)
                            .sortOrder(l)
                            .build();
                    lectureRepository.save(lecture);
                }
            }
        }
    }

    /**
     * 각 학생이 임의로 강의에 수강 신청
     */
    private void createEnrollments(List<Member> students, List<Course> courses) {
        for (Member student : students) {
            // 각 학생이 5-8개의 강의 수강 신청
            int enrollCount = 5 + (int) (Math.random() * 4);

            for (int i = 0; i < enrollCount; i++) {
                Course randomCourse = courses.get((int) (Math.random() * courses.size()));

                // 중복 수강 방지
                boolean alreadyEnrolled = enrollmentRepository
                        .findByMemberAndCourse(student, randomCourse)
                        .isPresent();

                if (!alreadyEnrolled) {
                    Enrollment enrollment = Enrollment.builder()
                            .member(student)
                            .course(randomCourse)
                            .enrolledAt(LocalDateTime.now())
                            .isCompleted(Math.random() < 0.3) // 30% 확률로 완강
                            .build();
                    enrollmentRepository.save(enrollment);
                }
            }
        }
    }
}

