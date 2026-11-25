import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Ruler, Save, User, X } from 'lucide-react';
import { MemberProfile } from '../types/wishlist';
import {
  FestiveInputShell,
  HOLIDAY_ASSETS,
  HolidayMedallion,
  HolidayWorkspaceHero,
  InputOrnamentKind,
  ScallopedSnowEdge,
} from './FestiveDecor';

interface SizesDirectoryProps {
  currentMember: MemberProfile;
  members: MemberProfile[];
  hideFloatingControls?: boolean;
  onRequestSaveProfile: (profile: MemberProfile) => void;
}

const SIZE_FIELDS: Array<{
  key: keyof Pick<
    MemberProfile,
    'casaca' | 'polo' | 'chompa' | 'pantalon' | 'zapatillas'
  >;
  label: string;
  placeholder: string;
  ornament: InputOrnamentKind;
}> = [
  { key: 'casaca', label: 'Casaca / Abrigo', placeholder: 'Ej. M o L', ornament: 'tree' },
  { key: 'polo', label: 'Polo / Camiseta', placeholder: 'Ej. M', ornament: 'bauble' },
  { key: 'chompa', label: 'Chompa / Suéter', placeholder: 'Ej. M o L', ornament: 'snowflake' },
  { key: 'pantalon', label: 'Pantalón', placeholder: 'Ej. 32', ornament: 'bell' },
  { key: 'zapatillas', label: 'Zapatillas / Calzado', placeholder: 'Ej. 42 o 9.5 US', ornament: 'gift' },
];

function countRegisteredSizes(profile: MemberProfile): number {
  return SIZE_FIELDS.reduce(
    (acc, f) => (profile[f.key]?.trim() ? acc + 1 : acc),
    0
  );
}

