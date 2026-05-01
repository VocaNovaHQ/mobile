import { Image, Text, View, type ImageSourcePropType } from "react-native";

export type AvatarProps = {
  initial?: string;
  color?: string;
  size?: number;
  ring?: string;
  source?: ImageSourcePropType | string;
};

export function Avatar({
  initial = "?",
  color = "#FF7A45",
  size = 32,
  ring,
  source,
}: AvatarProps) {
  const fontSize = Math.round(size * 0.42);
  const ringStyle = ring
    ? {
        borderWidth: 2.5,
        borderColor: ring,
        padding: 1.5,
      }
    : null;

  return (
    <View
      style={[
        ringStyle,
        {
          width: size + (ring ? 6 : 0),
          height: size + (ring ? 6 : 0),
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {source ? (
          <Image
            source={typeof source === "string" ? { uri: source } : source}
            style={{ width: size, height: size }}
          />
        ) : (
          <Text
            style={{
              color: "#fff",
              fontWeight: "800",
              fontSize,
              letterSpacing: 0.2,
            }}
          >
            {initial}
          </Text>
        )}
      </View>
    </View>
  );
}
