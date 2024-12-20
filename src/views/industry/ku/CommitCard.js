import React from "react";
import { Card } from "reactstrap"
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";


const CommitCard = ({ commit }) => {
  const formattedTimestamp = new Date(commit.timestamp).toLocaleString();

  return (
    <Card key={commit.sha}>
      <Avatar>
        <AvatarImage
          src={`https://github.com/${commit.author}.png`}
          alt={commit.author}
        />
        <AvatarFallback>{commit.author.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <p className="text-sm font-medium">{commit.sha}</p>
        <p className="text-sm text-gray-500">{formattedTimestamp}</p>
      </div>
      <div>
        <p className="text-sm font-medium">
          {commit.file_changes.length} files changed
        </p>
      </div>
    </Card>
  );
};

export default CommitCard;