import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet, ScrollView, KeyboardAvoidingView } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { fio } from './App';

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


var previousScreen;
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
        } else if (data === '5') {
            navigation.navigate('PhoneScreen');
        } else if (data === '6') {
            navigation.navigate('MonitorScreen');
        } else if (data === '7') {
            navigation.navigate('IBPScreen');
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
            <TopHeaderButtonsQR navigation={navigation} />
            <Text style={styles.fioText1}>{fio}</Text>
            <View style={styles.square}></View>
            <TouchableOpacity
                onPress={() => {
                    if (previousScreen !== undefined) {
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
    const check = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/1/update-check`;
            const requestBody = {
                check: 1
            };
            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            console.log(JSON.stringify(requestBody));

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };
    const fetchIntDataByName = async () => {
        const name = 'Офис';
        const apiUrl = `https://back.qrcds.site/IntData/${name}`;

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                console.error('Ошибка при получении данных:', response);
                return null;
            }

            const responseBody = await response.text();

            if (!responseBody) {
                console.error('Тело ответа пусто');
                return null;
            }

            const data = JSON.parse(responseBody);

            setName(data.name);
            setLocation(data.place);
            setModel(data.model);
            setSerialNumber(data.serialNumber);
            setDescription(data.description);
            setEntryDate(data.inDate);
            setIntNumber(data.intNumber);

        } catch (error) {
            console.error('Ошибка при получении данных:', error);
        }
    };
    const update = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/1`;

            const requestData = {
                name: name,
                place: place,
                model: model,
                serialNumber: serialNumber,
                description: description,
                inDate: inDate,
            };

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
            console.log(JSON.stringify(requestData));

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };
    useEffect(() => {
        fetchIntDataByName();
    }, []);
    const [name, setName] = useState('Красноярск, Республики 51, 10 этаж');
    const [intNumber, setIntNumber] = useState('Красноярск, Республики 51, 10 этаж');
    const [place, setLocation] = useState('Красноярск, Республики 51, 10 этаж');
    const [model, setModel] = useState('Офис');
    const [serialNumber, setSerialNumber] = useState('Нет');
    const [description, setDescription] = useState('Нет');
    const [inDate, setEntryDate] = useState('20.12.2007');
    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <View style={styles.overlay}>
                        <TopHeaderButtons navigation={navigation} />
                        <View style={styles.fioTextContainer}>
                            <Text style={styles.fioText}>{fio}</Text>
                        </View>
                        <Text style={styles.text}>Наименование:</Text>
                        <TextInput
                            style={styles.inputName}
                            placeholder="Наименование"
                            value={name}
                            editable={false}
                        />
                        <Text style={styles.text}>Инвентарный номер:</Text>
                        <TextInput
                            style={styles.inputNumber}
                            placeholder="Инвентарный номер"
                            value={intNumber.toString()}
                            editable={false}
                        />
                        <Text style={styles.text}>Место расположения:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Место расположения"
                            value={place}
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
                            value={inDate}
                            onChangeText={(text) => setEntryDate(text)}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                update();
                                Alert.alert('Данные обновлены');
                            }}
                        >
                            <View style={{
                                flexDirection: 'row', backgroundColor: '#CCCCCC',
                                padding: 2,
                                borderRadius: 8,
                                alignItems: 'center',
                                width: 100,
                                alignContent: 'center',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                paddingLeft: 10,
                                height: 55
                            }}>
                                <Text style={{ color: '#ffffff' }}>Изменить </Text>
                            </View>
                        </TouchableOpacity>
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
                                onPress={() => {
                                    Alert.alert('Объект проверен');
                                    check()
                                }}
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
                    </View>
                </View >
            </KeyboardAvoidingView>
        </ScrollView>
    );
};

const MFUIntScreen = ({ navigation }) => {
    previousScreen = useRoute().name;
    const check = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/2/update-check`;

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };

    const fetchIntDataByName = async () => {
        const name = 'МФУ';
        const apiUrl = `https://back.qrcds.site/IntData/${encodeURIComponent(name)}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.error('Ошибка при получении данных:', response);
                return null;
            }
            const data = await response.json();
            setName(data.name);
            setLocation(data.place);
            setModel(data.model);
            setSerialNumber(data.serialNumber);
            setDescription(data.description);
            setEntryDate(data.inDate);
            setIntNumber(data.intNumber)
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
        }
    };
    const update = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/2`;

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    place: place,
                    model: model,
                    serialNumber: serialNumber,
                    description: description,
                    inDate: inDate,
                }),
            });

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };
    useEffect(() => {
        fetchIntDataByName();
    }, []);


    const [name, setName] = useState('Красноярск, Республики 51, 10 этаж');
    const [intNumber, setIntNumber] = useState('Красноярск, Республики 51, 10 этаж');
    const [place, setLocation] = useState('Красноярск, Республики 51, 10 этаж, кабинет 10-04');
    const [model, setModel] = useState('HP LaserJet Pro 4103fdn');
    const [serialNumber, setSerialNumber] = useState('2Z628A');
    const [description, setDescription] = useState('Исправен');
    const [inDate, setEntryDate] = useState('22.11.2022');
    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <View style={styles.overlay}>
                        <TopHeaderButtons navigation={navigation} />
                        <View style={styles.fioTextContainer}>
                            <Text style={styles.fioText}>{fio}</Text>
                        </View>
                        <Text style={styles.text}>Наименование:</Text>
                        <TextInput
                            style={styles.inputName}
                            placeholder="Наименование"
                            value={name}
                            editable={false}
                        />
                        <Text style={styles.text}>Инвентарный номер:</Text>
                        <TextInput
                            style={styles.inputNumber}
                            placeholder="Инвентарный номер"
                            value={intNumber.toString()}
                            editable={false}
                        />
                        <Text style={styles.text}>Место расположения:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Место расположения"
                            value={place}
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
                            value={inDate}
                            onChangeText={(text) => setEntryDate(text)}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                update();
                                Alert.alert('Данные обновлены');
                            }}
                        >
                            <View style={{
                                flexDirection: 'row', backgroundColor: '#CCCCCC',
                                padding: 2,
                                borderRadius: 8,
                                alignItems: 'center',
                                width: 100,
                                alignContent: 'center',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                paddingLeft: 10,
                                height: 55
                            }}>
                                <Text style={{ color: '#ffffff' }}>Изменить </Text>
                            </View>
                        </TouchableOpacity>
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
                                onPress={() => {
                                    Alert.alert('Объект проверен');
                                    check()
                                }}                            >
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
                    </View>
                </View >
            </KeyboardAvoidingView>
        </ScrollView>
    );
};

