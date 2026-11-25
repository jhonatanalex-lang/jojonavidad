import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, Save, UserPlus, X } from 'lucide-react';
import { FamilyGroup, MemberProfile } from '../types/wishlist';
import { QrCodeBox } from './QrCodeBox';
import {
  FestiveInputShell,
  HolidayMedallion,
  ScallopedSnowEdge,
} from './FestiveDecor';

interface FamilyGroupModalProps {
  open: boolean;
  onClose: () => void;
  group: FamilyGroup | null;
  familyCode: string;
  isGroupCreator: boolean;
  isAdmin: boolean;
  members: MemberProfile[];
  onUpdateGroupSettings: (name: string, expectedMembers: number) => void;
  onSwitchGroup: () => void;
  onRequestPreRegisterMember: (name: string) => void;
}

export const FamilyGroupModal: React.FC<FamilyGroupModalProps> = ({
  open,
  onClose,
  group,
  familyCode,
  isGroupCreator,
  isAdmin,
  members,
  onUpdateGroupSettings,
  onSwitchGroup,
  onRequestPreRegisterMember,
}) => {
  const [newMember, setNewMember] = useState('');
  const [nameDraft, setNameDraft] = useState(group?.name || '');
  const [countDraft, setCountDraft] = useState(group?.expectedMembers || 6);

  useEffect(() => {
    if (group) {
      setNameDraft(group.name);
      setCountDraft(group.expectedMembers);
    }
  }, [group]);

  if (!open) return null;

  const canManage = isGroupCreator || isAdmin;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMember.trim();
    if (!trimmed) return;
    onRequestPreRegisterMember(trimmed);
    setNewMember('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameDraft.trim()) return;
    onUpdateGroupSettings(nameDraft.trim(), countDraft);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F1E1C]/60 dark:bg-black/70 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] shadow-2xl overflow-hidden">
        <div className="relative bg-gradient-to-br from-[#2C4B46] via-[#345852] to-[#26423D] pt-2.5 sm:pt-4 px-5 sm:px-6 pb-6 shrink-0 text-[#FBF3E4]">
          <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <HolidayMedallion object="cottage" size="xs" />
              <div className="min-w-0">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#FFFBF4] truncate">
                  {group?.name || 'Grupo Navideño'}
                </h2>
                <p className="text-xs text-[#D7E4E0] tabular-nums">
                  {members.length}
                  {group ? ` de ${group.expectedMembers}` : ''} participantes
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#D7E4E0] hover:bg-white/10 active:scale-[0.97] transition-all"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute bottom-0 inset-x-0 pointer-events-none">
            <ScallopedSnowEdge className="text-white dark:text-[#223B37]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-5">
          {/* Code, Link & QR Code */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#1A2E2B] dark:text-[#FBF3E4]">
              Código y QR de invitación
            </h3>
            <QrCodeBox
              groupCode={familyCode}
              groupName={group?.name || familyCode}
            />
          </div>

          {/* Creator / Admin group settings */}
          {canManage && group && (
            <form
              onSubmit={handleSaveSettings}
              className="pt-4 border-t border-[#D8E2DE] dark:border-[#34534D] space-y-3"
            >
              <h3 className="text-sm font-bold text-[#1A2E2B] dark:text-[#FBF3E4]">
                Ajustes del grupo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="modal-group-name"
                    className="block text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB] mb-1.5"
                  >
                    Nombre del grupo
                  </label>
                  <FestiveInputShell ornament="tree">
                    <input
                      id="modal-group-name"
                      type="text"
                      maxLength={60}
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      className="w-full min-h-[46px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm text-[#1A2E2B] dark:text-[#FBF3E4] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                      required
                    />
                  </FestiveInputShell>
                </div>
                <div>
                  <label
                    htmlFor="modal-group-count"
                    className="block text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB] mb-1.5"
                  >
                    Participantes
                  </label>
                  <FestiveInputShell ornament="star">
                    <input
                      id="modal-group-count"
                      type="number"
                      min={2}
                      max={100}
                      value={countDraft}
                      onChange={(e) =>
                        setCountDraft(
                          Math.max(2, Math.min(100, Number(e.target.value) || 2))
                        )
                      }
                      className="w-full min-h-[46px] pl-10 pr-3.5 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-mono tabular-nums text-[#1A2E2B] dark:text-[#FBF3E4] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                      required
                    />
                  </FestiveInputShell>
                </div>
              </div>
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#284540] text-xs sm:text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] hover:border-[#D96857] dark:hover:border-[#F2D5A0] inline-flex items-center gap-1.5 active:scale-[0.98] transition-all"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Guardar ajustes</span>
              </button>
            </form>
          )}

          {/* Pre-register family member (Creator / Admin) */}
          {canManage && (
            <div className="pt-4 border-t border-[#D8E2DE] dark:border-[#34534D] space-y-2.5">
              <h3 className="text-sm font-bold text-[#1A2E2B] dark:text-[#FBF3E4]">
                Pre-registrar participante
              </h3>
              <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2">
                <FestiveInputShell ornament="bauble" className="flex-1">
                  <input
                    type="text"
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value.toUpperCase())}
                    placeholder="Nombre (ej. TÍA CARMEN)"
                    className="w-full min-h-[46px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-medium uppercase text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                  />
                </FestiveInputShell>
                <button
                  type="submit"
                  className="min-h-[46px] px-5 py-2 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 active:scale-[0.98] transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  Agregar
                </button>
              </form>
            </div>
          )}

          {/* Participants list */}
          <div className="pt-4 border-t border-[#D8E2DE] dark:border-[#34534D] space-y-2">
            <h3 className="text-sm font-bold text-[#1A2E2B] dark:text-[#FBF3E4]">
              Unidos ({members.length})
            </h3>
            {members.length === 0 ? (
              <p className="text-xs text-[#556D68] dark:text-[#BDD0CB]">
                Sin participantes aún.
              </p>
            ) : (
              <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-xs text-[#49635E] dark:text-[#D7E4E0]">
                {members.map((m, idx) => (
                  <span key={m.id} className="inline-flex items-center gap-2">
                    <span className="font-semibold text-[#1A2E2B] dark:text-[#FBF3E4]">{m.member}</span>
                    {idx < members.length - 1 && (
                      <span className="text-[#B8C7C2] dark:text-[#4C7069]" aria-hidden="true">
                        ·
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Switch or Create another group */}
          <div className="pt-4 border-t border-[#D8E2DE] dark:border-[#34534D] flex items-center justify-between gap-3">
            <span className="text-xs text-[#556D68] dark:text-[#BDD0CB]">
              ¿Cambiar de intercambio?
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchGroup();
              }}
              className="min-h-[44px] px-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#284540] text-xs sm:text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] hover:border-[#D96857] dark:hover:border-[#F2D5A0] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-[0.98] transition-all"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span>Cambiar grupo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
