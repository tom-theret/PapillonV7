import ButtonCta from "@/components/FirstInstallation/ButtonCta";
import { NativeItem, NativeList, NativeListHeader, NativeText } from "@/components/Global/NativeComponents";
import { useCurrentAccount } from "@/stores/account";
import { useTimetableStore } from "@/stores/timetable";
import { useTheme } from "@react-navigation/native";
import { Calendar, Info, QrCode, X } from "lucide-react-native";
import React, { useEffect } from "react";
import { Alert, Modal, Platform, TextInput, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import * as Clipboard from "expo-clipboard";

import { CameraView } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PapillonSpinner from "@/components/Global/PapillonSpinner";

const ical = require("cal-parser");

const LessonsImportIcal = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const account = useCurrentAccount(store => store.account!);
  const mutateProperty = useCurrentAccount(store => store.mutateProperty);

  const [url, setUrl] = React.useState("");

  const [cameraVisible, setCameraVisible] = React.useState(false);

  const scanIcalQRCode = async () => {
    setCameraVisible(true);
  };

  const [loading, setLoading] = React.useState(false);

  const saveIcal = async () => {
    setLoading(true);
    const oldUrls = account.personalization.icalURLs || [];

    fetch(url)
      .then(response => response.text())
      .then(text => {
        const parsed = ical.parseString(text);
        let newParsed = parsed;
        newParsed.events = [];
        console.log(newParsed);

        const title = "Mon calendrier" + (oldUrls.length > 0 ? ` ${oldUrls.length + 1}` : "");

        mutateProperty("personalization", {
          ...account.personalization,
          icalURLs: [...oldUrls, {
            name: title,
            url,
          }]
        });
      })
      .catch(() => {
        Alert.alert("Erreur", "Impossible de récupérer les données du calendrier. Vérifiez l'URL et réessayez.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 16,
        paddingTop: 0,
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Modal
        visible={cameraVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setCameraVisible(false)}
      >
        <TouchableOpacity
          onPress={() => setCameraVisible(false)}
          style={{
            padding: 8,
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 999,
            borderRadius: 100,
            backgroundColor: "#ffffff39",
            opacity: 1,
          }}
        >
          <X size={20} strokeWidth={2.5} color={"#fff"} />
        </TouchableOpacity>

        <View style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 10,
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
        }}>
          <View style={{
            width: 260,
            maxWidth: "90%",
            aspectRatio: 1,
            borderWidth: 3,
            borderColor: "#fff",
            borderRadius: 8,
          }}/>
        </View>

        <CameraView
          style={{
            flex: 1,
          }}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={({ data }) => {
            setUrl(data);
            setCameraVisible(false);
          }}
        />
      </Modal>

      <NativeList>
        <NativeItem
          icon={<Info />}
        >
          <NativeText variant="subtitle">
            Les liens iCal permettent d'importer des calendriers en temps réel depuis un agenda compatible.
          </NativeText>
        </NativeItem>
      </NativeList>

      <NativeListHeader label="Utiliser un lien iCal" />

      <NativeList>
        <NativeItem
          trailing={
            <TouchableOpacity
              style={{
                marginRight: 8,
              }}
              onPress={() => scanIcalQRCode()}
            >
              <QrCode
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          }
        >
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="Adresse URL du calendrier"
            placeholderTextColor={theme.colors.text + 50}
            style={{
              flex: 1,
              paddingHorizontal: 6,
              paddingVertical: 0,
              fontFamily: "medium",
              fontSize: 16,
              color: theme.colors.text,
            }}
          />
        </NativeItem>
      </NativeList>

      <ButtonCta
        value="Importer"
        icon={loading &&
          <View>
            <PapillonSpinner
              strokeWidth={3}
              size={22}
              color={theme.colors.text}
            />
          </View>
        }
        primary={!loading}
        style={{
          marginTop: 16,
        }}
        onPress={() => {saveIcal();}}
      />

      {account.personalization.icalURLs && account.personalization.icalURLs.length > 0 &&(<>
        <NativeListHeader label="URLs ajoutées" />

        <NativeList>
          {account.personalization.icalURLs.map((url, index) => (
            <NativeItem
              key={index}
              icon={<Calendar />}
              onPress={() => {
                Alert.alert(url.name, url.url, [
                  {
                    text: "Annuler",
                    style: "cancel",
                  },
                  {
                    text: "Copier l'URL",
                    onPress: () => {
                      Clipboard.setString(url.url);
                      Alert.alert("Copié", "L'URL a été copiée dans le presse-papiers.");
                    },
                  },
                  {
                    text: "Supprimer le calendrier",
                    style: "destructive",
                    onPress: () => {
                      useTimetableStore.getState().removeClassesFromSource("ical://"+url.url);
                      const urls = account.personalization.icalURLs || [];
                      urls.splice(index, 1);
                      mutateProperty("personalization", {
                        ...account.personalization,
                        icalURLs: urls,
                      });
                    },
                  },
                ]);
              }}
            >
              <NativeText variant="title">{url.name}</NativeText>
              <NativeText variant="subtitle">{url.url}</NativeText>
            </NativeItem>
          ))}
        </NativeList>
      </>)}

    </ScrollView>
  );
};

export default LessonsImportIcal;