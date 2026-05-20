import { Modules } from '@/helpers/ipc/types'
import GetSettingsSchema from './getSettingsSchema'
import GetSettingValue from './getSettingValue'
import SetSettingValue from './setSettingValue'

export function createSettingsUseCases({ SettingsRegistry }: Modules) {
  return {
    getSettingsSchema: new GetSettingsSchema(SettingsRegistry),
    getSettingValue: new GetSettingValue(SettingsRegistry),
    setSettingValue: new SetSettingValue(SettingsRegistry),
  }
}
