import React, { useMemo } from "react";
import Select from "react-select";
import { NACE_SECTOR_OPTIONS } from "../variables/naceSectors";

/**
 * SectorSelect — searchable dropdown of NACE sectors (variables/naceSectors.js),
 * grouped by NACE section. Use it wherever the user has to pick a sector.
 *
 * Props:
 *   value         selected sector name ("" / null for none)
 *   onChange      called with the sector name ("" when cleared)
 *   inputId       id for the input (so a <Label for=…> can point at it)
 *   placeholder   placeholder text
 *   exclude       sector names to hide (e.g. ones already added)
 *   extraOptions  additional names to offer that aren't in the NACE list
 *                 (e.g. sectors already stored by older records)
 *   preferredOptions  names shown first, in their own group (e.g. the
 *                 organization's own sectors); preferredLabel names that group
 *   isClearable, isDisabled, menuPortal (default true: render the menu on
 *   <body> so it isn't clipped inside cards/modals)
 */
function SectorSelect({
  value,
  onChange,
  inputId,
  placeholder = "Select a sector…",
  exclude = [],
  extraOptions = [],
  preferredOptions = [],
  preferredLabel = "Suggested",
  isClearable = true,
  isDisabled = false,
  menuPortal = true,
}) {
  const options = useMemo(() => {
    const excluded = new Set(exclude);
    const known = new Set();
    const groups = NACE_SECTOR_OPTIONS.map((g) => {
      g.options.forEach((o) => known.add(o.value));
      return { ...g, options: g.options.filter((o) => !excluded.has(o.value)) };
    }).filter((g) => g.options.length);

    // Values that aren't NACE sectors (older data) stay selectable/visible.
    const others = [...new Set([...extraOptions, value].filter(Boolean))]
      .filter((s) => !known.has(s) && !excluded.has(s))
      .map((s) => ({ value: s, label: s }));
    const preferred = [...new Set(preferredOptions.filter(Boolean))]
      .filter((s) => !excluded.has(s))
      .map((s) => ({ value: s, label: s }));
    const preferredSet = new Set(preferred.map((o) => o.value));
    const otherOpts = others.filter((o) => !preferredSet.has(o.value));

    return [
      ...(preferred.length ? [{ label: preferredLabel, options: preferred }] : []),
      ...(otherOpts.length ? [{ label: "Other", options: otherOpts }] : []),
      ...groups,
    ];
  }, [exclude, extraOptions, preferredOptions, preferredLabel, value]);

  const selected = value ? { value, label: value } : null;

  return (
    <Select
      inputId={inputId}
      options={options}
      value={selected}
      onChange={(opt) => onChange(opt ? opt.value : "")}
      placeholder={placeholder}
      isClearable={isClearable}
      isDisabled={isDisabled}
      noOptionsMessage={() => "No matching sector"}
      menuPortalTarget={menuPortal && typeof document !== "undefined" ? document.body : undefined}
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        groupHeading: (base) => ({ ...base, fontWeight: 700, color: "#51cbce" }),
        container: (base) => ({ ...base, flex: 1, minWidth: 0 }),
      }}
    />
  );
}

export default SectorSelect;
