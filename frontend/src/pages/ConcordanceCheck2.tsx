import React, { useState, useRef, useEffect } from "react";
import {
  Heading,
  Tag,
  Accordion,
  AccordionItem,
  Theme,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@carbon/react";
import { FilterEdit } from "@carbon/react/icons";
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

  const [highlightedPara, setHighlightedPara] = useState<number | null>(null);
  const paragraphRef = useRef<(HTMLDivElement | null)[]>([]);
  const doc1Refs = useRef<(HTMLDivElement | null)[]>([]);
  const doc2Refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    doc1Refs.current = new Array(data.paragraphsA.length);
    doc2Refs.current = new Array(data.paragraphsA.length);
  }, [data.paragraphsA.length]);

  const scrollToDiv = (idx: number) => {
    paragraphRef.current[idx]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Highlight the paragraph
    setHighlightedPara(idx);
  };

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

  const dates = data.comparisons?.dates ?? [];
  const cases = data.comparisons?.case_references ?? [];

  // Render both documents in a table, with each paragraph in a row
  // !!!!!!!!! Still needs error handling when both docs don't have the same number of paragraphs
  const renderDocuments = (
    doc1: string,
    doc2: string,
    paragraphA: string[],
    paragraphB: string[],
    paraRef: React.RefObject<(HTMLDivElement | null)[]>,
    highlightedPara: number | null
  ) => {
    if (paragraphA.length !== paragraphB.length) {
      console.error("Paragraphs count mismatch between documents");
      return <p>Error: Paragraphs count mismatch between documents.</p>;
    }
    return paragraphA.map((para, index) => {
      console.log("Rendering paragraph", para);
      return (
        <TableRow
          key={index}
          className={
            highlightedPara !== null && highlightedPara - 1 === index
              ? styles.highlight
              : ""
          }
        >
          <TableCell>
            <div
              key={index}
              ref={(el) => {
                paraRef.current[index] = el;
              }}
            ></div>
            {index + 1}
          </TableCell>
          <TableCell className={styles.paraTableCell}>
            <div>{para}</div>
          </TableCell>
          <TableCell className={styles.paraTableCell}>
            <div>{paragraphB[index]}</div>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <div>
      <Heading className={styles.title}>
        Comparing: {data.docA} vs {data.docB}
      </Heading>

      <div className={styles.pageWrapper2}>
        <div className={styles.tableWrapper2}>
          <Theme theme="g10">
            <Table
              aria-label="document table"
              background-color="white"
              className={styles.tableFixed}
            >
              <TableBody>
                {renderDocuments(
                  data.docA,
                  data.docB,
                  data.paragraphsA,
                  data.paragraphsB,
                  paragraphRef,
                  highlightedPara
                )}
              </TableBody>
            </Table>
          </Theme>
        </div>

        <div className={styles.outputWrapper}>
          <Heading className={styles.outputTitle}>
            Concordance Output
            <span className={styles.filterIcon}>
              <FilterEdit />
            </span>
          </Heading>

          <div className={styles.accordionContainer}>
            <div className={styles.discrepanciesContainer}>
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
                        open={true}
                        key={`date-${i}`}
                        title={
                          <span className={styles.accLabel}>
                            {"Paragraph " + d.paragraph}
                          </span>
                        }
                      >
                        <div
                          className={styles.inlineDetail}
                          onClick={() => scrollToDiv(d.paragraph)}
                        >
                          <div className={styles.detailRow}>
                            <Tag type={tagTypeForDate(d.status)}>
                              {d.status}
                            </Tag>
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
                  Cases{" "}
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
                        open={true}
                        key={`case-${i}`}
                        title={
                          <span className={styles.accLabel}>
                            {"Paragraph " + c.paragraph}
                          </span>
                        }
                      >
                        <div
                          className={styles.inlineDetail}
                          onClick={() => scrollToDiv(c.paragraph)}
                        >
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
    </div>
  );
};

export default ConcordanceCheck2;
