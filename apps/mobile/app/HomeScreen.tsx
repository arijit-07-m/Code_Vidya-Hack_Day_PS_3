import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';

interface HomeScreenProps {
  onLogout: () => void;
}

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const q = query(collection(db, 'tasks'), where('assignedTo', '==', userId));
      const snapshot = await getDocs(q);
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onLogout();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: '#3b82f6' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>My Tasks</Text>
          <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 }}>
            <Text style={{ color: 'white' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : tasks.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#94a3b8', fontSize: 16 }}>No tasks assigned</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTasks} />}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '600', fontSize: 16, flex: 1 }}>{item.title}</Text>
                <View style={{ backgroundColor: item.status === 'COMPLETED' ? '#dcfce7' : item.priority === 'CRITICAL' ? '#fef2f2' : '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, color: item.status === 'COMPLETED' ? '#16a34a' : item.priority === 'CRITICAL' ? '#dc2626' : '#64748b' }}>
                    {item.status === 'COMPLETED' ? 'Done' : item.priority}
                  </Text>
                </View>
              </View>
              {item.deadline && <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 13 }}>Due: {new Date(item.deadline).toLocaleDateString()}</Text>}
            </View>
          )}
        />
      )}
    </View>
  );
}