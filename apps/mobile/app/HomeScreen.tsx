import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
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
      const user = auth.currentUser;
      if (!user) return;
      const userEmail = user.email || '';
      const userShortName = userEmail.split('@')[0].toLowerCase();
      const userId = user.uid;

      // Query all tasks and filter for current user or show club tasks
      const q = query(collection(db, 'tasks'));
      const snapshot = await getDocs(q);
      const allTasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Match tasks assigned to current user UID, email, or short name
      const userTasks = allTasks.filter((t: any) => {
        if (!t.assignedTo) return false;
        const assign = t.assignedTo.toLowerCase();
        return (
          t.assignedTo === userId ||
          assign === userEmail.toLowerCase() ||
          assign === userShortName ||
          (t.assignedToName && t.assignedToName.toLowerCase() === userShortName)
        );
      });

      // If no specifically assigned tasks, fallback to showing all recent tasks
      setTasks(userTasks.length > 0 ? userTasks : allTasks.slice(0, 15));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (task: any) => {
    const nextStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update task');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onLogout();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: '#4f46e5' }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>
              My Tasks
            </Text>
            <Text style={{ color: '#c7d2fe', fontSize: 12, marginTop: 2 }}>
              {auth.currentUser?.email || 'Volunteer Workspace'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#4f46e5" />
      ) : tasks.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🎉</Text>
          <Text style={{ color: '#1e293b', fontSize: 18, fontWeight: 'bold' }}>
            All caught up!
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 4, textAlign: 'center' }}>
            No pending tasks assigned to you right now.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadTasks}
              colors={['#4f46e5']}
            />
          }
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isDone = item.status === 'COMPLETED';
            return (
              <TouchableOpacity
                onPress={() => toggleTaskStatus(item)}
                style={{
                  backgroundColor: 'white',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: isDone ? '#bbf7d0' : '#e2e8f0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      style={{
                        fontWeight: '600',
                        fontSize: 15,
                        color: isDone ? '#94a3b8' : '#0f172a',
                        textDecorationLine: isDone ? 'line-through' : 'none',
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                      👤 {item.assignedToName || item.assignedTo || 'Unassigned'}
                    </Text>
                    {item.deadline && (
                      <Text style={{ color: '#94a3b8', marginTop: 2, fontSize: 12 }}>
                        📅 Due: {new Date(item.deadline).toLocaleDateString()}
                      </Text>
                    )}
                  </View>

                  <View
                    style={{
                      backgroundColor: isDone
                        ? '#dcfce7'
                        : item.priority === 'CRITICAL'
                        ? '#fee2e2'
                        : item.priority === 'HIGH'
                        ? '#fef3c7'
                        : '#f1f5f9',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: isDone
                          ? '#15803d'
                          : item.priority === 'CRITICAL'
                          ? '#b91c1c'
                          : item.priority === 'HIGH'
                          ? '#b45309'
                          : '#475569',
                      }}
                    >
                      {isDone ? '✓ Done' : item.priority}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    marginTop: 10,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                    Tap card to toggle status
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: isDone ? '#16a34a' : '#4f46e5',
                    }}
                  >
                    {isDone ? 'Completed' : 'Mark Done'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}