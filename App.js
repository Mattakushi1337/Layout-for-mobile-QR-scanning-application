import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Dimensions, Text, TouchableOpacity, Image, TextInput, Alert, Modal, StyleSheet, ScrollView, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { NavigationContainer, useRoute, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import AdminScreen, { TableScreen, ComputerScreen, MFUIntScreen, OfficeIntScreen } from './adminScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BarcodeMask from 'react-native-barcode-mask';
import { Camera, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';

const socket = io('wss://back.qrcds.site');
const Stack = createStackNavigator();
const clearAsyncStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('AsyncStorage очищен.');
  } catch (error) {
    console.error('Ошибка при очистке AsyncStorage:', error);
  }
};

const FioList = ({ onSelectFio }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const loadSavedFio = async () => {
      try {
        const savedFio = await AsyncStorage.getItem('savedFio');
        if (savedFio) {
          setInputValue(savedFio);
          onSelectFio(savedFio);
        }
      } catch (error) {
        console.error('Ошибка при загрузке сохраненного ФИО:', error);
      }
    };
    loadSavedFio();
  }, []);

  const handleInputChange = (text) => {
    setInputValue(text);
  };

  const handleSelectFio = async () => {
    if (inputValue.trim() === '') {
      return;
    }

    try {
      const response = await fetch(`https://back.qrcds.site/users/${inputValue}`);
      const userData = await response.json();
      if (userData && userData.fio) {
        const idToImeiMap = {
          "pqOZLciKlrng": '51757158715',
          "F0sTxGe5RliK": '12345678901',
          "d9s19deZzAJV": '98765432109',
          "vThAfFXXBDZn": '55555555555',
          "CvAIk7wG8uHf": '99999999999',
        };

        const imei = idToImeiMap[userData.id];
        const userRights = {
          it: userData.it,
          asutp: userData.asutp,
          aho: userData.aho,
        };
        userData.imei = imei;

        await fetch(`https://back.qrcds.site/users/${userData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
        console.log(userData);
        await AsyncStorage.setItem('userId', userData.id);
        await AsyncStorage.setItem('savedFio', userData.fio);
        await AsyncStorage.setItem('userRights', JSON.stringify(userRights));
        onSelectFio(userData.fio);
      }
    } catch (error) {
      console.error('Ошибка при получении ФИО с бэкэнда:', error);
    }
  };

  return (
    <View>
      <TextInput
        style={styles.fioInput}
        placeholder="Введите ID"
        placeholderTextColor="white"
        value={inputValue}
        onChangeText={handleInputChange}
      />
      <TouchableOpacity onPress={handleSelectFio} style={styles.fioItem}>
        <Text style={styles.fioTextModal}>Сохранить</Text>
      </TouchableOpacity>
    </View>
  );
};

var previousScreen;
var fio;
const HomeScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [alertShown, setAlertShown] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [barcodeKey, setBarcodeKey] = useState(0);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setHasPermission(null);
    });
    return unsubscribe;
  }, [navigation, previousScreen]);


  useFocusEffect(
    useCallback(() => {
      const requestPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      };

      setHasPermission(null);
      requestPermission();
    }, [])
  );

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const marginX = 10;
  const marginY = 270;

  const perimeterBounds = {
    left: marginX,
    top: marginY,
    right: screenWidth - marginX,
    bottom: screenHeight - marginY - 50,
  };

  const isPointInsidePerimeter = (point) => {
    return (
      point.x >= perimeterBounds.left &&
      point.x <= perimeterBounds.right &&
      point.y >= perimeterBounds.top &&
      point.y <= perimeterBounds.bottom
    );
  };
  const handleBarCodeScanned = async ({ cornerPoints, data }) => {
    const pointsInsidePerimeter = cornerPoints.filter(isPointInsidePerimeter);
    const centerX = cornerPoints.reduce((sum, point) => sum + point.x, 0) / cornerPoints.length;
    const centerY = cornerPoints.reduce((sum, point) => sum + point.y, 0) / cornerPoints.length;
    const userRightsString = await AsyncStorage.getItem('userRights');
    const userRights = JSON.parse(userRightsString);
    if (centerX >= perimeterBounds.left &&
      centerX <= perimeterBounds.right &&
      centerY >= perimeterBounds.top &&
      centerY <= perimeterBounds.bottom) {
      if (data === 'mrL7vRrdzUSQ0eYGxM2PvyhlzIy1ZzaIHT8vG1PI') {
        if (userRights.aho === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('OfficeScreen');
          socket.emit('animation_1', { qrCodeId: 'mrL7vRrdzUSQ0eYGxM2PvyhlzIy1ZzaIHT8vG1PI', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: 'mrL7vRrdzUSQ0eYGxM2PvyhlzIy1ZzaIHT8vG1PIВ' });
          const fetchIntDataByName = async () => {
            const name = 'mrL7vRrdzUSQ0eYGxM2PvyhlzIy1ZzaIHT8vG1PI';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;

            try {
              const response = await fetch(apiUrl);
              if (!response.ok) {
                console.error('Ошибка при получении данных:', response);
                return null;
              }
              const data = await response.json();
              console.log(data);
              socket.emit('animation_3', data);
            } catch (error) {
              console.error('Ошибка при получении данных:', error);
            }
          };
          fetchIntDataByName()

        }
      } else if (data === 'FiZX73nN6P5tjXWSSTqVyr8Yn5hDAIk0tl17hLSn') {
        if (userRights.it === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('MFUScreen');
          socket.emit('animation_1', { qrCodeId: 'FiZX73nN6P5tjXWSSTqVyr8Yn5hDAIk0tl17hLSn', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: 'FiZX73nN6P5tjXWSSTqVyr8Yn5hDAIk0tl17hLSn' });
          const fetchIntDataByName = async () => {
            const name = 'FiZX73nN6P5tjXWSSTqVyr8Yn5hDAIk0tl17hLSn';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;

            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          };
          fetchIntDataByName();
        }
      } else if (data === 'z1XUGy6aTNHyvYihei9nu63LgGlMQtHe1XnRzJ8d') {
        if (userRights.aho === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('TableFixScreen');
          socket.emit('animation_1', { qrCodeId: 'z1XUGy6aTNHyvYihei9nu63LgGlMQtHe1XnRzJ8d', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: 'z1XUGy6aTNHyvYihei9nu63LgGlMQtHe1XnRzJ8d' });
          const fetchIntDataByName = async () => {
            const name = 'z1XUGy6aTNHyvYihei9nu63LgGlMQtHe1XnRzJ8d';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          }
          fetchIntDataByName()
        }
      } else if (data === 'om95lS8uAQ2Hkfezn9qFA4fc2sLGWDGZ1KBlA7dK') {
        if (userRights.it === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('ComputerFixScreen');
          socket.emit('animation_1', { qrCodeId: 'om95lS8uAQ2Hkfezn9qFA4fc2sLGWDGZ1KBlA7dK', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: 'om95lS8uAQ2Hkfezn9qFA4fc2sLGWDGZ1KBlA7dK' });
          const fetchIntDataByName = async () => {
            const name = 'om95lS8uAQ2Hkfezn9qFA4fc2sLGWDGZ1KBlA7dK';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          }
          fetchIntDataByName()
        }
      } else if (data === 'fVnwnEaemLVvaCfuh3hB9OwmOz0f2Hz2KVQDsLl4') {
        if (userRights.it === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('PhoneFixScreen');
          socket.emit('animation_1', { qrCodeId: 'fVnwnEaemLVvaCfuh3hB9OwmOz0f2Hz2KVQDsLl4', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: 'fVnwnEaemLVvaCfuh3hB9OwmOz0f2Hz2KVQDsLl4' });
          const fetchIntDataByName = async () => {
            const name = 'fVnwnEaemLVvaCfuh3hB9OwmOz0f2Hz2KVQDsLl4';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          }
          fetchIntDataByName()
        }
      } else if (data === 'BEYWc02B1w3vONMoViurR06cmQPh4oueJNyO77pZ') {
        if (userRights.it === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('MonitorFixScreen');
          socket.emit('animation_1', { qrCodeId: 'BEYWc02B1w3vONMoViurR06cmQPh4oueJNyO77pZ', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: 'BEYWc02B1w3vONMoViurR06cmQPh4oueJNyO77pZ' });
          const fetchIntDataByName = async () => {
            const name = 'BEYWc02B1w3vONMoViurR06cmQPh4oueJNyO77pZ';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          }
          fetchIntDataByName()
        }
      } else if (data === 'p6ZgIRLZIgVDCSsB30wxw6Og0JdqMfsXBm273bwe') {
        if (userRights.aho === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('ChairFixScreen');
          socket.emit('animation_1', { qrCodeId: 'p6ZgIRLZIgVDCSsB30wxw6Og0JdqMfsXBm273bwe', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: 'p6ZgIRLZIgVDCSsB30wxw6Og0JdqMfsXBm273bwe' });
          const fetchIntDataByName = async () => {
            const name = 'p6ZgIRLZIgVDCSsB30wxw6Og0JdqMfsXBm273bwe';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          }
          fetchIntDataByName()
        }
      } else if (data === '9vKqvvnqtBK5C6krs6aa8PJ7O4LcsH8hWCB6OV6y') {
        if (userRights.it === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('RouterFixScreen');
          socket.emit('animation_1', { qrCodeId: '9vKqvvnqtBK5C6krs6aa8PJ7O4LcsH8hWCB6OV6y', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: '9vKqvvnqtBK5C6krs6aa8PJ7O4LcsH8hWCB6OV6y' });
          const fetchIntDataByName = async () => {
            const name = '9vKqvvnqtBK5C6krs6aa8PJ7O4LcsH8hWCB6OV6y';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          }
          fetchIntDataByName()
        }

      } else if (data === 'Fg3WpHuSHmt9vHJCrDVQVfNG3X2a87DQCTaTrdXn') {
        if (userRights.aho === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('CoolerFixScreen');
          socket.emit('animation_1', { qrCodeId: 'Fg3WpHuSHmt9vHJCrDVQVfNG3X2a87DQCTaTrdXn', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: 'Fg3WpHuSHmt9vHJCrDVQVfNG3X2a87DQCTaTrdXn' });
          const fetchIntDataByName = async () => {
            const name = 'Fg3WpHuSHmt9vHJCrDVQVfNG3X2a87DQCTaTrdXn';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          }
          fetchIntDataByName();
        }
      } else if (data === '0R4BU1Cu5CoVAdKQwytppRGEpWzZ1DKZfXTSO5yi') {
        if (userRights.it === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('IBPFixScreen');
          socket.emit('animation_1', { qrCodeId: '0R4BU1Cu5CoVAdKQwytppRGEpWzZ1DKZfXTSO5yi', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: '0R4BU1Cu5CoVAdKQwytppRGEpWzZ1DKZfXTSO5yi' });
          const fetchIntDataByName = async () => {
            const name = '0R4BU1Cu5CoVAdKQwytppRGEpWzZ1DKZfXTSO5yi';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          }
          fetchIntDataByName();
        }
      } else if (data === '1XichVggzUfhecv6xyGqAfDR7f6RujLQb3cVPeN1') {
        if (userRights.it === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('MFU2FixScreen');
          socket.emit('animation_1', { qrCodeId: '1XichVggzUfhecv6xyGqAfDR7f6RujLQb3cVPeN1', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: '1XichVggzUfhecv6xyGqAfDR7f6RujLQb3cVPeN1' });
          const fetchIntDataByName = async () => {
            const name = '1XichVggzUfhecv6xyGqAfDR7f6RujLQb3cVPeN1';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          }
          fetchIntDataByName();
        }
      } else if (data === 'VUUFiYQP6DEEHcABTKG5ySWCohMF7V368JvwDFo6') {
        if (userRights.it === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('Computer2FixScreen');
          socket.emit('animation_1', { qrCodeId: 'VUUFiYQP6DEEHcABTKG5ySWCohMF7V368JvwDFo6', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: 'VUUFiYQP6DEEHcABTKG5ySWCohMF7V368JvwDFo6' });
          const fetchIntDataByName = async () => {
            const name = 'VUUFiYQP6DEEHcABTKG5ySWCohMF7V368JvwDFo6';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          }
          fetchIntDataByName();
        }
      } else if (data === 'inbFJyiyvHWnDTUlDszbrIFbCMqYy72vvesYhiYL') {
        if (userRights.aho === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('Office2Screen');
          socket.emit('animation_1', { qrCodeId: 'inbFJyiyvHWnDTUlDszbrIFbCMqYy72vvesYhiYL', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: 'inbFJyiyvHWnDTUlDszbrIFbCMqYy72vvesYhiYL' });
          const fetchIntDataByName = async () => {
            const name = 'inbFJyiyvHWnDTUlDszbrIFbCMqYy72vvesYhiYL';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          }
          fetchIntDataByName();
        }
      } else if (data === 's5Gb9aAM91I8mar7IZSR8cJk2puVusARYdz4WSqC') {
        if (userRights.aho === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('Chair2FixScreen');
          socket.emit('animation_1', { qrCodeId: 's5Gb9aAM91I8mar7IZSR8cJk2puVusARYdz4WSqC', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: 's5Gb9aAM91I8mar7IZSR8cJk2puVusARYdz4WSqC' });
          const fetchIntDataByName = async () => {
            const name = 's5Gb9aAM91I8mar7IZSR8cJk2puVusARYdz4WSqC';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          }
          fetchIntDataByName();
        }
      } else if (data === 'hhfezhtQFmv7oemKWtpRSu4ka5f4hTbirefUaseF') {
        if (userRights.it === "0") {
          if (!alertShown) {
            Alert.alert('У вас нет прав для сканирования этого объекта', '', [
              {
                text: 'OK',
                onPress: () => setAlertShown(false),
              },
            ]);
            setAlertShown(true);
          }
        } else {
          navigation.navigate('IBP2FixScreen');
          socket.emit('animation_1', { qrCodeId: 'hhfezhtQFmv7oemKWtpRSu4ka5f4hTbirefUaseF', userId: await AsyncStorage.getItem('userId') });
          socket.emit('animation_2', { qrCodeId: 'hhfezhtQFmv7oemKWtpRSu4ka5f4hTbirefUaseF' });
          const fetchIntDataByName = async () => {
            const name = 'hhfezhtQFmv7oemKWtpRSu4ka5f4hTbirefUaseF';
            const apiUrl = `https://back.qrcds.site/IntData/${name}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
              console.error('Ошибка при получении данных:', response);
              return null;
            }
            const data = await response.json();
            console.log(data);
            socket.emit('animation_3', data);
          }
          fetchIntDataByName();
        }
      } else {
        if (!alertShown) {
          Alert.alert('QR код не существует', '', [
            {
              text: 'OK',
              onPress: () => setAlertShown(false),
            },
          ]);
          setAlertShown(true);
        }

      }
    } else {
      console.log("QR-код за пределами заданного периметра");
    }
  };

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setBarcodeKey((prevKey) => prevKey + 1);
  };

  const handleSelectFio = (selectedFio) => {
    fio = selectedFio;
    closeModal();
  };

  const toggleFlash = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.torch
        : Camera.Constants.FlashMode.off
    );
  };

  if (hasPermission === null) {
    return <Text>Запрос разрешений на камеру...</Text>;
  }

  if (hasPermission === false) {
    return <Text>Доступ к камере запрещен</Text>;
  }
  return (
    <View style={styles.container}>
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <FioList onSelectFio={handleSelectFio} />
        </View>
      </Modal>
      <Camera
        ratio='16:9'
        type={CameraType.back}
        style={styles.camera}
        flashMode={flashMode}
        onBarCodeScanned={(data) => {
          if (!isModalVisible) {
            handleBarCodeScanned(data);
          }
        }}
      >
        <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
          <Ionicons name={flashMode === Camera.Constants.FlashMode.off ? 'flash' : 'flash-off'} size={24} color="white" />
        </TouchableOpacity>
        <View
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            flexDirection: 'row',
          }}>
        </View>
        <BarcodeMask key={barcodeKey} lineAnimationDuration={1500} showAnimatedLine={true} edgeBorderWidth={10} edgeHeight={40} edgeWidth={40} edgeRadius={20} animatedLineColor='lime' width={330} height={330} />
      </Camera>


      <TouchableOpacity
        onPress={() => {
          clearAsyncStorage();
          openModal();
        }}
      >
        <Text style={{ color: '#ffffff' }}>Назад </Text>
      </TouchableOpacity>

      <Text style={styles.scanText}>Отсканируйте QR-код</Text>

      <TouchableOpacity
        onPress={() => {
          if (previousScreen !== undefined) {
            navigation.navigate(previousScreen);
          } else {
            navigation.navigate('Home');
          }
        }}
        style={{
          flexDirection: 'row',
          backgroundColor: '#CCCCCC',
          padding: 2,
          borderRadius: 8,
          alignItems: 'center',
          width: 'auto',
          minWidth: 150,
          alignContent: 'center',
          height: 55,
          top: 670,
          justifyContent: 'center',
          alignSelf: 'center',
          position: 'absolute',
          display: previousScreen !== undefined ? 'flex' : 'none',
        }}
      >
        <Text style={{ color: '#ffffff' }}>Назад </Text>
      </TouchableOpacity>
    </View >

  );
};


