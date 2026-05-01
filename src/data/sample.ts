import type { Word, WordRow, WordSnapshot, UserWordRow } from "../types/word";

function makeSnapshot(
  word: string,
  source: string,
  ipaUS: string,
  pos: string,
  defs: { ko: string; en?: string; tr?: string }[]
): WordSnapshot {
  return {
    word,
    source,
    level: source === "OXFORD" ? "Oxford" : undefined,
    pronunciations: [{ label: "미국식", ipa: ipaUS, audioUrl: "" }],
    partsOfSpeech: [
      {
        pos,
        meanings: defs.map((d, i) => ({
          order: String(i + 1),
          definition: d.ko,
          exampleEn: d.en,
          exampleKo: d.tr,
        })),
      },
    ],
    synonyms: [],
    antonyms: [],
    images: [],
  };
}

function makeWord(opts: {
  id: string;
  word: string;
  source: string;
  ipaUS: string;
  pos: string;
  defs: { ko: string; en?: string; tr?: string }[];
  mastery: number;
  status?: UserWordRow["status"];
  daysAgo?: number;
}): Word {
  const created = new Date();
  created.setDate(created.getDate() - (opts.daysAgo ?? 0));

  const due = new Date();
  due.setDate(due.getDate() + (opts.mastery > 0.7 ? 4 : opts.mastery > 0.4 ? 1 : 0));

  const wordRow: WordRow = {
    id: opts.id,
    lemma: opts.word.toLowerCase(),
    snapshot: makeSnapshot(opts.word, opts.source, opts.ipaUS, opts.pos, opts.defs),
    source: "naver",
    last_synced_at: created.toISOString(),
    created_at: created.toISOString(),
  };

  const userWord: UserWordRow = {
    id: `uw-${opts.id}`,
    user_id: "demo",
    word_id: opts.id,
    folder_id: null,
    status: opts.status ?? (opts.mastery > 0.7 ? "mastered" : opts.mastery > 0.2 ? "learning" : "new"),
    srs_due_at: due.toISOString(),
    srs_interval_days: Math.round(opts.mastery * 21),
    srs_ease: 2.5,
    review_count: Math.round(opts.mastery * 10),
    correct_count: Math.round(opts.mastery * 8),
    source_url: null,
    context_sentence: null,
    note: null,
    created_at: created.toISOString(),
    updated_at: created.toISOString(),
  };

  return {
    ...wordRow,
    user_word: userWord,
    mastery: opts.mastery,
  };
}

export const SAMPLE_WORDS: Word[] = [
  makeWord({
    id: "common",
    word: "common",
    source: "OXFORD",
    ipaUS: "ˈkɑːmən",
    pos: "형용사",
    defs: [
      { ko: "흔한", en: "Jackson is a common English name.", tr: "잭슨은 흔한 영어 이름이다." },
      { ko: "공동의, 공통의", en: "They share a common interest in photography.", tr: "그들은 공통적으로 사진에 관심을 지니고 있다." },
    ],
    mastery: 0.4,
    daysAgo: 2,
  }),
  makeWord({
    id: "profound",
    word: "profound",
    source: "OXFORD",
    ipaUS: "prəˈfaʊnd",
    pos: "형용사",
    defs: [{ ko: "심오한, 깊은", en: "She has a profound understanding of music.", tr: "그녀는 음악에 대한 깊은 이해를 가지고 있다." }],
    mastery: 0.7,
    daysAgo: 5,
  }),
  makeWord({
    id: "serendipity",
    word: "serendipity",
    source: "CAMBRIDGE",
    ipaUS: "ˌserənˈdɪpəti",
    pos: "명사",
    defs: [{ ko: "뜻밖의 발견", en: "Meeting her was pure serendipity.", tr: "그녀를 만난 건 정말 뜻밖의 행운이었다." }],
    mastery: 0.2,
    daysAgo: 1,
  }),
  makeWord({
    id: "elaborate",
    word: "elaborate",
    source: "OXFORD",
    ipaUS: "ɪˈlæbəreɪt",
    pos: "동사",
    defs: [{ ko: "상세히 설명하다", en: "Could you elaborate on your idea?", tr: "당신의 아이디어를 자세히 설명해 주시겠어요?" }],
    mastery: 0.5,
    daysAgo: 3,
  }),
  makeWord({
    id: "mitigate",
    word: "mitigate",
    source: "MERRIAM",
    ipaUS: "ˈmɪtɪɡeɪt",
    pos: "동사",
    defs: [{ ko: "완화시키다", en: "Steps were taken to mitigate the damage.", tr: "피해를 줄이기 위한 조치가 취해졌다." }],
    mastery: 0.3,
    daysAgo: 4,
  }),
  makeWord({
    id: "ubiquitous",
    word: "ubiquitous",
    source: "OXFORD",
    ipaUS: "juːˈbɪkwɪtəs",
    pos: "형용사",
    defs: [{ ko: "어디에나 있는", en: "Smartphones are ubiquitous nowadays.", tr: "스마트폰은 요즘 어디에나 있다." }],
    mastery: 0.1,
    daysAgo: 0,
  }),
  makeWord({
    id: "resilient",
    word: "resilient",
    source: "OXFORD",
    ipaUS: "rɪˈzɪliənt",
    pos: "형용사",
    defs: [{ ko: "회복력 있는", en: "Children are usually resilient.", tr: "아이들은 보통 회복력이 강하다." }],
    mastery: 0.8,
    daysAgo: 7,
  }),
  makeWord({
    id: "concise",
    word: "concise",
    source: "CAMBRIDGE",
    ipaUS: "kənˈsaɪs",
    pos: "형용사",
    defs: [{ ko: "간결한", en: "Please be concise in your answer.", tr: "답변은 간결하게 해 주세요." }],
    mastery: 0.6,
    daysAgo: 6,
  }),
];

export type Friend = {
  name: string;
  initial: string;
  color: string;
  xp: number;
  rank: number;
  me?: boolean;
};

export const SAMPLE_FRIENDS: Friend[] = [
  { name: "지훈", initial: "지", color: "#FF7A45", xp: 1240, rank: 1 },
  { name: "Sarah", initial: "S", color: "#7C3AED", xp: 1180, rank: 2 },
  { name: "민지", initial: "민", color: "#10B981", xp: 980, rank: 3 },
  { name: "나", initial: "나", color: "#2D6FF5", xp: 920, rank: 4, me: true },
  { name: "Alex", initial: "A", color: "#F59E0B", xp: 740, rank: 5 },
];
