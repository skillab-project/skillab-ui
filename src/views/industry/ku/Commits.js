import React from "react";
import CommitCard from "./CommitCard";

const Commits= ({ commits, loading }) => {
  // If loading, show skeleton loaders
  if (loading) {
    return (
      <div className="space-y-4">
      </div>
    );
  } else if (commits.length === 0) {
    // If no commits, show empty state
    return (
      <div className="flex flex-col items-center justify-center h-full">
        {/* <Inbox className="w-12 h-12 text-gray-500 mb-4" /> */}
        <p className="text-xl text-gray-500">No commits yet</p>
      </div>
    );
  }

  // Show commits
  return (
    <div className="space-y-4">
      {commits.map((commit) => (
        <CommitCard key={commit.sha} commit={commit} />
      ))}
    </div>
  );
};

export default Commits;