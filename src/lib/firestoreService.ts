import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  buildMemberDocId,
  deriveAccountIdFromPhone,
  generateGroupCode,
  namesMatchAccount,
  normalizeFamilyCode,
  normalizeHttpUrl,
  normalizeMemberName,
  sanitizeGroupCodeInput,
  sanitizeText,
} from './validation';
import {
  FamilyGroup,
  MemberProfile,
  UserAccount,
  WishItem,
} from '../types/wishlist';

export const ADMIN_EMAIL = 'yiroku20@gmail.com';

function formatTimestamp(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString().slice(0, 10);
  }
  return '';
}

function mapGroupDoc(id: string, data: Record<string, unknown>): FamilyGroup {
  return {
    code: String(data.code || id),
    name: sanitizeText(data.name, 60) || String(data.code || id),
    expectedMembers: Number(data.expectedMembers) || 6,
    creatorUid: String(data.creatorUid || ''),
    creatorName: sanitizeText(data.creatorName, 60),
    creatorAccountId: sanitizeText(data.creatorAccountId, 128) || undefined,
    createdAt: formatTimestamp(data.createdAt),
  };
}

function sanitizeStringArray(raw: unknown, maxItems: number, maxLen = 128): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const clean = sanitizeText(item, maxLen);
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
      if (out.length >= maxItems) break;
    }
  }
  return out;
}

function mergeBoundedStrings(
  existingList: string[],
  additions: string[],
  maxItems: number
): string[] {
  const merged = [...existingList];
  for (const raw of additions) {
    const item = sanitizeText(raw, 128);
    if (!item) continue;
    const idx = merged.indexOf(item);
    if (idx !== -1) merged.splice(idx, 1);
    merged.push(item);
  }
  return merged.slice(-maxItems);
}

function mapAccountDoc(id: string, data: Record<string, unknown>): UserAccount {
  return {
    accountId: String(data.accountId || id),
    displayName: normalizeMemberName(data.displayName),
    authorizedUids: sanitizeStringArray(data.authorizedUids, 10, 128),
    createdGroupCodes: sanitizeStringArray(data.createdGroupCodes, 30, 40),
    joinedGroupCodes: sanitizeStringArray(data.joinedGroupCodes, 30, 40),
    createdAt: formatTimestamp(data.createdAt),
  };
}

