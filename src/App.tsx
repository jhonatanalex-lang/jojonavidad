import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { AlertCircle, CheckCircle2, EyeOff, Loader2, Plus, X } from 'lucide-react';
import {
  auth,
  ensureAnonymousSession,
  testFirestoreConnection,
} from './lib/firebase';
import {
  ADMIN_EMAIL,
  adminPreRegisterMember,
  createFamilyGroup,
  createWish,
  deleteWish,
  enterOrClaimMember,
  fetchGroupByCode,
  purgeLegacyExampleParticipants,
  registerOrRecoverAccount,
  saveMemberSizes,
  setPrimaryFavoriteWish,
  subscribeAccount,
  subscribeGroup,
  subscribeMembers,
  subscribeMyCreatedGroups,
  subscribeMyJoinedGroupCodes,
  subscribeWishes,
  toggleWishReservation,
  updateFamilyGroup,
  updateWishDetails,
} from './lib/firestoreService';
import { formatFirebaseError, sanitizeGroupCodeInput } from './lib/validation';
import {
  CompressedPhoto,
  FamilyGroup,
  MemberProfile,
  UserAccount,
  WishItem,
} from './types/wishlist';
import { AuthScreen } from './components/AuthScreen';
import { GroupOnboardingScreen } from './components/GroupOnboardingScreen';
import { MemberSelectGate } from './components/MemberSelectGate';
import { AppTab, TopBar } from './components/TopBar';
import { WishComposer } from './components/WishComposer';
import { WishCard } from './components/WishCard';
import { WishFeed } from './components/WishFeed';
import { SizesDirectory } from './components/SizesDirectory';
import { SizesPromptModal } from './components/SizesPromptModal';
import { FamilyGroupModal } from './components/FamilyGroupModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { FestiveSnowConfetti } from './components/FestiveSnowConfetti';
import { HOLIDAY_ASSETS, HolidayWorkspaceHero } from './components/FestiveDecor';
import { useTheme } from './lib/theme';

const WELCOMED_STORAGE_KEY = 'navidad_secreta_welcomed';
const ACCOUNT_STORAGE_KEY = 'navidad_secreta_account_v1';

function readStoredAccountId(): string {
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { accountId?: string };
    return typeof parsed.accountId === 'string' && parsed.accountId.startsWith('acc_')
      ? parsed.accountId
      : '';
  } catch {
    return '';
  }
}

function persistStoredAccount(account: { accountId: string; displayName: string } | null): void {
  try {
    if (!account) {
      localStorage.removeItem(ACCOUNT_STORAGE_KEY);
    } else {
      localStorage.setItem(
        ACCOUNT_STORAGE_KEY,
        JSON.stringify({
          accountId: account.accountId,
          displayName: account.displayName,
        })
      );
    }
  } catch {
    // ignore storage errors
  }
}

interface PendingConfirm {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  action: () => Promise<void>;
}

interface ToastState {
  message: string;
  isError: boolean;
}

function getInvitedCodeFromUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('grupo') || params.get('codigo') || '';
    const cleaned = sanitizeGroupCodeInput(fromUrl);
    return cleaned.length >= 3 ? cleaned : '';
  } catch {
    return '';
  }
}

