import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Search,
  User,
  Users,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { patientsApi } from '@/api';
import { useDebounce } from '@/hooks/useDebounce';
import { cn, formatPatientAge } from '@/lib/utils';
import type { Patient } from '@/features/patient/types/patient.types';

type FilterType = 'ALL' | 'TITULAR' | 'BENEFICIARIO';

interface PatientSelectorProps {
  value?: string;
  onChange: (patientId: string, patient?: Patient) => void;
  selectedPatient?: Patient | null;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showDetailsCard?: boolean;
}

export function PatientSelector({
  value,
  onChange,
  selectedPatient: propSelectedPatient,
  placeholder = 'Buscar paciente por cédula, nombre o titular...',
  disabled = false,
  className,
  showDetailsCard = true,
}: PatientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [internalSelectedPatient, setInternalSelectedPatient] = useState<Patient | null>(
    propSelectedPatient || null
  );

  const debouncedSearch = useDebounce(search.trim(), 200);

  // Sincronizar si cambia el prop seleccionado
  useEffect(() => {
    if (propSelectedPatient !== undefined) {
      setInternalSelectedPatient(propSelectedPatient);
    }
  }, [propSelectedPatient]);

  // Si hay value (id) pero no tenemos los datos del paciente cargados, buscarlos
  const { data: singlePatientRes } = useQuery({
    queryKey: ['patient-single-selector', value],
    queryFn: () => patientsApi.getById(value!),
    enabled: !!value && (!internalSelectedPatient || internalSelectedPatient.id !== value),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (singlePatientRes?.data && (!internalSelectedPatient || internalSelectedPatient.id !== value)) {
      setInternalSelectedPatient(singlePatientRes.data);
    }
  }, [singlePatientRes, value, internalSelectedPatient]);

  // Cargar lista con búsqueda y filtro de tipo (optimizado a 35 registros con caché)
  const {
    data: patientsRes,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['patients-selector-query', debouncedSearch, filterType],
    queryFn: () =>
      patientsApi.getAll({
        search: debouncedSearch || undefined,
        patientType: filterType === 'ALL' ? undefined : (filterType as any),
        limit: 35,
      }),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const patientsList: Patient[] = (patientsRes?.data as any)?.data || patientsRes?.data || [];

  // Ordenar y priorizar coincidencias (máximo 35 elementos en el DOM para apertura instantánea)
  const sortedPatients = useMemo(() => {
    if (!search.trim()) return patientsList.slice(0, 35);
    const rawQuery = search.toLowerCase().trim();
    const digitsOnlyQuery = rawQuery.replace(/\D/g, '');

    const scored = patientsList.map((p) => {
      const idClean = (p.identificationNumber || '').replace(/\D/g, '');
      const firstName = (p.firstName || '').toLowerCase();
      const lastName = (p.lastName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      const titularName = p.titular
        ? `${p.titular.firstName} ${p.titular.lastName}`.toLowerCase()
        : '';
      const titularId = p.titular?.identificationNumber
        ? p.titular.identificationNumber.replace(/\D/g, '')
        : '';

      let score = 0;
      let matchIndex = 999;

      if (digitsOnlyQuery.length > 0) {
        if (idClean.startsWith(digitsOnlyQuery) || titularId.startsWith(digitsOnlyQuery)) {
          score = 1000;
          matchIndex = 0;
        } else if (idClean.includes(digitsOnlyQuery) || titularId.includes(digitsOnlyQuery)) {
          matchIndex = idClean.indexOf(digitsOnlyQuery);
          score = 500;
        }
      }

      if (
        firstName.startsWith(rawQuery) ||
        lastName.startsWith(rawQuery) ||
        fullName.startsWith(rawQuery)
      ) {
        score = Math.max(score, 400);
      } else if (fullName.includes(rawQuery) || titularName.includes(rawQuery)) {
        score = Math.max(score, 300);
      }

      return { patient: p, score, matchIndex };
    });

    return scored
      .filter((item) => item.score > 0 || patientsList.length > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 35)
      .map((item) => item.patient);
  }, [patientsList, search]);

  const currentPatient = propSelectedPatient || internalSelectedPatient;

  const handleSelect = (patient: Patient) => {
    setInternalSelectedPatient(patient);
    onChange(patient.id, patient);
    setIsOpen(false);
  };

  return (
    <div className={cn('space-y-2 w-full', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={disabled}
            className={cn(
              'w-full h-auto min-h-10 py-2 justify-between text-left border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-normal hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors flex items-center',
              !value && 'text-muted-foreground'
            )}
          >
            {currentPatient ? (
              <div className="flex flex-col items-start min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground truncate max-w-full">
                    {currentPatient.firstName} {currentPatient.lastName}
                  </span>
                  {currentPatient.patientType === 'BENEFICIARIO' ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-bold shrink-0"
                    >
                      Beneficiario ({currentPatient.relationship || 'Familiar'})
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-bold shrink-0"
                    >
                      Titular
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate w-full mt-0.5">
                  {currentPatient.identificationNumber
                    ? `C.I: ${currentPatient.identificationNumber}`
                    : 'Sin Cédula (Menor de edad)'}
                  {currentPatient.gerencia && ` • ${currentPatient.gerencia}`}
                  {currentPatient.patientType === 'BENEFICIARIO' && currentPatient.titular && (
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      {' '}• Titular: {currentPatient.titular.firstName} {currentPatient.titular.lastName}
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground truncate flex-1 min-w-0 text-left pr-2">
                {placeholder}
              </span>
            )}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          avoidCollisions={false}
          className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-24px)] flex flex-col p-0 shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden rounded-xl bg-white dark:bg-slate-900"
          style={{
            maxHeight: 'min(280px, calc(100dvh - 120px))',
          }}
          align="start"
          sideOffset={4}
        >
          {/* ── BARRA SUPERIOR CON PESTAÑAS DE CATEGORÍA ── */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 space-y-1.5 shrink-0">
            <div className="flex p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={cn(
                  'flex-1 py-1.5 px-1 text-[10px] sm:text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1 min-w-0 cursor-pointer',
                  filterType === 'ALL'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                <Shield className="h-3 w-3 shrink-0" />
                <span className="truncate">Todos</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('TITULAR')}
                className={cn(
                  'flex-1 py-1.5 px-1 text-[10px] sm:text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1 min-w-0 cursor-pointer',
                  filterType === 'TITULAR'
                    ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">Titulares</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('BENEFICIARIO')}
                className={cn(
                  'flex-1 py-1.5 px-1 text-[10px] sm:text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1 min-w-0 cursor-pointer',
                  filterType === 'BENEFICIARIO'
                    ? 'bg-white dark:bg-slate-950 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                <Users className="h-3 w-3 shrink-0" />
                <span className="truncate">Familiares</span>
              </button>
            </div>

            {/* Input de Búsqueda */}
            <div className="flex items-center px-2.5 gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <Input
                placeholder={
                  filterType === 'ALL'
                    ? 'Buscar por cédula, nombre o titular...'
                    : filterType === 'TITULAR'
                    ? 'Buscar titular por cédula o nombre...'
                    : 'Buscar beneficiario o su titular...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 focus-visible:ring-0 px-0 h-8 bg-transparent text-xs"
                autoFocus
              />
            </div>
          </div>

          {/* ── LISTA DE RESULTADOS ── */}
          <div className="flex-1 min-h-0 max-h-[160px] sm:max-h-[200px] overflow-y-auto p-1.5 space-y-1">
            {isLoading || isFetching ? (
              <div className="p-5 text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Buscando pacientes...</span>
              </div>
            ) : sortedPatients.length === 0 ? (
              <div className="p-5 text-xs text-center text-muted-foreground">
                No se encontraron pacientes para "{search}".
              </div>
            ) : (
              sortedPatients.map((patient) => {
                const isBeneficiario = patient.patientType === 'BENEFICIARIO';
                const isSelected = value === patient.id;

                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handleSelect(patient)}
                    className={cn(
                      'w-full text-left flex items-center justify-between rounded-lg p-2 text-xs transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    )}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-2">
                      {/* Avatar Iniciales */}
                      <div
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5',
                          isBeneficiario
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        )}
                      >
                        {patient.firstName?.charAt(0) || 'P'}
                        {patient.lastName?.charAt(0) || ''}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                            {patient.firstName} {patient.lastName}
                          </span>
                          {isBeneficiario ? (
                            <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded-md">
                              Beneficiario ({patient.relationship || 'Familiar'})
                            </span>
                          ) : (
                            <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-bold px-1.5 py-0.2 rounded-md">
                              Titular
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {patient.identificationNumber
                              ? `C.I: ${patient.identificationNumber}`
                              : 'Sin Cédula'}
                          </span>
                          {patient.gerencia && ` • ${patient.gerencia}`}
                        </p>

                        {isBeneficiario && patient.titular && (
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 truncate font-medium">
                            Titular: {patient.titular.firstName} {patient.titular.lastName} ({patient.titular.identificationNumber || 'S/D'})
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0 ml-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* ── FICHA RESUMEN INFERIOR ── */}
      {showDetailsCard && currentPatient && (
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {currentPatient.patientType === 'BENEFICIARIO'
                ? `Carga Familiar • ${currentPatient.relationship || 'Beneficiario'}`
                : 'Trabajador Titular'}
            </span>
            <span className="text-[10px] font-semibold text-primary">
              {formatPatientAge(currentPatient.birthDate)} •{' '}
              {(currentPatient.gender as string) === 'M' ||
              (currentPatient.gender as string) === 'MALE'
                ? 'Masculino'
                : 'Femenino'}
            </span>
          </div>

          {currentPatient.patientType === 'BENEFICIARIO' && currentPatient.titular && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-200">Titular Responsable:</strong>{' '}
              {currentPatient.titular.firstName} {currentPatient.titular.lastName}{' '}
              (C.I: {currentPatient.titular.identificationNumber || 'S/D'})
            </p>
          )}

          {currentPatient.gerencia && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
              <strong className="text-slate-800 dark:text-slate-200">Gerencia:</strong>{' '}
              {currentPatient.gerencia}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
