import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { AlertCircle, Layers, ListChecks, RefreshCw, Sliders } from "lucide-react";
import { Button, Field, Input, Select, cn } from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { readSessionUser } from "../../layouts/sessionUser";
import { useSalaryStructures } from "../../hooks/useSalaryStructures";
import {
  calculateCalendarDailySplit,
  calculateStructureSplit,
  getEmployeeStructure,
  getSalaryComponentLibrary,
  saveEmployeeStructure,
  type LibrarySalaryComponent,
  type SalaryComponentRow,
} from "../../services/employeeSalaryService";
import {
  hasSalaryData,
  validateAnnualCtc,
  validateComponentsMatchCalendarDaily,
  validateComponentsMatchCtc,
  validateComponentsMatchDailyWage,
  validateDailyWage,
  type SalaryDraft,
} from "./salaryValidation";
import {
  applyCalendarDailyBasic,
  buildManualComponentsFromLibrary,
  buildManualMatchSummary,
  manualModeAmountHint,
  manualTargetAmountLabel,
  partitionSalaryComponents,
  resolveManualSplitCodes,
} from "./salaryManualFlow";

export type SalaryEditorHandle = {
  saveStructure: () => Promise<void>;
  hasUnsavedChanges: () => boolean;
  validateStructure: () => string;
  getDraft: () => SalaryDraft;
};

export type EmployeeSalaryStructureEditorProps = {
  employeeId?: string;
  payType?: string;
  draftValue?: SalaryDraft | null;
  onDraftChange?: (draft: SalaryDraft) => void;
  hideActions?: boolean;
};

const resolveWageType = (
  payType?: string,
  draftValue?: SalaryDraft | null,
): "MONTHLY" | "DAILY" | "CALENDAR_DAILY" => {
  if (payType) {
    const p = String(payType).toUpperCase();
    if (p === "DAILY" || p === "CALENDAR_DAILY" || p === "MONTHLY") return p;
  }
  if (draftValue?.wageType) {
    const w = String(draftValue.wageType).toUpperCase();
    if (w === "DAILY" || w === "CALENDAR_DAILY" || w === "MONTHLY") return w;
  }
  if (draftValue?.dailyWage) return "DAILY";
  return "MONTHLY";
};

const structureIdOf = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id?: string })._id || "");
  }
  return "";
};

const EmployeeSalaryStructureEditor = forwardRef<
  SalaryEditorHandle,
  EmployeeSalaryStructureEditorProps
