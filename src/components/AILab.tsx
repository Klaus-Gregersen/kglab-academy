import { useState } from 'react';

const evidence =
  'Checkout returned HTTP 503 from 09:12 to 09:18. Recovery was observed after a rollback. Root cause is not confirmed.';
export function AILab({ lesson, onComplete }: { lesson: string; onComplete: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [step, setStep] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [goal, setGoal] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const change = (key: string, value: string) => {
    setAnswers((before) => ({ ...before, [key]: value }));
    setFeedback('');
  };
  const select = (key: string, label: string, choices: [string, string][]) => (
    <label className="ai-field" key={key}>
      <span>{label}</span>
      <select
        value={answers[key] ?? ''}
        onChange={(event) => change(key, event.target.value)}
        required
      >
        <option value="">Choose an answer</option>
        {choices.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
  function done(message: string) {
    setFeedback(message);
    onComplete();
  }
  return (
    <section className="ai-lab" aria-label="AI learning activity">
      <p className="simulation-note">
        Prepared learning examples · No live model, tool access, or API key
      </p>
      {lesson === 'model' && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (
              answers.generate === 'model' &&
              answers.chat === 'application' &&
              answers.tools === 'agent'
            )
              done(
                'Matched. The model generates output; the application manages the interface; the agent program controls a tool loop.',
              );
            else
              setFeedback(
                'Look again at each role. An interface alone is not an agent, and a model alone does not execute tools.',
              );
          }}
        >
          {[
            ['generate', 'Generates text from the supplied input'],
            ['chat', 'A chat screen that manages conversation messages'],
            ['tools', 'A program lets a model choose tools, observes results, and continues'],
          ].map(([key, label]) =>
            select(key, label, [
              ['model', 'Model'],
              ['application', 'Application'],
              ['agent', 'Agent'],
            ]),
          )}
          <button className="button-primary">Check my matches →</button>
        </form>
      )}
      {lesson === 'prompt' && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (goal.trim().length < 12) {
              setFeedback('Write a goal of at least 12 characters after trimming spaces.');
              return;
            }
            if (
              answers.context !== 'incident' ||
              answers.boundary !== 'evidence' ||
              answers.format !== 'bullets'
            ) {
              setFeedback(
                'Choose relevant incident evidence, keep uncertainty explicit, and use the requested three-bullet format.',
              );
              return;
            }
            setPrompt(
              `${goal.trim()}\n\nEvidence:\n${evidence}\n\nUse only the evidence. State uncertainty; do not invent a root cause.\n\nReturn three bullets: impact, observed recovery, unknowns.`,
            );
            done(
              'Prompt assembled. This checks the chosen structure, not the quality of an AI answer. Compare any future answer with the incident evidence.',
            );
          }}
        >
          <div className="ai-evidence">
            <strong>Incident note</strong>
            <p>{evidence}</p>
          </div>
          <label className="ai-field">
            <span>Goal: write an instruction for the next engineer’s handover</span>
            <textarea
              required
              minLength={12}
              maxLength={500}
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Summarise this incident for the next engineer…"
            />
          </label>
          {select('context', 'Relevant context', [
            ['incident', 'Include the supplied incident note'],
            ['marketing', 'Include our product marketing description'],
          ])}
          {select('boundary', 'Evidence boundary', [
            ['evidence', 'Use evidence only and state unknowns'],
            ['guess', 'Invent a confident root cause'],
          ])}
          {select('format', 'Output format', [
            ['bullets', 'Three bullets: impact, recovery, unknowns'],
            ['essay', 'An unrestricted essay'],
          ])}
          <label className="ai-check">
            <input
              type="checkbox"
              required
              checked={reviewed}
              onChange={(event) => setReviewed(event.target.checked)}
            />
            I checked that my goal can be answered from the supplied evidence.
          </label>
          <button className="button-primary">Build my prompt →</button>
          {prompt && (
            <div className="ai-evidence">
              <strong>Your assembled prompt · Not a model response</strong>
              <pre>{prompt}</pre>
            </div>
          )}
        </form>
      )}
      {lesson === 'agent' && (
        <div>
          <div className="agent-path" aria-label="Agent tool loop">
            <span>Task</span>
            <span>→ Model request</span>
            <span>→ Permission check</span>
            <span>→ Tool result</span>
            <span>→ Next step</span>
          </div>
          <div className="ai-evidence">
            <strong>Task: investigate checkout errors</strong>
            <p>
              The agent program runs in a demo worker. Its model could be hosted elsewhere. Tool
              permissions are enforced by the program.
            </p>
          </div>
          {step === 0 && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (answers.read !== 'yes')
                  setFeedback('The investigation needs permission to read logs.');
                else if (answers.restart === 'yes')
                  setFeedback(
                    'This is a read-only investigation. Leave restart_service unapproved; the task does not require that permission.',
                  );
                else {
                  setFeedback('');
                  setStep(1);
                }
              }}
            >
              <label className="ai-check">
                <input
                  type="checkbox"
                  checked={answers.read === 'yes'}
                  onChange={(event) => change('read', event.target.checked ? 'yes' : 'no')}
                />
                Allow read_logs
              </label>
              <label className="ai-check">
                <input
                  type="checkbox"
                  checked={answers.restart === 'yes'}
                  onChange={(event) => change('restart', event.target.checked ? 'yes' : 'no')}
                />
                Allow restart_service
              </label>
              <button className="button-primary">Run the next demo step →</button>
            </form>
          )}
          {step >= 1 && (
            <div className="ai-evidence">
              <strong>Prepared tool result</strong>
              <pre>
                read_logs("checkout"){'\n'}09:12 HTTP 503 · upstream connection refused{'\n'}09:18
                requests recovered after rollback
              </pre>
            </div>
          )}
          {step === 1 && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (answers.next === 'report') {
                  setStep(2);
                  done(
                    'Investigation complete. Report the observed connection failures, keep the root cause unconfirmed, and request approval before changes. This bounded demo stops here.',
                  );
                } else
                  setFeedback(
                    'The logs support an observation, not a proven root cause or permission to restart. Choose a report and approval request.',
                  );
              }}
            >
              {select('next', 'Choose the next action', [
                ['report', 'Report observations, state unknowns, ask before changes'],
                ['restart', 'Restart checkout without approval'],
                ['claim', 'Declare that the database caused the outage'],
              ])}
              <button className="button-primary">Choose the next step →</button>
            </form>
          )}
        </div>
      )}
      {lesson === 'hosting' && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (
              answers.offline === 'local' &&
              answers.internal === 'onprem' &&
              answers.prototype === 'cloud'
            )
              done(
                'These starting choices fit the stated assumptions. Next, check model capability, memory/GPU requirements, data policy, access controls, monitoring, and operating cost. The agent runtime and model do not have to share a host.',
              );
            else
              setFeedback(
                'Use the scenario constraints: offline operation, existing organisation-operated GPUs, or an online prototype without model hardware. These are starting choices, not universal rules.',
              );
          }}
        >
          {[
            ['offline', 'Offline laptop; a suitable small model fits the available hardware'],
            [
              'internal',
              'Organisation already operates a GPU service; this project’s data is approved only for that internal service',
            ],
            [
              'prototype',
              'Online prototype; non-sensitive data is approved for a hosted API; no inference hardware is available',
            ],
          ].map(([key, label]) =>
            select(key, label, [
              ['local', 'Local inference on the laptop'],
              ['onprem', 'Organisation-operated on-premises inference'],
              ['cloud', 'Provider-hosted cloud model API'],
            ]),
          )}
          <button className="button-primary">Check architecture choices →</button>
        </form>
      )}
      {feedback && (
        <p className="activity-feedback" role="status">
          {feedback}
        </p>
      )}
    </section>
  );
}
