import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Appbar, Searchbar, Chip, Card, Text, FAB, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { placeService } from '../../services/placeService';
import { Place } from '../../types';
import ScreenWrapper from '../../components/ScreenWrapper';

type FilterType = 'all' | 'visitlater' | 'liked';

export default function PlacesScreen() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPlaces();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [places, searchQuery, filter]);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const allPlaces = await placeService.getAllPlaces();
      setPlaces(allPlaces);
    } catch (error) {
      console.error('Ошибка загрузки мест:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlaces();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...places];

    // Применяем фильтр по статусу
    if (filter === 'visitlater') {
      filtered = filtered.filter((p) => p.visitlater);
    } else if (filter === 'liked') {
      filtered = filtered.filter((p) => p.liked);
    }

    // Применяем поиск
    if (searchQuery.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPlaces(filtered);
  };

  const handlePlacePress = (placeId: string) => {
    router.push(`/places/${placeId}`);
  };

  const renderPlaceItem = ({ item }: { item: Place }) => (
    <Card
      style={styles.card}
      onPress={() => handlePlacePress(item.id)}
      mode="elevated"
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.placeName}>
            {item.name}
          </Text>
          <View style={styles.chipsContainer}>
            {item.visitlater && (
              <Chip icon="clock-outline" compact style={styles.chip}>
                Посетить
              </Chip>
            )}
            {item.liked && (
              <Chip icon="heart" compact style={styles.chip}>
                Понравилось
              </Chip>
            )}
          </View>
        </View>
        {item.description && (
          <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.dd && (
          <Text variant="bodySmall" style={styles.coordinates}>
            📍 Координаты: {item.dd}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Места" />
        <Appbar.Action icon="plus" onPress={() => router.push('/places/new')} />
      </Appbar.Header>

      <View style={styles.content}>
        <Searchbar
          placeholder="Поиск мест..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <View style={styles.filtersContainer}>
          <Chip
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={styles.filterChip}
          >
            Все
          </Chip>
          <Chip
            selected={filter === 'visitlater'}
            onPress={() => setFilter('visitlater')}
            icon="clock-outline"
            style={styles.filterChip}
          >
            Посетить
          </Chip>
          <Chip
            selected={filter === 'liked'}
            onPress={() => setFilter('liked')}
            icon="heart"
            style={styles.filterChip}
          >
            Понравилось
          </Chip>
        </View>

        {loading && places.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">Загрузка...</Text>
          </View>
        ) : filteredPlaces.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">
              {places.length === 0
                ? 'Нет мест. Добавьте первое место!'
                : 'Места не найдены'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPlaces}
            renderItem={renderPlaceItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/places/new')}
      />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    marginRight: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  placeName: {
    flex: 1,
    marginRight: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  chip: {
    height: 24,
  },
  description: {
    marginTop: 4,
    color: '#666',
  },
  coordinates: {
    marginTop: 8,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
