import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  { id: "all",          label: "All Styles",   icon: "✦" },
  { id: "Bridal",       label: "Bridal",       icon: "💍" },
  { id: "Arabic",       label: "Arabic",       icon: "🌙" },
  { id: "Traditional",  label: "Traditional",  icon: "🏛" },
  { id: "Modern",       label: "Modern",       icon: "⬡" },
  { id: "Minimal",      label: "Minimal",      icon: "◇" },
  { id: "Indo-Western", label: "Indo-Western", icon: "✿" },
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollStyle}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.8}
            onPress={() => onSelect(cat.id)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primary : colors.card,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.icon, { color: isSelected ? colors.primaryForeground : colors.gold }]}>
              {cat.icon}
            </Text>
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? colors.primaryForeground : colors.text,
                  fontFamily: isSelected ? "Poppins_600SemiBold" : "Poppins_400Regular",
                },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollStyle: {
    marginVertical: 8,
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
    height: 48,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1.5,
    elevation: 1,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 13,
  },
});
