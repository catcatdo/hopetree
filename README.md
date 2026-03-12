# 혼자가는빕스 담벼락

Firestore `comments` 컬렉션의 모든 응원을 스티커 카드로 보여주는 정적 웹앱이다.

## 구조
- `main.js`: Firebase 연결, 입력 검증, 백업, 팝업
- `stickerRenderer.js`: 스티커 카드 렌더링
- `style.css`: 벽지, 스티커, 입력폼, 팝업 스타일

## 운영 메모
- 댓글 1개 = 스티커 1장으로 전부 표시한다.
- `댓글 백업` 버튼은 현재 로드된 댓글을 JSON으로 저장한다.
- 권장 Firestore Rules는 `firestore.rules.example` 참고.
