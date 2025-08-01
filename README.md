# Heritage Hunters 🏛️📸

전통과 기술이 만나는 곳, Heritage Hunters는 대한민국의 국가 유산을 직접 방문하고 사진을 공유하며 점수를 얻는 **게임형 SNS 플랫폼**입니다.

## 🚀 About the Project

> "국가 유산을 직접 방문해 사진을 찍어 올려 점수를 얻는 게임 + SNS"

사용자는 전국의 국가 유산을 탐방하고, 인증 사진을 업로드하여 점수를 획득합니다.  
사진은 커뮤니티에 공유되며, 좋아요·댓글 등 다양한 활동을 통해 추가 점수를 얻을 수 있습니다.  
랭킹 시스템을 통해 유산 탐험의 재미와 경쟁 요소를 동시에 제공합니다.

🎥 [시연 영상 보러가기](https://youtu.be/)

---

## 👥 Team Heritage Hunters

| 이름   | 역할 |
| ------ | ---- |
| 윤현진 | 팀장 |
| 유동혁 |      |
| 이수완 |      |

> 팀명과 프로젝트명인 "Heritage Hunters"는 문화유산을 직접 찾아다니며 기록하는 탐험가의 의미를 담고 있습니다.

---

## 🗂️ Project Dashboard

📌 이 프로젝트는 **Notion**을 통해 협업과 문서 작업을 관리합니다.  
기획안, API 설계, UI 시안, 일정 관리 등은 아래 링크에서 확인할 수 있습니다.

- 🔗 [프로젝트 관리용 Notion 페이지](https://www.notion.so/Heritage-Hunters-23a2233de693809ca788ff81b5ecc173)

---

## 🗓️ Timeline

- **2025.07.29 (Tue) ~ 2025.08.25 (Mon)**

---

## 🔧 Tech Stack

- **Backend**: Spring Boot, Spring Security, JPA(Hibernate), PostgreSQL
- **Frontend**: Thymeleaf (템플릿), HTML/CSS/JS
- **Infrastructure**: AWS RDS (DB), AWS S3 (이미지 업로드), OAuth(Google), Google Maps API, Alan API

---

## 📌 Features

- 국가 유산 지도 보기 및 검색 기능
- 유산 인증 사진 업로드 및 커뮤니티 공유
- 방문 인증을 통한 점수 획득 및 랭킹 시스템
- 좋아요, 댓글, 공유 등 커뮤니티 활동 기반 점수 부여
- 국가 유산 설명 요약, 주변 정보 및 날씨 제공 (Alan API 활용)
- OAuth 기반 로그인 및 사용자 프로필 관리

---

## 🌐 External API

| API          | 용도 설명                        |
| ------------ | -------------------------------- |
| Google OAuth | 소셜 로그인 기능                 |
| Google Maps  | 국가 유산 위치 기반 지도 서비스  |
| Alan API     | 챗봇 기반 유산 추천 및 정보 제공 |
| AWS RDS      | 클라우드 데이터 베이스           |
| AWS S3       | 이미지 업로드 및 파일 저장       |

---

## 🛠 Internal Development

- RESTful API 설계 및 구현
- UI/UX 설계 [Figma 링크](https://www.figma.com/design/2QGcq7VGRlTLl6yIMhmIOQ/Heritage-Hunters?node-id=0-1&p=f&t=IVCdWGbdNJjqjyFO-0)
- 인증 로직 및 점수 계산 알고리즘 설계

---

## 🤝 Contribution & Workflow

### 브랜치 전략

- `main`: 배포 브랜치
- `develop`: 개발 브랜치 → 여기서 `feature/*`, `fix/*`, `style/*` 등으로 파생

```bash
예시: feature/search-page
```

### 커밋 컨벤션

```txt
<타입>: <변경 요약>

<변경 상세 설명> (선택 사항)

```

예시

```txt
Feat: 댓글 작성 시 점수 부여 기능 추가

사용자가 유산 게시물에 댓글을 작성하면 점수를 획득하도록 기능 구현

```

| 타입       | 설명                                               |
| ---------- | -------------------------------------------------- |
| `Feat`     | 새로운 기능 추가                                   |
| `Fix`      | 버그 수정                                          |
| `Fixing`   | 버그 수정 테스트 코드                              |
| `Docs`     | 문서 수정                                          |
| `Style`    | 코드 포맷팅, 세미콜론 누락, 코드 변경 없는 경우    |
| `Refactor` | 코드 리팩토링                                      |
| `Test`     | 테스트 코드, 리팩토링 테스트 코드 추가             |
| `Chore`    | 빌드 업무 수정, 패키지 매니저 수정,그 외 자잘한 수 |
| `Design`   | css등 ui디자인을 변경했을 때                       |
| `Rename`   | 파일명( or 폴더명)을 수정한 경우                   |
| `Remove`   | 코드(파일)의 삭제가 있을 때.                       |
| `Perf`     | 성능 개선                                          |
| `Build`    | 빌드 관련 파일 수정 / 모듈 설치 또는 삭제          |

---

## 📄 License

이 프로젝트는 **비영리 학습 목적**으로 진행됩니다.
코드 및 자료는 자유롭게 참고 가능하지만, 상업적 사용은 삼가주시기 바랍니다.
