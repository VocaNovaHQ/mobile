import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader, Card, Icon, Ring } from "../../components";
import { colors } from "../../theme/tokens";
import { loadWords } from "../../lib/dataSource";
import type { RootStackParamList } from "../../navigation/types";
import type { Word, WordStatus } from "../../types/word";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type FilterKey = "all" | "new" | "learning" | "mastered" | "favorite";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "new", label: "학습 전" },
  { key: "learning", label: "학습 중" },
  { key: "mastered", label: "완료" },
  { key: "favorite", label: "즐겨찾기" },
];

export function ListScreen() {
  const navigation = useNavigation<Nav>();
  const [words, setWords] = useState<Word[]>([]);
  const [view, setView] = useState<"list" | "grid">("list");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadWords()
        .then((w) => {
          if (active) setWords(w);
        })
        .catch((e) => {
          console.warn("[ListScreen] loadWords failed", e);
          if (active) setWords([]);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  const filtered = useMemo(() => {
    let list = words;
    if (filter === "favorite") {
      list = list.filter((w) => w.user_word?.is_favorite === true);
    } else if (filter !== "all") {
      const status = filter as WordStatus;
      list = list.filter((w) => w.user_word?.status === status);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(
        (w) =>
          w.snapshot.word.toLowerCase().includes(s) ||
          w.snapshot.partsOfSpeech.some((p) =>
            p.meanings.some((m) => m.definition.toLowerCase().includes(s))
          )
      );
    }
    return list;
  }, [words, filter, search]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.ink[50] }}>
      <AppHeader
        title="단어장"
        subtitle={`${words.length}개의 단어`}
        big
        trailing={
          <>
            <RoundIconButton
              icon={view === "list" ? "grid" : "list"}
              onPress={() => setView(view === "list" ? "grid" : "list")}
            />
            <RoundIconButton
              icon="search"
              onPress={() =>
                setSearchOpen((v) => {
                  const next = !v;
                  if (!next) setSearch("");
                  return next;
                })
              }
            />
          </>
        }
      />

      {/* Search bar — 검색 버튼 누를 때만 표시 */}
      {searchOpen ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              height: 44,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: "#fff",
              borderWidth: 0.5,
              borderColor: "rgba(15,23,42,0.06)",
            }}
          >
            <Icon name="search" size={18} color={colors.ink[500]} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="단어 검색…"
              placeholderTextColor={colors.ink[500]}
              style={{
                flex: 1,
                fontSize: 14,
                color: colors.ink[900],
                padding: 0,
                fontWeight: "500",
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              autoFocus
            />
            {search ? (
              <Pressable onPress={() => setSearch("")}>
                <Icon name="x" size={16} color={colors.ink[400]} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 16,
          gap: 8,
          alignItems: "center",
        }}
      >
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: active ? colors.blue[500] : "#fff",
                borderWidth: active ? 0 : 0.5,
                borderColor: "rgba(15,23,42,0.06)",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: active ? "#fff" : colors.ink[700],
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* List */}
      {view === "list" ? (
        <FlatList
          data={filtered}
          keyExtractor={(w) => w.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, gap: 10 }}
          renderItem={({ item }) => (
            <WordRow
              word={item}
              onPress={() =>
                navigation.navigate("Detail", { wordId: item.id })
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Empty filter={filter} search={search} />}
        />
      ) : (
        <FlatList
          key="grid"
          data={filtered}
          keyExtractor={(w) => w.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
          columnWrapperStyle={{ gap: 10, marginBottom: 10 }}
          renderItem={({ item }) => (
            <WordTile
              word={item}
              onPress={() =>
                navigation.navigate("Detail", { wordId: item.id })
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Empty filter={filter} search={search} />}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Components ────────────────────────────────────────

function WordRow({ word, onPress }: { word: Word; onPress: () => void }) {
  const m = word.mastery;
  const masteryColor =
    m > 0.7 ? colors.success : m > 0.4 ? colors.blue[500] : colors.warn;
  const ipa = word.snapshot.pronunciations[0]?.ipa ?? "";
  const pos = word.snapshot.partsOfSpeech[0]?.pos ?? "";
  const def = word.snapshot.partsOfSpeech[0]?.meanings[0]?.definition ?? "";

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderWidth: 0.5,
        borderColor: "rgba(15,23,42,0.05)",
      }}
    >
      <Ring
        value={m}
        size={36}
        stroke={3}
        color={masteryColor}
        track={colors.ink[100]}
      >
        <Text style={{ fontSize: 9, fontWeight: "800", color: masteryColor }}>
          {Math.round(m * 100)}
        </Text>
      </Ring>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 2,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "800",
              color: colors.ink[900],
              letterSpacing: -0.3,
            }}
            numberOfLines={1}
          >
            {word.snapshot.word}
          </Text>
          {ipa ? (
            <Text
              style={{
                fontSize: 11,
                color: colors.ink[500],
                fontStyle: "italic",
              }}
              numberOfLines={1}
            >
              [{ipa}]
            </Text>
          ) : null}
        </View>
        <Text
          style={{ fontSize: 13, color: colors.ink[500] }}
          numberOfLines={1}
        >
          {pos ? (
            <Text style={{ color: colors.blue[500], fontWeight: "700" }}>
              {pos}
            </Text>
          ) : null}
          {pos ? " · " : ""}
          {def}
        </Text>
      </View>
      <Icon name="chevron-right" size={18} color={colors.ink[300]} />
    </Pressable>
  );
}

function WordTile({ word, onPress }: { word: Word; onPress: () => void }) {
  const m = word.mastery;
  const def = word.snapshot.partsOfSpeech[0]?.meanings[0]?.definition ?? "";
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        borderWidth: 0.5,
        borderColor: "rgba(15,23,42,0.05)",
        minHeight: 110,
        justifyContent: "space-between",
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            color: colors.ink[900],
            letterSpacing: -0.3,
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {word.snapshot.word}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.ink[500],
            lineHeight: 17,
          }}
          numberOfLines={2}
        >
          {def}
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 8,
        }}
      >
        <View
          style={{
            flex: 1,
            height: 4,
            backgroundColor: colors.ink[100],
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${m * 100}%`,
              height: "100%",
              backgroundColor: colors.blue[500],
              borderRadius: 2,
            }}
          />
        </View>
        <Text
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: colors.blue[500],
          }}
        >
          {Math.round(m * 100)}%
        </Text>
      </View>
    </Pressable>
  );
}

function Empty({ filter, search }: { filter: FilterKey; search: string }) {
  return (
    <Card padding={24} style={{ alignItems: "center", marginTop: 30 }}>
      <Icon name="layers" size={36} color={colors.ink[300]} />
      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: colors.ink[700],
          marginTop: 10,
        }}
      >
        {search ? "검색 결과가 없습니다" : "단어가 없습니다"}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: colors.ink[500],
          marginTop: 4,
          textAlign: "center",
        }}
      >
        {filter === "all"
          ? "익스텐션에서 단어를 추가해보세요."
          : "다른 필터를 선택해보세요."}
      </Text>
    </Card>
  );
}

function RoundIconButton({
  icon,
  onPress,
}: {
  icon: any;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#0F172A",
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <Icon name={icon} size={20} color={colors.ink[700]} />
    </Pressable>
  );
}
