import React, { useState } from 'react';
import { Collapse } from 'reactstrap';
import OccupationDropdown, { StatusSummary } from './OccupationDropDown';
import './DepartmentDropdown.css';

function DepartmentDropdown({
    departments = [],
    onJobAdSelect,
    selectedJobAdId,
    onDepartmentSelect,
    selectedDepartmentId = null,
    onOccupationSelect,
    selectedOccupationId = null,
    expandAll = false,
}) {
    const [openDepartmentIndex, setOpenDepartmentIndex] = useState(null);

    const isActiveDept = (dept) => {
        if (selectedDepartmentId != null && dept.departmentId != null) {
            return Number(selectedDepartmentId) === Number(dept.departmentId);
        }
        return false;
    };

    const handleDepartmentClick = (dept, index) => {
        const isClosing = openDepartmentIndex === index;

        onDepartmentSelect?.({ id: dept.departmentId ?? null, name: dept.department });

        // toggle
        setOpenDepartmentIndex(isClosing ? null : index);

        // clear selections when the department closes or changes
        onOccupationSelect?.(null);
        onJobAdSelect?.(null);
    };

    return (
        <div className="dept-root">
            {departments.map((dept, index) => {
                const isOpen = expandAll || openDepartmentIndex === index;
                const occs = dept.occupations || [];
                const jobs = occs.flatMap((o) => o.jobTitles || []);

                return (
                    <div
                        key={`${dept.department}-${dept.departmentId ?? index}`}
                        className={`ja-dept ${isOpen ? 'is-open' : ''} ${isActiveDept(dept) ? 'is-active' : ''}`}
                    >
                        <button
                            type="button"
                            onClick={() => handleDepartmentClick(dept, index)}
                            className="ja-dept-header"
                            aria-expanded={isOpen}
                            title={dept.department}
                        >
                            <span className="ja-dept-icon">
                                <i className="nc-icon nc-bank" />
                            </span>
                            <span className="ja-dept-text">
                                <span className="ja-dept-name truncate-1">{dept.department}</span>
                                <span className="ja-dept-meta">
                                    {occs.length} occupation{occs.length === 1 ? '' : 's'} · {jobs.length} job ad{jobs.length === 1 ? '' : 's'}
                                </span>
                            </span>
                            <StatusSummary jobs={jobs} />
                            <i className="nc-icon nc-minimal-down ja-chevron" />
                        </button>

                        <Collapse isOpen={isOpen}>
                            <div className="ja-dept-body">
                                {/* remount when opening/closing so the inner state resets */}
                                <OccupationDropdown
                                    key={`${dept.departmentId ?? index}-${isOpen ? 'open' : 'closed'}`}
                                    occupations={occs}
                                    onJobAdSelect={onJobAdSelect}
                                    selectedJobAdId={selectedJobAdId}
                                    parentDepartmentId={dept.departmentId ?? selectedDepartmentId ?? null}
                                    onOccupationSelect={onOccupationSelect}
                                    selectedOccupationId={selectedOccupationId}
                                    expandAll={expandAll}
                                />
                            </div>
                        </Collapse>
                    </div>
                );
            })}
        </div>
    );
}

export default DepartmentDropdown;
