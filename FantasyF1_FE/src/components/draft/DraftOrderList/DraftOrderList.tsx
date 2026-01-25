import React from "react";
import { DraftParticipant } from "../../../services/draftService";
import "./DraftOrderList.scss";

/**
 * Props for DraftOrderList component
 */
export interface DraftOrderListProps {
  participants: DraftParticipant[];
  currentDraftIndex?: number;
  isMyTurn?: boolean;
  userId?: string;
}

/**
 * DraftOrderList component
 * Displays the draft order with pick status
 */
const DraftOrderList: React.FC<DraftOrderListProps> = ({
  participants,
  currentDraftIndex = 0,
  isMyTurn = false,
  userId,
}) => {
  const getDraftStatus = (
    index: number
  ): "PENDING" | "ACTIVE" | "COMPLETE" => {
    if (index < currentDraftIndex) return "COMPLETE";
    if (index === currentDraftIndex) return "ACTIVE";
    return "PENDING";
  };

  const renderParticipantRow = (
    participant: DraftParticipant,
    index: number
  ) => {
    const status = getDraftStatus(index);
    const isCurrentUser = userId && participant.user_id === userId;
    const hasPick = participant.selected_driver && status === "COMPLETE";

    return (
      <div
        key={participant.user_id}
        className={`draft-order-list__row ${
          isCurrentUser ? "draft-order-list__row--current-user" : ""
        }`}
      >
        <div className="draft-order-list__pick-number">
          <div className="draft-order-list__badge">
            {index + 1}
          </div>
          {status === "ACTIVE" && (
            <div className="draft-order-list__indicator draft-order-list__indicator--active">
              <span className="dot" />
              Current
            </div>
          )}
        </div>

        <div className="draft-order-list__user">
          <div className="draft-order-list__username">
            {participant.username}
            {isCurrentUser && (
              <span className="draft-order-list__you-badge">You</span>
            )}
          </div>
          <div className="draft-order-list__team-name">
            {participant.team_name}
          </div>
        </div>

        <div className="draft-order-list__pick">
          {hasPick ? (
            <div className="draft-order-list__driver-pick">
              <div className="draft-order-list__driver-number">
                {participant.selected_driver!.number}
              </div>
              <div className="draft-order-list__driver-info">
                <div className="draft-order-list__driver-name">
                  {participant.selected_driver!.name}
                </div>
                <div className="draft-order-list__driver-team">
                  {participant.selected_driver!.team}
                </div>
              </div>
            </div>
          ) : (
            <div className={`draft-order-list__status draft-order-list__status--${status.toLowerCase()}`}>
              {status === "PENDING" && "Waiting..."}
              {status === "ACTIVE" && "Selecting..."}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="draft-order-list">
      <div className="draft-order-list__header">
        <h3 className="draft-order-list__title">Draft Order</h3>
        <div className="draft-order-list__legend">
          <div className="draft-order-list__legend-item">
            <span className="dot dot--pending" />
            <span>Pending</span>
          </div>
          <div className="draft-order-list__legend-item">
            <span className="dot dot--active" />
            <span>Active</span>
          </div>
          <div className="draft-order-list__legend-item">
            <span className="dot dot--complete" />
            <span>Complete</span>
          </div>
        </div>
      </div>

      <div className="draft-order-list__content">
        {participants.length === 0 ? (
          <div className="draft-order-list__empty">
            No participants in draft yet
          </div>
        ) : (
          participants.map((participant, index) =>
            renderParticipantRow(participant, index)
          )
        )}
      </div>

      {isMyTurn && (
        <div className="draft-order-list__notification">
          <div className="draft-order-list__notification-icon">⚡</div>
          <div className="draft-order-list__notification-text">
            It's your turn to pick!
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftOrderList;
