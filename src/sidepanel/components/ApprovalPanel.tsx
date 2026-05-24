import type { ApprovalChoice, ApprovalRequestEvent } from '../types';

interface ApprovalPanelProps {
  approvals: ApprovalRequestEvent[];
  onRespond: (request: ApprovalRequestEvent, choice: ApprovalChoice) => Promise<void>;
}

const choices: Array<{ choice: ApprovalChoice; label: string }> = [
  { choice: 'once', label: 'Allow Once' },
  { choice: 'session', label: 'Allow Session' },
  { choice: 'always', label: 'Always Allow' },
  { choice: 'deny', label: 'Deny' },
];

export function ApprovalPanel({ approvals, onRespond }: ApprovalPanelProps) {
  if (approvals.length === 0) return null;

  return (
    <section className="approval-stack" aria-label="Pending approvals">
      {approvals.map((approval, index) => (
        <article className="approval-card" key={`${approval.approvalSessionKey}-${approval.timestamp ?? index}`}>
          <div className="approval-header">
            <span className="approval-title">Permission required</span>
            {approval.description && <span className="approval-reason">{approval.description}</span>}
          </div>
          <pre className="approval-command">{approval.command}</pre>
          <div className="approval-actions">
            {choices.map(({ choice, label }) => (
              <button
                className={choice === 'deny' ? 'secondary-button danger-button' : 'secondary-button'}
                type="button"
                key={choice}
                onClick={() => void onRespond(approval, choice)}
              >
                {label}
              </button>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
