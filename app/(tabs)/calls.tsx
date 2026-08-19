import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, Phone, PhoneMissed } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { calls } from '@/data/mock';
import { colors } from '@/lib/theme';

export default function CallsScreen() {
  return (
    <Screen>
      <View className="mb-6 mt-5 flex-row items-center justify-between">
        <Text className="text-[34px] font-semibold tracking-[-1px] text-primary">Calls</Text>
        <IconButton icon={Phone} label="Start a call" />
      </View>
      <SearchField placeholder="Search call history" />
      <Text className="mb-3 mt-7 text-[13px] font-semibold uppercase tracking-[1px] text-subtle">Recent</Text>
      <FlatList
        data={calls}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const Direction = item.direction === 'missed' ? PhoneMissed : item.direction === 'incoming' ? ArrowDownLeft : ArrowUpRight;
          return (
            <Pressable onPress={() => router.push({ pathname: '/call/[id]', params: { id: item.id } })} className="min-h-[76px] flex-row items-center rounded-[20px] px-2 active:bg-white/[0.04]">
              <Avatar initials={item.initials} color={item.color} size={52} />
              <View className="ml-4 flex-1">
                <Text className="text-[16px] font-semibold text-primary">{item.name}</Text>
                <View className="mt-1 flex-row items-center">
                  <Direction size={15} color={item.direction === 'missed' ? colors.danger : colors.muted} />
                  <Text className={`ml-1.5 text-[13px] ${item.direction === 'missed' ? 'text-danger' : 'text-secondary'}`}>{item.time}{item.duration ? ` · ${item.duration}` : ''}</Text>
                </View>
              </View>
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-elevated"><Phone size={19} color={colors.accent} /></View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
