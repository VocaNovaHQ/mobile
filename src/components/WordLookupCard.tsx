import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { Icon } from "./Icon";
import { lookupWord } from "../lib/naverDict";
import { addWordToVocab } from "../lib/words";
import { colors } from "../theme/tokens";
import type { WordSnapshot } from "../types/word";

type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; snapshot: WordSnapshot; alreadySaved: boolean }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

export type WordLookupCardProps = {
  /** 단어 추가 성공 시 호출 — HomeScreen이 fetchData() 재호출 */
  onAdded: () => void;
};

export function WordLookupCard({ onAdded }: WordLookupCardProps) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<LookupState>({ kind: "idle" });
  const [adding, setAdding] = useState(false);

  const trimmed = query.trim();
  const canSearch = trimmed.length > 0 && state.kind !== "loading";

  const handleSearch = async () => {
    if (!canSearch) return;
    setState({ kind: "loading" });
    try {
      const snapshot = await lookupWord(trimmed);
      if (!snapshot) {
        setState({ kind: "not-found" });
        return;
      }
      setState({ kind: "result", snapshot, alreadySaved: false });
    } catch (e: any) {
      setState({ kind: "error", message: e?.message ?? "검색 실패" });
    }
  };

  const handleAdd = async () => {
    if (state.kind !== "result" || adding) return;
    setAdding(true);
    try {
      const r = await addWordToVocab({
        lemma: state.snapshot.word,
        snapshot: state.snapshot,
        sourceUrl: null,
        contextSentence: null,
      });
      if (r && !r.was_new) {
        // 이미 저장된 단어 — 카드 안에서 알려주고 검색창 유지
        setState({ ...state, alreadySaved: true });
      } else {
        // 신규 추가 성공 — 검색창 초기화 + 부모에게 알림
        setQuery("");
        setState({ kind: "idle" });
        onAdded();
      }
    } catch (e: any) {
      Alert.alert("추가 실패", e?.message ?? "다시 시도해 주세요.");
    } finally {
      setAdding(false);
    }
  };

  const handleReset = () => {
    setQuery("");
    setState({ kind: "idle" });
  };

  return (
    <Card padding={16}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <Icon name="plus" size={16} color={colors.blue[500]} strokeWidth={2.4} />
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: colors.blue[500],
            letterSpacing: 0.5,
          }}
        >
          단어 빠르게 추가
        </Text>
      </View>

      <Text
        style={{
          fontSize: 13,
          color: colors.ink[600],
          lineHeight: 18,
          marginBottom: 12,
        }}
      >
        외우고 싶은 영단어를 검색해서 단어장에 바로 추가해 보세요.
      </Text>

      {/* Search row */}
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <View
          style={{
            flex: 1,
            height: 44,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: colors.ink[50],
            borderWidth: 0.5,
            borderColor: "rgba(15,23,42,0.06)",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="search" size={16} color={colors.ink[500]} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="apple"
            placeholderTextColor={colors.ink[400]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            editable={state.kind !== "loading"}
            maxLength={50}
            style={{
              flex: 1,
              fontSize: 14,
              color: colors.ink[900],
              padding: 0,
              fontWeight: "500",
            }}
          />
          {state.kind === "loading" ? (
            <ActivityIndicator size="small" color={colors.blue[500]} />
          ) : query ? (
            <Pressable onPress={handleReset} hitSlop={8}>
              <Icon name="x" size={14} color={colors.ink[400]} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={handleSearch}
          disabled={!canSearch}
          style={{
            height: 44,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: colors.blue[500],
            alignItems: "center",
            justifyContent: "center",
            opacity: canSearch ? 1 : 0.4,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
            검색
          </Text>
        </Pressable>
      </View>

      {/* Result / status area */}
      {state.kind === "result" ? (
        <ResultPreview
          snapshot={state.snapshot}
          alreadySaved={state.alreadySaved}
          adding={adding}
          onAdd={handleAdd}
        />
      ) : null}

      {state.kind === "not-found" ? (
        <StatusBox>
          <Text style={{ fontSize: 13, color: colors.ink[700], fontWeight: "600" }}>
            이 단어의 사전 결과가 없습니다.
          </Text>
          <Text
            style={{ fontSize: 12, color: colors.ink[500], marginTop: 2 }}
          >
            철자를 다시 확인해 보세요.
          </Text>
        </StatusBox>
      ) : null}

      {state.kind === "error" ? (
        <StatusBox tone="error">
          <Text style={{ fontSize: 13, color: colors.danger, fontWeight: "600" }}>
            검색 실패
          </Text>
          <Text style={{ fontSize: 12, color: colors.ink[500], marginTop: 2 }}>
            {state.message}
          </Text>
          <Pressable
            onPress={handleSearch}
            style={{ marginTop: 8, alignSelf: "flex-start" }}
            hitSlop={6}
          >
            <Text
              style={{ fontSize: 12, color: colors.blue[500], fontWeight: "700" }}
            >
              다시 시도 →
            </Text>
          </Pressable>
        </StatusBox>
      ) : null}
    </Card>
  );
}

// ─── Subcomponents ────────────────────────────────

function ResultPreview({
  snapshot,
  alreadySaved,
  adding,
  onAdd,
}: {
  snapshot: WordSnapshot;
  alreadySaved: boolean;
  adding: boolean;
  onAdd: () => void;
}) {
  const ipa = snapshot.pronunciations[0]?.ipa ?? "";
  const firstPos = snapshot.partsOfSpeech[0];
  const pos = firstPos?.pos ?? "";
  const firstMeaning = firstPos?.meanings[0];
  const def = firstMeaning?.definition ?? "";
  const exampleEn = firstMeaning?.exampleEn ?? "";

  return (
    <View
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: "rgba(15,23,42,0.08)",
        backgroundColor: colors.ink[50],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 4,
          flexWrap: "wrap",
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            color: colors.ink[900],
            letterSpacing: -0.3,
          }}
        >
          {snapshot.word}
        </Text>
        {ipa ? (
          <Text
            style={{
              fontSize: 12,
              color: colors.ink[500],
              fontStyle: "italic",
            }}
          >
            [{ipa}]
          </Text>
        ) : null}
      </View>

      {pos ? (
        <View style={{ flexDirection: "row", marginBottom: 6 }}>
          <Chip color={colors.blue[600]} bg={colors.chip} size="sm">
            {pos}
          </Chip>
        </View>
      ) : null}

      {def ? (
        <Text
          style={{
            fontSize: 13,
            color: colors.ink[800],
            fontWeight: "600",
            lineHeight: 19,
          }}
          numberOfLines={2}
        >
          {def}
        </Text>
      ) : null}

      {exampleEn ? (
        <Text
          style={{
            fontSize: 12,
            color: colors.ink[500],
            fontStyle: "italic",
            marginTop: 4,
            lineHeight: 17,
          }}
          numberOfLines={2}
        >
          “{exampleEn}”
        </Text>
      ) : null}

      <Pressable
        onPress={onAdd}
        disabled={alreadySaved || adding}
        style={{
          marginTop: 12,
          height: 38,
          borderRadius: 10,
          backgroundColor: alreadySaved ? colors.ink[200] : colors.blue[500],
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 6,
          opacity: adding ? 0.6 : 1,
        }}
      >
        {adding ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon
              name={alreadySaved ? "check" : "plus"}
              size={14}
              color={alreadySaved ? colors.ink[700] : "#fff"}
              strokeWidth={2.6}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: alreadySaved ? colors.ink[700] : "#fff",
              }}
            >
              {alreadySaved ? "이미 단어장에 있어요" : "단어장에 추가"}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function StatusBox({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "error";
}) {
  return (
    <View
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor:
          tone === "error" ? "rgba(239,68,68,0.2)" : "rgba(15,23,42,0.08)",
        backgroundColor:
          tone === "error" ? "#FEF2F2" : colors.ink[50],
      }}
    >
      {children}
    </View>
  );
}
