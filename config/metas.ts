export const PROJECT_NAME = 'Transfer';
export const IS_PROD = process.env?.UMI_ENV === 'prod' ? true : false;

const WEB_URL = IS_PROD ? 'https://transfer.socialswap.com' : 'https://transfer.web3-tp.net';
const PROJECT_DESC = 'Convenient way to transfer Token&NFT to friends directly.';
const PROJECT_IMG = `${WEB_URL}/share_logo.png`;
const PROJECT_SITE_ICON = `${WEB_URL}/card_icon.png`;

export default [
  {
    name: 'viewport',
    content: 'width=device-width,maximum-scale=1,minimum-scale=1,initial-scale=1,user-scalable=no,viewport-fit=cover'
  },
  {
    property: 'og:site_name',
    content: PROJECT_NAME
  },
  {
    property: 'og:title',
    content: PROJECT_NAME
  },
  {
    property: 'og:description',
    content: PROJECT_DESC
  },
  {
    property: 'og:image',
    content: PROJECT_IMG
  },
  {
    property: 'og:site_icon',
    content: PROJECT_SITE_ICON
  },
  {
    property: 'twitter:title',
    content: PROJECT_NAME
  },
  {
    property: 'twitter:description',
    content: PROJECT_DESC
  },
  {
    property: 'twitter:image',
    content: PROJECT_IMG
  },
  {
    property: 'twitter:image:src',
    content: PROJECT_IMG
  },
  {
    property: 'twitter:image:alt',
    content: PROJECT_NAME
  },
  {
    property: 'twitter:card',
    content: 'summary_large_image'
  },
  {
    property: 'twitter:site',
    content: PROJECT_NAME
  },
  {
    property: 'og:image:template',
    content: 'horizontal'
  }
];