const OfficeScreen = ({ navigation }) => {
  previousScreen = useRoute().name;
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollViewRef = useRef();

  var place;
  const fetchIntDataByName = async () => {
    const name = 'mrL7vRrdzUSQ0eYGxM2PvyhlzIy1ZzaIHT8vG1PI';
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  fetchIntDataByName();

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'АХО: офис',
      executorGroup: 'АХО',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      console.log(JSON.stringify(requestBody));
      if (!response.ok) {
        console.log('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.log('Ошибка при отправке данных:', error);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}

    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/office1.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}

            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>Офиса</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>

              <View style={styles.categoryButtonContainer}>
                {categories.slice(0, 2).map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });

                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.categoryButtonContainer}>
                {categories.slice(2).map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });

                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedCategory === 'Освещение' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {subCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {selectedCategory === 'Розетка' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {subSocketCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              numberOfLines={5}
              editable={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView >
    </ScrollView >
  );
};
const Office2Screen = ({ navigation }) => {
  previousScreen = useRoute().name;
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  var place;
  const fetchIntDataByName = async () => {
    const name = 'inbFJyiyvHWnDTUlDszbrIFbCMqYy72vvesYhiYL';
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  fetchIntDataByName();

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'АХО: офис',
      executorGroup: 'АХО',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      console.log(JSON.stringify(requestBody));
      if (!response.ok) {
        console.log('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.log('Ошибка при отправке данных:', error);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/office2.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>Офиса</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>

              <View style={styles.categoryButtonContainer}>
                {categories.slice(0, 2).map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.categoryButtonContainer}>
                {categories.slice(2).map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedCategory === 'Освещение' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {subCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {selectedCategory === 'Розетка' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {subSocketCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView >
    </ScrollView >
  );
};
const MFUScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  previousScreen = useRoute().name;
  var place;

  const fetchIntDataByName = async () => {
    const name = 'FiZX73nN6P5tjXWSSTqVyr8Yn5hDAIk0tl17hLSn';
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };

  fetchIntDataByName();

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };
  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'ИТ: МФУ',
      executorGroup: 'ИТ',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.error('Ошибка при отправке данных:', error);
    }
  };
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >

        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/MFU1.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>МФУ</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>
              <View style={styles.categoryButtonContainer}>
                {mfuCategories.slice(0, 2).map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.categoryButtonContainer}>
                {mfuCategories.slice(2).map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.mfuCategoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedCategory === 'Замена картирджа' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {cartridgeColors.slice(0, 2).map((color) => (
                    <TouchableOpacity
                      key={color.label}
                      style={[styles.mfuSubCategoryButton, selectedSubCategory === color.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(color.label)}
                    >
                      <Text>{color.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.categoryButtonContainer}>
                  {cartridgeColors.slice(2).map((color) => (
                    <TouchableOpacity
                      key={color.label}
                      style={[styles.mfuSubCategoryButton, selectedSubCategory === color.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(color.label)}
                    >
                      <Text>{color.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

        </View >
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const MFU2FixScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  previousScreen = useRoute().name;
  var place;

  const fetchIntDataByName = async () => {
    const name = '1XichVggzUfhecv6xyGqAfDR7f6RujLQb3cVPeN1';
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };

  fetchIntDataByName();

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };
  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'ИТ: МФУ(Ч/Б)',
      executorGroup: 'ИТ',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.error('Ошибка при отправке данных:', error);
    }
  };
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}

    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >

        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/MFU2.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>МФУ(Ч/Б)</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>
              <View style={styles.categoryButtonContainer}>
                {mfuCategories.slice(0, 2).map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.mfuCategoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.categoryButtonContainer}>
                {mfuCategories.slice(2).map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.mfuCategoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

        </View >
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const TableFixScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  previousScreen = useRoute().name;
  var place;

  const fetchIntDataByName = async () => {
    const name = 'z1XUGy6aTNHyvYihei9nu63LgGlMQtHe1XnRzJ8d';
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  fetchIntDataByName();

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'АХО: стол',
      executorGroup: 'АХО',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.error('Ошибка при отправке данных:', error);
    }
  };
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}

    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >

        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/table.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>Стола</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>

              <View style={styles.categoryButtonContainer}>
                {TableCategories.map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};
const ComputerFixScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  previousScreen = useRoute().name;
  var place;

  const fetchIntDataByName = async () => {
    const name = 'om95lS8uAQ2Hkfezn9qFA4fc2sLGWDGZ1KBlA7dK';
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  fetchIntDataByName();

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'ИТ: компьютер',
      executorGroup: 'ИТ',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.error('Ошибка при отправке данных:', error);
    }
  };
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}

    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/pc1.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>Компьютера</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>

              <View style={styles.categoryButtonContainer}>
                {computerCategories.map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedCategory === 'Системный блок' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {computerSubCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const Computer2FixScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  previousScreen = useRoute().name;
  var place;

  const fetchIntDataByName = async () => {
    const name = 'VUUFiYQP6DEEHcABTKG5ySWCohMF7V368JvwDFo6';
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  fetchIntDataByName();

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'ИТ: компьютер',
      executorGroup: 'ИТ',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.error('Ошибка при отправке данных:', error);
    }
  };
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}

    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/pc2.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>Компьютера</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>

              <View style={styles.categoryButtonContainer}>
                {computerCategories.map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedCategory === 'Системный блок' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {computerSubCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const PhoneFixScreen = ({ navigation }) => {
  previousScreen = useRoute().name;
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  var place;
  const fetchIntDataByName = async () => {
    const name = "fVnwnEaemLVvaCfuh3hB9OwmOz0f2Hz2KVQDsLl4";
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  fetchIntDataByName();

  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'ИТ: телефон',
      executorGroup: 'Связь',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      console.log(JSON.stringify(requestBody));
      if (!response.ok) {
        console.log('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.log('Ошибка при отправке данных:', error);
    }
  };

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}

    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/phone.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>Телефона</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>

              <View style={styles.categoryButtonContainer}>
                {phoneCategories.map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedCategory === 'Проблемы со звуком' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {subPhoneCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const MonitorFixScreen = ({ navigation }) => {
  previousScreen = useRoute().name;
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  var place;
  const fetchIntDataByName = async () => {
    const name = "BEYWc02B1w3vONMoViurR06cmQPh4oueJNyO77pZ";
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  fetchIntDataByName();

  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'ИТ: монитор',
      executorGroup: 'ИТ',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      console.log(JSON.stringify(requestBody));
      if (!response.ok) {
        console.log('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.log('Ошибка при отправке данных:', error);
    }
  };

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}

    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/monitor.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>Монитора</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>

              <View style={styles.categoryButtonContainer}>
                {monitorCategories.map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedCategory === 'Проблемы со звуком' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {subMonitorCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const IBPFixScreen = ({ navigation }) => {
  previousScreen = useRoute().name;
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  var place;
  const fetchIntDataByName = async () => {
    const name = '0R4BU1Cu5CoVAdKQwytppRGEpWzZ1DKZfXTSO5yi';
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  fetchIntDataByName();

  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'ИТ: ИБП',
      executorGroup: 'ИТ',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      console.log(JSON.stringify(requestBody));
      if (!response.ok) {
        console.log('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.log('Ошибка при отправке данных:', error);
    }
  };

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}

    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/ibp1.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>ИБП</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>

              <View style={styles.categoryButtonContainer}>
                {IPBCategories.map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedCategory === 'Проблемы со звуком' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {subMonitorCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const IBP2FixScreen = ({ navigation }) => {
  previousScreen = useRoute().name;
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  var place;
  const fetchIntDataByName = async () => {
    const name = 'hhfezhtQFmv7oemKWtpRSu4ka5f4hTbirefUaseF';
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  fetchIntDataByName();

  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'ИТ: ИБП',
      executorGroup: 'ИТ',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      console.log(JSON.stringify(requestBody));
      if (!response.ok) {
        console.log('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.log('Ошибка при отправке данных:', error);
    }
  };

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}

    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/ibp2.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>ИБП</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>

              <View style={styles.categoryButtonContainer}>
                {IPBCategories.map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedCategory === 'Проблемы со звуком' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {subMonitorCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const ChairFixScreen = ({ navigation }) => {
  previousScreen = useRoute().name;
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  var place;
  const fetchIntDataByName = async () => {
    const name = 'p6ZgIRLZIgVDCSsB30wxw6Og0JdqMfsXBm273bwe';
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  fetchIntDataByName();

  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'АХО: стул',
      executorGroup: 'АХО',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      console.log(JSON.stringify(requestBody));
      if (!response.ok) {
        console.log('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.log('Ошибка при отправке данных:', error);
    }
  };

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}

    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/chair.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>Стула</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>
              <View style={styles.categoryButtonContainer}>
                {chairCategories.map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {selectedCategory === 'Проблемы со звуком' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {subChairCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const Chair2FixScreen = ({ navigation }) => {
  previousScreen = useRoute().name;
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  var place;
  const fetchIntDataByName = async () => {
    const name = 's5Gb9aAM91I8mar7IZSR8cJk2puVusARYdz4WSqC';
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  fetchIntDataByName();

  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'АХО: стул',
      executorGroup: 'АХО',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      console.log(JSON.stringify(requestBody));
      if (!response.ok) {
        console.log('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.log('Ошибка при отправке данных:', error);
    }
  };

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}

    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/chair.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>Стула</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>
              <View style={styles.categoryButtonContainer}>
                {chairCategories.map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {selectedCategory === 'Проблемы со звуком' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {subChairCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const RouterFixScreen = ({ navigation }) => {
  previousScreen = useRoute().name;
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  var place;
  const fetchIntDataByName = async () => {
    const name = '9vKqvvnqtBK5C6krs6aa8PJ7O4LcsH8hWCB6OV6y';
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  fetchIntDataByName();

  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'ИТ: роутер',
      executorGroup: 'ИТ',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      console.log(JSON.stringify(requestBody));
      if (!response.ok) {
        console.log('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.log('Ошибка при отправке данных:', error);
    }
  };

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}

    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/router.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>Роутера</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>
              <View style={styles.categoryButtonContainer}>
                {routerCategories.map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {selectedCategory === 'Проблемы со звуком' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {subRouterCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const CoolerFixScreen = ({ navigation }) => {
  previousScreen = useRoute().name;
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();
  var place;
  const fetchIntDataByName = async () => {
    const name = 'Fg3WpHuSHmt9vHJCrDVQVfNG3X2a87DQCTaTrdXn';
    const apiUrl = `https://back.qrcds.site/IntData/${name}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Ошибка при получении данных:', response);
        return null;
      }
      const data = await response.json();
      place = data.place;
      objectName = data.name
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  fetchIntDataByName();

  const sendDataToServer = async () => {
    const apiUrl = 'https://back.qrcds.site/data';
    const requestBody = {
      object: objectName,
      theme: 'АХО: куллер',
      executorGroup: 'АХО',
      fromWho: fio,
      description: `${selectedCategory}, ${selectedSubCategory}, ${description}`,
      place: place
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      console.log(JSON.stringify(requestBody));
      if (!response.ok) {
        console.log('Ошибка при отправке данных на сервер:', response);
      } else {
        socket.emit('animation_4', requestBody);
        console.log('Данные успешно отправлены на сервер');
      }
    } catch (error) {
      console.log('Ошибка при отправке данных:', error);
    }
  };

  const handleSendButtonPress = async () => {
    try {
      setIsLoading(true);
      await sendDataToServer();
      Alert.alert('Обращение отправлено');
    } catch (error) {
      Alert.alert('Ошибка при отправке данных', error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}

    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.overlay}>
            {/* <TopHeaderButtons navigation={navigation} /> */}
            <Image
              source={require('./pics/cooler.jpg')}
              style={styles.image}
            />
            <View style={styles.fioTextContainer}>
              {/* <Text style={styles.fioText}>{fio}</Text> */}
            </View>
            <View>
              <Text style={styles.overlayText}>Вы отсканировали QR-код:{'\n'}
                <View><Text style={styles.overlayCategory}>Куллера</Text></View></Text></View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>Что вас интересует</Text>
              <View style={styles.categoryButtonContainer}>
                {coolerCategories.map((category) => (
                  <TouchableOpacity
                    key={category.label}
                    style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                    onPress={() => {
                      setSelectedCategory(category.label);
                      setSelectedSubCategory('');
                      scrollViewRef.current.scrollToEnd({ animated: true });
                    }}
                  >
                    <Text>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {selectedCategory === 'Проблема с водой' && (
              <View style={styles.subCategoryContainer}>
                <View style={styles.categoryButtonContainer}>
                  {subCoolerCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.label}
                      style={[styles.subCategoryButton, selectedSubCategory === subCategory.label && styles.subSelectedButton]}
                      onPress={() => setSelectedSubCategory(subCategory.label)}
                    >
                      <Text>{subCategory.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
              multiline={true}
              placeholderTextColor="#979aaa"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <View style={{
                  flexDirection: 'row', backgroundColor: '#CCCCCC',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Назад </Text>
                  <MaterialIcons name="qr-code-2" size={50} marginLeft='auto' color="white" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendButtonPress}
                disabled={isLoading}
              >

                <View style={{
                  flexDirection: 'row', backgroundColor: '#009b4d',
                  padding: 2,
                  borderRadius: 8,
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 150,
                  alignContent: 'center',
                  paddingLeft: 10,
                  height: 55
                }}>
                  <Text style={{ color: '#ffffff' }}>Отправить</Text>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginLeft: 'auto' }} />
                  ) : (
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MFUScreen"
          component={MFUScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OfficeScreen"
          component={OfficeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Office2Screen"
          component={Office2Screen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OfficeIntScreen"
          component={OfficeIntScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminScreen"
          component={AdminScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TableScreen"
          component={TableScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ComputerScreen"
          component={ComputerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MFUIntScreen"
          component={MFUIntScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TableFixScreen"
          component={TableFixScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ComputerFixScreen"
          component={ComputerFixScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Computer2FixScreen"
          component={Computer2FixScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PhoneFixScreen"
          component={PhoneFixScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MonitorFixScreen"
          component={MonitorFixScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChairFixScreen"
          component={ChairFixScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Chair2FixScreen"
          component={Chair2FixScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RouterFixScreen"
          component={RouterFixScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CoolerFixScreen"
          component={CoolerFixScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="IBPFixScreen"
          component={IBPFixScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="IBP2FixScreen"
          component={IBP2FixScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MFU2FixScreen"
          component={MFU2FixScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  camera: {
    height: '90%',
    width: '100%'
  },
  scanText: {
    alignSelf: 'center',
    position: 'absolute',
    top: 180,
    color: 'white',
    fontSize: 18,
  },
  overlay: {
    backgroundColor: '#20242a',
    height: '100%',
    padding: 4,
    justifyContent: 'center',
  },
  overlayText: {
    color: '#ffffff',
    fontSize: 24,
    textAlign: 'center',
    textAlignVertical: "center",
    marginBottom: 40
  },
  overlayCategory: {
    color: '#20242a',
    fontSize: 24,
    textAlign: 'center',
    textAlignVertical: "center",
    justifyContent: 'center',
    backgroundColor: "#f8cc37",
    borderRadius: 9,
  },
  categoryContainer: {
    backgroundColor: '#626369',
    marginTop: 10,
    padding: 16,
    borderRadius: 9,
    marginBottom: 10
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  categoryButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  categoryButton: {
    flex: 1,
    backgroundColor: '#42aaff',
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 20,
    minWidth: 100,
    minHeight: 40,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mfuCategoryButton: {
    flex: 1,
    backgroundColor: '#42aaff',
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 20,
    minWidth: 100,
    minHeight: 40,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mfuSubCategoryButton: {
    flex: 1,
    backgroundColor: '#42aaff',
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 20,
    minWidth: 100,
    minHeight: 40,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCategoryContainer: {
    backgroundColor: '#78787e',
    borderRadius: 9,
    marginBottom: 10
  },
  subCategoryButton: {
    flex: 1,
    backgroundColor: '#42aaff',
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 20,
    minWidth: 100,
    minHeight: 40,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedButton: {
    backgroundColor: '#ffff33',
  },
  subSelectedButton: {
    backgroundColor: '#ffa200',
  },
  input: {
    textAlignVertical: 'top',
    backgroundColor: '#ffffff',
    color: 'black',
    padding: 5,
    borderRadius: 8,
    marginBottom: 10,
    height: 200,
  },
  goBackButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    backgroundColor: '#CCCCCC',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    height: 50,
    width: 100,
  },
  topButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    marginTop: 30,
    bottom: 30
  },
  topButtonsContainerQR: {
    position: 'absolute',
    top: 70,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  topButton: {
    flex: 1,
    backgroundColor: '#009b4d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    margin: 1,
  },
  activeButton: {
    backgroundColor: '#006634',
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
  },
  activeButtonText: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 40,
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#20242a',
  },
  fioTextContainer: {
    marginBottom: 160,
  },
  fioTextModal: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  fioItem: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    top: 120,
    borderRadius: 8,
    backgroundColor: '#009b4d',
    alignSelf: 'center',
    width: 125,
  },
  fioInput: {
    height: 40,
    width: 250,
    borderColor: 'gray',
    borderWidth: 1,
    top: 120,
    marginBottom: 10,
    paddingHorizontal: 10,
    fontSize: 16,
    color: 'white',
  },
  fioText: {
    fontSize: 18,
    color: 'white',
    position: 'absolute',
    alignSelf: 'flex-start'
  },
  fioText1: {
    fontSize: 18,
    color: 'black',
    position: 'absolute',
    top: 140,
    alignSelf: 'center'
  },
  buttonStyle: {
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
    backgroundColor: '#8ad24e',
    marginRight: 2,
    marginLeft: 2,
  },
  buttonTextStyle: {
    color: '#fff',
    textAlign: 'center',
  },
  flashButton: {
    position: 'absolute',
    top: 90,
    right: 20,
  },
  image: {
    width: 300,
    height: 150,
    position: 'absolute',
    alignSelf: 'center',
    resizeMode: 'contain',
    top: 20
  }
});
export { HomeScreen, MFUScreen, OfficeScreen, fio };

const categories = [
  { label: 'Клининг' },
  { label: 'Освещение' },
  { label: 'Отопление' },
  { label: 'Розетка' },
];

const subCategories = [
  { label: 'Замена лампы' },
  { label: 'Не работает освещение' },
];

const IPBCategories = [
  { label: 'Не работает' },
  { label: 'Куллер' },
  { label: 'Батарея' },
];

const coolerCategories = [
  { label: 'Не работает' },
  { label: 'Проблема с водой' },
];

const subCoolerCategories = [
  { label: 'Холодная' },
  { label: 'Горячая' },
];

const routerCategories = [
  { label: 'Не работает' },
  { label: 'Нет интернета' },
];

const subRouterCategories = [
  { label: 'Замена лампы' },
  { label: 'Не работает освещение' },
];

const chairCategories = [
  { label: 'Колёсико' },
  { label: 'Спинка' },
  { label: 'Газлифт' },
];

const subChairCategories = [
  { label: 'Замена лампы' },
  { label: 'Не работает освещение' },
];

const subSocketCategories = [
  { label: 'Искрит' },
  { label: 'Не питает' },
];
const monitorCategories = [
  { label: 'Ребит' },
  { label: 'Не работает' },
  { label: 'Полоска на экране' },
];

const subMonitorCategories = [
  { label: 'Замена лампы' },
  { label: 'Не работает освещение' },
];

const phoneCategories = [
  { label: 'Не работает' },
  { label: 'Проблемы со звуком' },
];

const subPhoneCategories = [
  { label: 'Я не слышу' },
  { label: 'Меня не слышат' },
];

const mfuCategories = [
  { label: 'Замена картирджа' },
  { label: 'Не сканирует' },
  { label: 'Не копирует' },
  { label: 'Не печатает' },
];

const cartridgeColors = [
  { label: 'Чёрный' },
  { label: 'Голубой' },
  { label: 'Жёлтый' },
  { label: 'Пурпурный' },
];

const TableCategories = [
  { label: 'Ножка' },
];

const computerCategories = [
  { label: 'Системный блок' },
  { label: 'Мышь' },
  { label: 'Клавиатура' },
];

const computerSubCategories = [
  { label: 'Гудит' },
  { label: 'Не работает' },
];

export default App;