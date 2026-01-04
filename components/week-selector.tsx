import { View, Text, TouchableOpacity } from "react-native";
import { getUpcomingWeeks, type WeekInfo } from "@/lib/week-utils";
import { cn } from "@/lib/utils";

interface WeekSelectorProps {
  selectedWeek: string; // weekStartString (YYYY-MM-DD)
  onSelectWeek: (weekStartString: string) => void;
  weeksToShow?: number;
}

export function WeekSelector({
  selectedWeek,
  onSelectWeek,
  weeksToShow = 4,
}: WeekSelectorProps) {
  const weeks = getUpcomingWeeks(weeksToShow);

  return (
    <View className="gap-3">
      <Text className="text-lg font-semibold text-foreground">
        Which week do you want to plan for?
      </Text>

      {weeks.map((week: WeekInfo) => {
        const isSelected = week.weekStartString === selectedWeek;
        const showWarning = week.isCurrentWeek && week.daysRemaining < 4;

        return (
          <TouchableOpacity
            key={week.weekStartString}
            onPress={() => onSelectWeek(week.weekStartString)}
            className={cn(
              "p-4 rounded-xl border-2",
              isSelected
                ? "bg-primary/10 border-primary"
                : "bg-surface border-border"
            )}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <View
                    className={cn(
                      "w-5 h-5 rounded-full border-2 items-center justify-center",
                      isSelected
                        ? "bg-primary border-primary"
                        : "bg-transparent border-border"
                    )}
                  >
                    {isSelected && (
                      <View className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </View>
                  <Text
                    className={cn(
                      "text-base font-semibold",
                      isSelected ? "text-primary" : "text-foreground"
                    )}
                  >
                    {week.label}
                  </Text>
                </View>

                {week.isNextWeek && (
                  <Text className="text-sm text-success ml-7 mt-1">
                    ✓ Recommended - Perfect timing for shopping this week
                  </Text>
                )}

                {showWarning && (
                  <Text className="text-sm text-warning ml-7 mt-1">
                    ⚠️ Only {week.daysRemaining} day{week.daysRemaining !== 1 ? 's' : ''} left
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
