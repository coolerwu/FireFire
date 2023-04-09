
/**
 * 构建主题样式
 */
const buildThemeStyleFunc = (setting) => {
    const theme = {};

    //Ant样式
    if (setting?.themeSource !== 'dark') {
        theme.token = {
            colorPrimary: '#00b96b',
            colorBgContainer: 'white',
            colorLink: '#61d39c',
            colorLinkActive: '#00ff94',
            colorLinkHover: '#00b96b',
        };
    } else {
        theme.token = {
            colorPrimary: '#7d806e',
            colorBgContainer: 'darkgray',
            colorLink: '#7d806e',
            colorLinkActive: '#d3ff00',
            colorLinkHover: '#c2cc8c',
        };
    }

    //自定义样式
    theme.fontSizeLarge = '20px';
    theme.fontSizeMedium = '15px';
    theme.fontSizeMini = '10px';
    theme.fontLinkColor = '#365ad2';
    if (setting?.themeSource !== 'dark') {
        theme.fontColor = '#1f1f1f';
        theme.boxShadowColor = 'gray';
        theme.backgroundColor = 'white';
    } else {
        theme.fontColor = 'white';
        theme.boxShadowColor = 'white';
        theme.backgroundColor = 'darkgray';
    }
    return theme;
}

export default buildThemeStyleFunc;
