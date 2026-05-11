import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { AppHeader, Button, Card, Icon, Ring } from "../../components";
import { colors } from "../../theme/tokens";
import { WORDS_PAGE_SIZE, loadWordsPage } from "../../lib/dataSource";
import { deleteUserWord } from "../../lib/words";
import type { RootStackParamList } from "../../navigation/types";
import type { Word } from "../../types/word";

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
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "grid">("list");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const requestIdRef = useRef(0);
  const listRef = useRef<FlatList<Word>>(null);
  const gridRef = useRef<FlatList<Word>>(null);

  // 300ms 디바운스
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // 탭 전환 시 스크롤 최상단으로
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    gridRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filter]);

  const loadPage = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      const reqId = ++requestIdRef.current;
      setLoading(true);
      try {
        const next = await loadWordsPage({
          filter,
          search: debouncedSearch,
          page: targetPage,
        });
        if (reqId !== requestIdRef.current) return;
        if (mode === "replace") {
          setWords(next);
        } else {
          setWords((prev) => [...prev, ...next]);
        }
        setHasMore(next.length === WORDS_PAGE_SIZE);
        setPage(targetPage);
        setError(null);
      } catch (e: any) {
        if (reqId !== requestIdRef.current) return;
        console.warn("[ListScreen] loadWordsPage failed", e);
        setError(e?.message ?? "단어를 불러오지 못했습니다");
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    },
    [filter, debouncedSearch]
  );

  // focus 진입 + filter/검색 변경 시 첫 페이지 리셋
  useFocusEffect(
    useCallback(() => {
      void loadPage(0, "replace");
    }, [loadPage])
  );

  const onEndReached = useCallback(() => {
    if (loading || !hasMore) return;
    void loadPage(page + 1, "append");
  }, [loading, hasMore, page, loadPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPage(0, "replace");
    setRefreshing(false);
  }, [loadPage]);

  const handleDelete = useCallback(
    (word: Word) => {
      if (!word.user_word?.id) return;
      const userWordId = word.user_word.id;
      Alert.alert(
        "단어 삭제",
        `'${word.snapshot.word}' 단어를 삭제하시겠습니까?`,
        [
          { text: "취소", style: "cancel" },
          {
            text: "삭제",
            style: "destructive",
            onPress: () => {
              setWords((prev) => prev.filter((w) => w.id !== word.id));
              deleteUserWord(userWordId).catch((e: any) => {
                console.warn("[ListScreen] deleteUserWord failed", e);
                setError(e?.message ?? "단어를 삭제하지 못했습니다");
                void loadPage(0, "replace");
              });
            },
          },
        ]
      );
    },
    [loadPage]
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.ink[50] }}>
      <AppHeader
        title="단어장"
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

      {/* Error state */}
      {error ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Card padding={20} style={{ alignItems: "center" }}>
            <Icon name="x" size={36} color={colors.danger} strokeWidth={2.4} />
            <Text
              style={{
                marginTop: 10,
                fontSize: 15,
                fontWeight: "700",
                color: colors.ink[900],
              }}
            >
              단어를 불러오지 못했습니다
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontSize: 12,
                color: colors.ink[500],
                textAlign: "center",
              }}
            >
              {error}
            </Text>
            <View style={{ marginTop: 14 }}>
              <Button
                variant="secondary"
                size="sm"
                icon="refresh"
                onPress={() => {
                  void loadPage(0, "replace");
                }}
              >
                다시 시도
              </Button>
            </View>
          </Card>
        </View>
      ) : null}

      {/* List */}
      {!error && view === "list" ? (
        <FlatList
          ref={listRef}
          data={words}
          keyExtractor={(w) => w.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, gap: 10 }}
          renderItem={({ item }) => (
            <SwipeableWordRow
              word={item}
              onPress={() =>
                navigation.navigate("Detail", { wordId: item.id })
              }
              onLongPress={() => handleDelete(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            loading && hasMore && words.length > 0 ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator color={colors.ink[400]} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            loading ? null : <Empty filter={filter} search={search} />
          }
          removeClippedSubviews
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={10}
        />
      ) : !error && view === "grid" ? (
        <FlatList
          ref={gridRef}
          key="grid"
          data={words}
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
              onLongPress={() => handleDelete(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            loading && hasMore && words.length > 0 ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator color={colors.ink[400]} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            loading ? null : <Empty filter={filter} search={search} />
          }
          removeClippedSubviews
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={10}
        />
      ) : null}
    </SafeAreaView>
  );
}

// ─── Components ────────────────────────────────────────

function SwipeableWordRow({
  word,
  onPress,
  onLongPress,
  onDelete,
}: {
  word: Word;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
}) {
  const swipeableRef = useRef<SwipeableMethods | null>(null);

  const handleDeletePress = () => {
    swipeableRef.current?.close();
    onDelete();
  };

  const renderLeftActions = () => (
    <View
      style={{
        width: 88,
        marginRight: 8,
        justifyContent: "center",
      }}
    >
      <Pressable
        onPress={handleDeletePress}
        style={{
          flex: 1,
          backgroundColor: colors.danger,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <Icon name="trash" size={22} color="#fff" strokeWidth={2.2} />
        <Text style={{ fontSize: 11, fontWeight: "800", color: "#fff" }}>
          삭제
        </Text>
      </Pressable>
    </View>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      friction={2}
      leftThreshold={40}
      overshootLeft={false}
      containerStyle={{ borderRadius: 12 }}
    >
      <WordRow word={word} onPress={onPress} onLongPress={onLongPress} />
    </ReanimatedSwipeable>
  );
}

function WordRow({
  word,
  onPress,
  onLongPress,
}: {
  word: Word;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const m = word.mastery;
  const masteryColor =
    m > 0.7 ? colors.success : m > 0.4 ? colors.blue[500] : colors.warn;
  const ipa = word.snapshot.pronunciations[0]?.ipa ?? "";
  const pos = word.snapshot.partsOfSpeech[0]?.pos ?? "";
  const def = word.snapshot.partsOfSpeech[0]?.meanings[0]?.definition ?? "";

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
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

function WordTile({
  word,
  onPress,
  onLongPress,
}: {
  word: Word;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const m = word.mastery;
  const def = word.snapshot.partsOfSpeech[0]?.meanings[0]?.definition ?? "";
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
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
