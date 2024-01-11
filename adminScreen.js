import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet, ScrollView } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { NavigationContainer, useRoute, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

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
                    style={[styles.topButton, index === 0 && styles.activeButton]}
                    onPress={() => {
                        previousScreen = undefined;
                        navigation.navigate(tab.screen);
                    }}
                >
                    <Text style={[styles.buttonText, index === 0 && styles.activeButtonText]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const TopHeaderButtonsQR = ({ navigation }) => {
    const tabs = [
        { screen: 'Home', label: 'Клиент' },
        { screen: 'AdminScreen', label: 'Инвентаризация' },
    ];

    return (
        <View style={styles.topButtonsContainerQR}>
            {tabs.map((tab, index) => (
                <TouchableOpacity
                    key={index}
                    style={[styles.topButton, index === 0 && styles.activeButton]}
                    onPress={() => {
                        previousScreen = undefined;
                        navigation.navigate(tab.screen);
                    }}
                >
                    <Text style={[styles.buttonText, index === 0 && styles.activeButtonText]}>
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
                onPress={() => Alert.alert('Объект проверен')}
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
                    <Text style={{ color: '#ffffff' }}>Проверено</Text>
                    <AntDesign name="arrowright" size={30} marginLeft='auto' color="white" />
                </View>
            </TouchableOpacity>
        </View>
    );
};
var previousScreen;
console.log('dsadsa', previousScreen);
const AdminScreen = ({ navigation }) => {
    const [hasPermission, setHasPermission] = React.useState(null);
    const [alertShown, setAlertShown] = useState(false);

    const requestCameraPermission = async () => {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('blur', () => {
            setHasPermission(null);
        });

        return unsubscribe;
    }, [navigation]);

    useFocusEffect(
        React.useCallback(() => {
            setHasPermission(null);
            requestCameraPermission();
        }, [])
    );

    const handleBarCodeScanned = ({ data }) => {
        if (data === '1') {
            navigation.navigate('OfficeIntScreen');
        }
        else if (data === '2') {
            navigation.navigate('MFUIntScreen');
        }
        else if (data === '3') {
            navigation.navigate('TableScreen');
        } else if (data === '4') {
            navigation.navigate('ComputerScreen');
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
    console.log('fdsfds', previousScreen);

    return (
        <View style={styles.container}>
            <BarCodeScanner
                onBarCodeScanned={handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
            />
            <TopHeaderButtonsQR navigation={navigation} />
            <View style={styles.square}></View>
            <TouchableOpacity
                onPress={() => {
                    if (previousScreen !== undefined) {
                        console.log('click');
                        navigation.navigate(previousScreen);
                    } else {
                        navigation.navigate('AdminScreen');
                    }
                }}
                style={{
                    flexDirection: 'row', backgroundColor: '#CCCCCC',
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
                }}
            >
                <Text style={{ color: '#ffffff' }}>Назад </Text>
            </TouchableOpacity>
        </View>
    );
};

const OfficeIntScreen = ({ navigation }) => {
    previousScreen = useRoute().name;
    console.log('sdasda', previousScreen);
    const [location, setLocation] = useState('Республики 51');
    const [model, setModel] = useState('Офис');
    const [serialNumber, setSerialNumber] = useState('Нет');
    const [description, setDescription] = useState('Нет');
    const [entryDate, setEntryDate] = useState('20.12.2007');
    return (
        <View style={styles.container}>
            <View style={styles.overlay}>
                <TopHeaderButtons navigation={navigation} />
                <Text style={styles.text}>Наименование:</Text>
                <TextInput
                    style={styles.inputName}
                    placeholder="Наименование"
                    value="офис"
                    editable={false}
                />
                <Text style={styles.text}>Инвентарный номер:</Text>
                <TextInput
                    style={styles.inputNumber}
                    placeholder="Инвентарный номер"
                    value="53652345"
                    editable={false}
                />
                <Text style={styles.text}>Место расположения:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Место расположения"
                    value={location}
                    onChangeText={(text) => setLocation(text)}
                />
                <Text style={styles.text}>Модель:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Модель"
                    value={model}
                    onChangeText={(text) => setModel(text)}
                />
                <Text style={styles.text}>Серийный номер:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Серийный номер"
                    value={serialNumber}
                    onChangeText={(text) => setSerialNumber(text)}
                />
                <Text style={styles.text}>Описание:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Описание"
                    value={description}
                    onChangeText={(text) => setDescription(text)}
                />
                <Text style={styles.text}>Дата ввода:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Дата ввода"
                    value={entryDate}
                    onChangeText={(text) => setEntryDate(text)}
                />
                <HeaderButtons navigation={navigation} />
            </View>
        </View >
    );
};

const MFUIntScreen = ({ navigation }) => {
    previousScreen = useRoute().name;
    console.log('sdasda', previousScreen);
    const [location, setLocation] = useState('Республики 51');
    const [model, setModel] = useState('FE122');
    const [serialNumber, setSerialNumber] = useState('8453221');
    const [description, setDescription] = useState('Исправен');
    const [entryDate, setEntryDate] = useState('22.11.2022');
    return (
        <View style={styles.container}>
            <View style={styles.overlay}>
                <TopHeaderButtons navigation={navigation} />
                <Text style={styles.text}>Наименование:</Text>
                <TextInput
                    style={styles.inputName}
                    placeholder="Наименование"
                    value="МФУ"
                    editable={false}
                />
                <Text style={styles.text}>Инвентарный номер:</Text>
                <TextInput
                    style={styles.inputNumber}
                    placeholder="Инвентарный номер"
                    value="53652345"
                    editable={false}
                />
                <Text style={styles.text}>Место расположения:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Место расположения"
                    value={location}
                    onChangeText={(text) => setLocation(text)}
                />
                <Text style={styles.text}>Модель:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Модель"
                    value={model}
                    onChangeText={(text) => setModel(text)}
                />
                <Text style={styles.text}>Серийный номер:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Серийный номер"
                    value={serialNumber}
                    onChangeText={(text) => setSerialNumber(text)}
                />
                <Text style={styles.text}>Описание:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Описание"
                    value={description}
                    onChangeText={(text) => setDescription(text)}
                />
                <Text style={styles.text}>Дата ввода:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Дата ввода"
                    value={entryDate}
                    onChangeText={(text) => setEntryDate(text)}
                />
                <HeaderButtons navigation={navigation} />
            </View>
        </View >
    );
};

const TableScreen = ({ navigation }) => {
    previousScreen = useRoute().name;
    console.log('sdasda', previousScreen);
    const [location, setLocation] = useState('Республики 51');
    const [model, setModel] = useState('MDS312');
    const [serialNumber, setSerialNumber] = useState('682643520');
    const [description, setDescription] = useState('Сломана ножка');
    const [entryDate, setEntryDate] = useState('01.01.2022');
    return (
        <View style={styles.container}>
            <View style={styles.overlay}>
                <TopHeaderButtons navigation={navigation} />
                <Text style={styles.text}>Наименование:</Text>
                <TextInput
                    style={styles.inputName}
                    placeholder="Наименование"
                    value="Стол"
                    editable={false}
                />
                <Text style={styles.text}>Инвентарный номер:</Text>
                <TextInput
                    style={styles.inputNumber}
                    placeholder="Инвентарный номер"
                    value="123"
                    editable={false}
                />
                <Text style={styles.text}>Место расположения:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Место расположения"
                    value={location}
                    onChangeText={(text) => setLocation(text)}
                />
                <Text style={styles.text}>Модель:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Модель"
                    value={model}
                    onChangeText={(text) => setModel(text)}
                />
                <Text style={styles.text}>Серийный номер:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Серийный номер"
                    value={serialNumber}
                    onChangeText={(text) => setSerialNumber(text)}
                />
                <Text style={styles.text}>Описание:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Описание"
                    value={description}
                    onChangeText={(text) => setDescription(text)}
                />
                <Text style={styles.text}>Дата ввода:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Дата ввода"
                    value={entryDate}
                    onChangeText={(text) => setEntryDate(text)}
                />
                <HeaderButtons navigation={navigation} />
            </View>
        </View>
    );
};

const ComputerScreen = ({ navigation }) => {
    previousScreen = useRoute().name;
    console.log('sdasda', previousScreen);
    const [location, setLocation] = useState('Республики 51');
    const [model, setModel] = useState('XLE532');
    const [serialNumber, setSerialNumber] = useState('1247956528');
    const [description, setDescription] = useState('Исправен');
    const [entryDate, setEntryDate] = useState('21.04.2023');
    return (
        <View style={styles.container}>
            <View style={styles.overlay}>
                <TopHeaderButtons navigation={navigation} />
                <Text style={styles.text}>Наименование:</Text>
                <TextInput
                    style={styles.inputName}
                    placeholder="Наименование"
                    value="Компьютер"
                    editable={false}
                />
                <Text style={styles.text}>Инвентарный номер:</Text>
                <TextInput
                    style={styles.inputNumber}
                    placeholder="Инвентарный номер"
                    value="3213"
                    editable={false}
                />
                <Text style={styles.text}>Место расположения:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Место расположения"
                    value={location}
                    onChangeText={(text) => setLocation(text)}
                />
                <Text style={styles.text}>Модель:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Модель"
                    value={model}
                    onChangeText={(text) => setModel(text)}
                />
                <Text style={styles.text}>Серийный номер:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Серийный номер"
                    value={serialNumber}
                    onChangeText={(text) => setSerialNumber(text)}
                />
                <Text style={styles.text}>Описание:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Описание"
                    value={description}
                    onChangeText={(text) => setDescription(text)}
                />
                <Text style={styles.text}>Дата ввода:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Дата ввода"
                    value={entryDate}
                    onChangeText={(text) => setEntryDate(text)}
                />
                <HeaderButtons navigation={navigation} />
            </View>
        </View>
    );
};

export { AdminScreen, TableScreen, ComputerScreen, MFUIntScreen, OfficeIntScreen };

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    square: {
        width: 200,
        height: 200,
        top: 280,
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
    input: {
        backgroundColor: '#ffffff',
        color: '#000000',
        padding: 5,
        borderRadius: 8,
        marginBottom: 12,
        height: 45,
    },
    inputNumber: {
        backgroundColor: '#626369',
        color: '#ffffff',
        padding: 5,
        borderRadius: 8,
        marginBottom: 12,
        height: 45,
    },
    inputName: {
        backgroundColor: '#626369',
        color: '#ffffff',
        padding: 5,
        borderRadius: 8,
        marginBottom: 12,
        height: 45,
        fontWeight: 'bold'
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
        position: 'fixed',
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 30
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
    text: {
        color: '#ffffff',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 30
    },
});

export default AdminScreen;