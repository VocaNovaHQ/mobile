# VocaNova (iOS)

영어 단어를 모으고, 간격 반복(SRS)으로 복습하는 모바일 단어장 앱입니다.
크롬 익스텐션 / macOS 앱에서 저장한 단어가 자동으로 동기화되어, 어디서 모았든 한 곳에서 학습할 수 있습니다.

같은 Supabase 백엔드를 공유하는 [크롬 익스텐션(`voca-extension`)](../voca-extension) / [macOS 앱(`VocaNovaApp`)](../VocaNovaApp) 과 함께 동작합니다.

## 실행화면

<!-- 스크린샷 추가 -->

## 주요 기능

- **단어장 보기** — 저장된 단어를 리스트로 확인, 상세 화면에서 뜻·예문·발음 재생
- **SRS 복습** — 간격 반복 알고리즘으로 매일 복습할 단어를 자동 큐잉
- **학습 통계** — 누적 학습 단어, 연속 일수, 일별 통계
- **복습 알림** — 지정한 시간에 푸시 알림으로 학습 리마인드
- **Google / Apple 로그인** — Supabase Auth 기반
- **TTS 발음** — `expo-speech` / mp3 발음 재생

## 배포

<!-- TODO: App Store 출시 후 링크 추가 -->
<!-- TODO: TestFlight 베타 링크 추가 -->

## 기술 스택

- **프레임워크**: React Native (Expo SDK 54, New Architecture)
- **언어**: TypeScript
- **네비게이션**: React Navigation (Native Stack + Bottom Tabs)
- **상태 관리**: Zustand
- **스타일링**: NativeWind (Tailwind CSS for RN)
- **백엔드**: Supabase (`@supabase/supabase-js`)
- **인증**: `expo-auth-session` (Google), `expo-apple-authentication` (Apple)
- **저장소**: `expo-secure-store`, `@react-native-async-storage/async-storage`
- **알림**: `expo-notifications`
- **빌드 / 배포**: EAS Build

## 아키텍처

```
┌──────────────────────────┐
│  VocaNova (iOS)          │
│  ┌────────────────────┐  │
│  │ Screens (RN)       │  │
│  │ Zustand Store      │  │
│  │ src/lib/*          │  │
│  └─────────┬──────────┘  │
└────────────┼─────────────┘
             │  REST / RPC
             ▼
       ┌──────────────┐
       │   Supabase   │  ← voca-extension / VocaNovaApp 도 같은 백엔드 사용
       │  Auth + DB   │
       └──────────────┘
```

- 단어 데이터·사용자 인증·SRS 진행 상태는 모두 Supabase에 저장됩니다.
- 크롬 익스텐션과 macOS 앱이 같은 테이블을 바라보고 있어, 한 클라이언트에서 추가한 단어가 다른 기기에서도 즉시 학습 가능합니다.
- 발음/뜻 데이터는 네이버 사전을 source-of-truth로 사용하며, 저장 시점의 스냅샷을 함께 기록합니다.
