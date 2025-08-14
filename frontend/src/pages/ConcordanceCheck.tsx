import React, { useState, useRef, useCallback } from "react";
import {
  Accordion,
  AccordionItem,
  Theme,
  Table,
  Heading,
  Tag,
  TableBody,
  TableRow,
  TableCell,
} from "@carbon/react";
import styles from "./ConcordanceCheck.module.css";
import { useLocation } from "react-router-dom";
import { FilterEdit } from "@carbon/react/icons";

interface ExtractedEntities {
  date?: {
    date?: string[];
    range?: string[];
    month?: string[];
    time?: string[];
    year?: string[];
  };
  amounts?: {
    amount?: string[];
  };
  articles?: {
    reference?: string[];
  };
  regdirs?: {
    regulation?: string[];
    directive?: string[];
  };
  caselaw?: {};
}

interface DocumentData {
  para: string;
  extracted_entities: ExtractedEntities;
}

interface ParagraphItem {
  para_num: number;
  doc1: DocumentData;
  doc2?: DocumentData;
  errors?: {
    date?: string;
    amounts?: string;
    articles?: string;
    regdirs?: string;
    caselaw?: string;
  };
}

interface Data {
  doc1: string;
  doc2: string;
  paragraphs: ParagraphItem[];
}

const DiscrepancyItem = ({
  paragraph,
  doc1Name,
  doc2Name,
  errorType,
  errorMsg,
}: {
  paragraph: ParagraphItem;
  doc1Name: string;
  doc2Name: string;
  errorType?: string;
  errorMsg?: string;
}) => {
  return (
    <div className={styles.discrepancyItem}>
      <div className={styles.discrepancyHeader}>
        <Tag
          type={
            errorType === "date"
              ? "cyan"
              : errorType === "amounts"
              ? "purple"
              : errorType === "articles"
              ? "red"
              : "gray"
          }
        >
          {errorType}
        </Tag>
      </div>
      <div className={styles.discrepancyContent}>
        <div className={styles.discrepancyText}>{errorMsg}</div>
      </div>
    </div>
  );
};

