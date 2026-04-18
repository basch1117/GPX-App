import React, { useLayoutEffect } from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { EntryForm } from '@/src/components/EntryForm';

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entryId = Number(id);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Edit Entry' });
  }, [navigation]);

  return <EntryForm editId={entryId} />;
}