const TableScreen = ({ navigation }) => {
    previousScreen = useRoute().name;
    const check = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/3/update-check`;

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };
    const fetchIntDataByName = async () => {
        const name = 'Стол';
        const apiUrl = `https://back.qrcds.site/IntData/${encodeURIComponent(name)}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.error('Ошибка при получении данных:', response);
                return null;
            }
            const data = await response.json();
            setName(data.name);
            setLocation(data.place);
            setModel(data.model);
            setSerialNumber(data.serialNumber);
            setDescription(data.description);
            setEntryDate(data.inDate);
            setIntNumber(data.intNumber)
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
        }
    };
    const update = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/3`;

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    place: place,
                    model: model,
                    serialNumber: serialNumber,
                    description: description,
                    inDate: inDate,
                }),
            });

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };
    useEffect(() => {
        fetchIntDataByName();
    }, []);
    const [name, setName] = useState('Красноярск, Республики 51, 10 этаж');
    const [intNumber, setIntNumber] = useState('Красноярск, Республики 51, 10 этаж');
    const [place, setLocation] = useState('Красноярск, Республики 51, 10 этаж, кабинет 10-06');
    const [model, setModel] = useState('ВИТАЛ-ПК Carry-3');
    const [serialNumber, setSerialNumber] = useState('Нет');
    const [description, setDescription] = useState('Сломана ножка');
    const [inDate, setEntryDate] = useState('01.01.2022');
    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <View style={styles.overlay}>
                        <TopHeaderButtons navigation={navigation} />
                        <View style={styles.fioTextContainer}>
                            <Text style={styles.fioText}>{fio}</Text>
                        </View>
                        <Text style={styles.text}>Наименование:</Text>
                        <TextInput
                            style={styles.inputName}
                            placeholder="Наименование"
                            value={name}
                            editable={false}
                        />
                        <Text style={styles.text}>Инвентарный номер:</Text>
                        <TextInput
                            style={styles.inputNumber}
                            placeholder="Инвентарный номер"
                            value={intNumber.toString()}
                            editable={false}
                        />
                        <Text style={styles.text}>Место расположения:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Место расположения"
                            value={place}
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
                            value={inDate}
                            onChangeText={(text) => setEntryDate(text)}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                update();
                                Alert.alert('Данные обновлены');
                            }}
                        >
                            <View style={{
                                flexDirection: 'row', backgroundColor: '#CCCCCC',
                                padding: 2,
                                borderRadius: 8,
                                alignItems: 'center',
                                width: 100,
                                alignContent: 'center',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                paddingLeft: 10,
                                height: 55
                            }}>
                                <Text style={{ color: '#ffffff' }}>Изменить </Text>
                            </View>
                        </TouchableOpacity>
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
                                onPress={() => {
                                    Alert.alert('Объект проверен');
                                    check()
                                }}                            >
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
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScrollView>
    );
};

const ComputerScreen = ({ navigation }) => {
    previousScreen = useRoute().name;
    const check = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/4/update-check`;

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };

    const fetchIntDataByName = async () => {
        const name = 'Компьютер';
        const apiUrl = `https://back.qrcds.site/IntData/${encodeURIComponent(name)}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.error('Ошибка при получении данных:', response);
                return null;
            }
            const data = await response.json();
            setName(data.name);
            setLocation(data.place);
            setModel(data.model);
            setSerialNumber(data.serialNumber);
            setDescription(data.description);
            setEntryDate(data.inDate);
            setIntNumber(data.intNumber)
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
        }
    };
    const update = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/4`;

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    place: place,
                    model: model,
                    serialNumber: serialNumber,
                    description: description,
                    inDate: inDate,
                }),
            });

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };
    useEffect(() => {
        fetchIntDataByName();
    }, []);
    const [name, setName] = useState('Красноярск, Республики 51, 10 этаж');
    const [intNumber, setIntNumber] = useState('Красноярск, Республики 51, 10 этаж');
    const [place, setLocation] = useState('Красноярск, Республики 51, 10 этаж, кабинет 10-05');
    const [model, setModel] = useState('CHUWI HeroBox Intel N100');
    const [serialNumber, setSerialNumber] = useState('48FC45Q');
    const [description, setDescription] = useState('Исправен');
    const [inDate, setEntryDate] = useState('21.04.2023');
    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <View style={styles.overlay}>
                        <TopHeaderButtons navigation={navigation} />
                        <View style={styles.fioTextContainer}>
                            <Text style={styles.fioText}>{fio}</Text>
                        </View>
                        <Text style={styles.text}>Наименование:</Text>
                        <TextInput
                            style={styles.inputName}
                            placeholder="Наименование"
                            value={name}
                            editable={false}
                        />
                        <Text style={styles.text}>Инвентарный номер:</Text>
                        <TextInput
                            style={styles.inputNumber}
                            placeholder="Инвентарный номер"
                            value={intNumber.toString()}
                            editable={false}
                        />
                        <Text style={styles.text}>Место расположения:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Место расположения"
                            value={place}
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
                            value={inDate}
                            onChangeText={(text) => setEntryDate(text)}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                update();
                                Alert.alert('Данные обновлены');
                            }}
                        >
                            <View style={{
                                flexDirection: 'row', backgroundColor: '#CCCCCC',
                                padding: 2,
                                borderRadius: 8,
                                alignItems: 'center',
                                width: 100,
                                alignContent: 'center',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                paddingLeft: 10,
                                height: 55
                            }}>
                                <Text style={{ color: '#ffffff' }}>Изменить </Text>
                            </View>
                        </TouchableOpacity>
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
                                onPress={() => {
                                    Alert.alert('Объект проверен');
                                    check()
                                }}                            >
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
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScrollView>
    );
};
const PhoneScreen = ({ navigation }) => {
    previousScreen = useRoute().name;
    const check = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/4/update-check`;

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };

    const fetchIntDataByName = async () => {
        const name = 'phone';
        const apiUrl = `https://back.qrcds.site/IntData/${encodeURIComponent(name)}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.error('Ошибка при получении данных:', response);
                return null;
            }
            const data = await response.json();
            setName(data.name);
            setLocation(data.place);
            setModel(data.model);
            setSerialNumber(data.serialNumber);
            setDescription(data.description);
            setEntryDate(data.inDate);
            setIntNumber(data.intNumber)
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
        }
    };
    const update = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/55532`;

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    place: place,
                    model: model,
                    serialNumber: serialNumber,
                    description: description,
                    inDate: inDate,
                }),
            });

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };
    useEffect(() => {
        fetchIntDataByName();
    }, []);
    const [name, setName] = useState('Красноярск, Республики 51, 10 этаж');
    const [intNumber, setIntNumber] = useState('Красноярск, Республики 51, 10 этаж');
    const [place, setLocation] = useState('Красноярск, Республики 51, 10 этаж, кабинет 10-05');
    const [model, setModel] = useState('CHUWI HeroBox Intel N100');
    const [serialNumber, setSerialNumber] = useState('48FC45Q');
    const [description, setDescription] = useState('Исправен');
    const [inDate, setEntryDate] = useState('21.04.2023');
    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <View style={styles.overlay}>
                        <TopHeaderButtons navigation={navigation} />
                        <View style={styles.fioTextContainer}>
                            <Text style={styles.fioText}>{fio}</Text>
                        </View>
                        <Text style={styles.text}>Наименование:</Text>
                        <TextInput
                            style={styles.inputName}
                            placeholder="Наименование"
                            value={name}
                            onChangeText={(text) => setName(text)}
                        />
                        <Text style={styles.text}>Инвентарный номер:</Text>
                        <TextInput
                            style={styles.inputNumber}
                            placeholder="Инвентарный номер"
                            value={intNumber.toString()}
                            editable={false}
                        />
                        <Text style={styles.text}>Место расположения:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Место расположения"
                            value={place}
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
                            value={inDate}
                            onChangeText={(text) => setEntryDate(text)}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                update();
                                Alert.alert('Данные обновлены');
                            }}
                        >
                            <View style={{
                                flexDirection: 'row', backgroundColor: '#CCCCCC',
                                padding: 2,
                                borderRadius: 8,
                                alignItems: 'center',
                                width: 100,
                                alignContent: 'center',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                paddingLeft: 10,
                                height: 55
                            }}>
                                <Text style={{ color: '#ffffff' }}>Изменить </Text>
                            </View>
                        </TouchableOpacity>
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
                                onPress={() => {
                                    Alert.alert('Объект проверен');
                                    check()
                                }}                            >
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
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScrollView>
    );
};

const MonitorScreen = ({ navigation }) => {
    previousScreen = useRoute().name;
    const check = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/4/update-check`;

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };

    const fetchIntDataByName = async () => {
        const name = 'monitor';
        const apiUrl = `https://back.qrcds.site/IntData/${encodeURIComponent(name)}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.error('Ошибка при получении данных:', response);
                return null;
            }
            const data = await response.json();
            setName(data.name);
            setLocation(data.place);
            setModel(data.model);
            setSerialNumber(data.serialNumber);
            setDescription(data.description);
            setEntryDate(data.inDate);
            setIntNumber(data.intNumber)
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
        }
    };
    const update = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/55523`;

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    place: place,
                    model: model,
                    serialNumber: serialNumber,
                    description: description,
                    inDate: inDate,
                }),
            });

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };
    useEffect(() => {
        fetchIntDataByName();
    }, []);
    const [name, setName] = useState('Красноярск, Республики 51, 10 этаж');
    const [intNumber, setIntNumber] = useState('Красноярск, Республики 51, 10 этаж');
    const [place, setLocation] = useState('Красноярск, Республики 51, 10 этаж, кабинет 10-05');
    const [model, setModel] = useState('CHUWI HeroBox Intel N100');
    const [serialNumber, setSerialNumber] = useState('48FC45Q');
    const [description, setDescription] = useState('Исправен');
    const [inDate, setEntryDate] = useState('21.04.2023');
    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <View style={styles.overlay}>
                        <TopHeaderButtons navigation={navigation} />
                        <View style={styles.fioTextContainer}>
                            <Text style={styles.fioText}>{fio}</Text>
                        </View>
                        <Text style={styles.text}>Наименование:</Text>
                        <TextInput
                            style={styles.inputName}
                            placeholder="Наименование"
                            value={name}
                            onChangeText={(text) => setName(text)}
                        />
                        <Text style={styles.text}>Инвентарный номер:</Text>
                        <TextInput
                            style={styles.inputNumber}
                            placeholder="Инвентарный номер"
                            value={intNumber.toString()}
                            editable={false}
                        />
                        <Text style={styles.text}>Место расположения:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Место расположения"
                            value={place}
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
                            value={inDate}
                            onChangeText={(text) => setEntryDate(text)}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                update();
                                Alert.alert('Данные обновлены');
                            }}
                        >
                            <View style={{
                                flexDirection: 'row', backgroundColor: '#CCCCCC',
                                padding: 2,
                                borderRadius: 8,
                                alignItems: 'center',
                                width: 100,
                                alignContent: 'center',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                paddingLeft: 10,
                                height: 55
                            }}>
                                <Text style={{ color: '#ffffff' }}>Изменить </Text>
                            </View>
                        </TouchableOpacity>
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
                                onPress={() => {
                                    Alert.alert('Объект проверен');
                                    check()
                                }}                            >
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
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScrollView>
    );
};