const renderEntities = (entities: ExtractedEntities) => {
  if (!entities) return null;

  return (
    <div className={styles.entitiesContainer}>
      {entities.date && (
        <div className={styles.entityGroup}>
          <span className={styles.entityLabel}>Dates:</span>
          {entities.date.year?.map((year, i) => (
            <div key={`year-${i}`} className={styles.entity}>
              - {year}
            </div>
          ))}
          {entities.date.date?.map((date, i) => (
            <div key={`date-${i}`} className={styles.entity}>
              - {date}
            </div>
          ))}
          {entities.date.range?.map((range, i) => (
            <div key={`range-${i}`} className={styles.entity}>
              - {range}
            </div>
          ))}
          {entities.date.month?.map((month, i) => (
            <div key={`month-${i}`} className={styles.entity}>
              - {month}
            </div>
          ))}
          {entities.date.time?.map((time, i) => (
            <div key={`time-${i}`} className={styles.entity}>
              - {time}
            </div>
          ))}
        </div>
      )}
      {entities.amounts && (
        <div className={styles.entityGroup}>
          <span className={styles.entityLabel}>Amounts:</span>
          {entities.amounts.amount?.map((amount, i) => (
            <div key={`amount-${i}`} className={styles.entity}>
              - {amount}
            </div>
          ))}
        </div>
      )}
      {entities.articles && (
        <div className={styles.entityGroup}>
          <span className={styles.entityLabel}>Articles:</span>
          {entities.articles.reference?.map((article, i) => (
            <div key={`article-${i}`} className={styles.entity}>
              - {article.replace(/\|/g, " ")}
            </div>
          ))}
        </div>
      )}
      {entities.regdirs && (
        <div className={styles.entityGroup}>
          <span className={styles.entityLabel}>Regulations & Directives:</span>
          {entities.regdirs.regulation?.map((regdir, i) => (
            <div key={`regdirs-${i}`} className={styles.entity}>
              - {regdir}
            </div>
          ))}
          {entities.regdirs.directive?.map((directive, i) => (
            <div key={`directive-${i}`} className={styles.entity}>
              - {directive}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Render both documents in a table, with each paragraph in a row
// !!!!!!!!! Still needs error handling when both docs don't have the same number of paragraphs
const renderDocuments = (
  doc1: string,
  doc2: string,
  allParagraphs: ParagraphItem[],
  paraRef: React.RefObject<(HTMLDivElement | null)[]>
) => {
  return allParagraphs.map((para, index) => {
    console.log("Rendering paragraph", para);
    return (
      <TableRow key={index} className={false ? styles.highlight : ""}>
        <TableCell>
          <div
            key={index}
            ref={(el) => {
              paraRef.current[index] = el;
            }}
          ></div>
          {para.para_num}
        </TableCell>
        <TableCell className={styles.paraTableCell}>
          <div>{para.doc1.para}</div>

          {
            // Render the Extracted entities when available
            para.doc1.extracted_entities && (
              <>
                <div className={styles.entitiesHeader}>Extracted Entities:</div>
                <div className={styles.entitiesContainer}>
                  {renderEntities(para.doc1.extracted_entities)}
                </div>
              </>
            )
          }
        </TableCell>
        <TableCell className={styles.paraTableCell}>
          {para.doc2 ? (
            para.doc2.para ? (
              // Render the Extracted entities when available
              <>
                <div>{para.doc2.para}</div>
                {para.doc2 &&
                  para.doc2.extracted_entities &&
                  Object.values(para.doc2.extracted_entities).some(
                    (entity) =>
                      entity &&
                      Object.values(entity).some(
                        (arr) => Array.isArray(arr) && arr.length > 0
                      )
                  ) && (
                    <>
                      <div className={styles.entitiesHeader}>
                        Extracted Entities:
                      </div>
                      <div>{renderEntities(para.doc2.extracted_entities)}</div>
                    </>
                  )}
              </>
            ) : (
              <span className={styles.missingPara}>-</span>
            )
          ) : para.doc1.para ? (
            <span className={styles.missingPara}>
              {doc2} paragraph not available
            </span>
          ) : (
            <span className={styles.missingPara}>-</span>
          )}
        </TableCell>
      </TableRow>
    );
  });
};

const ConcordanceCheck = () => {
  const location = useLocation();
  const data = location.state.results as Data;
  console.log("ConcordanceCheck data:", data);

  const [highlightedPara, setHighlightedPara] = useState<number | null>(null);
  const paragraphRef = useRef<(HTMLDivElement | null)[]>([]);

  const getDiscrepancies = useCallback(() => {
    console.log("Getting discrepancies from data:", data);
    if (!data?.paragraphs?.length) return [];

    let filteredParagraphs = data.paragraphs.filter(
      (paragraph) =>
        paragraph.errors &&
        (paragraph.errors.date ||
          paragraph.errors.amounts ||
          paragraph.errors.articles)
    );
    console.log("Filtered paragraphs with discrepancies:", filteredParagraphs);
    return filteredParagraphs;
  }, [data]);

  const scrollToDiv = (idx: number) => {
    paragraphRef.current[idx]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  if (!data) {
    return (
      <div className={styles.pageWrapper}>
        <p>
          Error: No data available. Please upload files and start analysis
          again.
        </p>
      </div>
    );
  }

  let filteredParas = getDiscrepancies();

  return (
    <div>
      <div className={styles.pageWrapper}>
        <div className={styles.tableWrapper}>
          <Theme theme="g10">
            <Table
              aria-label="document table"
              background-color="white"
              className={styles.tableFixed}
            >
              <TableBody>
                {renderDocuments(
                  data.doc1,
                  data.doc2,
                  data.paragraphs,
                  paragraphRef
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
              <Accordion className={styles.tableScrollContainer}>
                {filteredParas.length > 0 ? (
                  filteredParas.map((paragraph) => (
                    <AccordionItem
                      title={"Paragraph " + paragraph.para_num}
                      open={true}
                      key={`discrepancy-${paragraph.para_num}`}
                      className={styles.discrepancyRow}
                      onClick={() => scrollToDiv(paragraph.para_num)}
                    >
                      {paragraph.errors &&
                        Object.entries(paragraph.errors).map(
                          ([errorType, errorMsg], index) => (
                            <DiscrepancyItem
                              paragraph={paragraph}
                              doc1Name={data.doc1}
                              doc2Name={data.doc2}
                              key={`error-${index}`}
                              errorType={errorType}
                              errorMsg={errorMsg}
                            />
                          )
                        )}
                    </AccordionItem>
                  ))
                ) : (
                  <AccordionItem
                    className={styles.noDiscrepancies}
                    title="No discrepancies found"
                    open={true}
                  >
                    All good !
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcordanceCheck;
