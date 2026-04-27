import type { ThemeConfig } from 'antd'

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#4a9b6f',
    colorSuccess: '#52c41a',
    colorBgLayout: '#f4f6f5',
    borderRadius: 8,
    fontSize: 15,
    fontSizeLG: 17,
    fontSizeHeading3: 22,
    fontSizeHeading4: 18,
  },
  components: {
    Layout: {
      siderBg: '#1a3328',
      triggerBg: '#14281f',
    },
    Menu: {
      darkItemBg: '#1a3328',
      darkSubMenuItemBg: '#14281f',
      darkItemSelectedBg: '#4a9b6f',
    },
  },
}

export default theme
