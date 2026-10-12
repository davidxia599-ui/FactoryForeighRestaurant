import { createI18n } from 'vue-i18n'
import zhTW from './zh-TW'
import en from './en'

export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'zh-TW',
  fallbackLocale: 'en',
  messages: {
    'zh-TW': zhTW,
    en
  }
})
