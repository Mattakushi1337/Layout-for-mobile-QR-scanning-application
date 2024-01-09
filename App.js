import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { NavigationContainer, useRoute, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import AdminScreen, { TableScreen, ComputerScreen } from './adminScreen';

const Stack = createStackNavigator();

const TopHeaderButtons = ({ navigation }) => {
  const tabs = [
    { screen: 'Home', label: 'Клиент' },
    { screen: 'AdminScreen', label: 'Инвентаризация' },
  ];

  return (
    <View style={styles.topButtonsContainer}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.topButton, index !== 0 && styles.activeButton]}
          onPress={() => {
            navigation.navigate(tab.screen);
          }}
        >
          <Text style={[styles.buttonText, index !== 0 && styles.activeButtonText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};


const HeaderButtons = ({ navigation }) => {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          navigation.goBack();
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text style={{ color: '#ffffff' }}>Назад </Text>
          <MaterialIcons name="qr-code-2" size={20} left={30} color="white" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sendButton}
        onPress={() => Alert.alert('Ваше обращение отправлено')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text style={{ color: '#ffffff' }}>Отправить</Text>
          <AntDesign name="arrowright" size={20} left={20} color="white" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = React.useState(null);
  const [alertShown, setAlertShown] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  useEffect(() => {
    requestCameraPermission();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setHasPermission(null);
      requestCameraPermission();
    }, [])
  );

  const handleBarCodeScanned = ({ data }) => {
    if (data === '1') {
      navigation.navigate('OfficeScreen');
    } else if (data === '2') {
      navigation.navigate('MFUScreen');
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
  };

  if (hasPermission === null) {
    return <Text>Запрос разрешений на камеру...</Text>;
  }

  if (hasPermission === false) {
    return <Text>Доступ к камере запрещен</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.square}></View>
    </View>
  );
};

const OfficeScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const route = useRoute();

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <TopHeaderButtons navigation={navigation} />
        <Text style={styles.overlayText}>Вы отсканировали QR-код: офиса</Text>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>Что вас интересует</Text>

          <View style={styles.categoryButtonContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.label}
                style={[styles.categoryButton, selectedCategory === category.label && styles.selectedButton]}
                onPress={() => {
                  setSelectedCategory(category.label);
                  setSelectedSubCategory(null);
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

        <TextInput
          style={styles.input}
          placeholder={selectedCategory ? 'Дополните свой запрос здесь' : 'Напишите свой запрос здесь'}
          multiline={true}
          placeholderTextColor="#979aaa"
        />
        <HeaderButtons navigation={navigation} />

      </View>
    </View>
  );
};

const MFUScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <TopHeaderButtons navigation={navigation} />
        <Text style={styles.overlayText}>Вы отсканировали QR-код: МФУ</Text>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>Что вас интересует</Text>
          <View style={styles.categoryButtonContainer}>
            {mfuCategories.slice(0, 2).map((category) => (
              <TouchableOpacity
                key={category.label}
                style={[styles.mfuCategoryButton, selectedCategory === category.label && styles.selectedButton]}
                onPress={() => {
                  setSelectedCategory(category.label);
                  setSelectedSubCategory(null);
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
                  setSelectedSubCategory(null);
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
        />
        <HeaderButtons navigation={navigation} />

      </View>
    </View>
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
  square: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 9,
    alignSelf: 'center',
    position: 'absolute',
    backgroundColor: 'transparent',
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
  },
  categoryContainer: {
    backgroundColor: '#626369',
    marginTop: 16,
    padding: 16,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  categoryButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButton: {
    backgroundColor: '#42aaff',
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 20,
    width: 80,
    height: 40,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mfuCategoryButton: {
    backgroundColor: '#42aaff',
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 20,
    width: 120,
    height: 40,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mfuSubCategoryButton: {
    backgroundColor: '#42aaff',
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 20,
    width: 120,
    height: 40,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCategoryContainer: {

    backgroundColor: '#78787e'
  },
  subCategoryButton: {
    backgroundColor: '#42aaff',
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 20,
    width: 100,
    height: 40,
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
    backgroundColor: '#212d23',
    color: '#ffffff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    height: 200,
    textAlignVertical: 'top',
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
    position: 'absolute',
    top: 40,
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
  },
  backButton: {
    backgroundColor: '#CCCCCC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: 150,
  },
  sendButton: {
    backgroundColor: '#009b4d',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: 150,
  },
});
export { HomeScreen, MFUScreen };

const categories = [
  { label: 'Клининг' },
  { label: 'Освещение' },
  { label: 'Отопление' },
];

const subCategories = [
  { label: 'Замена лампы' },
  { label: 'Не работает освещение' },
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

export default App;