>(function EmployeeSalaryStructureEditor(
  {
    employeeId,
    payType,
    draftValue,
    onDraftChange,
    hideActions = false,
  },
  ref,
) {
  const user = readSessionUser();
  const vendorId = user?.vendorId || null;
  const isDraftMode = !employeeId;
  const mounted = useRef(true);

  const { data: availableStructures = [] } = useSalaryStructures(
    vendorId,
    Boolean(vendorId),
  );

  const [libraryComponents, setLibraryComponents] = useState<
    LibrarySalaryComponent[]
  >([]);
  const [selectedStructureId, setSelectedStructureId] = useState("");
  const [components, setComponents] = useState<SalaryComponentRow[]>([]);
  const [ctcAnnual, setCtcAnnual] = useState("");
  const [dailyWage, setDailyWage] = useState("");
  const [basicFixed, setBasicFixed] = useState("");
  const [wageType, setWageType] = useState<"MONTHLY" | "DAILY" | "CALENDAR_DAILY">(
    () => resolveWageType(payType, draftValue),
  );
  const [hasExistingSalary, setHasExistingSalary] = useState(false);
  const [isRevising, setIsRevising] = useState(isDraftMode);
  const [inputMode, setInputMode] = useState<"template" | "manual" | null>(null);
  const [selectedManualCodes, setSelectedManualCodes] = useState<string[]>([]);
  const [manualPickerOpen, setManualPickerOpen] = useState(true);
  const [revisionType, setRevisionType] = useState("Annual Increment");
  const [revisionReason, setRevisionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [monthlyGross, setMonthlyGross] = useState(0);
  const [dailyGross, setDailyGross] = useState(0);

  const isDaily = wageType === "DAILY";
  const isCalendarDaily = wageType === "CALENDAR_DAILY";
  const usesDailyWageInput = isDaily || isCalendarDaily;
  const previewDaysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).getDate();
  const safeComponents = Array.isArray(components) ? components : [];

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!payType) return;
    const next = resolveWageType(payType, null);
    if (next !== wageType) setWageType(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from parent payType only
  }, [payType]);

  const syncDraft = (
    nextCtc: string | number,
    nextDailyWage: string | number,
    nextWageType: string,
    nextStructId: string,
    nextComponents: SalaryComponentRow[],
  ) => {
    if (isDraftMode && onDraftChange) {
      onDraftChange({
        ctcAnnual: Number(nextCtc) || 0,
        dailyWage: Number(nextDailyWage) || 0,
        wageType: nextWageType || wageType,
        structureId: nextStructId,
        components: Array.isArray(nextComponents) ? nextComponents : [],
      });
    }
  };

  const loadData = async () => {
    if (!vendorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const lib = await getSalaryComponentLibrary(true);
      if (mounted.current) setLibraryComponents(lib);

      if (isDraftMode) {
        const draftWageType = resolveWageType(payType, draftValue);
        if (mounted.current) setWageType(draftWageType);
        if (draftValue?.ctcAnnual) {
          setCtcAnnual(String(draftValue.ctcAnnual));
          setHasExistingSalary(true);
          setIsRevising(false);
        }
        if (draftValue?.dailyWage) {
          setDailyWage(String(draftValue.dailyWage));
          setHasExistingSalary(true);
          setIsRevising(false);
        }
        if (draftValue?.structureId) {
          setSelectedStructureId(draftValue.structureId);
          setInputMode("template");
        }
        if (draftValue?.components?.length) {
          setComponents(draftValue.components as SalaryComponentRow[]);
          if (!draftValue.structureId) {
            setInputMode("manual");
            setSelectedManualCodes(
              draftValue.components.map((c) => String(c.code || "")),
            );
          }
        }
        if (
          !draftValue?.ctcAnnual &&
          !draftValue?.dailyWage &&
          !draftValue?.components?.length
        ) {
          setIsRevising(true);
        }
      } else if (employeeId) {
        const empData = (await getEmployeeStructure(employeeId)) || {};
        const savedWageType = empData.wageType
          ? String(empData.wageType).toUpperCase()
          : empData.dailyWage
            ? "DAILY"
            : "MONTHLY";
        const wt =
          savedWageType === "DAILY" || savedWageType === "CALENDAR_DAILY"
            ? savedWageType
            : "MONTHLY";
        if (mounted.current) setWageType(wt);

        if ((wt === "DAILY" || wt === "CALENDAR_DAILY") && empData.dailyWage) {
          setDailyWage(String(empData.dailyWage));
          setHasExistingSalary(true);
          setIsRevising(false);
          if (wt === "CALENDAR_DAILY") {
            const basicComp = (empData.components || []).find(
              (c) => String(c.code || "").toUpperCase() === "BASIC",
            );
            if (basicComp && Number(basicComp.monthlyAmount) > 0) {
              setBasicFixed(String(basicComp.monthlyAmount));
            }
          }
        } else if (empData.ctcAnnual) {
          setCtcAnnual(String(empData.ctcAnnual));
          setHasExistingSalary(true);
          setIsRevising(false);
        } else {
          setIsRevising(true);
        }

        const structId = structureIdOf(empData.salaryStructure);
        if (structId) {
          setSelectedStructureId(structId);
          setInputMode("template");
        }
        if (empData.components?.length) {
          setComponents(empData.components);
          if (!structId) {
            setInputMode("manual");
            setSelectedManualCodes(
              empData.components.map((c) => String(c.code || "")),
            );
          }
        }
      }
    } catch {
      if (mounted.current) setError("Failed to load salary configurations.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, vendorId]);

  const handleSwitchMode = (mode: "template" | "manual") => {
    if (inputMode === mode) return;
    if (
      safeComponents.length > 0 &&
      !window.confirm(
        "Switching mode will clear current component data. Continue?",
      )
    ) {
      return;
    }
    setInputMode(mode);
    setComponents([]);
    setSelectedManualCodes([]);
    setManualPickerOpen(true);
    setBasicFixed("");
    if (mode === "template") setSelectedStructureId("");
    setError("");
    setMsg("");
    if (usesDailyWageInput) syncDraft("", dailyWage, wageType, "", []);
    else syncDraft(ctcAnnual, "", wageType, "", []);
  };

  const handleSwitchWageType = (
    nextType: "MONTHLY" | "DAILY" | "CALENDAR_DAILY",
  ) => {
    if (nextType === wageType) return;
    if (
      (safeComponents.length > 0 || ctcAnnual || dailyWage) &&
      !window.confirm("Switching wage type will clear current data. Continue?")
    ) {
      return;
    }
    setWageType(nextType);
    setComponents([]);
    setSelectedManualCodes([]);
    setSelectedStructureId("");
    setManualPickerOpen(true);
    setBasicFixed("");
    setInputMode(null);
    setError("");
    setMsg("");
    setMonthlyGross(0);
    setDailyGross(0);
    if (nextType === "DAILY" || nextType === "CALENDAR_DAILY") {
      setCtcAnnual("");
      syncDraft("", dailyWage, nextType, "", []);
    } else {
      setDailyWage("");
      syncDraft(ctcAnnual, "", nextType, "", []);
    }
  };

  const handleCalculateSplit = async () => {
    if (!vendorId) return setError("Vendor not found.");
    if (!isCalendarDaily && !selectedStructureId) {
      return setError("Please select a Salary Structure template.");
    }
    if (usesDailyWageInput) {
      const wageErr = validateDailyWage(dailyWage);
      if (wageErr) return setError(wageErr);
    } else {
      const ctcErr = validateAnnualCtc(ctcAnnual);
      if (ctcErr) return setError(ctcErr);
    }

    try {
      setCalculating(true);
      setError("");
      let result;
      if (isCalendarDaily) {
        const basicAmt = Number(basicFixed);
        if (!basicAmt || basicAmt <= 0) {
          setError("Enter Fixed Basic amount (required for Calendar Daily).");
          setCalculating(false);
          return;
        }
        result = await calculateCalendarDailySplit(vendorId, {
          dailyWage: Number(dailyWage),
          structureId: selectedStructureId || undefined,
          daysInMonth: previewDaysInMonth,
          basicFixedAmount: basicAmt,
        });
      } else if (isDaily) {
        result = await calculateStructureSplit(vendorId, {
          dailyWage: Number(dailyWage),
          structureId: selectedStructureId,
          wageType: "DAILY",
        });
      } else {
        result = await calculateStructureSplit(vendorId, {
          ctcAnnual: Number(ctcAnnual),
          structureId: selectedStructureId,
          wageType: "MONTHLY",
        });
      }

      const parsed = result.components || [];
      if (!parsed.length) {
        setError(
          "Calculation returned no components. Please check your template structure.",
        );
        return;
      }
      setComponents(parsed);
      if (isDaily) {
        setDailyGross(
          result.summary?.ctcEarnings ?? result.summary?.totalEarnings ?? 0,
        );
        syncDraft("", dailyWage, wageType, selectedStructureId, parsed);
      } else {
        setMonthlyGross(
          result.summary?.ctcEarnings ?? result.summary?.totalEarnings ?? 0,
        );
        syncDraft(
          isCalendarDaily ? "" : ctcAnnual,
          isCalendarDaily ? dailyWage : "",
          wageType,
          selectedStructureId,
          parsed,
        );
      }
      setMsg("Salary structure calculated successfully.");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Failed to calculate structure.",
      );
    } finally {
      setCalculating(false);
    }
  };

  const handleToggleManualComponent = (comp: LibrarySalaryComponent) => {
    setSelectedManualCodes((prev) =>
      prev.includes(comp.code)
        ? prev.filter((c) => c !== comp.code)
        : [...prev, comp.code],
    );
  };

  const handleApplyManualComponents = async () => {
    if (selectedManualCodes.length === 0) {
      return setError("Please select at least one component.");
    }
    if (!vendorId) return setError("Vendor not found.");
    setError("");

    // Calendar Daily: Fixed Basic hand path (not library CTC % split).
    if (isCalendarDaily) {
      let newComponents = buildManualComponentsFromLibrary(
        libraryComponents,
        selectedManualCodes,
      );
      const applied = applyCalendarDailyBasic(
        newComponents,
        libraryComponents,
        Number(basicFixed),
      );
      if (applied.error) return setError(applied.error);
      newComponents = applied.components;
      const basicCode = newComponents.find(
        (c) => String(c.code).toUpperCase() === "BASIC",
      )?.code;
      if (basicCode && !selectedManualCodes.includes(basicCode)) {
        setSelectedManualCodes((prev) => [...prev, basicCode]);
      }
      setComponents(newComponents);
      setManualPickerOpen(false);
      syncDraft("", dailyWage, wageType, "", newComponents);
      setMsg(
        `${newComponents.length} components ready. Adjust monthly preview amounts below if needed.`,
      );
      setTimeout(() => setMsg(""), 4000);
      return;
    }

    if (isDaily) {
      const wageErr = validateDailyWage(dailyWage);
      if (wageErr) return setError(wageErr);
    } else {
      const ctcErr = validateAnnualCtc(ctcAnnual);
      if (ctcErr) return setError(ctcErr);
    }

    const codes = resolveManualSplitCodes(
      selectedManualCodes,
      libraryComponents,
      wageType,
    );
    if (codes.includes("SPECIAL") && !selectedManualCodes.map((c) => c.toUpperCase()).includes("SPECIAL")) {
      setSelectedManualCodes((prev) =>
        prev.some((c) => c.toUpperCase() === "SPECIAL")
          ? prev
          : [...prev, "SPECIAL"],
      );
    }

    try {
      setCalculating(true);
      const result = await calculateStructureSplit(vendorId, {
        wageType,
        componentCodes: codes,
        ...(isDaily
          ? { dailyWage: Number(dailyWage) }
          : { ctcAnnual: Number(ctcAnnual) }),
      });
      const parsed = result.components || [];
      if (!parsed.length) {
        setError("Calculation returned no components. Check component rates in Settings.");
        return;
      }
      setComponents(parsed);
      setManualPickerOpen(false);
      if (isDaily) {
        setDailyGross(
          result.summary?.ctcEarnings ?? result.summary?.totalEarnings ?? 0,
        );
        syncDraft("", dailyWage, wageType, "", parsed);
      } else {
        setMonthlyGross(
          result.summary?.ctcEarnings ?? result.summary?.totalEarnings ?? 0,
        );
        syncDraft(ctcAnnual, "", wageType, "", parsed);
      }
      setMsg(
        `Split applied from library rates (${parsed.length} components). Tweak amounts below if needed.`,
      );
      setTimeout(() => setMsg(""), 4000);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Failed to split salary from selected components.",
      );
    } finally {
      setCalculating(false);
    }
  };

  const updateComponentAmount = (code: string, value: string) => {
    const numericVal = Number(value) || 0;
    const amountKey = isDaily ? "dailyAmount" : "monthlyAmount";
    if (isCalendarDaily && String(code).toUpperCase() === "BASIC") {
      setBasicFixed(value);
    }
    setComponents((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      const targetIdx = next.findIndex((c) => c.code === code);
      if (targetIdx === -1) return prev;
      const editedIsCTC = next[targetIdx].isPartOfCTC !== false;
      const diff =
        numericVal - Number(next[targetIdx][amountKey] || 0);
      next[targetIdx] = { ...next[targetIdx], [amountKey]: numericVal };

      // Balance via SPECIAL only in template mode (auto-split math).
      if (inputMode === "template" && editedIsCTC) {
        const specialIdx = next.findIndex((c) => c.code === "SPECIAL");
        if (specialIdx !== -1 && code !== "SPECIAL") {
          const newSpecial =
            Number(next[specialIdx][amountKey] || 0) - diff;
          next[specialIdx] = {
            ...next[specialIdx],
            [amountKey]: Math.max(0, newSpecial),
          };
        }
      }

      if (usesDailyWageInput) {
        syncDraft("", dailyWage, wageType, selectedStructureId, next);
      } else {
        syncDraft(ctcAnnual, "", wageType, selectedStructureId, next);
      }
      return next;
    });
  };

  const syncBasicFixedIntoComponents = (value: string) => {
    setBasicFixed(value);
    if (!isCalendarDaily || inputMode !== "manual" || !safeComponents.length) {
      return;
    }
    const amt = Number(value) || 0;
    setComponents((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      const idx = next.findIndex(
        (c) => String(c.code || "").toUpperCase() === "BASIC",
      );
      if (idx === -1) return prev;
      next[idx] = { ...next[idx], monthlyAmount: amt, dailyAmount: 0 };
      syncDraft("", dailyWage, wageType, "", next);
      return next;
    });
  };

  const getDraft = (): SalaryDraft => ({
    wageType,
    ctcAnnual: Number(ctcAnnual) || 0,
    dailyWage: Number(dailyWage) || 0,
    structureId: selectedStructureId,
    components: safeComponents,
  });

  const hasEnteredSalaryInput = () => {
    if (Number(ctcAnnual) > 0) return true;
    if (Number(dailyWage) > 0) return true;
    if (selectedStructureId) return true;
    return safeComponents.some(
      (c) => Number(c.monthlyAmount) > 0 || Number(c.dailyAmount) > 0,
    );
  };

  const validateStructure = (): string => {
    if (!isRevising || !hasEnteredSalaryInput()) return "";
    if (isCalendarDaily) {
      const wageErr = validateDailyWage(dailyWage);
      if (wageErr) {
        setError(wageErr);
        return wageErr;
      }
      const matchErr = validateComponentsMatchCalendarDaily({
        dailyWage,
        components: safeComponents,
      });
      if (matchErr) setError(matchErr);
      return matchErr;
    }
    if (isDaily) {
      const wageErr = validateDailyWage(dailyWage);
      if (wageErr) {
        setError(wageErr);
        return wageErr;
      }
      const matchErr = validateComponentsMatchDailyWage({
        dailyWage,
        components: safeComponents,
      });
      if (matchErr) setError(matchErr);
      return matchErr;
    }
    const ctcErr = validateAnnualCtc(ctcAnnual);
    if (ctcErr) {
      setError(ctcErr);
      return ctcErr;
    }
    const matchErr = validateComponentsMatchCtc({
      ctcAnnual,
      components: safeComponents,
    });
    if (matchErr) setError(matchErr);
    return matchErr;
  };

  const handleSave = async () => {
    if (isDraftMode) {
      setIsRevising(false);
      setHasExistingSalary(true);
      setMsg("Draft saved successfully.");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    if (!employeeId) return;

    setSaving(true);
    setError("");

    if (
      inputMode === "template" &&
      !isCalendarDaily &&
      !selectedStructureId
    ) {
      setError("Salary structure is missing.");
      setSaving(false);
      return;
    }
    if (safeComponents.length === 0) {
      setError("Please configure components before saving.");
      setSaving(false);
      return;
    }

    const matchError = validateStructure();
    if (matchError) {
      setSaving(false);
      return;
    }

    try {
      const revision =
        hasExistingSalary
          ? { revisionType, revisionReason }
          : { revisionType: "Initial", revisionReason: "Initial setup" };

      const payload =
        isCalendarDaily
          ? {
              wageType: "CALENDAR_DAILY" as const,
              dailyWage: Number(dailyWage),
              monthlyGross,
              daysInMonth: previewDaysInMonth,
              structureId:
                inputMode === "template" ? selectedStructureId : undefined,
              components: safeComponents,
              ...revision,
            }
          : isDaily
            ? {
                wageType: "DAILY" as const,
                dailyWage: Number(dailyWage),
                dailyGross,
                structureId:
                  inputMode === "template" ? selectedStructureId : undefined,
                components: safeComponents,
                ...revision,
              }
            : {
                wageType: "MONTHLY" as const,
                ctcAnnual: Number(ctcAnnual),
                structureId:
                  inputMode === "template" ? selectedStructureId : undefined,
                monthlyGross,
                components: safeComponents,
                ...revision,
              };

      await saveEmployeeStructure(employeeId, payload);
      setMsg("Employee salary saved successfully.");
      setHasExistingSalary(true);
      setIsRevising(false);
      setTimeout(() => setMsg(""), 2500);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Failed to save salary.",
      );
      throw e;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    saveStructure: handleSave,
    hasUnsavedChanges: () => Boolean(isRevising && hasEnteredSalaryInput()),
    validateStructure,
    getDraft,
  }));

  if (loading) {
    return (
      <p className="m-0 text-sm text-wz-text-secondary">Loading salary data…</p>
    );
  }

  const {
    earnings,
    deductions,
    employerContributions,
  } = partitionSalaryComponents(safeComponents);
  const libEarnings = libraryComponents.filter((c) => c.category === "Earning");
  const libDeductions = libraryComponents.filter(
    (c) => c.category === "Deduction" && !c.isEmployerContribution,
  );
  const libEmployer = libraryComponents.filter((c) => c.isEmployerContribution);

  const amountKey = isDaily ? "dailyAmount" : "monthlyAmount";
  const manualMatch =
    isRevising && inputMode === "manual"
      ? buildManualMatchSummary({
          wageType,
          ctcAnnual,
          dailyWage,
          components: safeComponents,
        })
      : null;

  const wageTab = (
    type: "MONTHLY" | "DAILY" | "CALENDAR_DAILY",
    label: string,
  ) => (
    <button
      type="button"
      className={cn(
        "cursor-pointer border border-b-0 border-wz-neutral-200 px-4 py-2 text-sm",
        wageType === type
          ? "rounded-t-md border-t bg-white font-semibold text-wz-primary"
          : "bg-transparent font-normal text-wz-text-primary",
      )}
      onClick={() => handleSwitchWageType(type)}
      disabled={calculating || saving}
    >
      {label}
    </button>
  );

  return (
    <div className="flex w-full flex-col gap-wz-4">
      {hasExistingSalary && !isRevising ? (
        <div className="flex flex-wrap items-center justify-between gap-wz-3 rounded-wz-lg border border-wz-border bg-white px-wz-4 py-wz-4">
          <div>
            <p className="m-0 text-xs font-semibold text-wz-text-secondary">
              {isCalendarDaily
                ? "Current Per Day Pay"
                : isDaily
                  ? "Current Daily Wage"
                  : "Current Annual CTC"}
            </p>
            <p className="m-0 mt-1 text-lg font-bold text-wz-text-primary">
              {usesDailyWageInput
                ? `₹${(Number(dailyWage) || 0).toLocaleString("en-IN")}/day`
                : `₹${(Number(ctcAnnual) || 0).toLocaleString("en-IN")}`}
            </p>
          </div>
          {!hideActions ? (
            <Button type="button" variant="secondary" onClick={() => setIsRevising(true)}>
              Revise Salary
            </Button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div
          className="flex items-start gap-2 rounded-wz-md border border-[#fecdca] bg-[#fef3f2] px-3.5 py-3 text-sm text-wz-error"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}
      {msg ? (
        <div className="rounded-wz-md border border-[#a6f4c5] bg-[#ecfdf3] px-3.5 py-3 text-sm text-[#027a48]">
          {msg}
        </div>
      ) : null}

      {isRevising ? (
        <div className="flex flex-wrap gap-1 border-b border-wz-neutral-200">
          {wageTab("MONTHLY", "Monthly CTC")}
          {wageTab("DAILY", "Daily Wage")}
          {wageTab("CALENDAR_DAILY", "Calendar Daily")}
        </div>
      ) : null}

      {isRevising && hasExistingSalary ? (
        <div className="grid grid-cols-1 gap-wz-4 md:grid-cols-2">
          <Field label="Revision Type" htmlFor="salary-revision-type">
            <Select
              id="salary-revision-type"
              value={revisionType}
              onChange={(e) => setRevisionType(e.target.value)}
              disabled={saving}
            >
              <option value="Annual Increment">Annual Increment</option>
              <option value="Promotion">Promotion</option>
              <option value="Mid-Year Adjustment">Mid-Year Adjustment</option>
              <option value="Correction">Correction</option>
            </Select>
          </Field>
          <Field label="Reason / Note (Optional)" htmlFor="salary-revision-reason">
            <Input
              id="salary-revision-reason"
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="e.g. FY 2026 Appraisal"
              disabled={saving}
            />
          </Field>
        </div>
      ) : null}

      {isRevising && !inputMode ? (
        <div className="flex flex-col items-center gap-wz-4 rounded-[10px] py-wz-2">
          <p className="m-0 text-center text-base font-semibold text-wz-text-primary">
            How would you like to set the salary?
          </p>
          <div className="flex flex-wrap items-stretch justify-center gap-wz-6">
            <button
              type="button"
              className="flex w-[220px] cursor-pointer flex-col items-center gap-2.5 rounded-[10px] border-2 border-[#e2e8f0] bg-white px-[22px] py-[30px] text-center hover:border-wz-primary"
              onClick={() => handleSwitchMode("template")}
              disabled={calculating || saving}
            >
              <Layers className="size-7 text-wz-primary" aria-hidden />
              <span className="text-sm font-semibold text-wz-text-primary">
                Use Structure Template
              </span>
              <span className="text-xs font-normal text-wz-text-primary">
                Pick a predefined template and auto-split CTC across components
              </span>
            </button>
            <button
              type="button"
              className="flex w-[220px] cursor-pointer flex-col items-center gap-2.5 rounded-[10px] border-2 border-[#e2e8f0] bg-white px-[22px] py-[30px] text-center hover:border-wz-primary"
              onClick={() => handleSwitchMode("manual")}
              disabled={calculating || saving}
            >
              <ListChecks className="size-7 text-[#7a5af8]" aria-hidden />
              <span className="text-sm font-semibold text-wz-text-primary">
                Select Components Manually
              </span>
              <span className="text-xs font-normal text-wz-text-primary">
                {manualModeAmountHint(wageType)}
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {isRevising && inputMode ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-wz-md border px-3 py-1.5 text-xs font-semibold",
              inputMode === "template"
                ? "border-wz-primary bg-wz-hover text-wz-primary"
                : "border-wz-border bg-white text-wz-text-secondary",
            )}
            onClick={() => handleSwitchMode("template")}
          >
            <Layers size={14} /> Template
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-wz-md border px-3 py-1.5 text-xs font-semibold",
              inputMode === "manual"
                ? "border-wz-primary bg-wz-hover text-wz-primary"
                : "border-wz-border bg-white text-wz-text-secondary",
            )}
            onClick={() => handleSwitchMode("manual")}
          >
            <Sliders size={14} /> Manual
          </button>
        </div>
      ) : null}

      {isRevising && inputMode === "template" ? (
        <div className="grid grid-cols-1 items-end gap-wz-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="1. Select Salary Structure" htmlFor="salary-structure-id">
            <Select
              id="salary-structure-id"
              value={selectedStructureId}
              onChange={(e) => setSelectedStructureId(e.target.value)}
              disabled={calculating || saving}
            >
              <option value="">Choose a template…</option>
              {availableStructures.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={
              isCalendarDaily
                ? "2. Per Day Pay (₹/day)"
                : isDaily
                  ? "2. Daily Wage (₹/day)"
                  : "2. Annual CTC (₹)"
            }
            htmlFor="salary-amount"
          >
            <Input
              id="salary-amount"
              type="number"
              min={0}
              value={usesDailyWageInput ? dailyWage : ctcAnnual}
              onChange={(e) =>
                usesDailyWageInput
                  ? setDailyWage(e.target.value)
                  : setCtcAnnual(e.target.value)
              }
              disabled={calculating || saving}
            />
          </Field>
          {isCalendarDaily ? (
            <Field label="3. Fixed Basic (₹)" htmlFor="salary-basic-fixed">
              <Input
                id="salary-basic-fixed"
                type="number"
                min={0}
                value={basicFixed}
                onChange={(e) => setBasicFixed(e.target.value)}
                disabled={calculating || saving}
              />
            </Field>
          ) : null}
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleCalculateSplit()}
            disabled={
              calculating ||
              saving ||
              (isCalendarDaily
                ? !dailyWage || !basicFixed
                : !selectedStructureId ||
                  (usesDailyWageInput ? !dailyWage : !ctcAnnual))
            }
          >
            {calculating ? (
              <RefreshCw className="size-4 animate-spin" aria-hidden />
            ) : null}
            Calculate Breakdown
          </Button>
        </div>
      ) : null}

      {isRevising && inputMode === "manual" ? (
        <div className="flex flex-col gap-wz-4">
          <p className="m-0 text-sm text-wz-text-secondary">
            Manual mode: enter the target, pick components, then Apply &amp; Split
            uses each component&apos;s library rates (same engine as Template).
            Tweak amounts afterward if needed.
          </p>
          <div className="flex flex-wrap items-end gap-wz-4">
            <Field
              label={manualTargetAmountLabel(wageType)}
              htmlFor="salary-manual-amount"
              className="min-w-[200px] flex-1"
            >
              <Input
                id="salary-manual-amount"
                type="number"
                min={0}
                value={usesDailyWageInput ? dailyWage : ctcAnnual}
                onChange={(e) =>
                  usesDailyWageInput
                    ? setDailyWage(e.target.value)
                    : setCtcAnnual(e.target.value)
                }
                disabled={calculating || saving}
              />
            </Field>
            {isCalendarDaily ? (
              <Field
                label="Fixed Basic (₹) — required"
                htmlFor="salary-manual-basic-fixed"
                className="min-w-[180px] flex-1"
              >
                <Input
                  id="salary-manual-basic-fixed"
                  type="number"
                  min={0}
                  value={basicFixed}
                  onChange={(e) => syncBasicFixedIntoComponents(e.target.value)}
                  placeholder="e.g. 10994"
                  disabled={calculating || saving}
                />
              </Field>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleApplyManualComponents()}
              disabled={
                calculating ||
                saving ||
                selectedManualCodes.length === 0 ||
                (isCalendarDaily
                  ? !basicFixed || !dailyWage
                  : isDaily
                    ? !dailyWage
                    : !ctcAnnual)
              }
            >
              {calculating ? (
                <RefreshCw className="size-4 animate-spin" aria-hidden />
              ) : null}
              3. Apply &amp; Split ({selectedManualCodes.length})
            </Button>
          </div>

          {safeComponents.length > 0 && !manualPickerOpen ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-wz-md border border-wz-border bg-wz-neutral-50 px-3 py-2 text-sm">
              <span className="text-wz-text-secondary">
                {safeComponents.length} component
                {safeComponents.length === 1 ? "" : "s"} split from library rates
                — tweak amounts below (step 4) if needed.
              </span>
              <Button
                type="button"
                variant="ghost"
                className="text-xs"
                onClick={() => setManualPickerOpen(true)}
                disabled={calculating || saving}
              >
                Change selection
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="m-0 text-xs font-semibold text-wz-text-secondary">
                2. Select components
                {isCalendarDaily ? " (BASIC is required and filled from Fixed Basic)" : ""}
              </p>
              <div className="grid grid-cols-1 gap-wz-4 md:grid-cols-3">
                {(
                  [
                    ["Earnings", libEarnings],
                    ["Deductions", libDeductions],
                    ["Employer Cont.", libEmployer],
                  ] as const
                ).map(([title, items]) =>
                  items.length ? (
                    <div
                      key={title}
                      className="rounded-wz-lg border border-wz-border bg-white p-wz-3"
                    >
                      <p className="m-0 mb-2 text-xs font-semibold text-wz-text-secondary">
                        {title}
                      </p>
                      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                        {items.map((comp) => (
                          <label
                            key={comp.code}
                            className={cn(
                              "inline-flex cursor-pointer items-center gap-2 rounded-wz-md px-2 py-1.5 text-sm",
                              selectedManualCodes.includes(comp.code)
                                ? "bg-wz-hover"
                                : "hover:bg-wz-neutral-50",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={selectedManualCodes.includes(comp.code)}
                              onChange={() => handleToggleManualComponent(comp)}
                              disabled={calculating || saving}
                            />
                            {comp.name}
                            {isCalendarDaily &&
                            String(comp.code).toUpperCase() === "BASIC"
                              ? " (required)"
                              : ""}
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}

          {manualMatch && safeComponents.length > 0 ? (
            <div
              className={cn(
                "rounded-wz-md border px-3.5 py-3 text-sm",
                manualMatch.status === "ok"
                  ? "border-[#a6f4c5] bg-[#ecfdf3] text-[#027a48]"
                  : manualMatch.status === "empty"
                    ? "border-wz-border bg-wz-neutral-50 text-wz-text-secondary"
                    : "border-[#fecdca] bg-[#fef3f2] text-wz-error",
              )}
              role="status"
            >
              {manualMatch.message}
            </div>
          ) : null}
        </div>
      ) : null}

      {safeComponents.length > 0 ? (
        <div className="flex flex-col gap-wz-3">
          {inputMode === "manual" && isRevising ? (
            <p className="m-0 text-xs font-semibold text-wz-text-secondary">
              4. Review / tweak amounts
              {isDaily
                ? " (per day)"
                : isCalendarDaily
                  ? " (monthly preview)"
                  : " (monthly)"}
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-wz-4 md:grid-cols-2">
            {(
              [
                ["Earnings", earnings],
                ["Deductions", deductions],
                ...(employerContributions.length
                  ? ([["Employer Cont.", employerContributions]] as const)
                  : []),
              ] as const
            ).map(([title, items]) => (
              <div
                key={title}
                className="overflow-hidden rounded-wz-lg border border-wz-border bg-white"
              >
                <div className="flex items-center justify-between border-b border-wz-border bg-wz-neutral-50 px-wz-4 py-wz-3">
                  <span className="text-sm font-semibold text-wz-text-primary">
                    {title}
                    {isDaily ? " (per day)" : ""}
                  </span>
                  <span className="text-xs text-wz-text-secondary">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col divide-y divide-wz-border">
                  {items.length ? (
                    items.map((c) => {
                      const val = c[amountKey] ?? c.monthlyAmount ?? 0;
                      return (
                        <div
                          key={c.code}
                          className="flex items-center justify-between gap-3 px-wz-4 py-wz-3"
                        >
                          <div className="min-w-0">
                            <p className="m-0 truncate text-sm font-medium text-wz-text-primary">
                              {c.name}
                            </p>
                            <p className="m-0 text-[11px] text-wz-text-secondary">
                              {c.calculationType || "Custom"}
                              {c.isPartOfCTC === false ? " · Outside CTC" : ""}
                            </p>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            className="w-28"
                            value={val === 0 ? "" : String(val)}
                            onChange={(e) =>
                              updateComponentAmount(
                                String(c.code),
                                e.target.value,
                              )
                            }
                            disabled={!isRevising || calculating || saving}
                            placeholder="0"
                          />
                        </div>
                      );
                    })
                  ) : (
                    <p className="m-0 px-wz-4 py-wz-4 text-sm text-wz-text-secondary">
                      No {title.toLowerCase()} configured.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Expose draft presence for parents that only check hasSalaryData */}
      <span className="sr-only" data-has-salary={hasSalaryData(getDraft())}>
        salary-editor
      </span>
    </div>
  );
});

export default EmployeeSalaryStructureEditor;
export { hasSalaryData };
