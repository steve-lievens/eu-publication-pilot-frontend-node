import React, { useState, useRef, useEffect, useCallback } from "react";
import { Heading, Toggle, Tag, Accordion, AccordionItem } from "@carbon/react";
import { WarningAlt } from "@carbon/react/icons";
import styles from "./ConcordanceCheck2.module.css";
import { useLocation } from "react-router-dom";

// case refs shape from backend
type CaseReason =
  | "missing_in_B"
  | "missing_in_A"
  | "number_changed"
  | "paragraph_changed"
  | "format";
type CaseKind = "ECLI" | "case_number" | "paragraph";

interface CaseDiff {
  paragraph: number;
  snippetA: string | null;
  snippetB: string | null;
  reason?: CaseReason;
  kind?: CaseKind | null;
  status: "mismatch";
}

interface DateDiff {
  paragraph: number;
  snippetA: string | null;
  snippetB: string | null;
  status: "mismatch" | "missing_in_A" | "missing_in_B";
}

interface Data {
  docA: string;
  docB: string;
  paragraphsA: string[];
  paragraphsB: string[];
  comparisons: {
    dates: DateDiff[];
    case_references: CaseDiff[];
  };
}

const ConcordanceCheck2: React.FC = () => {
  const location = useLocation();
  const data = location.state as Data;

  const [syncScrolling, setSyncScrolling] = useState(false);
  const [highlightedPara, setHighlightedPara] = useState<number | null>(null);
  const doc1Refs = useRef<(HTMLDivElement | null)[]>([]);
  const doc2Refs = useRef<(HTMLDivElement | null)[]>([]);
  const doc1ScrollRef = useRef<HTMLDivElement>(null);
  const doc2ScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    doc1Refs.current = new Array(data.paragraphsA.length);
    doc2Refs.current = new Array(data.paragraphsA.length);
  }, [data.paragraphsA.length]);

  // any discrepancy in a paragraph?
  const hasAnyDiff = React.useMemo(() => {
    const dMap = new Map<number, boolean>();
    (data.comparisons?.dates || []).forEach((d) => dMap.set(d.paragraph, true));
    (data.comparisons?.case_references || []).forEach((c) =>
      dMap.set(c.paragraph, true)
    );
    return (paraNum: number) => dMap.has(paraNum);
  }, [data.comparisons]);

  const handleDocScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>, source: "doc1" | "doc2") => {
      if (!syncScrolling) return;
      const other =
        source === "doc1" ? doc2ScrollRef.current : doc1ScrollRef.current;
      if (other) other.scrollTop = e.currentTarget.scrollTop;
    },
    [syncScrolling]
  );

  const scrollToParagraph = useCallback((paraNum: number) => {
    setHighlightedPara(paraNum);
    const idx = paraNum - 1;
    const offset = doc1Refs.current[idx]?.offsetTop ?? 0;
    const headerHeight = 60;
    [doc1ScrollRef.current, doc2ScrollRef.current].forEach((c) => {
      if (c) c.scrollTo({ top: offset - headerHeight, behavior: "smooth" });
    });
    setTimeout(() => setHighlightedPara(null), 8000);
  }, []);

  if (!data) return <p>Error: no data.</p>;

  // helpers for labels & colors
  const tagTypeForDate = (s: DateDiff["status"]) =>
    s === "mismatch" ? "red" : s === "missing_in_A" ? "cyan" : "purple";

  const tagTypeForCase = (r?: CaseReason) => {
    switch (r) {
      case "number_changed":
      case "paragraph_changed":
        return "red";
      case "missing_in_A":
        return "cyan";
      case "missing_in_B":
        return "purple";
      default:
        return "gray";
    }
  };

  const dateLabel = (d: DateDiff) => {
    if (d.status === "mismatch")
      return `Date mismatch — Paragraph ${d.paragraph}`;
    if (d.status === "missing_in_A")
      return `Missing date in ${data.docA} — Paragraph ${d.paragraph}`;
    return `Missing date in ${data.docB} — Paragraph ${d.paragraph}`;
  };

  const caseLabel = (c: CaseDiff) => {
    const kind = c.kind ? c.kind.toLowerCase().replace("_", " ") : "reference";
    switch (c.reason) {
      case "number_changed":
        return `Mismatch ${kind} — Paragraph ${c.paragraph}`;
      case "paragraph_changed":
        return `Mismatch paragraph reference — Paragraph ${c.paragraph}`;
      case "missing_in_A":
        return `Missing ${kind} in ${data.docA} — Paragraph ${c.paragraph}`;
      case "missing_in_B":
        return `Missing ${kind} in ${data.docB} — Paragraph ${c.paragraph}`;
      case "format":
        return `Mismatch ECLI/EU — Paragraph ${c.paragraph}`;
      default:
        return `Case discrepancy — Paragraph ${c.paragraph}`;
    }
  };

  const dates = data.comparisons?.dates ?? [];
  const cases = data.comparisons?.case_references ?? [];

  return (
    <div className={styles.pageWrapper}>
      <Heading className={styles.title}>
        Comparing: {data.docA} vs {data.docB}
      </Heading>
      <Toggle
        id="syncScroll"
        labelText="Synchronize scrolling"
        toggled={syncScrolling}
        onToggle={() => setSyncScrolling(!syncScrolling)}
      />

      <div className={styles.tableContainer}>
        <div className={styles.documentsWrapper}>
          {/* Left column */}
          <div className={styles.docTableContainer}>
            <div className={styles.docHeader}>{data.docA}</div>
            <div
              className={styles.tableScrollContainer}
              ref={doc1ScrollRef}
              onScroll={(e: React.UIEvent<HTMLDivElement>) =>
                handleDocScroll(e, "doc1")
              }
            >
              <div className={styles.tableBody}>
                {data.paragraphsA.map((paraA, idx) => {
                  const paraNum = idx + 1;
                  const rowClass = `
                    ${styles.tableRow}
                    ${idx % 2 ? styles.oddRow : styles.evenRow}
                    ${hasAnyDiff(paraNum) ? styles.hasDiscrepancy : ""}
                    ${highlightedPara === paraNum ? styles.highlightedRow : ""}
                  `;
                  return (
                    <div
                      key={`A-${paraNum}`}
                      ref={(el) => {
                        doc1Refs.current[idx] = el;
                      }}
                      className={rowClass}
                    >
                      <div className={styles.paraNumber}>
                        Paragraph {paraNum}
                      </div>
                      <div className={styles.paraContent}>{paraA}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className={styles.docTableContainer}>
            <div className={styles.docHeader}>{data.docB}</div>
            <div
              className={styles.tableScrollContainer}
              ref={doc2ScrollRef}
              onScroll={(e: React.UIEvent<HTMLDivElement>) =>
                handleDocScroll(e, "doc2")
              }
            >
              <div className={styles.tableBody}>
                {data.paragraphsB.map((paraB, idx) => {
                  const paraNum = idx + 1;
                  const rowClass = `
                    ${styles.tableRow}
                    ${idx % 2 ? styles.oddRow : styles.evenRow}
                    ${hasAnyDiff(paraNum) ? styles.hasDiscrepancy : ""}
                    ${highlightedPara === paraNum ? styles.highlightedRow : ""}
                  `;
                  return (
                    <div
                      key={`B-${paraNum}`}
                      ref={(el) => {
                        doc2Refs.current[idx] = el;
                      }}
                      className={rowClass}
                    >
                      <div className={styles.paraNumber}>
                        Paragraph {paraNum}
                      </div>
                      <div className={styles.paraContent}>{paraB}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar of discrepancies (scrollable column) */}
        <div className={styles.discrepanciesContainer}>
          <div className={styles.sidebarScroll}>
            {/* Dates group */}
            <div className={styles.groupBlock}>
              <div className={styles.groupHeader}>
                Dates{" "}
                {dates.length > 0 && (
                  <span className={styles.countPill}>{dates.length}</span>
                )}
              </div>

              {dates.length === 0 ? (
                <div className={styles.noDiscrepancies}>
                  No date discrepancies found.
                </div>
              ) : (
                <Accordion align="start" size="lg">
                  {dates.map((d, i) => (
                    <AccordionItem
                      key={`date-${i}`}
                      title={
                        <span
                          className={styles.accLabel}
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToParagraph(d.paragraph);
                          }}
                        >
                          <WarningAlt
                            className={`${styles.accIcon} ${
                              d.status === "mismatch"
                                ? styles.iconRed
                                : d.status === "missing_in_A"
                                ? styles.iconCyan
                                : styles.iconPurple
                            }`}
                            size={16}
                          />
                          {dateLabel(d)}
                        </span>
                      }
                    >
                      <div className={styles.inlineDetail}>
                        <div className={styles.detailRow}>
                          <Tag type={tagTypeForDate(d.status)}>{d.status}</Tag>
                        </div>
                        <div className={styles.detailRow}>
                          <strong>Doc A:</strong>
                          <pre className={styles.detailSnippet}>
                            {d.snippetA ?? "– none –"}
                          </pre>
                        </div>
                        <div className={styles.detailRow}>
                          <strong>Doc B:</strong>
                          <pre className={styles.detailSnippet}>
                            {d.snippetB ?? "– none –"}
                          </pre>
                        </div>
                      </div>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>

            {/* Case references group */}
            <div className={styles.groupBlock}>
              <div className={styles.groupHeader}>
                Case references{" "}
                {cases.length > 0 && (
                  <span className={styles.countPill}>{cases.length}</span>
                )}
              </div>

              {cases.length === 0 ? (
                <div className={styles.noDiscrepancies}>
                  No case-reference discrepancies found.
                </div>
              ) : (
                <Accordion align="start" size="lg">
                  {cases.map((c, i) => (
                    <AccordionItem
                      key={`case-${i}`}
                      title={
                        <span
                          className={styles.accLabel}
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToParagraph(c.paragraph);
                          }}
                        >
                          <WarningAlt
                            className={`${styles.accIcon} ${(() => {
                              const t = tagTypeForCase(c.reason);
                              return t === "red"
                                ? styles.iconRed
                                : t === "cyan"
                                ? styles.iconCyan
                                : t === "purple"
                                ? styles.iconPurple
                                : styles.iconGray;
                            })()}`}
                            size={16}
                          />
                          {caseLabel(c)}
                        </span>
                      }
                    >
                      <div className={styles.inlineDetail}>
                        <div className={styles.detailRow}>
                          <div className={styles.tagRow}>
                            <Tag type={tagTypeForCase(c.reason)}>
                              {c.reason ?? "mismatch"}
                            </Tag>
                            {c.kind && <Tag type="gray">{c.kind}</Tag>}
                          </div>
                        </div>
                        <div className={styles.detailRow}>
                          <strong>Doc A:</strong>
                          <pre className={styles.detailSnippet}>
                            {c.snippetA ?? "– none –"}
                          </pre>
                        </div>
                        <div className={styles.detailRow}>
                          <strong>Doc B:</strong>
                          <pre className={styles.detailSnippet}>
                            {c.snippetB ?? "– none –"}
                          </pre>
                        </div>
                      </div>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcordanceCheck2;
