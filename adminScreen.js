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
                onPress={() => Alert.alert('Объект проверен')}
            >
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                    <Text style={{ color: '#ffffff' }}>Проверено</Text>
                    <AntDesign name="arrowright" size={20} left={20} color="white" />
                </View>
            </TouchableOpacity>
        </View>
    );
};

const AdminScreen = ({ navigation }) => {
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
        if (data === '3') {
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

const TableScreen = ({ navigation }) => {
    const [location, setLocation] = useState('Республики 51');
    const [model, setModel] = useState('MDS312');
    const [serialNumber, setSerialNumber] = useState('682643520');
    const [description, setDescription] = useState('Сломана ножка');
    const [entryDate, setEntryDate] = useState('01.01.2022');
    return (
        <View style={styles.container}>
            <View style={styles.overlay}>
                <Text style={styles.overlayText}>Информация о столе:</Text>
                <Text style={styles.text}>Инвентарный номер:</Text>
                <TextInput
                    style={styles.input}
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
                <TopHeaderButtons navigation={navigation} />
                <HeaderButtons navigation={navigation} />

            </View>
        </View>
    );
};

const ComputerScreen = ({ navigation }) => {
    const [location, setLocation] = useState('Республики 51');
    const [model, setModel] = useState('XLE532');
    const [serialNumber, setSerialNumber] = useState('1247956528');
    const [description, setDescription] = useState('Исправен');
    const [entryDate, setEntryDate] = useState('21.04.2023');
    return (
        <View style={styles.container}>
            <View style={styles.overlay}>
                <Text style={styles.overlayText}>Информация о компьютере:</Text>
                <Text style={styles.text}>Инвентарный номер:</Text>
                <TextInput
                    style={styles.input}
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
                <TopHeaderButtons navigation={navigation} />
                <HeaderButtons navigation={navigation} />

            </View>
        </View>
    );
};

export { AdminScreen, TableScreen, ComputerScreen };

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
        backgroundColor: '#212d23',
        color: '#ffffff',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        height: 53,
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
    overlayText: {
        color: '#ffffff',
        fontSize: 24,
        textAlign: 'center',
    },
    text: {
        color: '#ffffff',
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

export default AdminScreen;
