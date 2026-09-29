import React, { useState, useEffect } from 'react';
import { Collapse } from 'reactstrap';
import { scoreVariant } from './candidateUi';
import '../Interview/interview.css';
import './Candidates.css';

const API_BASE = process.env.REACT_APP_API_URL_HIRING_MANAGEMENT;

/* Score pill coloured by value (0–100) */
function ScorePill({ value }) {
    const v = Number(value);
    const has = value !== null && value !== undefined && value !== '' && Number.isFinite(v);
    return (
        <span className={`cand-score cand-score--${scoreVariant(value)}`} title="Average score">
            {has ? `${v}%` : '—'}
        </span>
    );
}

export default function StepsDropDown({
    steps = [],
    ratings = {},
    onSelect,
    showScore = true,
    interviewReportId,
    candidateId,
}) {
    const [openIndex, setOpenIndex] = useState(null);
    const [selectedKey, setSelectedKey] = useState(null);

    // a different candidate → nothing selected
    useEffect(() => { setSelectedKey(null); }, [candidateId]);

    /** ---------- Backend metrics cache ---------- */
    const [metricsByQ, setMetricsByQ] = useState({});
    const allQids = (steps ?? [])
        .flatMap((s) => (s?.questions ?? []).map((q) => q?.id))
        .filter(Boolean);

    // fetch metrics είτε με interviewReportId είτε (fallback) με candidateId
    useEffect(() => {
        const hasIds = allQids.length > 0;
        const shouldFetch = showScore && hasIds && (interviewReportId || candidateId);
        if (!shouldFetch) {
            setMetricsByQ({});
            return;
        }

        const qs = allQids.join(',');
        const base = interviewReportId
            ? `${API_BASE}/api/v1/question-scores/metrics-by-report?interviewReportId=${encodeURIComponent(
                interviewReportId
            )}`
            : `${API_BASE}/api/v1/question-scores/metrics?candidateId=${encodeURIComponent(
                candidateId
            )}`;
        const url = `${base}&questionIds=${encodeURIComponent(qs)}`;

        let alive = true;
        (async () => {
            try {
                const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } });
                if (!r.ok) return;
                const data = await r.json(); // [{questionId,totalSkills,ratedSkills,averageScore}]
                if (!alive) return;
                const map = {};
                for (const m of data || []) {
                    if (m && m.questionId != null) map[m.questionId] = m;
                }
                setMetricsByQ(map);
            } catch {
                // ignore
            }
        })();

        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showScore, interviewReportId, candidateId, steps]);

    /* ---------- Helpers για Fallback υπολογισμών (όταν δεν έχουμε __metrics) ---------- */

    const makeSkillKey = (stepName, skill) => {
        const sName = typeof skill === 'string' ? skill : skill?.name || String(skill);
        return `${stepName}::${sName}`;
    };

    // Question stats από ratings (fallback)
    const computeQuestionStatsFallback = (question, step) => {
        const stepName = step?.name || 'step';
        const skills = Array.isArray(question?.skills) ? question.skills : [];
        const ids = skills.map((sk) => makeSkillKey(stepName, sk));

        const total = ids.length;
        const vals = ids
            .map((id) => ratings[id]?.value)
            .filter((v) => Number.isFinite(v));
        const ratedCount = vals.length;
        const complete = total > 0 && ratedCount === total;

        const avg =
            ratedCount > 0
                ? Math.round(vals.reduce((a, b) => a + b, 0) / ratedCount)
                : null;

        return { avg, ratedCount, total, complete };
    };

    // Step stats από τα question-stats (fallback)
    const computeStepStatsFallback = (step) => {
        const qs = Array.isArray(step?.questions) ? step.questions : [];
        const totalQ = qs.length;

        let counted = 0;
        let sumAvgs = 0;
        let fullyRatedQ = 0;

        for (const q of qs) {
            const { avg, ratedCount, total, complete } = computeQuestionStatsFallback(q, step);
            if (ratedCount > 0) {
                counted += 1;
                sumAvgs += avg ?? 0;
            }
            if (complete) fullyRatedQ += 1;
        }

        const avg = counted > 0 ? Math.round(sumAvgs / counted) : null;

        return {
            avg,
            ratedQuestions: fullyRatedQ,
            totalQuestions: totalQ,
        };
    };

    /* ---------- Επιλογή πηγής μετρικών (backend-first, με merge, αλλιώς fallback) ---------- */

    const getQuestionMetrics = (q, step) => {
        const remote = q?.id ? metricsByQ[q.id] : null; // από backend
        const local = q?.__metrics || {}; // από refreshMetrics

        // total: προτίμηση στο τοπικό αν είναι >0, αλλιώς backend, αλλιώς 0
        const total =
            Number.isFinite(local.totalSkills) && local.totalSkills > 0
                ? local.totalSkills
                : Number.isFinite(remote?.totalSkills)
                    ? remote.totalSkills
                    : 0;

        // rated: μέγιστο από local/remote
        const ratedCount = Math.max(
            Number.isFinite(local.ratedSkills) ? local.ratedSkills : 0,
            Number.isFinite(remote?.ratedSkills) ? remote.ratedSkills : 0
        );

        // avg: προτίμηση στο τοπικό αν υπάρχει, αλλιώς backend
        const avg = Number.isFinite(local.averageScore)
            ? local.averageScore
            : Number.isFinite(remote?.averageScore)
                ? remote.averageScore
                : null;

        return {
            total,
            ratedCount,
            avg,
            complete: total > 0 && ratedCount === total,
        };
    };

    const getStepMetrics = (step) => {
        if (step?.__metrics) {
            const {
                totalQuestions = 0,
                ratedQuestions = 0,
                averageScore = null,
            } = step.__metrics || {};
            return { totalQuestions, ratedQuestions, avg: averageScore };
        }
        // Αν έχουμε backend question metrics, συνθέτουμε step metrics από αυτά
        const qs = Array.isArray(step?.questions) ? step.questions : [];
        const totalQuestions = qs.length;
        if (totalQuestions > 0 && Object.keys(metricsByQ).length > 0) {
            let ratedQuestions = 0;
            let sum = 0,
                cnt = 0;

            for (const q of qs) {
                const m = q?.id ? metricsByQ[q.id] : null;
                if (!m) continue;

                // fallback: __metrics.totalSkills ή q.skills.length
                const totalSkillsForQ = Number.isFinite(m?.totalSkills)
                    ? m.totalSkills
                    : Number.isFinite(q?.__metrics?.totalSkills)
                        ? q.__metrics.totalSkills
                        : Array.isArray(q?.skills)
                            ? q.skills.length
                            : 0;

                if (
                    totalSkillsForQ > 0 &&
                    Number.isFinite(m.ratedSkills) &&
                    m.ratedSkills === totalSkillsForQ
                ) {
                    ratedQuestions += 1;
                }

                if (Number.isFinite(m.averageScore)) {
                    sum += m.averageScore;
                    cnt += 1;
                }
            }

            const avg = cnt ? Math.round(sum / cnt) : null;
            return { totalQuestions, ratedQuestions, avg };
        }
        // Fallback από ratings/skills
        return computeStepStatsFallback(step);
    };

    /* -------------------------------- UI -------------------------------- */

    if (!steps.length) {
        return (
            <div className="iv-empty">
                <i className="nc-icon nc-bullet-list-67" />
                This job ad has no interview steps yet.
            </div>
        );
    }

    return (
        <div className="iv-steps cand-steps">
            {steps.map((step, idx) => {
                const isOpen = openIndex === idx;
                const stepStats = getStepMetrics(step);
                const totalQ = stepStats.totalQuestions ?? 0;
                const ratedQ = stepStats.ratedQuestions ?? 0;

                return (
                    <div key={step.id ?? step.name ?? idx} className={`iv-step ${isOpen ? 'is-open is-selected' : ''}`}>
                        <div
                            className="iv-step-header"
                            role="button"
                            aria-expanded={isOpen}
                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                        >
                            <span className="iv-step-num">{idx + 1}</span>
                            <span className="iv-step-text">
                                <span className="iv-step-title" title={step.name ?? step.title}>{step.name ?? step.title}</span>
                                <span className="cand-step-meta">
                                    {totalQ} question{totalQ === 1 ? '' : 's'}
                                    {showScore && ` · ${ratedQ}/${totalQ} fully rated`}
                                </span>
                            </span>
                            {showScore && <ScorePill value={stepStats.avg} />}
                            <i className="nc-icon nc-minimal-down iv-chevron" />
                        </div>

                        <Collapse isOpen={isOpen}>
                            <div className="cand-questions">
                                {(step.questions ?? []).length === 0 && (
                                    <div className="cand-step-meta" style={{ paddingTop: 8 }}>No questions in this step.</div>
                                )}
                                {(step.questions ?? []).map((q, i) => {
                                    const qStats = showScore ? getQuestionMetrics(q, step) : null;
                                    const skillsCountFromMetrics =
                                        (q?.id && metricsByQ[q.id]?.totalSkills) ?? q?.__metrics?.totalSkills;
                                    const skillsCount = Number.isFinite(skillsCountFromMetrics)
                                        ? skillsCountFromMetrics
                                        : q?.skills?.length ?? 0;
                                    const denom = qStats?.total && qStats.total > 0 ? qStats.total : skillsCount;
                                    const key = `${step.id ?? idx}:${q.id ?? i}`;
                                    const isSel = selectedKey === key;

                                    return (
                                        <button
                                            key={q.id ?? `${step.name}::${i}`}
                                            type="button"
                                            className={`cand-question ${isSel ? 'is-selected' : ''}`}
                                            onClick={() => {
                                                setSelectedKey(key);
                                                onSelect?.(step, q);
                                            }}
                                            title={q.question}
                                        >
                                            <span className="cand-question-text">{q.question}</span>
                                            {showScore && (
                                                <>
                                                    <span className="cand-question-meta">
                                                        {qStats?.ratedCount ?? 0}/{denom} skills rated
                                                    </span>
                                                    <ScorePill value={qStats?.avg} />
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </Collapse>
                    </div>
                );
            })}
        </div>
    );
}