export async function fetchAccountById(accountId: string): Promise<UserAccount | null> {
  const cleanId = sanitizeText(accountId, 128);
  if (!cleanId) return null;
  const path = `accounts/${cleanId}`;
  try {
    const snap = await getDoc(doc(db, 'accounts', cleanId));
    if (!snap.exists()) return null;
    return mapAccountDoc(snap.id, snap.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export function subscribeAccount(
  accountId: string,
  onData: (account: UserAccount | null) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const cleanId = sanitizeText(accountId, 128);
  const path = `accounts/${cleanId}`;
  return onSnapshot(
    doc(db, 'accounts', cleanId),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(mapAccountDoc(snap.id, snap.data()));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function recordGroupOnAccount(
  accountId: string,
  groupCode: string,
  kind: 'created' | 'joined'
): Promise<void> {
  const cleanAccountId = sanitizeText(accountId, 128);
  const cleanCode = sanitizeGroupCodeInput(groupCode);
  if (!cleanAccountId || cleanCode.length < 3) return;

  const ref = doc(db, 'accounts', cleanAccountId);
  const path = `accounts/${cleanAccountId}`;
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current = mapAccountDoc(snap.id, snap.data());
    if (kind === 'created') {
      if (current.createdGroupCodes.includes(cleanCode)) return;
      await updateDoc(ref, {
        createdGroupCodes: mergeBoundedStrings(current.createdGroupCodes, [cleanCode], 30),
        updatedAt: serverTimestamp(),
      });
    } else {
      if (current.joinedGroupCodes.includes(cleanCode)) return;
      await updateDoc(ref, {
        joinedGroupCodes: mergeBoundedStrings(current.joinedGroupCodes, [cleanCode], 30),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function backfillLegacyDeviceDataToAccount(
  accountId: string,
  uid: string
): Promise<{ createdCodes: string[]; joinedCodes: string[] }> {
  const createdCodes: string[] = [];
  const joinedCodes: string[] = [];
  const groupsToPatch: string[] = [];
  const membersToPatch: string[] = [];
  const wishIdsToPatch: string[] = [];

  try {
    const createdSnap = await getDocs(
      query(collection(db, 'groups'), where('creatorUid', '==', uid))
    );
    for (const d of createdSnap.docs) {
      const existingAccId = sanitizeText(d.data().creatorAccountId, 128);
      if (existingAccId && existingAccId !== accountId) continue;
      const code = sanitizeGroupCodeInput(d.data().code || d.id);
      if (code.length >= 3) createdCodes.push(code);
      if (!existingAccId) {
        groupsToPatch.push(d.id);
      }
    }

    const membersSnap = await getDocs(
      query(collection(db, 'members'), where('ownerUid', '==', uid))
    );
    const memberFamilyCodes = new Set<string>();
    for (const d of membersSnap.docs) {
      if (isExampleMemberId(d.id)) continue;
      const existingAccId = sanitizeText(d.data().accountId, 128);
      if (existingAccId && existingAccId !== accountId) continue;
      const code = sanitizeGroupCodeInput(d.data().familyCode);
      if (code.length >= 3) {
        joinedCodes.push(code);
        memberFamilyCodes.add(code);
      }
      if (!existingAccId) {
        membersToPatch.push(d.id);
      }
    }

    for (const code of memberFamilyCodes) {
      const wishesSnap = await getDocs(
        query(collection(db, 'wishes'), where('familyCode', '==', code))
      );
      for (const wd of wishesSnap.docs) {
        const wData = wd.data();
        if (String(wData.ownerUid || '') === uid && !wData.accountId) {
          wishIdsToPatch.push(wd.id);
        }
      }
    }

    // Patch legacy docs in bounded batches (<= 400 writes per batch)
    const ops: Array<{ col: 'groups' | 'members' | 'wishes'; id: string; field: string }> = [
      ...groupsToPatch.map((id) => ({
        col: 'groups' as const,
        id,
        field: 'creatorAccountId',
      })),
      ...membersToPatch.map((id) => ({
        col: 'members' as const,
        id,
        field: 'accountId',
      })),
      ...wishIdsToPatch.map((id) => ({
        col: 'wishes' as const,
        id,
        field: 'accountId',
      })),
    ];

    for (let i = 0; i < ops.length; i += 350) {
      const chunk = ops.slice(i, i + 350);
      const batch = writeBatch(db);
      for (const op of chunk) {
        batch.update(doc(db, op.col, op.id), {
          [op.field]: accountId,
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }

    if (createdCodes.length > 0 || joinedCodes.length > 0) {
      const accountRef = doc(db, 'accounts', accountId);
      const accSnap = await getDoc(accountRef);
      if (accSnap.exists()) {
        const current = mapAccountDoc(accSnap.id, accSnap.data());
        const nextCreated = mergeBoundedStrings(current.createdGroupCodes, createdCodes, 30);
        const nextJoined = mergeBoundedStrings(current.joinedGroupCodes, joinedCodes, 30);
        await updateDoc(accountRef, {
          createdGroupCodes: nextCreated,
          joinedGroupCodes: nextJoined,
          updatedAt: serverTimestamp(),
        });
        return { createdCodes: nextCreated, joinedCodes: nextJoined };
      }
    }
  } catch {
    // Non-fatal best-effort backfill
  }

  return { createdCodes, joinedCodes };
}

export async function registerOrRecoverAccount(
  rawName: string,
  rawPhone: string,
  mode: 'register-or-recover' | 'recover-only' = 'register-or-recover'
): Promise<{ account: UserAccount; isNew: boolean }> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sesión no iniciada. Intenta nuevamente.');

  const displayName = normalizeMemberName(rawName);
  if (!displayName || displayName.length < 2) {
    throw new Error('Ingresa tu nombre (mínimo 2 caracteres).');
  }

  const accountId = await deriveAccountIdFromPhone(rawPhone);
  const path = `accounts/${accountId}`;
  const ref = doc(db, 'accounts', accountId);

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }

  if (existingSnap.exists()) {
    const existingAccount = mapAccountDoc(existingSnap.id, existingSnap.data());
    if (!namesMatchAccount(displayName, existingAccount.displayName)) {
      throw new Error(
        'Este celular ya está registrado con otro nombre. Verifica tu nombre o número de celular.'
      );
    }

    let authorizedUids = existingAccount.authorizedUids;
    if (!authorizedUids.includes(user.uid)) {
      authorizedUids = mergeBoundedStrings(authorizedUids, [user.uid], 10);
      try {
        await updateDoc(ref, {
          authorizedUids,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }

    const synced = await backfillLegacyDeviceDataToAccount(accountId, user.uid);
    return {
      account: {
        ...existingAccount,
        authorizedUids,
        createdGroupCodes:
          synced.createdCodes.length > 0
            ? synced.createdCodes
            : existingAccount.createdGroupCodes,
        joinedGroupCodes:
          synced.joinedCodes.length > 0
            ? synced.joinedCodes
            : existingAccount.joinedGroupCodes,
      },
      isNew: false,
    };
  }

  if (mode === 'recover-only') {
    throw new Error(
      'No encontramos grupos registrados con ese celular. Verifica tu número o entra con el código de tu grupo.'
    );
  }

  try {
    await setDoc(ref, {
      accountId,
      displayName,
      authorizedUids: [user.uid],
      createdGroupCodes: [],
      joinedGroupCodes: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }

  const synced = await backfillLegacyDeviceDataToAccount(accountId, user.uid);
  return {
    account: {
      accountId,
      displayName,
      authorizedUids: [user.uid],
      createdGroupCodes: synced.createdCodes,
      joinedGroupCodes: synced.joinedCodes,
      createdAt: new Date().toISOString().slice(0, 10),
    },
    isNew: true,
  };
}

export async function fetchGroupByCode(rawCode: string): Promise<FamilyGroup | null> {
  const cleanCode = sanitizeGroupCodeInput(rawCode);
  if (cleanCode.length < 3) return null;

  const path = `groups/${cleanCode}`;
  try {
    const snap = await getDoc(doc(db, 'groups', cleanCode));
    if (!snap.exists()) return null;
    return mapGroupDoc(snap.id, snap.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export function subscribeGroup(
  familyCode: string,
  onData: (group: FamilyGroup | null) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const cleanCode = normalizeFamilyCode(familyCode);
  const path = `groups/${cleanCode}`;
  return onSnapshot(
    doc(db, 'groups', cleanCode),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(mapGroupDoc(snap.id, snap.data()));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeMyCreatedGroups(
  uid: string,
  onData: (groups: FamilyGroup[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = 'groups';
  const q = query(collection(db, path), where('creatorUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapGroupDoc(d.id, d.data()));
      list.sort((a, b) => a.name.localeCompare(b.name));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeMyJoinedGroupCodes(
  uid: string,
  onData: (codes: string[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = 'members';
  const q = query(collection(db, path), where('ownerUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const unique = Array.from(
        new Set(
          snap.docs
            .map((d) => sanitizeGroupCodeInput(d.data().familyCode))
            .filter((c) => c.length >= 3)
        )
      );
      onData(unique);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function createFamilyGroup(
  rawName: string,
  expectedMembersRaw: number,
  account?: { accountId: string; displayName: string } | null
): Promise<FamilyGroup> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sesión no iniciada. Intenta nuevamente.');

  const name = sanitizeText(rawName, 60);
  if (name.length < 2) {
    throw new Error('Ingresa un nombre de grupo válido (mínimo 2 caracteres).');
  }

  const expectedMembers = Math.floor(Number(expectedMembersRaw));
  if (!Number.isFinite(expectedMembers) || expectedMembers < 2 || expectedMembers > 100) {
    throw new Error('La cantidad de participantes debe estar entre 2 y 100.');
  }

  let chosenCode = generateGroupCode(name);
  for (let attempt = 0; attempt < 4; attempt++) {
    const candidate = attempt === 0 ? chosenCode : generateGroupCode(name);
    const existing = await fetchGroupByCode(candidate);
    if (!existing) {
      chosenCode = candidate;
      break;
    }
  }

  const creatorName = sanitizeText(
    account?.displayName || user.displayName || 'Organizador',
    60
  );
  const groupPath = `groups/${chosenCode}`;
  const payload: Record<string, unknown> = {
    code: chosenCode,
    name,
    expectedMembers,
    creatorUid: user.uid,
    creatorName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (account?.accountId) {
    payload.creatorAccountId = account.accountId;
  }

  try {
    await setDoc(doc(db, 'groups', chosenCode), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, groupPath);
  }

  if (account?.accountId) {
    try {
      await recordGroupOnAccount(account.accountId, chosenCode, 'created');
    } catch {
      // non-fatal
    }
  }

  return {
    code: chosenCode,
    name,
    expectedMembers,
    creatorUid: user.uid,
    creatorName,
    creatorAccountId: account?.accountId,
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

export async function updateFamilyGroup(
  code: string,
  rawName: string,
  expectedMembersRaw: number
): Promise<void> {
  const cleanCode = sanitizeGroupCodeInput(code);
  const name = sanitizeText(rawName, 60);
  if (name.length < 2) {
    throw new Error('El nombre del grupo debe tener al menos 2 caracteres.');
  }
  const expectedMembers = Math.floor(Number(expectedMembersRaw));
  if (!Number.isFinite(expectedMembers) || expectedMembers < 2 || expectedMembers > 100) {
    throw new Error('La cantidad de participantes debe estar entre 2 y 100.');
  }

  const groupPath = `groups/${cleanCode}`;
  try {
    await updateDoc(doc(db, 'groups', cleanCode), {
      name,
      expectedMembers,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, groupPath);
  }
}

export function subscribeMembers(
  familyCode: string,
  onData: (members: MemberProfile[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const cleanCode = normalizeFamilyCode(familyCode);
  const path = 'members';
  const q = query(collection(db, path), where('familyCode', '==', cleanCode));

  return onSnapshot(
    q,
    (snap) => {
      const list: MemberProfile[] = snap.docs
        .filter((d) => !isExampleMemberId(d.id))
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            member: normalizeMemberName(data.name),
            ownerUid: String(data.ownerUid || ''),
            accountId: sanitizeText(data.accountId, 128) || undefined,
            familyCode: String(data.familyCode || cleanCode),
            casaca: sanitizeText(data.casaca, 40),
            polo: sanitizeText(data.polo, 40),
            chompa: sanitizeText(data.chompa, 40),
            pantalon: sanitizeText(data.pantalon, 40),
            zapatillas: sanitizeText(data.zapatillas, 40),
            notas: sanitizeText(data.notas, 200),
          };
        });
      list.sort((a, b) => a.member.localeCompare(b.member));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeWishes(
  familyCode: string,
  onData: (wishes: WishItem[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const cleanCode = normalizeFamilyCode(familyCode);
  const path = 'wishes';
  const q = query(collection(db, path), where('familyCode', '==', cleanCode));

  return onSnapshot(
    q,
    (snap) => {
      const items: Array<WishItem & { sortMs: number }> = snap.docs
        .filter((d) => !isExampleMemberId(String(d.data().memberId || '')))
        .map((d) => {
          const data = d.data();
          const ts = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
          return {
            id: d.id,
            memberId: String(data.memberId || ''),
            member: normalizeMemberName(data.memberName),
            ownerUid: String(data.ownerUid || ''),
            accountId: sanitizeText(data.accountId, 128) || undefined,
            familyCode: String(data.familyCode || cleanCode),
            wish: sanitizeText(data.title, 140),
            description: sanitizeText(data.description, 600),
            productUrl: normalizeHttpUrl(data.productUrl),
            linkTitle: sanitizeText(data.linkTitle, 160),
            linkImage: normalizeHttpUrl(data.linkImage),
            linkSite: sanitizeText(data.linkSite, 60),
            linkDesc: sanitizeText(data.linkDesc, 240),
            linkPrice: sanitizeText(data.linkPrice, 40),
            photoId: sanitizeText(data.photoId, 128),
            reservedAnonymously: Boolean(data.reservedAnonymously),
            isFavorite: Boolean(data.isFavorite),
            createdAt: formatTimestamp(data.createdAt),
            sortMs: ts,
          };
        });
      items.sort((a, b) => b.sortMs - a.sortMs);
      onData(items.map(({ sortMs: _s, ...rest }) => rest));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function enterOrClaimMember(
  rawName: string,
  familyCode: string,
  accountId?: string
): Promise<MemberProfile> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sesión no iniciada. Intenta nuevamente.');

  const name = normalizeMemberName(rawName);
  if (!name || name.length < 2) {
    throw new Error('Ingresa un nombre válido (mínimo 2 caracteres).');
  }

  const cleanAccountId = sanitizeText(accountId, 128) || undefined;
  const cleanCode = normalizeFamilyCode(familyCode);
  const memberId = buildMemberDocId(cleanCode, name);
  const docPath = `members/${memberId}`;
  const ref = doc(db, 'members', memberId);

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
  }

  const isAdminUser = Boolean(
    user.email && user.emailVerified && user.email.toLowerCase() === ADMIN_EMAIL
  );

  if (existingSnap.exists()) {
    const data = existingSnap.data();
    const ownerUid = String(data.ownerUid || '');
    const storedAccountId = sanitizeText(data.accountId, 128) || undefined;

    if (ownerUid === 'UNCLAIMED') {
      const claimPayload: Record<string, unknown> = {
        ownerUid: user.uid,
        updatedAt: serverTimestamp(),
      };
      if (cleanAccountId) {
        claimPayload.accountId = cleanAccountId;
      }
      try {
        await updateDoc(ref, claimPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, docPath);
      }
      if (cleanAccountId) {
        try {
          await recordGroupOnAccount(cleanAccountId, cleanCode, 'joined');
        } catch {
          // non-fatal
        }
      }
      return {
        id: memberId,
        member: normalizeMemberName(data.name),
        ownerUid: user.uid,
        accountId: cleanAccountId,
        familyCode: cleanCode,
        casaca: sanitizeText(data.casaca, 40),
        polo: sanitizeText(data.polo, 40),
        chompa: sanitizeText(data.chompa, 40),
        pantalon: sanitizeText(data.pantalon, 40),
        zapatillas: sanitizeText(data.zapatillas, 40),
        notas: sanitizeText(data.notas, 200),
      };
    }

    const ownsViaUid = ownerUid === user.uid;
    const ownsViaAccount = Boolean(
      cleanAccountId && storedAccountId && storedAccountId === cleanAccountId
    );

    if (!ownsViaUid && !ownsViaAccount && !isAdminUser) {
      throw new Error(
        `El nombre "${name}" ya está registrado por otra persona en este grupo. Si eres tú desde otro equipo, entra con el mismo celular que registraste o usa tu nombre completo.`
      );
    }

    // Backfill accountId if this member belonged to current UID before account linking
    if (ownsViaUid && cleanAccountId && !storedAccountId) {
      try {
        await updateDoc(ref, {
          accountId: cleanAccountId,
          updatedAt: serverTimestamp(),
        });
      } catch {
        // non-fatal
      }
    }

    if (cleanAccountId) {
      try {
        await recordGroupOnAccount(cleanAccountId, cleanCode, 'joined');
      } catch {
        // non-fatal
      }
    }

    return {
      id: memberId,
      member: normalizeMemberName(data.name),
      ownerUid,
      accountId: storedAccountId || cleanAccountId,
      familyCode: cleanCode,
      casaca: sanitizeText(data.casaca, 40),
      polo: sanitizeText(data.polo, 40),
      chompa: sanitizeText(data.chompa, 40),
      pantalon: sanitizeText(data.pantalon, 40),
      zapatillas: sanitizeText(data.zapatillas, 40),
      notas: sanitizeText(data.notas, 200),
    };
  }

  // Create new member profile
  const createPayload: Record<string, unknown> = {
    name,
    ownerUid: user.uid,
    familyCode: cleanCode,
    casaca: '',
    polo: '',
    chompa: '',
    pantalon: '',
    zapatillas: '',
    notas: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (cleanAccountId) {
    createPayload.accountId = cleanAccountId;
  }

  try {
    await setDoc(ref, createPayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, docPath);
  }

  if (cleanAccountId) {
    try {
      await recordGroupOnAccount(cleanAccountId, cleanCode, 'joined');
    } catch {
      // non-fatal
    }
  }

  return {
    id: memberId,
    member: name,
    ownerUid: user.uid,
    accountId: cleanAccountId,
    familyCode: cleanCode,
    casaca: '',
    polo: '',
    chompa: '',
    pantalon: '',
    zapatillas: '',
    notas: '',
  };
}

export async function adminPreRegisterMember(
  rawName: string,
  familyCode: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sesión no iniciada.');

  const name = normalizeMemberName(rawName);
  if (!name || name.length < 2) {
    throw new Error('Ingresa un nombre válido (mínimo 2 caracteres).');
  }

  const cleanCode = normalizeFamilyCode(familyCode);
  const memberId = buildMemberDocId(cleanCode, name);
  const docPath = `members/${memberId}`;
  const ref = doc(db, 'members', memberId);

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
  }

  if (existingSnap.exists()) {
    throw new Error(`"${name}" ya existe en este grupo familiar.`);
  }

  try {
    await setDoc(ref, {
      name,
      ownerUid: 'UNCLAIMED',
      familyCode: cleanCode,
      casaca: '',
      polo: '',
      chompa: '',
      pantalon: '',
      zapatillas: '',
      notas: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, docPath);
  }
}

export async function saveMemberSizes(profile: MemberProfile): Promise<void> {
  const docPath = `members/${profile.id}`;
  const ref = doc(db, 'members', profile.id);

  try {
    await updateDoc(ref, {
      casaca: sanitizeText(profile.casaca, 40),
      polo: sanitizeText(profile.polo, 40),
      chompa: sanitizeText(profile.chompa, 40),
      pantalon: sanitizeText(profile.pantalon, 40),
      zapatillas: sanitizeText(profile.zapatillas, 40),
      notas: sanitizeText(profile.notas || '', 200),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }
}

async function findMemberFavoriteWishIds(
  familyCode: string,
  memberId: string,
  currentUid: string,
  isAdminUser: boolean,
  accountId?: string,
  excludeWishId?: string
): Promise<string[]> {
  const cleanCode = normalizeFamilyCode(familyCode);
  const q = query(collection(db, 'wishes'), where('familyCode', '==', cleanCode));
  try {
    const snap = await getDocs(q);
    return snap.docs
      .filter((d) => {
        if (excludeWishId && d.id === excludeWishId) return false;
        const data = d.data();
        const sameMember = String(data.memberId || '') === memberId;
        const canEdit =
          String(data.ownerUid || '') === currentUid ||
          Boolean(accountId && String(data.accountId || '') === accountId) ||
          isAdminUser;
        return sameMember && canEdit && Boolean(data.isFavorite);
      })
      .map((d) => d.id);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'wishes');
  }
}

export async function createWish(params: {
  memberId: string;
  memberName: string;
  familyCode: string;
  accountId?: string;
  title: string;
  description: string;
  productUrl: string;
  linkTitle: string;
  linkImage: string;
  linkSite: string;
  linkDesc?: string;
  linkPrice?: string;
  photoDataUrl?: string;
  isFavorite?: boolean;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sesión no iniciada.');

  const isAdminUser = Boolean(
    user.email && user.emailVerified && user.email.toLowerCase() === ADMIN_EMAIL
  );
  const cleanAccountId = sanitizeText(params.accountId, 128) || undefined;
  const cleanCode = normalizeFamilyCode(params.familyCode);
  const wishId = `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const makeFavorite = Boolean(params.isFavorite);
  let photoId = '';

  if (params.photoDataUrl) {
    if (params.photoDataUrl.length > 350_000) {
      throw new Error('La fotografía supera el límite permitido.');
    }
    photoId = `p_${wishId}`;
    const photoPath = `wishPhotos/${photoId}`;
    const photoPayload: Record<string, unknown> = {
      wishId,
      ownerUid: user.uid,
      familyCode: cleanCode,
      dataUrl: params.photoDataUrl,
      createdAt: serverTimestamp(),
    };
    if (cleanAccountId) {
      photoPayload.accountId = cleanAccountId;
    }
    try {
      await setDoc(doc(db, 'wishPhotos', photoId), photoPayload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, photoPath);
    }
  }

  const previousFavoriteIds = makeFavorite
    ? await findMemberFavoriteWishIds(
        cleanCode,
        params.memberId,
        user.uid,
        isAdminUser,
        cleanAccountId
      )
    : [];

  const wishPath = `wishes/${wishId}`;
  const wishPayload: Record<string, unknown> = {
    memberId: params.memberId,
    memberName: normalizeMemberName(params.memberName),
    ownerUid: user.uid,
    familyCode: cleanCode,
    title: sanitizeText(params.title, 140),
    description: sanitizeText(params.description, 600),
    productUrl: normalizeHttpUrl(params.productUrl),
    linkTitle: sanitizeText(params.linkTitle, 160),
    linkImage: normalizeHttpUrl(params.linkImage),
    linkSite: sanitizeText(params.linkSite, 60),
    linkDesc: sanitizeText(params.linkDesc || '', 240),
    linkPrice: sanitizeText(params.linkPrice || '', 40),
    photoId,
    reservedAnonymously: false,
    isFavorite: makeFavorite,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (cleanAccountId) {
    wishPayload.accountId = cleanAccountId;
  }

  try {
    const batch = writeBatch(db);
    for (const prevId of previousFavoriteIds) {
      batch.update(doc(db, 'wishes', prevId), {
        isFavorite: false,
        updatedAt: serverTimestamp(),
      });
    }
    batch.set(doc(db, 'wishes', wishId), wishPayload);
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, wishPath);
  }
}

export async function updateWishDetails(params: {
  wish: WishItem;
  accountId?: string;
  title: string;
  description: string;
  productUrl: string;
  linkTitle: string;
  linkImage: string;
  linkSite: string;
  linkDesc?: string;
  linkPrice?: string;
  keepExistingPhoto: boolean;
  newPhotoDataUrl?: string;
  isFavorite?: boolean;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sesión no iniciada.');

  const isAdminUser = Boolean(
    user.email && user.emailVerified && user.email.toLowerCase() === ADMIN_EMAIL
  );
  const cleanAccountId =
    sanitizeText(params.accountId || params.wish.accountId, 128) || undefined;
  const nextFavorite = Boolean(params.isFavorite);
  let nextPhotoId = params.keepExistingPhoto ? params.wish.photoId || '' : '';

  if (params.newPhotoDataUrl) {
    if (params.newPhotoDataUrl.length > 350_000) {
      throw new Error('La fotografía supera el límite permitido.');
    }
    const newId = `p_${params.wish.id}_${Date.now().toString(36)}`;
    const photoPath = `wishPhotos/${newId}`;
    const photoPayload: Record<string, unknown> = {
      wishId: params.wish.id,
      ownerUid: user.uid,
      familyCode: params.wish.familyCode,
      dataUrl: params.newPhotoDataUrl,
      createdAt: serverTimestamp(),
    };
    if (cleanAccountId) {
      photoPayload.accountId = cleanAccountId;
    }
    try {
      await setDoc(doc(db, 'wishPhotos', newId), photoPayload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, photoPath);
    }
    if (params.wish.photoId) {
      try {
        await deleteDoc(doc(db, 'wishPhotos', params.wish.photoId));
      } catch {
        // ignore cleanup failure
      }
    }
    nextPhotoId = newId;
  } else if (!params.keepExistingPhoto && params.wish.photoId) {
    try {
      await deleteDoc(doc(db, 'wishPhotos', params.wish.photoId));
    } catch {
      // ignore cleanup failure
    }
  }

  const previousFavoriteIds =
    nextFavorite && !params.wish.isFavorite
      ? await findMemberFavoriteWishIds(
          params.wish.familyCode,
          params.wish.memberId,
          user.uid,
          isAdminUser,
          cleanAccountId,
          params.wish.id
        )
      : [];

  const wishPath = `wishes/${params.wish.id}`;
  try {
    const batch = writeBatch(db);
    for (const prevId of previousFavoriteIds) {
      batch.update(doc(db, 'wishes', prevId), {
        isFavorite: false,
        updatedAt: serverTimestamp(),
      });
    }
    batch.update(doc(db, 'wishes', params.wish.id), {
      title: sanitizeText(params.title, 140),
      description: sanitizeText(params.description, 600),
      productUrl: normalizeHttpUrl(params.productUrl),
      linkTitle: sanitizeText(params.linkTitle, 160),
      linkImage: normalizeHttpUrl(params.linkImage),
      linkSite: sanitizeText(params.linkSite, 60),
      linkDesc: sanitizeText(params.linkDesc || '', 240),
      linkPrice: sanitizeText(params.linkPrice || '', 40),
      photoId: nextPhotoId,
      isFavorite: nextFavorite,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, wishPath);
  }
}

export async function setPrimaryFavoriteWish(
  wish: WishItem,
  makeFavorite: boolean,
  accountId?: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sesión no iniciada.');

  const isAdminUser = Boolean(
    user.email && user.emailVerified && user.email.toLowerCase() === ADMIN_EMAIL
  );
  const cleanAccountId =
    sanitizeText(accountId || wish.accountId, 128) || undefined;
  const previousFavoriteIds = makeFavorite
    ? await findMemberFavoriteWishIds(
        wish.familyCode,
        wish.memberId,
        user.uid,
        isAdminUser,
        cleanAccountId,
        wish.id
      )
    : [];

  const wishPath = `wishes/${wish.id}`;
  try {
    const batch = writeBatch(db);
    for (const prevId of previousFavoriteIds) {
      batch.update(doc(db, 'wishes', prevId), {
        isFavorite: false,
        updatedAt: serverTimestamp(),
      });
    }
    batch.update(doc(db, 'wishes', wish.id), {
      isFavorite: makeFavorite,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, wishPath);
  }
}

export async function toggleWishReservation(wish: WishItem): Promise<void> {
  const wishPath = `wishes/${wish.id}`;
  try {
    await updateDoc(doc(db, 'wishes', wish.id), {
      reservedAnonymously: !wish.reservedAnonymously,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, wishPath);
  }
}

export async function deleteWish(wish: WishItem): Promise<void> {
  const wishPath = `wishes/${wish.id}`;
  try {
    await deleteDoc(doc(db, 'wishes', wish.id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, wishPath);
  }

  if (wish.photoId) {
    try {
      await deleteDoc(doc(db, 'wishPhotos', wish.photoId));
    } catch {
      // non-fatal cleanup
    }
  }
}

export async function fetchWishPhoto(photoId: string): Promise<string> {
  if (!photoId) return '';
  const path = `wishPhotos/${photoId}`;
  try {
    const snap = await getDoc(doc(db, 'wishPhotos', photoId));
    if (!snap.exists()) return '';
    return String(snap.data().dataUrl || '');
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export function isExampleMemberId(memberId: string): boolean {
  return memberId.includes('_EJEMPLO_');
}

/**
 * Best-effort cleanup of any legacy example participants/wishes created in earlier versions
 * when owned by the current session.
 */
export async function purgeLegacyExampleParticipants(familyCode: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const cleanCode = normalizeFamilyCode(familyCode);

  try {
    const [membersSnap, wishesSnap] = await Promise.all([
      getDocs(query(collection(db, 'members'), where('familyCode', '==', cleanCode))),
      getDocs(query(collection(db, 'wishes'), where('familyCode', '==', cleanCode))),
    ]);

    const deletableWishes = wishesSnap.docs.filter((d) => {
      const data = d.data();
      return (
        isExampleMemberId(String(data.memberId || '')) &&
        String(data.ownerUid || '') === user.uid
      );
    });
    const deletableMembers = membersSnap.docs.filter(
      (d) => isExampleMemberId(d.id) && String(d.data().ownerUid || '') === user.uid
    );

    if (deletableWishes.length === 0 && deletableMembers.length === 0) return;

    const batch = writeBatch(db);
    for (const w of deletableWishes) {
      batch.delete(doc(db, 'wishes', w.id));
    }
    for (const m of deletableMembers) {
      batch.delete(doc(db, 'members', m.id));
    }
    await batch.commit();
  } catch {
    // Non-fatal silent cleanup
  }
}
