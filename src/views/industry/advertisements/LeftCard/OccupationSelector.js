import React from 'react';
import DepartmentDropdown from './DepartmentDropDown';
import "./sidebar.css";

function OccupationSelector({
    departments = [],
    loading = false,
    onJobAdSelect,
    selectedJobAdId,
    onDepartmentSelect,
    selectedDepartmentId = null,
    onOccupationSelect,
    selectedOccupationId = null,
}) {
    return (
        <div className="d-flex flex-column occ-col" style={{ minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0 }}>
                {loading && departments.length === 0 ? (
                    <div className="ja-empty">
                        <div className="lds-dual-ring" />
                        <div>Loading job ads…</div>
                    </div>
                ) : departments.length === 0 ? (
                    <div className="ja-empty">
                        <i className="nc-icon nc-paper" />
                        No job ads yet. Use <b>Create Job Ad</b> to add your first one.
                    </div>
                ) : (
                    <DepartmentDropdown
                        departments={departments}
                        onJobAdSelect={onJobAdSelect}
                        selectedJobAdId={selectedJobAdId}
                        onDepartmentSelect={onDepartmentSelect}
                        selectedDepartmentId={selectedDepartmentId}
                        onOccupationSelect={onOccupationSelect}
                        selectedOccupationId={selectedOccupationId}
                    />
                )}
            </div>
        </div>
    );
}

export default OccupationSelector;