function getInitialWelcomed(invitedCode: string): boolean {
  // Only skip the branded welcome screen automatically when entering via a direct group invite link
  return Boolean(invitedCode);
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [invitedCode] = useState<string>(getInvitedCodeFromUrl);
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean>(() =>
    getInitialWelcomed(getInvitedCodeFromUrl())
  );

  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isConnectingSession, setIsConnectingSession] = useState(false);
  const [needsAnonymousEnablement, setNeedsAnonymousEnablement] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [activeGroupCode, setActiveGroupCode] = useState<string>('');
  const [activeGroup, setActiveGroup] = useState<FamilyGroup | null>(null);
  const [autoJoiningUrl, setAutoJoiningUrl] = useState<boolean>(false);

  const [savedAccountId, setSavedAccountId] = useState<string>(readStoredAccountId);
  const [activeAccount, setActiveAccount] = useState<UserAccount | null>(null);
  const [accountCreatedGroups, setAccountCreatedGroups] = useState<FamilyGroup[]>([]);
  const [accountJoinedGroups, setAccountJoinedGroups] = useState<FamilyGroup[]>([]);

  const [myCreatedGroups, setMyCreatedGroups] = useState<FamilyGroup[]>([]);
  const [myJoinedCodes, setMyJoinedCodes] = useState<string[]>([]);
  const [myJoinedGroups, setMyJoinedGroups] = useState<FamilyGroup[]>([]);
  const [groupBusy, setGroupBusy] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [wishes, setWishes] = useState<WishItem[]>([]);

  const [currentMemberId, setCurrentMemberId] = useState<string>('');
  const [fallbackMember, setFallbackMember] = useState<MemberProfile | null>(null);
  const [enteringMember, setEnteringMember] = useState(false);
  const [memberGateError, setMemberGateError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>('upload');
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [showSizesPrompt, setShowSizesPrompt] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingWish, setEditingWish] = useState<WishItem | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);
  const [celebrationKey, setCelebrationKey] = useState(0);

  const notify = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const startAnonymousSession = useCallback(async () => {
    setIsConnectingSession(true);
    setSessionError(null);
    setNeedsAnonymousEnablement(false);
    try {
      await ensureAnonymousSession();
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const lower = raw.toLowerCase();
      if (
        lower.includes('operation-not-allowed') ||
        lower.includes('admin-restricted-operation')
      ) {
        setNeedsAnonymousEnablement(true);
        setHasSeenWelcome(false);
      } else {
        setSessionError(formatFirebaseError(err));
      }
    } finally {
      setIsConnectingSession(false);
    }
  }, []);

  // Automatically establish an anonymous Firebase session without any login prompt
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        setAuthReady(true);
        setNeedsAnonymousEnablement(false);
        setSessionError(null);
        void testFirestoreConnection();
      } else {
        setFirebaseUser(null);
        setAuthReady(true);
        void startAnonymousSession();
      }
    });
    return () => unsubscribe();
  }, [startAnonymousSession]);

  // Auto-resolve invite link (?grupo=...) once session is active
  useEffect(() => {
    if (!firebaseUser || !invitedCode || activeGroupCode) return;
    let cancelled = false;
    setAutoJoiningUrl(true);

    fetchGroupByCode(invitedCode)
      .then((found) => {
        if (cancelled) return;
        if (found) {
          setActiveGroup(found);
          setActiveGroupCode(found.code);
          setHasSeenWelcome(true);
        } else {
          setGroupError(
            `El código "${invitedCode}" del enlace no existe o fue eliminado. Verifica con quien creó el grupo.`
          );
          setHasSeenWelcome(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setGroupError(formatFirebaseError(err));
        }
      })
      .finally(() => {
        if (!cancelled) setAutoJoiningUrl(false);
      });

    return () => {
      cancelled = true;
    };
  }, [firebaseUser, invitedCode, activeGroupCode]);

  // Subscribe to groups created & joined by current device session
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubCreated = subscribeMyCreatedGroups(
      firebaseUser.uid,
      (groups) => setMyCreatedGroups(groups),
      () => {
        // non-fatal
      }
    );

    const unsubJoined = subscribeMyJoinedGroupCodes(
      firebaseUser.uid,
      (codes) => setMyJoinedCodes(codes),
      () => {
        // non-fatal
      }
    );

    return () => {
      unsubCreated();
      unsubJoined();
    };
  }, [firebaseUser]);

  // Subscribe to saved quick account once Firebase anonymous session is ready
  useEffect(() => {
    if (!firebaseUser || !savedAccountId) {
      setActiveAccount(null);
      return;
    }

    const unsubAccount = subscribeAccount(
      savedAccountId,
      (account) => {
        if (!account || !account.authorizedUids.includes(firebaseUser.uid)) {
          setActiveAccount(null);
          setSavedAccountId('');
          persistStoredAccount(null);
          return;
        }
        setActiveAccount(account);
      },
      () => {
        // non-fatal
      }
    );

    return () => unsubAccount();
  }, [firebaseUser, savedAccountId]);

  // Hydrate groups linked to the active quick account (created + joined across devices)
  useEffect(() => {
    if (!firebaseUser || !activeAccount) {
      setAccountCreatedGroups([]);
      setAccountJoinedGroups([]);
      return;
    }
    let cancelled = false;

    const resolveCodes = async (codes: string[]): Promise<FamilyGroup[]> => {
      if (codes.length === 0) return [];
      const results = await Promise.all(
        codes.map(async (code) => {
          try {
            return await fetchGroupByCode(code);
          } catch {
            return null;
          }
        })
      );
      return results.filter((g): g is FamilyGroup => Boolean(g));
    };

    Promise.all([
      resolveCodes(activeAccount.createdGroupCodes),
      resolveCodes(activeAccount.joinedGroupCodes),
    ]).then(([createdList, joinedList]) => {
      if (!cancelled) {
        setAccountCreatedGroups(createdList);
        setAccountJoinedGroups(joinedList);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [firebaseUser, activeAccount]);

  // Resolve FamilyGroup documents for joined codes from current browser UID
  useEffect(() => {
    if (!firebaseUser || myJoinedCodes.length === 0) {
      setMyJoinedGroups([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      myJoinedCodes.map(async (code) => {
        try {
          const found = await fetchGroupByCode(code);
          return (
            found || {
              code,
              name: code,
              expectedMembers: 12,
              creatorUid: '',
              createdAt: '',
            }
          );
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!cancelled) {
        setMyJoinedGroups(results.filter((g): g is FamilyGroup => Boolean(g)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, myJoinedCodes]);

  const combinedCreatedGroups = useMemo(() => {
    const map = new Map<string, FamilyGroup>();
    for (const g of myCreatedGroups) {
      if (
        !activeAccount ||
        !g.creatorAccountId ||
        g.creatorAccountId === activeAccount.accountId
      ) {
        map.set(g.code, g);
      }
    }
    for (const g of accountCreatedGroups) map.set(g.code, g);
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [myCreatedGroups, accountCreatedGroups, activeAccount]);

  const combinedJoinedGroups = useMemo(() => {
    const map = new Map<string, FamilyGroup>();
    for (const g of myJoinedGroups) map.set(g.code, g);
    for (const g of accountJoinedGroups) map.set(g.code, g);
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [myJoinedGroups, accountJoinedGroups]);

  const totalUniqueSavedGroups = useMemo(() => {
    const codes = new Set<string>();
    for (const g of combinedCreatedGroups) codes.add(g.code);
    for (const g of combinedJoinedGroups) codes.add(g.code);
    return codes.size;
  }, [combinedCreatedGroups, combinedJoinedGroups]);

  // Real-time Firestore listeners scoped by activeGroupCode
  useEffect(() => {
    if (!firebaseUser || !activeGroupCode) {
      setMembers([]);
      setWishes([]);
      return;
    }

    void purgeLegacyExampleParticipants(activeGroupCode);

    const unsubGroup = subscribeGroup(
      activeGroupCode,
      (grp) => {
        if (grp) setActiveGroup(grp);
      },
      () => {
        // ignore if legacy group without doc
      }
    );

    const unsubMembers = subscribeMembers(
      activeGroupCode,
      (list) => {
        setMembers(list);
      },
      (err) => {
        notify(formatFirebaseError(err), true);
      }
    );

    const unsubWishes = subscribeWishes(
      activeGroupCode,
      (list) => {
        setWishes(list);
      },
      (err) => {
        notify(formatFirebaseError(err), true);
      }
    );

    return () => {
      unsubGroup();
      unsubMembers();
      unsubWishes();
    };
  }, [firebaseUser, activeGroupCode, notify]);

  const isAdmin = Boolean(
    firebaseUser?.email &&
      firebaseUser.emailVerified &&
      firebaseUser.email.toLowerCase() === ADMIN_EMAIL
  );
  const isGroupCreator = Boolean(
    firebaseUser &&
      activeGroup &&
      (activeGroup.creatorUid === firebaseUser.uid ||
        Boolean(activeAccount && activeGroup.creatorAccountId === activeAccount.accountId))
  );

  const currentMember = useMemo(() => {
    if (!currentMemberId) return null;
    return (
      members.find((m) => m.id === currentMemberId) ||
      (fallbackMember && fallbackMember.id === currentMemberId
        ? fallbackMember
        : null)
    );
  }, [members, currentMemberId, fallbackMember]);

  const handleDismissWelcome = useCallback(() => {
    setHasSeenWelcome(true);
    try {
      localStorage.setItem(WELCOMED_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  const enterValidatedGroup = useCallback((group: FamilyGroup) => {
    setActiveGroup(group);
    setActiveGroupCode(group.code);
    setCurrentMemberId('');
    setFallbackMember(null);
    setEditingWish(null);
    setMemberGateError(null);
    setGroupError(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('grupo', group.code);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  }, []);

  const handleLeaveGroup = useCallback(() => {
    setActiveGroupCode('');
    setActiveGroup(null);
    setCurrentMemberId('');
    setFallbackMember(null);
    setEditingWish(null);
    setMemberGateError(null);
    setGroupError(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('grupo');
      url.searchParams.delete('codigo');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  }, []);

  const handleJoinGroupByCode = async (code: string) => {
    setGroupBusy(true);
    setGroupError(null);
    try {
      if (!auth.currentUser) {
        await ensureAnonymousSession();
      }
      const found = await fetchGroupByCode(code);
      if (!found) {
        setGroupError(
          `No existe ningún grupo con el código "${code}". Verifica con quien lo creó.`
        );
        return;
      }
      enterValidatedGroup(found);
    } catch (err) {
      setGroupError(formatFirebaseError(err));
    } finally {
      setGroupBusy(false);
    }
  };

  const handleRecoverWithPhone = async (name: string, phone: string) => {
    setGroupBusy(true);
    setGroupError(null);
    try {
      if (!auth.currentUser) {
        await ensureAnonymousSession();
      }
      const { account } = await registerOrRecoverAccount(name, phone, 'recover-only');
      setSavedAccountId(account.accountId);
      setActiveAccount(account);
      persistStoredAccount(account);
      const count = new Set([
        ...account.createdGroupCodes,
        ...account.joinedGroupCodes,
      ]).size;
      notify(
        count > 0
          ? `¡Bienvenido, ${account.displayName}! Recuperamos ${count} ${count === 1 ? 'grupo' : 'grupos'}.`
          : `¡Hola, ${account.displayName}! Tu acceso rápido quedó activo.`
      );
    } catch (err) {
      const msg = formatFirebaseError(err);
      setGroupError(msg);
      throw err;
    } finally {
      setGroupBusy(false);
    }
  };

  const handleLinkAccount = async (name: string, phone: string) => {
    setGroupBusy(true);
    setGroupError(null);
    try {
      if (!auth.currentUser) {
        await ensureAnonymousSession();
      }
      const { account } = await registerOrRecoverAccount(
        name,
        phone,
        'register-or-recover'
      );
      setSavedAccountId(account.accountId);
      setActiveAccount(account);
      persistStoredAccount(account);
      notify(
        `¡Listo, ${account.displayName}! Tus grupos quedaron respaldados para abrirlos en cualquier navegador.`
      );
    } catch (err) {
      const msg = formatFirebaseError(err);
      setGroupError(msg);
      throw err;
    } finally {
      setGroupBusy(false);
    }
  };

  const handleSwitchAccount = useCallback(() => {
    persistStoredAccount(null);
    setSavedAccountId('');
    setActiveAccount(null);
    setAccountCreatedGroups([]);
    setAccountJoinedGroups([]);
    setMyCreatedGroups([]);
    setMyJoinedCodes([]);
    setMyJoinedGroups([]);
    setActiveGroupCode('');
    setActiveGroup(null);
    setCurrentMemberId('');
    setFallbackMember(null);
    setEditingWish(null);
    setMemberGateError(null);
    setGroupError(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('grupo');
      url.searchParams.delete('codigo');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
    void signOut(auth).catch(() => {
      // ignore signOut failure
    });
    notify('Acceso rápido cerrado. Puedes ingresar con otro nombre y celular.');
  }, [notify]);

  const handleCreateGroup = async (
    name: string,
    expectedMembers: number,
    creatorIdentity?: { name: string; phone: string }
  ): Promise<FamilyGroup> => {
    setGroupBusy(true);
    setGroupError(null);
    try {
      if (!auth.currentUser) {
        await ensureAnonymousSession();
      }
      let resolvedAccount = activeAccount;
      if (!resolvedAccount && creatorIdentity) {
        const res = await registerOrRecoverAccount(
          creatorIdentity.name,
          creatorIdentity.phone,
          'register-or-recover'
        );
        resolvedAccount = res.account;
        setSavedAccountId(res.account.accountId);
        setActiveAccount(res.account);
        persistStoredAccount(res.account);
      }
      const created = await createFamilyGroup(
        name,
        expectedMembers,
        resolvedAccount
      );
      notify(`Grupo "${created.name}" creado. Código: ${created.code}`);
      return created;
    } catch (err) {
      const msg = formatFirebaseError(err);
      setGroupError(msg);
      notify(msg, true);
      throw err;
    } finally {
      setGroupBusy(false);
    }
  };

  const handleEnterWithName = async (name: string, phone?: string) => {
    if (!activeGroupCode) return;
    setEnteringMember(true);
    setMemberGateError(null);
    try {
      if (!auth.currentUser) {
        await ensureAnonymousSession();
      }
      let resolvedAccount = activeAccount;
      if (!resolvedAccount && phone) {
        const res = await registerOrRecoverAccount(
          name,
          phone,
          'register-or-recover'
        );
        resolvedAccount = res.account;
        setSavedAccountId(res.account.accountId);
        setActiveAccount(res.account);
        persistStoredAccount(res.account);
      }

      const profile = await enterOrClaimMember(
        name,
        activeGroupCode,
        resolvedAccount?.accountId
      );
      setFallbackMember(profile);
      setCurrentMemberId(profile.id);
      setActiveTab('upload');

      const hasAnySize = Boolean(
        profile.casaca ||
          profile.polo ||
          profile.chompa ||
          profile.pantalon ||
          profile.zapatillas
      );
      if (!hasAnySize) {
        setShowSizesPrompt(true);
      }
    } catch (err) {
      const msg = formatFirebaseError(err);
      setMemberGateError(msg);
      notify(msg, true);
    } finally {
      setEnteringMember(false);
    }
  };

  const executeSaveSizes = async (profile: MemberProfile) => {
    setIsBusy(true);
    try {
      await saveMemberSizes(profile);
      setFallbackMember(profile);
      setShowSizesPrompt(false);
      notify('Tallas guardadas correctamente.');
    } catch (err) {
      notify(formatFirebaseError(err), true);
    } finally {
      setIsBusy(false);
    }
  };

  const handleRequestSaveProfile = (profile: MemberProfile) => {
    const hasExistingSizes = Boolean(
      currentMember?.casaca ||
        currentMember?.polo ||
        currentMember?.chompa ||
        currentMember?.pantalon ||
        currentMember?.zapatillas
    );
    if (hasExistingSizes) {
      setPendingConfirm({
        title: '¿Actualizar tus tallas?',
        description: `Se actualizarán las tallas registradas de ${profile.member} para tu Amigo Secreto.`,
        confirmLabel: 'Actualizar tallas',
        action: () => executeSaveSizes(profile),
      });
    } else {
      void executeSaveSizes(profile);
    }
  };

  const handleRequestUpdateGroupSettings = (
    name: string,
    expectedMembers: number
  ) => {
    if (!activeGroupCode) return;
    setPendingConfirm({
      title: '¿Guardar cambios del grupo?',
      description: `Se actualizará el grupo a "${name}" con cupo de ${expectedMembers} participantes.`,
      confirmLabel: 'Guardar ajustes',
      action: async () => {
        setIsBusy(true);
        try {
          await updateFamilyGroup(activeGroupCode, name, expectedMembers);
          notify('Ajustes del grupo actualizados.');
        } catch (err) {
          notify(formatFirebaseError(err), true);
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  const handleSubmitWish = async (payload: {
    wish: string;
    description: string;
    productUrl: string;
    linkTitle: string;
    linkImage: string;
    linkSite: string;
    linkDesc: string;
    linkPrice: string;
    keepExistingPhoto: boolean;
    photo: CompressedPhoto | null;
    isFavorite: boolean;
  }) => {
    if (!currentMember || !activeGroupCode) return;

    if (editingWish) {
      const targetWish = editingWish;
      setPendingConfirm({
        title: '¿Guardar cambios en este deseo?',
        description: `Se actualizarán los datos del deseo "${targetWish.wish}" en tu lista.`,
        confirmLabel: 'Guardar cambios',
        action: async () => {
          setIsBusy(true);
          try {
            await updateWishDetails({
              wish: targetWish,
              accountId: activeAccount?.accountId,
              title: payload.wish,
              description: payload.description,
              productUrl: payload.productUrl,
              linkTitle: payload.linkTitle,
              linkImage: payload.linkImage,
              linkSite: payload.linkSite,
              linkDesc: payload.linkDesc,
              linkPrice: payload.linkPrice,
              keepExistingPhoto: payload.keepExistingPhoto,
              newPhotoDataUrl: payload.photo?.dataUrl,
              isFavorite: payload.isFavorite,
            });
            setEditingWish(null);
            setComposerOpen(false);
            notify('Deseo actualizado con éxito.');
          } catch (err) {
            notify(formatFirebaseError(err), true);
          } finally {
            setIsBusy(false);
          }
        },
      });
      return;
    }

    const isFirstWish = myWishes.length === 0;
    setIsBusy(true);
    try {
      await createWish({
        memberId: currentMember.id,
        memberName: currentMember.member,
        familyCode: activeGroupCode,
        accountId: activeAccount?.accountId,
        title: payload.wish,
        description: payload.description,
        productUrl: payload.productUrl,
        linkTitle: payload.linkTitle,
        linkImage: payload.linkImage,
        linkSite: payload.linkSite,
        linkDesc: payload.linkDesc,
        linkPrice: payload.linkPrice,
        photoDataUrl: payload.photo?.dataUrl,
        isFavorite: payload.isFavorite,
      });
      setComposerOpen(false);
      if (isFirstWish) {
        setCelebrationKey((k) => k + 1);
        notify('¡Tu primer deseo quedó guardado!');
      } else {
        notify(
          payload.isFavorite
            ? '¡Deseo guardado como tu regalo favorito principal!'
            : '¡Deseo guardado en tu lista!'
        );
      }
    } catch (err) {
      const msg = formatFirebaseError(err);
      notify(msg, true);
      throw err;
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleFavorite = async (wish: WishItem) => {
    if (favoriteBusyId) return;
    const makeFavorite = !wish.isFavorite;
    const replacingOther = Boolean(
      makeFavorite && myFavoriteWish && myFavoriteWish.id !== wish.id
    );
    setFavoriteBusyId(wish.id);
    try {
      await setPrimaryFavoriteWish(wish, makeFavorite, activeAccount?.accountId);
      if (makeFavorite) {
        notify(
          replacingOther
            ? `"${wish.wish}" es ahora tu regalo favorito principal.`
            : `"${wish.wish}" marcado como tu regalo favorito.`
        );
      } else {
        notify('Se quitó la marca de regalo favorito.');
      }
    } catch (err) {
      notify(formatFirebaseError(err), true);
    } finally {
      setFavoriteBusyId(null);
    }
  };

  const handleRequestDeleteWish = (wish: WishItem) => {
    setPendingConfirm({
      title: '¿Eliminar este deseo?',
      description: `Se eliminará permanentemente "${wish.wish}" de tu lista de deseos. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar deseo',
      destructive: true,
      action: async () => {
        setIsBusy(true);
        try {
          await deleteWish(wish);
          if (editingWish?.id === wish.id) setEditingWish(null);
          notify('Deseo eliminado.');
        } catch (err) {
          notify(formatFirebaseError(err), true);
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  const handleRequestToggleReserve = (wish: WishItem) => {
    const nextState = !wish.reservedAnonymously;
    setPendingConfirm({
      title: nextState
        ? '¿Reservar este regalo en secreto?'
        : '¿Liberar esta reserva anónima?',
      description: nextState
        ? `Se marcará "${wish.wish}" como reservado para que nadie más compre lo mismo. Es 100 % anónimo: ${wish.member} no verá esta marca ni sabrá quién lo eligió.`
        : `El deseo "${wish.wish}" volverá a mostrarse como disponible para que otra persona pueda elegirlo. ${wish.member} tampoco verá este cambio.`,
      confirmLabel: nextState ? 'Sí, lo regalaré' : 'Liberar reserva',
      action: async () => {
        setIsBusy(true);
        try {
          await toggleWishReservation(wish);
          notify(
            nextState
              ? 'Regalo reservado en secreto. La sorpresa está a salvo.'
              : 'Reserva liberada. El deseo vuelve a estar disponible.'
          );
        } catch (err) {
          notify(formatFirebaseError(err), true);
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  const handleRequestPreRegisterMember = (name: string) => {
    if (!activeGroupCode) return;
    const upperName = name.trim().toUpperCase();
    setPendingConfirm({
      title: `¿Agregar a ${upperName}?`,
      description: `Se pre-registrará a ${upperName} en el grupo ${
        activeGroup?.name || activeGroupCode
      } para que pueda entrar tocando su nombre.`,
      confirmLabel: 'Agregar participante',
      action: async () => {
        setIsBusy(true);
        try {
          await adminPreRegisterMember(upperName, activeGroupCode);
          notify(`${upperName} agregado al grupo.`);
        } catch (err) {
          notify(formatFirebaseError(err), true);
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  const runConfirmedAction = async () => {
    if (!pendingConfirm) return;
    setConfirmBusy(true);
    try {
      await pendingConfirm.action();
    } finally {
      setConfirmBusy(false);
      setPendingConfirm(null);
    }
  };

  const myWishes = useMemo(() => {
    if (!currentMember) return [];
    return wishes
      .filter((w) => w.memberId === currentMember.id)
      .sort((a, b) => Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)));
  }, [wishes, currentMember]);

  const myFavoriteWish = useMemo(
    () => myWishes.find((w) => w.isFavorite) || null,
    [myWishes]
  );

  const showWelcomeScreen =
    !hasSeenWelcome || needsAnonymousEnablement || !firebaseUser;

  return (
    <div className="min-h-screen bg-[#F3F6F4] dark:bg-[#192D2A] text-[#1A2E2B] dark:text-[#FBF3E4] transition-colors duration-200">
      {/* Festive snowfall & confetti on saving first wish */}
      <FestiveSnowConfetti triggerKey={celebrationKey} />

      {/* Global Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 max-w-sm rounded-2xl border px-4 py-3 shadow-lg flex items-start gap-3 ${
            toast.isError
              ? 'bg-white dark:bg-[#223B37] border-[#D96857]/45 text-[#C45544] dark:text-[#F29C8E]'
              : 'bg-white dark:bg-[#223B37] border-[#2F4E49]/30 dark:border-[#F2D5A0]/40 text-[#2B4B46] dark:text-[#F2D5A0]'
          }`}
        >
          {toast.isError ? (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium leading-snug flex-1 break-words">
            {toast.message}
          </p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4]"
            aria-label="Cerrar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!authReady || autoJoiningUrl ? (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="flex items-center gap-3 text-sm font-medium text-[#556D68] dark:text-[#BDD0CB]">
            <Loader2 className="h-5 w-5 animate-spin text-[#D96857] dark:text-[#F2D5A0]" />
            <span>
              {autoJoiningUrl ? 'Abriendo grupo invitado…' : 'Preparando la app…'}
            </span>
          </div>
        </div>
      ) : showWelcomeScreen ? (
        /* Step 1: Christmas Branded Cover / Welcome Screen */
        <AuthScreen
          invitedCode={invitedCode || null}
          savedGroupsCount={totalUniqueSavedGroups}
          isConnecting={isConnectingSession}
          needsAnonymousEnablement={needsAnonymousEnablement}
          errorMsg={sessionError}
          theme={theme}
          onToggleTheme={toggleTheme}
          onContinue={() => {
            if (!firebaseUser) {
              void startAnonymousSession();
            }
            handleDismissWelcome();
          }}
          onRetrySession={() => {
            void startAnonymousSession();
          }}
        />
      ) : !activeGroupCode ? (
        /* Step 2: Recover by Phone, Join with Code, or Create Group */
        <GroupOnboardingScreen
          initialJoinCode={invitedCode}
          activeAccount={activeAccount}
          myCreatedGroups={combinedCreatedGroups}
          myJoinedGroups={combinedJoinedGroups}
          isBusy={groupBusy}
          errorMsg={groupError}
          theme={theme}
          onToggleTheme={toggleTheme}
          onJoinByCode={handleJoinGroupByCode}
          onRecoverWithPhone={handleRecoverWithPhone}
          onLinkAccount={handleLinkAccount}
          onSwitchAccount={handleSwitchAccount}
          onCreateGroup={handleCreateGroup}
          onContinueToGroup={enterValidatedGroup}
          onBackToWelcome={() => setHasSeenWelcome(false)}
        />
      ) : !currentMember ? (
        /* Step 3: Enter Participant Name (+ Phone on first time) */
        <MemberSelectGate
          group={activeGroup}
          familyCode={activeGroupCode}
          currentUid={firebaseUser.uid}
          activeAccount={activeAccount}
          isAdmin={isAdmin}
          members={members}
          isSubmitting={enteringMember}
          errorMsg={memberGateError}
          theme={theme}
          onToggleTheme={toggleTheme}
          onEnterWithName={handleEnterWithName}
          onChangeGroup={handleLeaveGroup}
        />
      ) : (
        /* Step 4: Main Wishlist Workspace */
        <>
          <TopBar
            activeTab={activeTab}
            onSelectTab={(t) => {
              setActiveTab(t);
              if (t !== 'upload') {
                setComposerOpen(false);
                setEditingWish(null);
              }
            }}
            currentMember={currentMember.member}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenGroup={() => setShowGroupModal(true)}
            onLogout={() => {
              setCurrentMemberId('');
              setFallbackMember(null);
              setComposerOpen(false);
              setEditingWish(null);
              setMemberGateError(null);
            }}
          />

          <main className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-28 md:pb-24">
            {activeTab === 'upload' && (
              <section className="space-y-4">
                <HolidayWorkspaceHero
                  title={`Mis deseos (${myWishes.length})`}
                  subtitle="Toca la estrella para elegir tu regalo favorito principal o abre un deseo para editarlo."
                  metaText={activeGroup?.name || activeGroupCode}
                  object="gift"
                />

                {myWishes.length === 0 ? (
                  <div className="rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] p-5 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <img
                      src={HOLIDAY_ASSETS.gift3d}
                      alt="Regalo navideño 3D con lazo crema y esfera cobriza"
                      referrerPolicy="no-referrer"
                      className="w-36 h-36 sm:w-40 sm:h-40 object-cover rounded-2xl border border-[#D8E2DE] dark:border-[#34534D] shrink-0"
                    />
                    <div className="space-y-2.5 text-center sm:text-left">
                      <h2 className="font-display text-lg font-bold text-[#1A2E2B] dark:text-[#FBF3E4]">
                        Tu lista está vacía
                      </h2>
                      <p className="text-xs sm:text-sm text-[#556D68] dark:text-[#BDD0CB] leading-relaxed">
                        Toca el botón + para agregar tu primer regalo.
                      </p>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingWish(null);
                            setComposerOpen(true);
                          }}
                          className="min-h-[46px] px-5 py-2.5 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm font-semibold shadow-sm shadow-[#D96857]/25 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Agregar deseo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] divide-y divide-[#D8E2DE] dark:divide-[#34534D] overflow-hidden">
                      {myWishes.map((wish) => {
                        const canManage =
                          wish.ownerUid === firebaseUser.uid ||
                          Boolean(activeAccount && wish.accountId === activeAccount.accountId) ||
                          isAdmin;
                        return (
                          <WishCard
                            key={wish.id}
                            wish={wish}
                            isOwn
                            canManage={canManage}
                            variant="list-item"
                            favoriteBusy={favoriteBusyId === wish.id}
                            onToggleFavorite={(w) => {
                              void handleToggleFavorite(w);
                            }}
                            onEdit={(w) => {
                              setEditingWish(w);
                              setComposerOpen(true);
                            }}
                            onDelete={handleRequestDeleteWish}
                          />
                        );
                      })}
                    </div>

                    <p className="px-2 flex items-start gap-2 text-xs text-[#556D68] dark:text-[#BDD0CB] leading-relaxed">
                      <EyeOff className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#2F4E49] dark:text-[#F2D5A0]" />
                      <span>
                        Tu sorpresa está protegida: si alguien del grupo reserva alguno de tus deseos en secreto para evitar repetidos, esa marca nunca se mostrará aquí.
                      </span>
                    </p>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'list' && (
              <WishFeed
                wishes={wishes}
                members={members}
                currentMemberId={currentMember.id}
                currentUid={firebaseUser.uid}
                isAdmin={isAdmin}
                hideFloatingControls={
                  composerOpen ||
                  showGroupModal ||
                  showSizesPrompt ||
                  Boolean(pendingConfirm)
                }
                onToggleReserve={handleRequestToggleReserve}
                onGoToUpload={() => {
                  setActiveTab('upload');
                  setEditingWish(null);
                  setComposerOpen(true);
                }}
              />
            )}

            {activeTab === 'profile' && (
              <SizesDirectory
                currentMember={currentMember}
                members={members}
                hideFloatingControls={
                  composerOpen ||
                  showGroupModal ||
                  showSizesPrompt ||
                  Boolean(pendingConfirm)
                }
                onRequestSaveProfile={handleRequestSaveProfile}
              />
            )}
          </main>

          {/* Bottom-right Floating Action Button to add a new wish */}
          {activeTab === 'upload' &&
            !composerOpen &&
            !showGroupModal &&
            !showSizesPrompt && (
              <button
                type="button"
                onClick={() => {
                  setEditingWish(null);
                  setComposerOpen(true);
                }}
                aria-label="Agregar nuevo deseo"
                title="Nuevo deseo"
                className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 md:bottom-8 md:right-8 z-30 h-14 w-14 sm:w-auto sm:px-5 rounded-full bg-[#D96857] dark:bg-[#DE705E] text-[#FFFBF5] shadow-lg shadow-[#D96857]/35 dark:shadow-black/50 hover:bg-[#C45544] dark:hover:bg-[#EA7E6C] active:scale-[0.96] transition-all flex items-center justify-center gap-2 border border-transparent dark:border-[#F29C8E]/35"
              >
                <Plus className="h-6 w-6 shrink-0" />
                <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">
                  Nuevo deseo
                </span>
              </button>
            )}
        </>
      )}

      {/* Wish Composer Modal */}
      <WishComposer
        open={composerOpen}
        editingWish={editingWish}
        currentFavoriteWish={myFavoriteWish}
        isSubmitting={isBusy}
        onClose={() => {
          if (!isBusy) {
            setComposerOpen(false);
            setEditingWish(null);
          }
        }}
        onSubmitWish={handleSubmitWish}
      />

      {/* First-time Sizes Modal */}
      <SizesPromptModal
        open={showSizesPrompt}
        memberProfile={currentMember}
        onSave={(profile) => {
          void executeSaveSizes(profile);
        }}
        onSkip={() => setShowSizesPrompt(false)}
      />

      {/* Family Group, QR & Settings Modal */}
      <FamilyGroupModal
        open={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        group={activeGroup}
        familyCode={activeGroupCode}
        isGroupCreator={isGroupCreator}
        isAdmin={isAdmin}
        members={members}
        onUpdateGroupSettings={handleRequestUpdateGroupSettings}
        onSwitchGroup={handleLeaveGroup}
        onRequestPreRegisterMember={handleRequestPreRegisterMember}
      />

      {/* Explicit User Confirmation Dialog for Mutations / Deletions */}
      <ConfirmDialog
        open={Boolean(pendingConfirm)}
        title={pendingConfirm?.title || ''}
        description={pendingConfirm?.description || ''}
        confirmLabel={pendingConfirm?.confirmLabel}
        destructive={pendingConfirm?.destructive}
        busy={confirmBusy}
        onConfirm={() => {
          void runConfirmedAction();
        }}
        onCancel={() => {
          if (!confirmBusy) setPendingConfirm(null);
        }}
      />
    </div>
  );
}