export const SizesDirectory: React.FC<SizesDirectoryProps> = ({
  currentMember,
  members,
  hideFloatingControls = false,
  onRequestSaveProfile,
}) => {
  const [viewedMemberId, setViewedMemberId] = useState<string | null>(null);
  const [mySizesOpen, setMySizesOpen] = useState(false);
  const [myForm, setMyForm] = useState<MemberProfile>(currentMember);

  useEffect(() => {
    setMyForm(currentMember);
  }, [currentMember]);

  const otherMembers = useMemo(() => {
    return members
      .filter((m) => m.id !== currentMember.id)
      .sort((a, b) => a.member.localeCompare(b.member, 'es'));
  }, [members, currentMember.id]);

  const viewedProfile = useMemo(
    () => otherMembers.find((m) => m.id === viewedMemberId) || null,
    [otherMembers, viewedMemberId]
  );

  const handleMySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMySizesOpen(false);
    onRequestSaveProfile(myForm);
  };

  return (
    <section className="space-y-4">
      <HolidayWorkspaceHero
        title="Tallas del grupo"
        subtitle="Selecciona una persona para consultar sus tallas en privado."
        metaText={`${otherMembers.length} ${
          otherMembers.length === 1 ? 'participante' : 'participantes'
        }`}
        object="tree"
      />

      {otherMembers.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] p-6 sm:p-8 flex flex-col items-center text-center gap-3.5">
          <img
            src={HOLIDAY_ASSETS.tree3d}
            alt="Árbol de Navidad 3D nevado"
            referrerPolicy="no-referrer"
            className="h-28 w-28 rounded-2xl object-cover border border-[#D8E2DE] dark:border-[#34534D]"
          />
          <div className="space-y-1 max-w-sm">
            <h2 className="font-display text-lg font-bold text-[#1A2E2B] dark:text-[#FBF3E4]">
              Aún no hay otros participantes
            </h2>
            <p className="text-xs sm:text-sm text-[#556D68] dark:text-[#BDD0CB] leading-relaxed">
              Cuando tus familiares se unan al grupo, aparecerán aquí para que puedas ver sus tallas.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] divide-y divide-[#D8E2DE] dark:divide-[#34534D] overflow-hidden">
          {otherMembers.map((person) => {
            const count = countRegisteredSizes(person);
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => setViewedMemberId(person.id)}
                className="w-full min-h-[60px] px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#F3F6F4] dark:hover:bg-[#294742] active:bg-[#EAF0ED] dark:active:bg-[#2F524C] transition-colors focus-visible:outline-2 focus-visible:outline-[#D96857] dark:focus-visible:outline-[#F2D5A0]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-[#2F4E49]/12 dark:bg-[#355A53] text-[#2F4E49] dark:text-[#F2D5A0] flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] truncate">
                      {person.member}
                    </p>
                    <p className="text-xs text-[#556D68] dark:text-[#BDD0CB] tabular-nums mt-0.5">
                      {count > 0
                        ? `${count} ${count === 1 ? 'talla registrada' : 'tallas registradas'}`
                        : 'Sin tallas aún'}
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-4.5 w-4.5 text-[#7E9690] dark:text-[#9AB4AE] shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Bottom-Right Button for "Mis tallas" */}
      {!hideFloatingControls && !mySizesOpen && !viewedProfile && (
        <button
          type="button"
          onClick={() => {
            setMyForm(currentMember);
            setMySizesOpen(true);
          }}
          aria-label="Ver y editar mis tallas"
          title="Mis tallas"
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 md:bottom-8 md:right-8 z-30 h-14 w-14 sm:w-auto sm:px-5 rounded-full bg-[#D96857] dark:bg-[#DE705E] text-[#FFFBF5] shadow-lg shadow-[#D96857]/35 dark:shadow-black/50 hover:bg-[#C45544] dark:hover:bg-[#EA7E6C] active:scale-[0.96] transition-all flex items-center justify-center gap-2 border border-transparent dark:border-[#F29C8E]/35"
        >
          <Ruler className="h-5 w-5 shrink-0" />
          <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">
            Mis tallas
          </span>
        </button>
      )}

      {/* Person Sizes Detail Modal / Bottom Sheet */}
      {viewedProfile && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-[#0F1E1C]/60 dark:bg-black/70 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="person-sizes-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewedMemberId(null);
          }}
        >
          <div className="w-full max-w-md max-h-[88dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] shadow-2xl overflow-hidden">
            <div className="relative bg-gradient-to-br from-[#2C4B46] via-[#345852] to-[#26423D] pt-2.5 sm:pt-4 px-5 sm:px-6 pb-6 shrink-0 text-[#FBF3E4]">
              <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-3 sm:hidden" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <HolidayMedallion object="tree" size="xs" />
                  <div className="min-w-0">
                    <h2
                      id="person-sizes-title"
                      className="font-display text-lg font-bold text-[#FFFBF4] truncate"
                    >
                      {viewedProfile.member}
                    </h2>
                    <p className="text-xs text-[#D7E4E0]">
                      Tallas registradas
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewedMemberId(null)}
                  aria-label="Cerrar tallas"
                  className="min-h-[44px] min-w-[44px] -mr-1.5 flex items-center justify-center rounded-full text-[#D7E4E0] hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="absolute bottom-0 inset-x-0 pointer-events-none">
                <ScallopedSnowEdge className="text-white dark:text-[#223B37]" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-4">
              {countRegisteredSizes(viewedProfile) > 0 ? (
                <>
                  <div className="rounded-2xl border border-[#D8E2DE] dark:border-[#34534D] divide-y divide-[#D8E2DE] dark:divide-[#34534D] bg-[#FAFBF9] dark:bg-[#1C3330] overflow-hidden">
                    {SIZE_FIELDS.map((field) => (
                      <div
                        key={field.key}
                        className="px-4 py-3 flex items-center justify-between gap-4"
                      >
                        <span className="text-xs sm:text-sm font-medium text-[#556D68] dark:text-[#BDD0CB]">
                          {field.label}
                        </span>
                        <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-[#1A2E2B] dark:text-[#F2D5A0] text-right">
                          {viewedProfile[field.key]?.trim() || '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {viewedProfile.notas && (
                    <div className="rounded-2xl border border-[#D8E2DE] dark:border-[#34534D] bg-[#FAFBF9] dark:bg-[#1C3330] p-3.5 text-xs sm:text-sm text-[#49635E] dark:text-[#D7E4E0] leading-relaxed">
                      <span className="font-semibold text-[#1A2E2B] dark:text-[#FBF3E4]">
                        Notas:{' '}
                      </span>
                      {viewedProfile.notas}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4 text-center space-y-1">
                  <p className="text-sm font-medium text-[#1A2E2B] dark:text-[#FBF3E4]">
                    Sin tallas registradas
                  </p>
                  <p className="text-xs text-[#556D68] dark:text-[#BDD0CB]">
                    {viewedProfile.member} aún no ha completado sus medidas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* "Mis tallas" Edit Bottom Sheet Modal */}
      {mySizesOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-[#0F1E1C]/60 dark:bg-black/70 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="my-sizes-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMySizesOpen(false);
          }}
        >
          <div className="w-full max-w-md max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] shadow-2xl overflow-hidden">
            <div className="relative bg-gradient-to-br from-[#2C4B46] via-[#345852] to-[#26423D] pt-2.5 sm:pt-4 px-5 sm:px-6 pb-6 shrink-0 text-[#FBF3E4]">
              <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-3 sm:hidden" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <HolidayMedallion object="tree" size="xs" />
                  <div className="min-w-0">
                    <h2
                      id="my-sizes-modal-title"
                      className="font-display text-lg font-bold text-[#FFFBF4] truncate"
                    >
                      Mis tallas · {currentMember.member}
                    </h2>
                    <p className="text-xs text-[#D7E4E0]">
                      Guía para tu Amigo Secreto.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMySizesOpen(false)}
                  aria-label="Cerrar mis tallas"
                  className="min-h-[44px] min-w-[44px] -mr-1.5 flex items-center justify-center rounded-full text-[#D7E4E0] hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="absolute bottom-0 inset-x-0 pointer-events-none">
                <ScallopedSnowEdge className="text-white dark:text-[#223B37]" />
              </div>
            </div>

            <form
              onSubmit={handleMySubmit}
              className="flex-1 overflow-y-auto p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-3.5"
            >
              {SIZE_FIELDS.map((field) => (
                <div key={field.key}>
                  <label
                    htmlFor={`modal-my-size-${field.key}`}
                    className="block text-xs font-semibold text-[#49635E] dark:text-[#D7E4E0] mb-1.5"
                  >
                    {field.label}
                  </label>
                  <FestiveInputShell ornament={field.ornament}>
                    <input
                      id={`modal-my-size-${field.key}`}
                      type="text"
                      maxLength={40}
                      value={myForm[field.key]}
                      onChange={(e) =>
                        setMyForm((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="w-full min-h-[46px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-mono tabular-nums text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0] transition-colors"
                      required
                    />
                  </FestiveInputShell>
                </div>
              ))}

              <div>
                <label
                  htmlFor="modal-my-size-notas"
                  className="block text-xs font-semibold text-[#49635E] dark:text-[#D7E4E0] mb-1.5"
                >
                  Notas{' '}
                  <span className="font-normal text-[#556D68] dark:text-[#BDD0CB]">
                    (opcional)
                  </span>
                </label>
                <FestiveInputShell ornament="holly">
                  <input
                    id="modal-my-size-notas"
                    type="text"
                    maxLength={200}
                    value={myForm.notas || ''}
                    onChange={(e) =>
                      setMyForm((prev) => ({ ...prev, notas: e.target.value }))
                    }
                    placeholder="Ej. Corte holgado, tonos neutros"
                    className="w-full min-h-[46px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0] transition-colors"
                  />
                </FestiveInputShell>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[48px] px-5 py-2.5 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm sm:text-base font-semibold shadow-md shadow-[#D96857]/25 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar tallas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
