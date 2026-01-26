import React, { useState } from "react";
import { DraftParticipant, DraftOrderConstructor, DraftOrder } from "../../../services/draftService";
import "./DraftOrderList.scss";

/**
 * Props for DraftOrderList component
 */
export interface DraftOrderListProps {
  draftOrderData?: DraftOrder;
  currentDraftIndex?: number;
  isMyTurn?: boolean;
  userId?: string;
  isManager?: boolean;
  leagueId?: number;
  raceId?: number;
}

/**
 * DraftOrderList component
 * Displays the draft order with rotation, sequential pattern, and manager edit capabilities
 */
const DraftOrderList: React.FC<DraftOrderListProps> = ({
  draftOrderData,
  currentDraftIndex = 0,
  isMyTurn = false,
  userId,
  isManager = false,
  leagueId,
  raceId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editOrder, setEditOrder] = useState<DraftOrderConstructor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const participants = draftOrderData?.order || [];
  const isRotated = draftOrderData?.is_rotated || false;
  const rotationReason = draftOrderData?.rotation_reason;
  const allowDraftChange = draftOrderData?.allow_draft_change || false;

  const getDraftStatus = (
    index: number
  ): "PENDING" | "ACTIVE" | "COMPLETE" => {
    if (index < currentDraftIndex) return "COMPLETE";
    if (index === currentDraftIndex) return "ACTIVE";
    return "PENDING";
  };

  const getPickPattern = (index: number, totalParticipants: number): string => {
    // Sequential pattern: 1,2,3,4,5 then 1,2,3,4,5 for second picks
    const round = Math.floor(index / totalParticipants) + 1;
    const positionInRound = (index % totalParticipants) + 1;
    return `Round ${round}, Pick ${positionInRound}`;
  };

  const handleStartEdit = () => {
    if (!allowDraftChange || !isManager) return;
    setEditOrder([...participants]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditOrder([]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...editOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setEditOrder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === editOrder.length - 1) return;
    const newOrder = [...editOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setEditOrder(newOrder);
  };

  const handleSaveOrder = async () => {
    if (!leagueId || !raceId) return;
    
    setIsLoading(true);
    try {
      const order = editOrder.map((item) => item.constructor_id);
      // await updateDraftOrder(leagueId, raceId, order);
      setIsEditing(false);
      setEditOrder([]);
      // Optionally refresh the draft order data
    } catch (error) {
      console.error("Failed to update draft order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderParticipantRow = (
    participant: DraftOrderConstructor,
    index: number,
    isEditable: boolean
  ) => {
    const status = getDraftStatus(index);
    const isCurrentUser = userId && participant.user_id === userId;
    const pickPattern = getPickPattern(index, participants.length);

    return (
      <div
        key={`${participant.constructor_id}-${index}`}
        className={`draft-order-list__row ${
          isCurrentUser ? "draft-order-list__row--current-user" : ""
        } ${isEditable ? "draft-order-list__row--editable" : ""}`}
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
          {!isEditable && (
            <div className="draft-order-list__pick-pattern">
              {pickPattern}
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
            {participant.constructor_name}
          </div>
        </div>

        {isEditable && (
          <div className="draft-order-list__edit-controls">
            <button
              className="draft-order-list__edit-btn"
              onClick={() => handleMoveUp(index)}
              disabled={index === 0}
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              className="draft-order-list__edit-btn"
              onClick={() => handleMoveDown(index)}
              disabled={index === editOrder.length - 1}
              aria-label="Move down"
            >
              ↓
            </button>
          </div>
        )}

        <div className="draft-order-list__pick">
          {participant.picks && participant.picks.length > 0 ? (
            <div className="draft-order-list__picks">
              {participant.picks.map((pick, pickIndex) => (
                <div key={pickIndex} className="draft-order-list__driver-pick">
                  <div className="draft-order-list__driver-number">
                    {pick.driver.number}
                  </div>
                  <div className="draft-order-list__driver-info">
                    <div className="draft-order-list__driver-name">
                      {pick.driver.name}
                    </div>
                    <div className="draft-order-list__driver-team">
                      {pick.driver.team}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`draft-order-list__status draft-order-list__status--${status.toLowerCase()}`}>
              {status === "PENDING" && "Waiting..."}
              {status === "ACTIVE" && "Selecting..."}
              {status === "COMPLETE" && "No picks yet"}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="draft-order-list">
      <div className="draft-order-list__header">
        <div className="draft-order-list__header-left">
          <h3 className="draft-order-list__title">Draft Order</h3>
          {isRotated && (
            <div className="draft-order-list__rotation-badge">
              <span className="draft-order-list__rotation-icon">↻</span>
              Rotated
            </div>
          )}
        </div>
        
        {allowDraftChange && isManager && !isEditing && (
          <button
            className="draft-order-list__edit-order-btn"
            onClick={handleStartEdit}
          >
            <span>✏️</span> Edit Order
          </button>
        )}
        
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

      {rotationReason && (
        <div className="draft-order-list__rotation-info">
          <span className="draft-order-list__rotation-info-label">Rotation:</span>
          {rotationReason}
        </div>
      )}

      <div className="draft-order-list__content">
        {participants.length === 0 ? (
          <div className="draft-order-list__empty">
            No participants in draft yet
          </div>
        ) : (
          (isEditing ? editOrder : participants).map((participant, index) =>
            renderParticipantRow(participant, index, isEditing)
          )
        )}
      </div>

      {isEditing && (
        <div className="draft-order-list__edit-footer">
          <button
            className="draft-order-list__edit-footer-btn draft-order-list__edit-footer-btn--cancel"
            onClick={handleCancelEdit}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="draft-order-list__edit-footer-btn draft-order-list__edit-footer-btn--save"
            onClick={handleSaveOrder}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Order"}
          </button>
        </div>
      )}

      {isMyTurn && !isEditing && (
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
