import React, { useMemo, useState } from "react";
import { Input } from "reactstrap";
import "./questions.css";

const MAX_SUGGESTIONS = 50;
const nameOf = (s) => (typeof s === "string" ? s : s?.title ?? s?.name ?? "");

/**
 * Search-and-add skill picker for a question: a search box with suggestions
 * and the selected skills as wrapping chips (× to remove).
 */
export default function QuestionSkillsEditor({ allSkills = [], skills = [], onChange, disabled = false }) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);

    const selected = useMemo(() => new Set(skills.map(nameOf)), [skills]);
    const suggestions = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = allSkills.map(nameOf).filter((n) => n && !selected.has(n));
        return (q ? list.filter((n) => n.toLowerCase().includes(q)) : list).slice(0, MAX_SUGGESTIONS);
    }, [allSkills, selected, query]);

    const add = (name) => {
        if (!name || selected.has(name)) return;
        onChange?.([...skills, name]);
        setQuery("");
        setActive(0);
    };

    const remove = (name) => onChange?.(skills.filter((s) => nameOf(s) !== name));

    const onKeyDown = (e) => {
        if (!open && (e.key === "ArrowDown" || e.key === "Enter")) setOpen(true);
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (suggestions[active]) add(suggestions[active]);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div>
            {!disabled && (
                <div className="q-skill-search">
                    <Input
                        type="text"
                        value={query}
                        placeholder="Search and add skills…"
                        aria-label="Search skills"
                        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
                        onFocus={() => setOpen(true)}
                        onBlur={() => setTimeout(() => setOpen(false), 150)}
                        onKeyDown={onKeyDown}
                    />
                    {open && (
                        <div className="q-skill-suggestions" role="listbox">
                            {suggestions.length ? (
                                suggestions.map((n, i) => (
                                    <div
                                        key={n}
                                        role="option"
                                        aria-selected={i === active}
                                        className={`q-skill-suggestion ${i === active ? "is-active" : ""}`}
                                        onMouseDown={(e) => { e.preventDefault(); add(n); }}
                                        onMouseEnter={() => setActive(i)}
                                    >
                                        {n}
                                    </div>
                                ))
                            ) : (
                                <div className="q-skill-suggestion is-muted">No matching skills</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {skills.length ? (
                <div className="q-skill-chips">
                    {skills.map((s) => {
                        const n = nameOf(s);
                        return (
                            <span key={n} className="q-skill-chip" title={n}>
                                <span>{n}</span>
                                {!disabled && (
                                    <button type="button" aria-label={`Remove ${n}`} onClick={() => remove(n)}>
                                        ×
                                    </button>
                                )}
                            </span>
                        );
                    })}
                </div>
            ) : (
                <div className="q-skill-empty">No skills added to this question yet.</div>
            )}
        </div>
    );
}
