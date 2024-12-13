export default function isClientSide() {
  return (
    'document' in globalThis &&
    'window' in globalThis &&
    'history' in globalThis
  );
}
export function isServerSide() {
  return !isClientSide();
}

export const inClient = isClientSide();

export const inServer = isServerSide();

export const isInLocalhost =
  inClient && globalThis.location.hostname === 'localhost';
export const isInBonsaiTest =
  inClient && /bonsai-.*\.vercel\.app/.test(globalThis.location.hostname);

export function getPlatformInfo() {
  if (!inClient) return;
  const ua = navigator.userAgent;
  const isAndroid = ua.indexOf('Android') > -1 || ua.indexOf('Adr') > -1;
  const isIOS = !!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
  const isWechat = ua.indexOf('MicroMessenger') > -1;
  const isMacOS = /Mac OS/i.test(ua);
  const isMobile = /(iPhone|iPad|iPod|iOS|Android)/i.test(ua);
  const isPc = !isMobile;
  const isSdm = /SdmWallet/.test(ua);

  return {
    isAndroid,
    isIOS,
    isWechat,
    isMobile,
    isPc,
    isMacOS,
    isSdm,
  };
}