const IBPScreen = ({ navigation }) => {
    previousScreen = useRoute().name;
    const check = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/4/update-check`;

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };

    const fetchIntDataByName = async () => {
        const name = 'ibp';
        const apiUrl = `https://back.qrcds.site/IntData/${encodeURIComponent(name)}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.error('Ошибка при получении данных:', response);
                return null;
            }
            const data = await response.json();
            setName(data.name);
            setLocation(data.place);
            setModel(data.model);
            setSerialNumber(data.serialNumber);
            setDescription(data.description);
            setEntryDate(data.inDate);
            setIntNumber(data.intNumber)
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
        }
    };
    const update = async () => {
        try {
            const apiUrl = `https://back.qrcds.site/IntData/62116`;

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    place: place,
                    model: model,
                    serialNumber: serialNumber,
                    description: description,
                    inDate: inDate,
                }),
            });

            if (!response.ok) {
                console.error('Ошибка при отправке PATCH-запроса:', response);
            } else {
                console.log('Данные успешно обновлены');
            }
        } catch (error) {
            console.error('Ошибка при выполнении PATCH-запроса:', error);
        }
    };
    useEffect(() => {
        fetchIntDataByName();
    }, []);
    const [name, setName] = useState('Красноярск, Республики 51, 10 этаж');
    const [intNumber, setIntNumber] = useState('Красноярск, Республики 51, 10 этаж');
    const [place, setLocation] = useState('Красноярск, Республики 51, 10 этаж, кабинет 10-05');
    const [model, setModel] = useState('CHUWI HeroBox Intel N100');
    const [serialNumber, setSerialNumber] = useState('48FC45Q');
    const [description, setDescription] = useState('Исправен');
    const [inDate, setEntryDate] = useState('21.04.2023');
    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <View style={styles.overlay}>
                        <TopHeaderButtons navigation={navigation} />
                        <View style={styles.fioTextContainer}>
                            <Text style={styles.fioText}>{fio}</Text>
                        </View>
                        <Text style={styles.text}>Наименование:</Text>
                        <TextInput
                            style={styles.inputName}
                            placeholder="Наименование"
                            value={name}
                            onChangeText={(text) => setName(text)}
                        />
                        <Text style={styles.text}>Инвентарный номер:</Text>
                        <TextInput
                            style={styles.inputNumber}
                            placeholder="Инвентарный номер"
                            value={intNumber.toString()}
                            editable={false}
                        />
                        <Text style={styles.text}>Место расположения:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Место расположения"
                            value={place}
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
                            value={inDate}
                            onChangeText={(text) => setEntryDate(text)}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                update();
                                Alert.alert('Данные обновлены');
                            }}
                        >
                            <View style={{
                                flexDirection: 'row', backgroundColor: '#CCCCCC',
                                padding: 2,
                                borderRadius: 8,
                                alignItems: 'center',
                                width: 100,
                                alignContent: 'center',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                paddingLeft: 10,
                                height: 55
                            }}>
                                <Text style={{ color: '#ffffff' }}>Изменить </Text>
                            </View>
                        </TouchableOpacity>
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
                                onPress={() => {
                                    Alert.alert('Объект проверен');
                                    check()
                                }}                            >
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
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScrollView>
    );
};

export {
    AdminScreen, TableScreen, ComputerScreen, MFUIntScreen,
    OfficeIntScreen, PhoneScreen, MonitorScreen, IBPScreen,

};

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
        flexDirection: 'row',
        paddingHorizontal: 20,
        alignSelf: 'flex-start',
        marginTop: 70,
        bottom: 10
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
        marginTop: 30,
        width: '100%',
    },
    fioTextContainer: {
        marginBottom: 60,
    },
    fioText: {
        fontSize: 18,
        color: 'white',
        position: 'absolute',
        alignSelf: 'center'
    },
    fioText1: {
        fontSize: 18,
        color: 'white',
        position: 'absolute',
        top: 140,
        alignSelf: 'center'
    }
});

export default AdminScreen;