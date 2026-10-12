// Turn a view on screen into a PNG and hand it to the phone's share sheet (Instagram or WhatsApp stories, Photos,
// chats). On the web, the browser's share sheet when it can share files, otherwise a download.
import * as Sharing from 'expo-sharing';
import { toPng } from 'html-to-image';
import type { RefObject } from 'react';
import { Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

export async function shareView(ref: RefObject<View | null>, size: { width: number; height: number }, name: string, title: string): Promise<ShareResult> {
  if (!ref.current) throw new Error('nothing to capture');
  if (Platform.OS !== 'web') {
    const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', ...size });
    if (!(await Sharing.isAvailableAsync())) throw new Error('sharing unavailable');
    await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: title });
    return 'shared';
  }
  const node = ref.current as unknown as HTMLElement;
  const url = await toPng(node, { pixelRatio: size.width / node.offsetWidth, cacheBust: true });
  const file = new File([await (await fetch(url)).blob()], `${name}.png`, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title }); return 'shared'; }
    catch (e) { if ((e as Error).name === 'AbortError') return 'cancelled'; }
  }
  const a = document.createElement('a');
  a.href = url; a.download = `${name}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  return 'downloaded';
}
