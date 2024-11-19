import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CaixaScreen({ navigation }) {
  const [boxes, setBoxes] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null); // Caixinha selecionada
  const [loading, setLoading] = useState(true); // Estado de carregamento

  // Carregar as caixinhas do AsyncStorage
  useEffect(() => {
    const loadBoxes = async () => {
      try {
        const storedBoxes = await AsyncStorage.getItem('boxes');
        const parsedBoxes = storedBoxes ? JSON.parse(storedBoxes) : [];
        setBoxes(parsedBoxes);
      } catch (error) {
        console.error('Erro ao carregar caixinhas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBoxes();
  }, []);

  // Função para adicionar uma nova caixinha
  const addBox = async (newBox) => {
    const updatedBoxes = [...boxes, newBox];
    setBoxes(updatedBoxes);
    try {
      await AsyncStorage.setItem('boxes', JSON.stringify(updatedBoxes));
    } catch (error) {
      console.error('Erro ao salvar caixinha no AsyncStorage:', error);
    }
  };

  // Função para editar uma caixinha existente
  const editBox = async (updatedBox) => {
    const updatedBoxes = boxes.map((box) =>
      box.id === updatedBox.id ? updatedBox : box
    );
    setBoxes(updatedBoxes);
    try {
      await AsyncStorage.setItem('boxes', JSON.stringify(updatedBoxes));
    } catch (error) {
      console.error('Erro ao editar caixinha no AsyncStorage:', error);
    }
  };

  // Função para navegar até a tela de detalhes da caixinha
  const handleBoxPress = (box) => {
    setSelectedBox(box);
  };

  // Função para formatar o saldo
  const formatBalance = (balance) => {
    if (balance === undefined || balance === null) {
      return '0.00';
    }
    return balance.toFixed(2);
  };

  // Renderização condicional da caixinha selecionada
  const renderSelectedBox = () => {
    if (!selectedBox) return null;
    return (
      <View style={styles.selectedBoxDetails}>
        <Text style={styles.selectedBoxText}>
          Saldo da Caixinha: R$ {formatBalance(selectedBox.balance)}
        </Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('CaixaDetailsScreen', { box: selectedBox, editBox })
          }
          style={styles.modifyButton}
        >
          <Text style={styles.modifyButtonText}>Modificar Caixinha</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Função para renderizar cada item da lista de caixinhas
  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleBoxPress(item)} style={styles.boxButton}>
      <Text style={styles.boxText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#a445bd" />
      ) : boxes.length > 0 ? (
        <FlatList
          data={boxes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.gridContainer}
        />
      ) : (
        <Text style={styles.noBoxesText}>Nenhuma caixinha encontrada.</Text>
      )}
      {renderSelectedBox()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  boxButton: {
    backgroundColor: '#a445bd',
    padding: 30,
    borderRadius: 8,
    marginBottom: 15,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  boxText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noBoxesText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  selectedBoxDetails: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedBoxText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modifyButton: {
    backgroundColor: '#a445bd',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
