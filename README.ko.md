[English](./README.md) | 한국어

# 8bit Loop Composer

React, Vite, Tone.js로 만든 작은 오픈소스 8비트 음악 메이커입니다.

다음과 같은 작업을 할 수 있습니다:

- 내장된 레트로 루프 프리셋 재생
- BPM, 마디 수, 키, 코드 수정
- 루프를 WAV로 내보내기
- GPT나 Claude로 만든 `LoopSpec` JSON을 바로 불러와 재생

## 주요 기능

- 프리셋 곡 라이브러리
- 스텝 그리드 스타일 루프 시각화
- AI 프롬프트 템플릿과 예시 JSON이 포함된 import 모달
- 불러온 곡 로컬 저장
- WAV export

## 시작하기

### 필요 환경

- Node.js 18 이상
- npm

### 설치

```bash
npm install
```

### 로컬 실행

```bash
npm run dev
```

Vite가 출력하는 로컬 주소로 접속하면 됩니다. 보통 `http://localhost:5173` 입니다.

### 프로덕션 빌드

```bash
npm run build
```

## AI Import 사용 흐름

앱은 `LoopSpec` JSON 형태의 음악 데이터를 가져올 수 있습니다.

1. `Add to song list` 버튼을 엽니다
2. 내장된 AI 프롬프트 템플릿을 복사합니다
3. GPT, Claude 같은 LLM에 붙여넣습니다
4. 원하는 루프를 생성해달라고 요청합니다
5. 반환된 JSON을 import 입력창에 붙여넣습니다
6. 앱에서 바로 재생합니다

가져오기 기능은 AI 출력이 조금 지저분해도 다음 정도는 자동 정리합니다:

- markdown 코드펜스
- 첫 `{` 이전의 여분 텍스트
- 마지막 `}` 이후의 여분 텍스트

## LoopSpec 구조

불러오는 루프는 대략 아래 형태를 따릅니다:

```json
{
  "title": "Example Loop",
  "mood": ["bright", "arcade"],
  "bpm": 128,
  "key": "C major",
  "scale": "major",
  "bars": 4,
  "timeSignature": "4/4",
  "chords": ["C", "G", "Am", "F"],
  "instruments": {
    "lead": "square",
    "bass": "triangle",
    "arp": "pulse",
    "drums": "noise"
  },
  "lead": [{ "bar": 1, "beat": 1, "note": "E5", "length": "8n" }],
  "bass": [{ "bar": 1, "beat": 1, "note": "C2", "length": "4n" }],
  "arp": [{ "bar": 1, "beat": 1, "note": "C5", "length": "16n" }],
  "drums": {
    "kick": [{ "bar": 1, "beat": 1 }],
    "snare": [{ "bar": 1, "beat": 2 }],
    "hat": [{ "bar": 1, "beat": 1.5 }]
  }
}
```

## 기술 스택

- React
- TypeScript
- Vite
- Tone.js
- Lucide React

## 기여하기

이슈와 PR을 환영합니다.

처음 기여하기 좋은 예시는 다음과 같습니다:

- 새로운 프리셋 곡 추가
- AI import 정리 로직 개선
- MIDI import 추가
- 모바일 UI 개선
- 신스/드럼 사운드 개선
- 작곡 UX 개선

## 라이선스

MIT
