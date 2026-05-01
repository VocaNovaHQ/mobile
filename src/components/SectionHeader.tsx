import { Pressable, Text, View } from "react-native";
import { colors } from "../theme/tokens";

export type SectionHeaderProps = {
  title: string;
  action?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, action, onActionPress }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        paddingHorizontal: 20,
        marginTop: 14,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          fontSize: 17,
          fontWeight: "800",
          color: colors.ink[900],
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
      {action ? (
        <Pressable onPress={onActionPress}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.blue[500],
            }}
          >
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
