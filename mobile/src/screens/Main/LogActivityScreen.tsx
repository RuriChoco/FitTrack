import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LucideCheckCircle } from 'lucide-react-native';

const LogActivityScreen = () => {
  const [duration, setDuration] = useState('');
  const [status, setStatus] = useState('Completed');

  const handleSave = () => {
    if (!duration) {
      Alert.alert('Error', 'Please enter the duration.');
      return;
    }
    Alert.alert('Success', 'Activity logged successfully!');
    setDuration('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Activity</Text>
        <Text style={styles.subtitle}>Manually input your daily exercise progress.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Exercise Duration (Minutes)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 30"
          keyboardType="numeric"
          value={duration}
          onChangeText={setDuration}
        />

        <Text style={styles.label}>Completion Status</Text>
        <View style={styles.statusContainer}>
          {['Completed', 'Partial'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.statusButton,
                status === item && styles.statusButtonActive
              ]}
              onPress={() => setStatus(item)}
            >
              <Text style={[
                styles.statusButtonText,
                status === item && styles.statusButtonTextActive
              ]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <LucideCheckCircle color="#fff" size={20} style={{ marginRight: 10 }} />
          <Text style={styles.saveButtonText}>Save Log</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Note: This system relies on manual inputs to remain lightweight and accessible without wearables.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F1F3F5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F3F5',
    alignItems: 'center',
    marginRight: 10,
  },
  statusButtonActive: {
    backgroundColor: '#FF4757',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#2ED573',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    margin: 20,
    padding: 15,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  infoText: {
    color: '#1976D2',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default LogActivityScreen;
