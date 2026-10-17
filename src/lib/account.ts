// Optional account: sign in with an email and a one-time code (Supabase), and keep a saved copy of the app's data
// in it so it comes back on a new phone. Everything still works on the device without an account; when the app is
// built without the Supabase settings the account parts stay hidden.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { backupKey, backupSig, hasProfile, makeBackup, type Backup } from './backup.ts';

// Trimmed: a value pasted into the GitHub secret can carry a stray space, line break or full stop.
const SB_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
const ANON = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim().replace(/[.]+$/, '');
export const accountsOn = !!(SB_URL && ANON);

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!client) {
    client = createClient(SB_URL, ANON, {
      auth: { storage: AsyncStorage, storageKey: 'yw-auth', autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    });
  }
  return client;
}

let email: string | null = null;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());

function init() {
  if (!accountsOn || client) return;
  const s = sb();
  s.auth.getSession().then(({ data }) => { email = data.session?.user.email ?? null; loaded = true; emit(); }).catch(() => { loaded = true; emit(); });
  s.auth.onAuthStateChange((_e, session) => { email = session?.user.email ?? null; loaded = true; emit(); });
  // Tokens refresh only while the app is on screen.
  AppState.addEventListener('change', (st) => { if (st === 'active') s.auth.startAutoRefresh(); else s.auth.stopAutoRefresh(); });
}

/** The signed-in email (null when signed out) and whether the saved session has been read yet. */
export function useAccount() {
  init();
  const [, bump] = useState(0);
  useEffect(() => { const f = () => bump((n) => n + 1); listeners.add(f); return () => { listeners.delete(f); }; }, []);
  return { on: accountsOn, ready: !accountsOn || loaded, email };
}

export const cleanEmail = (s: string) => s.trim().toLowerCase();
export const okEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail(s));

export type AuthErr = 'network' | 'wait' | 'code' | 'other';
function why(e: { message?: string; status?: number; code?: string } | null): AuthErr {
  const m = `${e?.code ?? ''} ${e?.message ?? ''}`.toLowerCase();
  if (e?.status === 429 || m.includes('rate') || m.includes('security purposes')) return 'wait';
  if (m.includes('expired') || m.includes('invalid') || m.includes('otp')) return 'code';
  if (m.includes('fetch') || m.includes('network')) return 'network';
  return 'other';
}

/** Emails a sign-in code (a new account is made the first time). */
export async function sendCode(addr: string): Promise<AuthErr | null> {
  try {
    const { error } = await sb().auth.signInWithOtp({ email: cleanEmail(addr), options: { shouldCreateUser: true } });
    return error ? why(error) : null;
  } catch (e) { return why(e as Error); }
}

// While signing in, automatic saves wait: the phone's data must not replace the account's copy before the person
// has picked which one to keep. A forced save (the sign-in's own decision) lifts the hold.
let hold = false;

export async function checkCode(addr: string, code: string): Promise<AuthErr | null> {
  hold = true;
  try {
    const { error } = await sb().auth.verifyOtp({ email: cleanEmail(addr), token: code.trim(), type: 'email' });
    return error ? why(error) : null;
  } catch (e) { return why(e as Error); }
}

async function snapshot(): Promise<Backup> {
  const keys = (await AsyncStorage.getAllKeys()).filter(backupKey);
  return makeBackup(await AsyncStorage.multiGet(keys));
}

let lastSig = '';
/** Saves the device's data to the account (skipped when nothing changed since the last save). */
export async function saveNow(force = false): Promise<boolean> {
  if (force) hold = false;
  if (!accountsOn || !email || hold) return false;
  try {
    const { data } = await sb().auth.getUser();
    const id = data.user?.id;
    if (!id) return false;
    const b = await snapshot();
    // Never replace the account's copy with an empty phone (after "delete all my data" or before setup).
    if (!hasProfile(b)) return false;
    const sig = backupSig(b);
    if (!force && sig === lastSig) return true;
    const { error } = await sb().from('backups').upsert({ user_id: id, data: b, updated_at: b.at });
    if (error) return false;
    lastSig = sig;
    return true;
  } catch { return false; }
}

/** The copy saved in the account, or null when there is none (or it can't be reached). */
export async function readSaved(): Promise<Backup | null> {
  try {
    const { data } = await sb().from('backups').select('data').maybeSingle();
    return (data?.data as Backup | undefined) ?? null;
  } catch { return null; }
}

// Starts the app again from home, so the restored data is read fresh.
const restart = () => {
  // On the web the app's screens are one level under its folder (/app/onboarding, /app/me), so "." is home.
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.replace(new URL('.', window.location.href).href);
  else Updates.reloadAsync().catch(() => {});
};

/** Replaces the device's data with the account's copy and restarts the app on it. */
export async function applySaved(b: Backup) {
  const old = (await AsyncStorage.getAllKeys()).filter(backupKey);
  await AsyncStorage.multiRemove(old);
  await AsyncStorage.multiSet(Object.entries(b.items));
  lastSig = backupSig(b);
  restart();
}

export async function signOut() {
  await saveNow();
  // Only this phone: other phones on the same account stay signed in.
  await sb().auth.signOut({ scope: 'local' }).catch(() => {});
  lastSig = '';
}

/** Deletes the account and its saved copy on the server; the data on this device stays. */
export async function deleteAccount(): Promise<boolean> {
  try {
    const { error } = await sb().rpc('delete_me');
    if (error) return false;
    await sb().auth.signOut().catch(() => {});
    lastSig = '';
    return true;
  } catch { return false; }
}

/** Keeps the account copy up to date: when the app leaves the screen and every two minutes while it is open. */
export function useAutoSave() {
  const { email: who } = useAccount();
  useEffect(() => {
    if (!who) return;
    saveNow();
    const sub = AppState.addEventListener('change', (st) => { if (st !== 'active') saveNow(); });
    const t = setInterval(() => saveNow(), 120_000);
    return () => { sub.remove(); clearInterval(t); };
  }, [who]);
}
