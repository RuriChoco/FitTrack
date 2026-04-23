import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LucideSettings, LucideSave } from 'lucide-react-native';

const ProfileScreen = () => {
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('Male');

  const handleUpdate = () => {
    Alert.alert('Success', 'Profile updated! Your recommendations have been refreshed.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>My Profile</Text>
          <LucideSettings color="#333" size={24} />
        </View>
        <Text style={styles.subtitle}>Manage your demographic data for personalized exercise suggestions.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Your Age</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Age"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />

        <Text style={styles.label}>Your Gender</Text>
        <View style={styles.genderContainer}>
          {['Male', 'Female', 'Other'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.genderButton,
                gender === item && styles.genderButtonActive
              ]}
              onPress={() => setGender(item)}
            >
              <Text style={[
                styles.genderText,
                gender === item && styles.genderTextActive
              ]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
          <LucideSave color="#fff" size={20} style={{ marginRight: 10 }} />
          <Text style={styles.updateButtonText}>Update Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>Safety Notice</Text>
        <Text style={styles.warningText}>
          The exercise recommendations are based strictly on your age and gender. Please consult a professional if you have pre-existing medical conditions.
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F3F5',
    alignItems: 'center',
    marginRight: 8,
  },
  genderButtonActive: {
    backgroundColor: '#1A1A1A',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  genderTextActive: {
    color: '#fff',
  },
  updateButton: {
    backgroundColor: '#FF4757',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningBox: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 5,
  },
  warningText: {
    color: '#EF6C00',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ProfileScreen;
