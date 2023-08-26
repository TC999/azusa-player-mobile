import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { Appearance, StyleSheet, View, ColorSchemeName } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { DrawerNavigationProp } from '@react-navigation/drawer';

import SkinSettings from './SkinSettings';
import { SettingListItem, RenderSetting } from '../useRenderSetting';
import { useNoxSetting } from '@hooks/useSetting';
import GenericSelectDialog from '@components/dialogs/GenericSelectDialog';
import {
  SelectSettingEntry,
  dummySelectSettingEntry,
} from '../SetttingEntries';
import { saveColorScheme } from '@utils/ChromeStorage';

interface Props {
  navigation: DrawerNavigationProp<ParamListBase>;
}

enum VIEW {
  HOME = 'AppearanceHome',
  SKIN = 'SkinSetting',
}
const ColorSchemei18n = (
  scheme: ColorSchemeName,
  t: (val: string) => string
) => {
  switch (scheme) {
    case 'light':
      return t('AppearanceSettings.ColorSchemeLight');
    case 'dark':
      return t('AppearanceSettings.ColorSchemeDark');
    default:
      return t('AppearanceSettings.ColorSchemeAdaptive');
  }
};

const Stack = createNativeStackNavigator();

const MainView = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const navigationGlobal = useNavigation();
  const playerStyle = useNoxSetting(state => state.playerStyle);
  const [currentSelectOption, setCurrentSelectOption] = React.useState<
    SelectSettingEntry<any>
  >(dummySelectSettingEntry);
  const [selectVisible, setSelectVisible] = React.useState(false);

  const selectColorScheme = () => {
    setSelectVisible(true);
    const options: ColorSchemeName[] = [null, 'light', 'dark'];
    const defaultIndex = options.indexOf(Appearance.getColorScheme() || null);
    setCurrentSelectOption({
      options,
      renderOption: (option: ColorSchemeName) => ColorSchemei18n(option, t),
      defaultIndex: defaultIndex > -1 ? defaultIndex : 0,
      onClose: () => setSelectVisible(false),
      onSubmit: (index: number) => {
        setSelectVisible(false);
        Appearance.setColorScheme(options[index]);
        saveColorScheme(options[index]);
      },
      title: t('AppearanceSettings.ColorSchemeName'),
    } as SelectSettingEntry<ColorSchemeName>);
  };

  return (
    <View
      style={[
        styles.homeSettingsContainer,
        { backgroundColor: playerStyle.customColors.maskedBackgroundColor },
      ]}
    >
      <ScrollView>
        <SettingListItem
          icon={'palette-swatch-variant'}
          settingName="SkinSetting"
          onPress={() => navigation.navigate(VIEW.SKIN)}
          settingCategory="Settings"
        />
        <RenderSetting
          item={{
            settingName: 'hideCoverInMobile',
            settingCategory: 'AppearanceSettings',
          }}
        />
        <RenderSetting
          item={{
            settingName: 'trackCoverArtCard',
            settingCategory: 'AppearanceSettings',
          }}
        />
        <SettingListItem
          settingName="ColorScheme"
          onPress={selectColorScheme}
          settingCategory="AppearanceSettings"
          modifyDescription={() =>
            t('AppearanceSettings.ColorSchemeDesc', {
              scheme: ColorSchemei18n(Appearance.getColorScheme(), t),
            })
          }
        />
      </ScrollView>
      <GenericSelectDialog
        visible={selectVisible}
        options={currentSelectOption.options}
        renderOptionTitle={currentSelectOption.renderOption}
        title={currentSelectOption.title}
        defaultIndex={currentSelectOption.defaultIndex}
        onClose={currentSelectOption.onClose}
        onSubmit={currentSelectOption.onSubmit}
      />
    </View>
  );
};

const AppearanceSetting = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={VIEW.HOME}
        component={MainView}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={VIEW.SKIN}
        component={SkinSettings}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
export default AppearanceSetting;

const styles = StyleSheet.create({
  dummySettingsContainer: {
    flex: 1,
  },
  dummySettingsText: {
    fontSize: 60,
    paddingLeft: 20,
  },
  homeSettingsContainer: {
    flex: 1,
  },
  menuButton: {
    width: 55,
    marginLeft: -5,
  },
});
